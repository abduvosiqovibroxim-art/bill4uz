# Billard.uz Pro Platform (Uzbekistan-first)

Production-ready foundation of a billiard ecosystem platform:
- Next.js + TypeScript + Tailwind frontend
- NestJS + Prisma + PostgreSQL backend
- Telegram bot on top of the same backend and database
- JWT auth + role-based architecture
- Multi-language ready (RU/UZ/EN)
- Tournament / bracket / player / club / ranking / news / media modules

## Monorepo structure

```text
billiard-platform/
  apps/
    web/                  # Next.js app router frontend
      src/app             # pages/routes
      src/components      # reusable UI
      src/lib             # i18n, store, shared types
    api/                  # NestJS backend
      src/*               # modules/controllers/services
      prisma/schema.prisma
      prisma/seed.ts
    bot/                  # Telegram bot using the same backend
  docs/
    ARCHITECTURE.md
    API_ENDPOINTS.md
  docker-compose.yml
  .env.example
```

## Quick start

1. Create local env files:
   - copy `apps/api/.env.example` to `apps/api/.env`
   - copy `apps/web/.env.example` to `apps/web/.env.local`
   - copy `apps/bot/.env.example` to `apps/bot/.env`
   - set the same `BOT_INTERNAL_SECRET` in `apps/api/.env` and `apps/bot/.env`
2. Install deps from repo root:
   - `npm install`
3. Run local development:
   - `npm run dev`
4. Or run the full docker stack:
   - `docker compose up --build`

Frontend: `http://localhost:3000`
Backend: `http://localhost:4000/api`
Swagger: `http://localhost:4000/api/docs`
Bot standby/webhook port: `http://localhost:4100`

## Daily shortcuts

- `npm run docker:up` - build and start the Docker stack
- `npm run docker:down` - stop the Docker stack
- `npm run docker:ps` - inspect container status
- `npm run docker:logs:api` - tail API logs
- `npm run docker:logs:web` - tail web logs
- `npm run docker:logs:bot` - tail bot logs
- `npm run typecheck` - run both workspace typechecks
- `npm run test` - run API bracket tests
- `npm run verify` - run typecheck, tests, and production builds

## Collaboration guide

- Shared repo workflow notes live in `AGENTS.md`

## Bracket API

Tournament bracket logic is now embedded directly into `apps/api` and uses the same PostgreSQL database and Docker stack as the rest of the platform.

Core bracket endpoints:
- `POST /api/tournaments/:id/participants`
- `GET /api/tournaments/:id/participants`
- `POST /api/tournaments/:id/generate-bracket`
- `GET /api/tournaments/:id/bracket`
- `GET /api/tournaments/:id/matches`
- `GET /api/tournaments/:id/champion`
- `GET /api/matches/:id`
- `PATCH /api/matches/:id/result`
- `PATCH /api/matches/:id/status`

## Roles
- `PLAYER`: tournament applications, personal stats, notifications
- `CLUB`: club profile management, schedule, player applications
- `ORGANIZER`: tournament lifecycle, bracket/result operations
- `ADMIN`: moderation, verification, analytics

## Seed behavior

`npm run seed` now initializes only reference data required by the platform:
- countries
- cities
- disciplines

No demo users, demo clubs, demo players, or demo tournaments are created.

## Telegram bot

The Telegram bot lives in `apps/bot` and does not own separate business logic or a separate database. It calls dedicated internal bot endpoints in `apps/api`, and those endpoints reuse the existing auth, tournament, application, bracket, player, club, and notification services.

Implemented bot flows:
- public: `/start`, upcoming tournaments, live tournaments, tournament info, bracket, champion
- player: account linking, profile, tournaments, applications, apply to tournament, results
- organizer: own tournaments, create tournament, review applications, approve/reject, participant pool, generate bracket, update match status, save match result
- admin: tournaments, users, pending application moderation
- notifications: application submitted, application approved/rejected, upcoming tournament reminder, next match reminder, match result, tournament completed, champion

Account linking flow:
- user opens `/dashboard/telegram` on the website
- website generates a one-time short code and deep-link token
- user opens the bot and confirms the deep link
- API binds `telegramId`, `telegramUsername`, and `telegramLinkedAt` to the existing `User`

Production notes:
- `BOT_INTERNAL_SECRET` must match in API and bot envs
- `TELEGRAM_BOT_TOKEN` is required for real Telegram operation
- if the token is missing, the bot container stays in disabled standby mode instead of crashing, so the rest of the stack remains healthy
