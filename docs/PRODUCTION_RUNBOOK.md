# Production Runbook

## Required secrets

Create these files from the examples and replace every placeholder before deploy:

- `apps/api/.env.production`
- `apps/web/.env.production`
- `apps/bot/.env.production`

Production mode is guarded by `REQUIRE_PRODUCTION_CONFIG=true`. The API and bot refuse to start with localhost URLs, placeholder secrets, insecure cookies, or non-SMTP email delivery.

## Deploy

Use the production compose file with the same public URLs used for the web build. The API and bot read runtime secrets from `apps/api/.env.production` and `apps/bot/.env.production`; the web public URLs are needed during image build:

```powershell
$env:NEXT_PUBLIC_APP_URL = "https://bill4.uz"
$env:NEXT_PUBLIC_API_URL = "https://api.bill4.uz/api"
$env:INTERNAL_API_URL = "https://api.bill4.uz/api"
docker compose -f docker-compose.production.yml up --build -d
```

If you intentionally layer over the local compose file, use the same public URL variables:

```powershell
$env:NEXT_PUBLIC_APP_URL = "https://bill4.uz"
$env:NEXT_PUBLIC_API_URL = "https://api.bill4.uz/api"
$env:INTERNAL_API_URL = "https://api.bill4.uz/api"
docker compose -f docker-compose.yml -f docker-compose.production.yml up --build -d
```

The web image bakes `NEXT_PUBLIC_API_URL` into the client bundle at build time. Rebuild the web image after any domain/API URL change.

## Database cleanup

Before first launch, keep only reference data: `Country`, `City`, `Discipline`, and `_prisma_migrations`.

Runtime tables to clear before launch:

`AuditLog`, `Notification`, `TelegramLinkToken`, `RefreshToken`, `AuthToken`, `Booking`, `ClubTable`, `BracketMatch`, `BracketParticipant`, `Match`, `Application`, `Ranking`, `MediaAsset`, `Gallery`, `News`, `Tournament`, `Player`, `Club`, `User`.

Always take a dump before cleanup:

```powershell
docker exec billiard_pg pg_dump -U billiard -d billiard --clean --if-exists -f /tmp/pre-production-cleanup.sql
docker cp billiard_pg:/tmp/pre-production-cleanup.sql .\db-backups\pre-production-cleanup.sql
```

Restore drill:

```powershell
docker exec billiard_pg createdb -U billiard billiard_restore_check
docker cp .\db-backups\pre-production-cleanup.sql billiard_pg:/tmp/pre-production-cleanup.sql
docker exec billiard_pg psql -U billiard -d billiard_restore_check -f /tmp/pre-production-cleanup.sql
docker exec billiard_pg dropdb -U billiard billiard_restore_check
```

## Telegram E2E

Validated locally:

- `TELEGRAM_BOT_TOKEN` returns `getMe`.
- Bot runs in polling mode when webhook URL is empty.
- Bot container can call API `/api/health`.
- Bot container can read public tournaments from API.

Manual user-flow verification still needs a real Telegram account:

- Send `/start` to `@Billuzpro_bot`.
- Sign in on the site, open `/dashboard/telegram`, request link, open the deep link.
- Check tournaments, booking, booking cancellation, and notification delivery in Telegram.

## Domain and HTTPS

Terminate HTTPS in a reverse proxy or managed platform and route:

- `https://bill4.uz` -> web `3000`
- `https://api.bill4.uz` -> api `4000`
- Telegram webhook mode, if used: `https://bot.bill4.uz/telegram/webhook` -> bot `4100`

Set `TRUST_PROXY=true`, `AUTH_COOKIE_SECURE=true`, `APP_URL`, `API_PUBLIC_URL`, and `CORS_ORIGIN` to the final HTTPS domains.

## Operations checks

Basic checks:

```powershell
docker compose -f docker-compose.production.yml ps
docker compose -f docker-compose.production.yml logs --tail=120 api
docker compose -f docker-compose.production.yml logs --tail=120 web
docker compose -f docker-compose.production.yml logs --tail=120 bot
```

Run migrations before accepting traffic:

```powershell
npm run prisma:deploy
```

Run app verification:

```powershell
npm run typecheck
npm run test
npm run build
```
