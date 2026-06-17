# Deployment Recommendations

## Runtime split
- Frontend: Vercel or self-hosted Node runtime.
- Backend: Dockerized NestJS service on VPS/Kubernetes.
- Database: Managed PostgreSQL (Neon, Supabase, RDS, Aiven).
- Media: S3/Cloudinary.

## Production checklist
1. Set strong `JWT_SECRET`.
2. Enable HTTPS and trusted proxy.
3. Configure CORS to frontend domain.
4. Add rate-limit and request logging middleware.
5. Configure backups for PostgreSQL.
6. Add monitoring (Sentry + Prometheus/Grafana).
7. CI/CD:
   - lint + typecheck + tests
   - migration checks
   - image build + deploy

## Uzbek market specifics
- Keep Telegram bot + deep links for tournament registration.
- Prefer mobile-first responsive QA on Android devices.
- Prepare payment adapter interface for Uzum/Payme/Click.
