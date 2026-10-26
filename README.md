# Handoff

Vehicle rental demo built with pnpm/Turbo, Next.js, NestJS, and PostgreSQL/Prisma.
Implementation is deliberately staged; see [current_plan.md](current_plan.md).

## Workspace

- `apps/web` — Next.js frontend with Tailwind CSS and local account screens.
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

Authentication is fully local: no Clerk, Stripe, API keys, or external account
setup is required. Old Clerk variables in `.env.local` are unused and can be removed.

For an existing slice-1 database, apply the additive accounts migration and seed
only the demo account (without changing inventory or existing bookings):

```bash
pnpm --filter @handoff/bff db:migrate
pnpm --filter @handoff/bff... build
pnpm --filter @handoff/bff db:seed-account
```

Register at `/sign-up`, or log in at `/sign-in` using `demo@handoff.local` /
`DemoRental123!`. The login page can fill these demo credentials. The demo account
is shared; register a separate account for your own data. Reseeding never resets
an existing account's password. `/account` displays your signed-in identity.

Sessions persist in PostgreSQL for seven days and logout revokes them. Cookies
are HttpOnly and SameSite=Lax; configuring an HTTPS `WEB_ORIGIN` also sets Secure.
If you use a hostname/port other than `http://localhost:3000`, set `WEB_ORIGIN` in
`apps/bff/.env` to that exact browser origin. Browser API requests use `/api` on
the website. `BFF_URL` controls the internal API URL; set it before building the web app.

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

- `test`: password hashing and session-cookie regression tests; no database needed.
- `test:api`: builds the API/contracts, starts a disposable PostgreSQL 17 container
  on a random local port, applies migrations, seeds, tests routes and persistence,
  and removes the test container/volume. Requires Docker; it does not use your database.
- `test:smoke`: non-mutating API/page checks against the running, seeded local stack.

## Current boundaries

Browsing, filtering, location search, rental pricing, add-ons, and terms selection
work. Local registration/login/logout, persistent sessions, account details, and
owner-scoped booking APIs are implemented. Checkout submission, history UI,
confirmation email, and the 24-hour turnaround rule are not implemented yet.
The Reserve button remains explicitly disabled.

The basic booking API is preserved for demo use, including its existing overlap
check; concurrency-safe booking and retry protection are scheduled for slice 3.
Booking routes now require a session and return only the caller's bookings.
Customer identity is taken from the session, never the request body. Existing
anonymous bookings remain stored but are not assigned to newly registered users,
even when their email matches. Password recovery/email verification and deployment
hardening (including abuse/rate limiting) remain future work.

Mock payments, profiles, identity verification, rentals, and extra journeys are
removed. `POST /bookings` keeps its response envelope but now returns
`nextJourney: null` and `alternatives: []` instead of links to nonexistent pages.
See [API routes](apps/bff/README.md) and the staged plan for the next steps.
