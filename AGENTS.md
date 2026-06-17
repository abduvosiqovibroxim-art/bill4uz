# Agent Workflow For `billiard-platform`

This file is the shared operating guide for future work in this repo.

## Project shape

- Monorepo root: `C:\Users\Asus\billiard-platform`
- Frontend: `apps/web` (`Next.js 15`, `React 19`, `Tailwind`)
- Backend: `apps/api` (`NestJS 11`, `Prisma`, `PostgreSQL`)
- Docs: `docs/ARCHITECTURE.md`, `docs/API_ENDPOINTS.md`, `docs/DEPLOYMENT.md`

## Local runtime

- Web: `http://localhost:3000`
- API Swagger: `http://localhost:4000/api/docs`
- Postgres port: `5433`
- Main compose file: `docker-compose.yml`

## Preferred commands

- Start stack: `npm run docker:up`
- Stop stack: `npm run docker:down`
- Check containers: `npm run docker:ps`
- API logs: `npm run docker:logs:api`
- Web logs: `npm run docker:logs:web`
- Local dev (db + api + web): `npm run dev`
- Typecheck all: `npm run typecheck`
- API bracket test: `npm run test`
- Full verification: `npm run verify`

## Validation defaults

- Frontend-only change: `npm run typecheck -w apps/web`
- API-only change: `npm run typecheck -w apps/api` and `npm run test`
- Cross-cutting change: `npm run verify`
- Schema or seed change: also run `npm run prisma:generate`

## Editing boundaries

- Do not edit generated output unless explicitly needed: `node_modules`, `.next`, `dist`
- Treat `.env` files as user-owned
- Avoid touching `.tunnel` and `apps/api/.email-outbox` unless the task is specifically about them
- Prefer changing source files under `apps/web/src` and `apps/api/src`

## Good task prompts

When asking for help, include:

- target area: `web`, `api`, `prisma`, `docker`, or `full stack`
- expected result: bug fix, feature, refactor, cleanup, docs
- validation target: page, endpoint, command, or acceptance rule
- constraints: no schema changes, no UI redesign, keep Docker flow, and so on

Example:

`Fix organizer tournament creation in api. Keep Prisma schema unchanged. Validate through Swagger and npm run test.`

## Delegation playbook

The user has explicitly allowed sub-agent delegation for this project.

Use `explorer` when:

- the task starts with codebase discovery
- a bug may involve multiple modules and we need fast source mapping
- we need targeted answers about `web`, `api`, `prisma`, or `docker` without editing yet

Use `worker` when:

- a task can be split into a bounded implementation slice
- ownership is clear, for example `apps/web/src/...` or `apps/api/src/...`
- the delegated change does not require broad cross-repo coordination

Preferred delegation patterns for this repo:

- `web` UI/state investigation in one agent, `api` or Prisma investigation in another
- one agent traces a bug, another prepares the narrow fix
- one agent handles validation or tests while the main agent integrates changes

Do not delegate when:

- the next step is tiny and faster to do directly
- the task is tightly coupled across many files and needs one consistent editor
- the result depends on immediate back-and-forth with the user
