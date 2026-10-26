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

## Run with Docker

From the repository root, with Docker running and Compose 2.20 or newer:

```bash
docker compose up --build -d --wait
```

Open http://localhost:3000. Register an account or use `demo@handoff.local` /
`DemoRental123!`. Confirmation messages appear in the local inbox at
http://localhost:8025. No Node.js installation, API keys, or environment file is
needed to run the demo. The first build downloads dependencies and images.

After the first launch:

```bash
docker compose stop
docker compose start
```

Allow a few seconds for startup; `docker compose ps` shows service health.
The stack includes web, API, PostgreSQL, and Mailpit. Startup applies migrations
and inserts missing demo records without overwriting existing inventory, users,
or bookings. Database and inbox volumes survive stop/start and `docker compose down`.
Do not add `--volumes` to `down` unless you intend to erase your demo data.
Use `docker compose up --build -d --wait` again after pulling code changes.

The Compose project remains named `infra` to reuse existing development volumes.
The API is internal and reachable through the website's `/api` routes. Database
and inbox ports bind to localhost. Optional port/origin settings are documented in
[.env.example](.env.example); copy it to `.env` only if you need overrides.
When changing the browser address, set `WEB_ORIGIN` to that exact origin and
`DEMO_INBOX_URL` to the reachable inbox address.

## Local development

Use Node.js 24 LTS, pnpm 11.6.0, and Docker Compose. From the repository root:

```bash
pnpm install
docker compose stop api web # if the full Docker stack is running
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
do not need reseeding; the seed only inserts missing demo records.

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
- Local email inbox: http://localhost:8025 (SMTP: localhost:1025)

Subsequent starts need the running database and `pnpm dev`; keep the inbox running
for local email delivery.
Startup builds shared contracts and generates Prisma before starting the API.
Only run one development instance at a time. Stop it with Ctrl+C, then optionally:

```bash
docker compose -f infra/docker-compose.yml stop
```

Stop the containerized web/API before starting `pnpm dev` to avoid port conflicts.

## Confirmation email

New bookings queue a confirmation containing the saved car, rental times, extras,
price breakdown, and a private booking link. Default delivery goes to the bundled
Mailpit inbox at http://localhost:8025, **not a real email address's external inbox**.
The local inbox is shared across demo accounts and its data persists in Docker.
It binds only to localhost; the app's receipt includes an "Open local demo inbox" link.

Upgrading an existing checkout for email:

```bash
pnpm install
docker compose -f infra/docker-compose.yml up -d
pnpm --filter @handoff/bff db:migrate
pnpm dev
```

The additive migration creates the delivery queue without changing bookings or
seeding data. Existing bookings do not receive retroactive confirmations.
Receipts show queued, delayed/retrying, or sent status. SMTP downtime does not
cancel or fail a booking; delivery retries survive API restarts. Stop/start the
inbox with the existing Compose commands without deleting its volume.

To deliver externally, configure `SMTP_HOST`, `SMTP_PORT`, optional `SMTP_USER` /
`SMTP_PASSWORD`, `EMAIL_FROM`, and TLS in `apps/bff/.env`. Set `WEB_ORIGIN` to the
public website origin so email links work. See the API README and `.env.example`.
No provider integration is required; tests send only to disposable local inboxes.

## Validation

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:api
pnpm test:smoke
```

- `test`: password/session, rental-time, login-return and email configuration/template
  tests; no database or SMTP server needed.
- `test:api`: builds the API/contracts, starts a disposable PostgreSQL 17 container
  on a random local port, applies migrations, seeds, tests routes and persistence,
  and removes the test containers/volumes. Email checks use a disposable Mailpit
  SMTP server. Requires Docker; it does not use your database or send external email.
- `test:smoke`: non-mutating API/page checks against the running, seeded local stack.

Full production-container regression (requires installed workspace dependencies,
Docker, and Chromium):

```bash
pnpm exec playwright install chromium
pnpm test:compose
```

This builds production images and uses an isolated Compose project with random
ports. It checks initial migration/seeding, registration, search, extras, checkout,
email, history/details, retry safety, the 24-hour availability boundary, SMTP
outage recovery, stop/start, and container recreation. It verifies that edited
inventory, accounts, sessions, bookings, and inbox messages persist. Only its own
test containers and volumes are removed. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select
an existing Chromium executable.

For read-only smoke checks against the running Docker stack:

```bash
BFF_URL=http://localhost:3000/api pnpm test:smoke
```

History browser regression (stop `pnpm dev` first; requires Docker and port 3400):

```bash
pnpm exec playwright install chromium
pnpm test:history
```

This test builds the API, starts a disposable database and its own app processes,
and a disposable Mailpit inbox, then cleans them up afterward. It covers checkout
→ captured confirmation → history → details, pagination,
legacy records, owner isolation, live lifecycle changes, loading/error recovery,
and keyboard/mobile interactions. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` optionally selects
an existing Chromium binary. Browser tooling is a development-only dependency.

## Current boundaries

Browsing, filtering, location search, rental pricing, add-ons, and terms selection
work. Local registration/login/logout, persistent sessions, account details, and
owner-scoped booking APIs are implemented. Choose dates on `/vehicles`, select a
car and optional extras, accept the terms, and reserve it. Login/registration
preserves those selections. A successful booking opens a private confirmation
page with its saved price breakdown. No payment is collected.

Booking creation now requires the full checkout payload (see the API README);
the old date-only write format is retired. Vehicle locking prevents concurrent
double-booking, and owner-scoped request keys make retries safe. Search and checkout
both reserve the interval through **24 hours after return**, including existing
legacy bookings. No scheduler is needed to make cars available again.
All demo times are explicitly **UTC**, and pickup/return use the car's listed branch.

For an existing slice-2 checkout, run `pnpm --filter @handoff/bff db:migrate`
before starting the app. The migration only adds nullable checkout metadata and
a unique request-key index; it does not reset or seed data.

`/bookings` shows your rental history with clickable summary cards and older-page
navigation. `/bookings/:id` shows the saved receipt and details. Upcoming, Active,
and Completed states follow the scheduled UTC times and update while the page is
open; Pending and Cancelled records retain those states. Older records show only
the information originally saved. Confirmation email is implemented with a local
inbox and configurable SMTP. The full stack runs with Docker Compose.
Booking routes now require a session and return only the caller's bookings.
Customer identity is taken from the session, never the request body. Existing
anonymous bookings remain stored but are not assigned to newly registered users,
even when their email matches. Password recovery/email verification and deployment
hardening (including abuse/rate limiting) remain future work.

Mock payments, profiles, identity verification, rentals, and extra journeys are
removed. `POST /bookings` keeps its response envelope but now returns
`nextJourney: null` and `alternatives: []` instead of links to nonexistent pages.
See [API routes](apps/bff/README.md) and the staged plan for the next steps.
