# Deploy Bill4 to a VPS (bill4.uz)

Goal: `https://bill4.uz` serving the app, with automatic HTTPS. The app is a
Docker Compose stack (Postgres + API + Web + optional Telegram bot). The API
container runs DB migrations and seed automatically on start. The Web container
proxies `/api` to the API internally, so **only the web needs to be public** —
Caddy terminates HTTPS for `bill4.uz` and forwards to it.

## 0. What you need
- A VPS: **Ubuntu 22.04/24.04, ≥ 2 GB RAM** (building Next.js needs memory —
  1 GB can fail), ≥ 2 vCPU, ≥ 20 GB disk. SSH access (IP + root).
- The domain `bill4.uz` (you have it, at aHost).
- (Optional) SMTP credentials for real email, and/or a Telegram bot token.

## 1. DNS (in the aHost domain panel)
Point the domain at the VPS public IP:

| Type | Name | Value        |
|------|------|--------------|
| A    | `@`  | `<VPS_IP>`   |
| A    | `www`| `<VPS_IP>`   |

TTL 300 is fine. No `api` subdomain is needed. Wait a few minutes for it to
propagate before step 5 (Caddy needs DNS to issue the certificate).

## 2. Install Docker on the VPS
```bash
ssh root@<VPS_IP>
curl -fsSL https://get.docker.com | sh
docker compose version   # should print v2.x
```

## 3. Get the code onto the server
Easiest is a Git repo (push this project to a private GitHub repo first), then:
```bash
cd /opt
git clone <your-repo-url> bill4 && cd bill4
```
No GitHub? Upload the folder from your PC instead (run on your PC):
```bash
rsync -av --exclude node_modules --exclude .next --exclude .git \
  ./ root@<VPS_IP>:/opt/bill4/
```

## 4. Create the two env files on the server
The real secrets are NOT in Git. Create these on the VPS (content provided to you
separately — the JWT/BOT secrets are already generated):
- `/opt/bill4/apps/api/.env.production`
- `/opt/bill4/apps/bot/.env.production`

If you have no Telegram bot: leave `TELEGRAM_BOT_TOKEN` empty and skip the `bot`
service in step 5.

## 5. Launch
```bash
cd /opt/bill4
export NEXT_PUBLIC_API_URL=/api
export NEXT_PUBLIC_APP_URL=https://bill4.uz
export INTERNAL_API_URL=http://api:4000/api
export BACKUP_HOST_DIR=/opt/billuz-backups

docker compose \
  -f docker-compose.yml \
  -f docker-compose.production.yml \
  -f docker-compose.caddy.yml \
  up --build -d
```
Without a bot token, list the services explicitly to skip the bot:
```bash
docker compose -f docker-compose.yml -f docker-compose.production.yml -f docker-compose.caddy.yml \
  up --build -d postgres api web caddy
```
The API auto-runs migrations + seed. Caddy fetches the TLS certificate for
`bill4.uz` automatically (needs steps 1 and 6 done).

## 6. Firewall (open only web ports)
```bash
ufw allow 22 && ufw allow 80 && ufw allow 443 && ufw --force enable
```
Internal ports (3000/4000/4100/5433) are already bound to `127.0.0.1` by
`docker-compose.caddy.yml`, so they are not exposed publicly.

## 7. Verify
- Open `https://bill4.uz` — site loads with a valid HTTPS padlock.
- Header logo shows correctly (light + dark).
- Admin login works: `admin@billuz.local` (password from the seed).
- Diagnostics:
  ```bash
  docker compose -f docker-compose.yml -f docker-compose.production.yml -f docker-compose.caddy.yml ps
  docker compose -f docker-compose.yml -f docker-compose.production.yml -f docker-compose.caddy.yml logs --tail=120 api
  ```

## Enable real email (optional, later)
1. Get SMTP creds (e.g. Brevo/SendGrid free tier, or Gmail app password).
2. In `apps/api/.env.production`: set `EMAIL_DELIVERY_MODE=smtp` and fill
   `SMTP_HOST/PORT/USER/PASS`, `EMAIL_FROM`.
3. In `docker-compose.caddy.yml`: set `REQUIRE_PRODUCTION_CONFIG: "true"` for
   `api` (and `bot`).
4. Re-run the step 5 command.

## Update after code changes
```bash
cd /opt/bill4 && git pull   # or rsync again
# re-export the NEXT_PUBLIC_* vars, then:
docker compose -f docker-compose.yml -f docker-compose.production.yml -f docker-compose.caddy.yml up --build -d
```
