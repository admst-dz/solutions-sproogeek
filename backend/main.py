"""SproogeekDev lead relay.

Receives contact-form submissions from the site and emails them via Yandex SMTP.

Credentials live ONLY in the environment (see .env.example) — never in source
and never in the browser, otherwise anyone could read them from the page.
"""

import os
import smtplib
import time
from collections import defaultdict, deque
from email.message import EmailMessage
from email.utils import formataddr
from typing import Dict, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.yandex.ru")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USERNAME = os.environ.get("SMTP_USERNAME", "").strip()
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")
SMTP_USE_TLS = os.environ.get("SMTP_USE_TLS", "true").strip().lower() in {"1", "true", "yes"}
SMTP_FROM = os.environ.get("SMTP_FROM", SMTP_USERNAME).strip()
FEEDBACK_TO = os.environ.get("FEEDBACK_TO", SMTP_USERNAME).strip()

ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]

# Light in-memory rate limit: max 5 submissions per IP per 10 minutes.
RATE_LIMIT = 5
RATE_WINDOW = 600
_hits: Dict[str, deque] = defaultdict(deque)

app = FastAPI(title="SproogeekDev lead relay", docs_url=None, redoc_url=None)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS or ["*"],
    allow_methods=["POST"],
    allow_headers=["Content-Type"],
)


class Lead(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    phone: str = Field(min_length=3, max_length=40)
    message: str = Field(min_length=1, max_length=4000)
    # Honeypot: real users never fill this, bots usually do.
    botcheck: Optional[str] = None


def _rate_limited(ip: str) -> bool:
    now = time.time()
    hits = _hits[ip]
    while hits and now - hits[0] > RATE_WINDOW:
        hits.popleft()
    if len(hits) >= RATE_LIMIT:
        return True
    hits.append(now)
    return False


def _build_message(lead: Lead) -> EmailMessage:
    msg = EmailMessage()
    msg["Subject"] = f"Заявка с сайта — {lead.name}"
    # From must stay the authenticated mailbox or Yandex rejects the message.
    msg["From"] = formataddr(("SproogeekDev site", SMTP_FROM))
    msg["To"] = FEEDBACK_TO
    # So you can just hit "Reply" and answer the client directly.
    msg["Reply-To"] = formataddr((lead.name, str(lead.email)))
    msg.set_content(
        "Новая заявка с about.sproogeek.com\n\n"
        f"Имя:     {lead.name}\n"
        f"Email:   {lead.email}\n"
        f"Телефон: {lead.phone}\n\n"
        "О проекте:\n"
        f"{lead.message}\n"
    )
    return msg


def _send(msg: EmailMessage) -> None:
    """Blocking SMTP send — call through run_in_threadpool."""
    if SMTP_USE_TLS:
        # Port 587: plain connection upgraded via STARTTLS.
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
    else:
        # Port 465: TLS from the first byte.
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=20) as server:
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)


@app.get("/api/health")
async def health() -> dict:
    return {
        "ok": True,
        "configured": bool(SMTP_USERNAME and SMTP_PASSWORD),
        "host": SMTP_HOST,
        "port": SMTP_PORT,
        "tls": SMTP_USE_TLS,
    }


@app.post("/api/lead")
async def create_lead(lead: Lead, request: Request) -> dict:
    if not (SMTP_USERNAME and SMTP_PASSWORD):
        raise HTTPException(status_code=503, detail="Mail transport is not configured")

    # Silently accept honeypot hits so bots do not learn they were filtered.
    if lead.botcheck:
        return {"ok": True}

    client_ip = (request.headers.get("x-forwarded-for", "") or request.client.host or "").split(",")[0].strip()
    if _rate_limited(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests, try again later")

    try:
        await run_in_threadpool(_send, _build_message(lead))
    except smtplib.SMTPAuthenticationError:
        # Never leak credential details to the browser.
        raise HTTPException(status_code=502, detail="Mail authentication failed")
    except (smtplib.SMTPException, OSError):
        raise HTTPException(status_code=502, detail="Could not deliver the message")

    return {"ok": True}
