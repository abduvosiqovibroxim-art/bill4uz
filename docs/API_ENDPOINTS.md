# API Endpoints (Core)

## Auth
- `POST /api/auth/signin`

## Users
- `GET /api/users`

## Players
- `GET /api/players`
- `GET /api/players/:id`

## Clubs
- `GET /api/clubs?city=Tashkent`
- `GET /api/clubs/:id`

## Tournaments
- `GET /api/tournaments?city=Tashkent&status=LIVE&disciplineId=...`
- `GET /api/tournaments/:id`
- `POST /api/tournaments`
- `PATCH /api/tournaments/:id`
- `DELETE /api/tournaments/:id`
- `POST /api/tournaments/:id/participants`
- `GET /api/tournaments/:id/participants`
- `POST /api/tournaments/:id/generate-bracket`
- `GET /api/tournaments/:id/bracket`
- `GET /api/tournaments/:id/matches`
- `GET /api/tournaments/:id/champion`

## Bracket Matches
- `GET /api/matches/:id`
- `PATCH /api/matches/:id/result`
- `PATCH /api/matches/:id/status`

## Rankings
- `GET /api/rankings`

## Applications
- `POST /api/applications`
- `GET /api/applications/tournament/:id`

## News
- `GET /api/news`

## Media
- `GET /api/media/galleries`

## Notifications
- `GET /api/notifications/:userId`
