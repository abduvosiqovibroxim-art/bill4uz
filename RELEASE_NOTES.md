# Release Notes

## QA/dev data

- `npm run seed:qa -w apps/api` creates local QA users, players, a billiard place, and a Single Elimination tournament for manual QA.
- `seed:qa` is disabled when `NODE_ENV=production` and prints `QA seed is disabled in production`.
- Production seed creates only required reference data and does not create demo or QA users, tournaments, players, or billiard places.
- Before release, run `npm run db:clean-demo -w apps/api`.
- Verify `/api/tournaments` and `/api/clubs` before publishing.

## Known limitations

- Booking places are added manually by admin or imported when a Yandex API key is configured.
- Yandex API key is not included.
- Unsupported bracket formats are marked as soon.
