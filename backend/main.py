"""SproogeekDev lead relay.

Receives contact-form submissions from the site and forwards them to Telegram.

The bot token lives ONLY here (server side) — never in the browser, otherwise
anyone could read it from the page source and take over the bot.

Env vars (see .env.example):
    TELEGRAM_BOT_TOKEN   required, from @BotFather
    TELEGRAM_CHAT_ID     target chat, default "@sproogeek_dev"
    ALLOWED_ORIGINS      comma-separated origins allowed to POST
"""

import html
import os
import time
from collections import defaultdict, deque
from typing import Dict, Optional

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
CHAT_ID = os.environ.get("TELEGRAM_CHAT_ID", "@sproogeek_dev").strip()
ALLOWED_ORIGINS = [o.strip() for o in os.environ.get("ALLOWED_ORIGINS", "").split(",") if o.strip()]

TELEGRAM_API = "https://api.telegram.org/bot{token}/sendMessage"

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


def _format(lead: Lead) -> str:
    esc = html.escape
    return (
        "<b>Новая заявка — sproogeek.com</b>\n\n"
        f"<b>Имя:</b> {esc(lead.name)}\n"
        f"<b>Email:</b> {esc(lead.email)}\n"
        f"<b>Телефон:</b> {esc(lead.phone)}\n\n"
        f"<b>О проекте:</b>\n{esc(lead.message)}"
    )


@app.get("/api/health")
async def health() -> dict:
    return {"ok": True, "configured": bool(BOT_TOKEN)}


@app.post("/api/lead")
async def create_lead(lead: Lead, request: Request) -> dict:
    if not BOT_TOKEN:
        raise HTTPException(status_code=503, detail="Telegram bot is not configured")

    # Silently accept honeypot hits so bots do not learn they were filtered.
    if lead.botcheck:
        return {"ok": True}

    client_ip = (request.headers.get("x-forwarded-for", "") or request.client.host or "").split(",")[0].strip()
    if _rate_limited(client_ip):
        raise HTTPException(status_code=429, detail="Too many requests, try again later")

    payload = {
        "chat_id": CHAT_ID,
        "text": _format(lead),
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.post(TELEGRAM_API.format(token=BOT_TOKEN), json=payload)
    except httpx.HTTPError:
        raise HTTPException(status_code=502, detail="Telegram is unreachable")

    if response.status_code != 200 or not response.json().get("ok"):
        # Never echo the Telegram body back to the browser — it can leak config.
        raise HTTPException(status_code=502, detail="Telegram rejected the message")

    return {"ok": True}
