# Lead relay → Yandex Mail

Small FastAPI service that takes contact-form submissions from the site and
emails them to **info@sproogeek.com** through Yandex SMTP.

**Why a backend at all:** the mailbox password must stay server-side. If it were
in the browser JS, anyone could read it from the page source and send mail as
you. This service is the only place the credentials exist.

Each lead arrives with `Reply-To` set to the client's address — hit **Reply** in
Yandex Mail and you answer the client directly.

## 1. Configure

**Local development** — `.env` next to the code (gitignored):

```bash
cd backend
cp .env.example .env
# open .env and paste SMTP_PASSWORD
```

**On the server — NEVER put `.env` inside the deploy directory.**

The deploy rsyncs this repo *into* the nginx document root, so anything under
`backend/` is reachable over HTTP. A `.env` there is downloadable by anyone —
this has already happened once on this project. Keep the secret outside the
web root:

```bash
sudo mkdir -p /etc/sproogeek
sudo install -m 600 -o root -g root /dev/null /etc/sproogeek/leads.env
sudo nano /etc/sproogeek/leads.env     # paste the vars from .env.example
```

systemd then reads it via `EnvironmentFile=/etc/sproogeek/leads.env`.

This also makes the secret immune to `rsync --delete`, since it lives outside
`DEPLOY_PATH` entirely.

`SMTP_PASSWORD` must be a Yandex **app password**, not the account password:
[id.yandex.ru](https://id.yandex.ru) → Пароли приложений → Почта.

`.env` is gitignored — never commit it.

> IMAP/SMTP must be enabled for the mailbox: Яндекс Почта → Настройки →
> Почтовые программы → включить «Портальный пароль» / доступ по SMTP.

## 2. Run locally

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
set -a && source .env && set +a
uvicorn main:app --reload --port 8000
```

Check it: `curl localhost:8000/api/health`

```json
{"ok":true,"configured":true,"host":"smtp.yandex.ru","port":587,"tls":true}
```

Send a real test lead:

```bash
curl -X POST localhost:8000/api/lead -H 'Content-Type: application/json' \
  -d '{"name":"Test","email":"you@example.com","phone":"+70000000000","message":"Проверка"}'
```

## 3. Deploy (systemd + nginx)

`/etc/systemd/system/sproogeek-leads.service`:

```ini
[Unit]
Description=SproogeekDev lead relay
After=network.target

[Service]
User=www-data
WorkingDirectory=/var/www/sproogeek/backend
EnvironmentFile=/etc/sproogeek/leads.env
ExecStart=/var/www/sproogeek/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now sproogeek-leads
```

### nginx

Add the deny rules **before** anything else in the server block — the app code
sits inside the document root, and without these it is publicly downloadable:

```nginx
# Must come first. Blocks .env, .git and the whole backend/ directory.
location ~ /\.        { deny all; return 404; }
location ^~ /backend/ { deny all; return 404; }

# Same-origin API, so CORS never comes into play.
location /api/ {
    proxy_pass http://127.0.0.1:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

```bash
sudo nginx -t && sudo systemctl reload nginx
# both must return 404
curl -s -o /dev/null -w "%{http_code}\n" https://about.sproogeek.com/backend/.env
curl -s -o /dev/null -w "%{http_code}\n" https://about.sproogeek.com/backend/main.py
```

## Built-in protection

- **Honeypot** — hidden `botcheck` field; filled = silently dropped.
- **Rate limit** — 5 submissions per IP per 10 minutes.
- **Validation** — email format and field lengths enforced by pydantic.
- **CORS** — restricted to `ALLOWED_ORIGINS`.
- Credential errors are never echoed back to the browser.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| `"configured": false` | `.env` not loaded — check `EnvironmentFile` / `source .env` |
| 502 `Mail authentication failed` | wrong app password, or SMTP disabled for the mailbox |
| 502 `Could not deliver` | outbound port 587 blocked by the host firewall |
| Mail lands in spam | add SPF/DKIM for the domain in Yandex 360 |
