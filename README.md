# Handoff

Vehicle rental prototype built with pnpm/Turbo, Next.js, React, Tailwind CSS,
Clerk, NestJS, and PostgreSQL/Prisma.

## Workspace

- `apps/web` - Next.js app with Tailwind CSS and Clerk authentication.
- `apps/bff` - NestJS backend-for-frontend. It calls refdata and reshapes domain vehicles for the UI.
- `apps/services/refdata` - NestJS reference-data service backed by Postgres through Prisma.
- `apps/services/customer` - Customer profile service (seeded in-memory data).
- `apps/services/reservation` - Reservation service backed by refdata, with in-memory payment state.
- `libs/contracts` - Shared Zod schemas and inferred TypeScript types.

## Local Development

Use Node.js 24 LTS, pnpm 11.6.0 (declared in `package.json`), and Docker Compose.
From the repository root, install dependencies and start Postgres:

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d
```

Create `apps/services/refdata/.env` with the local connection:

```dotenv
DATABASE_URL=postgresql://handoff:handoff@localhost:5432/refdata
```

Configure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` in
`apps/web/.env.local` for your authentication instance. Clerk also supports
temporary keyless configuration in development. Production requires your own keys.
Do not commit secrets.

Initialize the database and run the app stack:

```bash
pnpm --filter @handoff/refdata exec prisma migrate deploy
pnpm --filter @handoff/contracts build
pnpm --filter @handoff/refdata exec prisma generate
pnpm --filter @handoff/refdata exec prisma db seed
pnpm dev
```

Default ports:

- web: `http://localhost:3000`
- BFF: `http://localhost:3001`
- refdata: `http://localhost:3002`
- customer: `http://localhost:3003`
- reservation: `http://localhost:3004`

Subsequent runs need Postgres and `pnpm dev`. Startup builds shared contracts
before the apps and regenerates Prisma. Apply migrations again after schema changes;
startup does not change the database.

Stop the app with Ctrl+C, then run `docker compose -f infra/docker-compose.yml stop`.
Only Postgres is containerized; Compose does not yet start the application services.

## Validation

```bash
pnpm build
pnpm lint
pnpm test       # regression tests; no running services required
pnpm test:smoke # requires the running stack and seeded database
```

Smoke checks cover health endpoints, filtering, quotes, missing records, invalid
requests, and page responses without creating bookings. Browser testing is still
needed for client interactions and authenticated account flows.

## Current feature boundaries

Vehicle browsing, filtering, location search, rental-window pricing, add-ons,
and terms selection are implemented. The Reserve button is disabled because web
checkout submission is unfinished; choosing dates does not book a car. The legacy
booking API exists, with additional reservation-storage work in progress.

Customer profiles and journey workflows contain seeded/mock data. Payment sessions
and identity verification are mocks, with some state held only in memory. The
reservation/journey destinations returned by these APIs do not yet have web pages.
These features need completion before a public production launch.
