# Handoff

Vehicle rental demo built with pnpm/Turbo, Next.js, NestJS, and PostgreSQL/Prisma.
Implementation is deliberately staged; see [current_plan.md](current_plan.md).

## Workspace

- `apps/web` — Next.js frontend with Tailwind CSS. Clerk remains until slice 2.
- `apps/bff` — the single NestJS API, including inventory, pricing, bookings, and Prisma.
  The existing directory/package name is retained for compatibility.
- `libs/contracts` — shared Zod schemas and TypeScript types.

The separate refdata, customer, and reservation apps and unused mock API workflows
have been removed. PostgreSQL container/database/volume names still include
`refdata` intentionally: renaming them would disconnect existing local data.

## Local development

Use Node.js 24 LTS, pnpm 11.6.0, and Docker Compose. From the repository root:

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d
pnpm --filter @handoff/bff db:migrate
pnpm --filter @handoff/bff... build
pnpm --filter @handoff/bff db:seed
pnpm dev
```

The API defaults to the bundled local database:
`postgresql://handoff:handoff@localhost:5432/refdata`.
For another database, set `DATABASE_URL` in `apps/bff/.env`
(see `apps/bff/.env.example`). Production requires an explicit `DATABASE_URL`.

Upgrading an existing checkout: move any custom settings from
`apps/services/refdata/.env` into `apps/bff/.env`. Run `pnpm install` to update
workspace links. Migration files have moved, but their contents/history are unchanged.
Do not reset the database or remove Docker volumes. Existing populated databases
do not need reseeding; the seed updates demo inventory, so use it for initial setup.

Clerk is still used by the frontend in this slice. Existing `apps/web/.env.local`
settings continue to work; development can use Clerk's temporary keyless setup.
Local account authentication without Clerk is the next slice.

Addresses:
- Website: http://localhost:3000
- API: http://localhost:3001
- PostgreSQL: localhost:5432

Subsequent starts need only the running database and `pnpm dev`.
Startup builds shared contracts and generates Prisma before starting the API.
Only run one development instance at a time. Stop it with Ctrl+C, then optionally:

```bash
docker compose -f infra/docker-compose.yml stop
```

Only PostgreSQL is containerized today. Full-stack Compose comes in a later slice.

## Validation

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:api
pnpm test:smoke
```

- `test`: dependency-free redirect regression tests (removed with Clerk in slice 2).
- `test:api`: builds the API/contracts, starts a disposable PostgreSQL 17 container
  on a random local port, applies migrations, seeds, tests routes and persistence,
  and removes the test container/volume. Requires Docker; it does not use your database.
- `test:smoke`: non-mutating API/page checks against the running, seeded local stack.

## Current boundaries

Browsing, filtering, location search, rental pricing, add-ons, and terms selection
work. Checkout submission, local accounts, booking ownership/history, confirmation
email, and the 24-hour turnaround rule are not implemented yet.
The Reserve button remains explicitly disabled.

The basic booking API is preserved for demo use, including its existing overlap
check; concurrency-safe booking and retry protection are scheduled for slice 3.
It is currently unauthenticated and must not be exposed as a public booking service.

Mock payments, profiles, identity verification, rentals, and extra journeys are
removed. `POST /bookings` keeps its response envelope but now returns
`nextJourney: null` and `alternatives: []` instead of links to nonexistent pages.
See [API routes](apps/bff/README.md) and the staged plan for the next steps.
