# Architecture

## Frontend (Next.js)
- App Router with route-per-domain page structure.
- Reusable UI components (`cards`, `RankingTable`, filters).
- Dark premium design system in Tailwind (`bg/surface/gold/emerald` tokens).
- i18n dictionary layer for RU/UZ/EN (`src/lib/i18n.ts`).
- TanStack Query data layer with API fetchers and mutations.
- Zustand-based auth persistence in `src/lib/auth/store.ts`.

## Backend (NestJS)
- Modular domain-based architecture:
  - `auth`, `users`, `players`, `clubs`, `tournaments`, `brackets`, `rankings`, `news`, `media`, `applications`, `notifications`.
- Prisma as ORM with PostgreSQL.
- JWT auth service for sign-in.
- Role model included (`PLAYER`, `CLUB`, `ORGANIZER`, `ADMIN`).
- Swagger/OpenAPI enabled at `/api/docs`.

## Database model summary
- `User` has one profile by role (`Player` or `Club`) and many `Notification`.
- `Player` belongs to `City`, `Country`, optional `Club`.
- `Club` belongs to `City`, `Country`; has many `Tournament` and `Player`.
- `Tournament` belongs to `Club`, `Discipline`, has `Match`, `Application`, `BracketParticipant`, `BracketMatch`.
- `Match` stores bracket schedule and scores.
- `BracketParticipant` and `BracketMatch` store single-elimination bracket state, BYE progression and seeded slots inside the main platform database.
- `Ranking` tracks points by `Player + Discipline + City`.
- `News`, `Gallery`, `MediaAsset` support content and media streams.
- `Application` connects player registration with tournaments.

## Scalability notes
- Frontend prepared for SSR/ISR per page type.
- Backend supports expansion to GraphQL gateway if needed.
- Media layer abstracted for Cloudinary/S3 connectors.
- Telegram-first notifications supported through `notifications` module extension.
