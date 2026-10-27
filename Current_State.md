# Handoff — Current State

Updated October 27, 2026. This describes the implemented application, not the older
microservices design or a future deployment.

## Architecture

Handoff is migrating to three domain microservices: Identity, Rental, and
Notifications, behind a thin API gateway. The first extraction is implemented:
there are currently **two backend applications**, not yet the final three.
See [current_plan.md](current_plan.md) for the remaining reviewed slices.

| Component | Implementation | Responsibility |
| --- | --- | --- |
| Web | `apps/web`: Next.js, React, TypeScript, Tailwind CSS | Account UI, search, checkout, history and receipts |
| Rental API | `apps/bff`: NestJS and Prisma | Inventory, pricing, bookings and transactional notification outbox; temporarily still owns accounts/sessions |
| Notifications | `apps/notifications`: NestJS, Prisma and Nodemailer | Idempotent confirmation acceptance, SMTP delivery and retries |
| Rental database | PostgreSQL 17, existing `refdata` database | Locations, vehicles, users, sessions, bookings and rental outbox |
| Notifications database | Separate PostgreSQL 17 instance/database | Accepted confirmations and delivery state |
| Inbox | Mailpit | Captures actual SMTP messages locally |
| Contracts | `libs/contracts`: Zod and TypeScript | Shared public and internal request/response validation |

Compose runs six services. Containers for databases, frontend and inbox are not
backend microservices. The workspace uses pnpm and Turborepo. Each backend owns its
schema and migrations; neither queries the other's database. The old mock domain
services, Clerk and Stripe remain removed. Existing `refdata` names are retained
to preserve data; these do not indicate a separate refdata microservice.

## Implemented rental flow

1. Register or log in using local accounts. Password hashes and revocable sessions
   are stored in PostgreSQL; browser sessions use HttpOnly cookies.
2. Search/filter cars and choose future pickup/return times. All demo times are UTC;
   pickup and return use the car's listed branch. Search updates automatically when
   either time changes: one time checks availability around that time with the
   turnaround buffer; two times check the full interval. Checkout still requires both.
3. Select optional add-ons and protection, review the server-calculated quote,
   and accept the current rental terms.
4. Reserve the car. Transactional vehicle locking prevents overlapping bookings;
   request keys make checkout retries safe. The agreed price and receipt details
   are saved rather than recalculated later.
5. View confirmation and email delivery status. Browse private booking-history
   cards and open the saved details for each booking.
6. Rental status follows the scheduled dates. Availability includes a 24-hour
   preparation period after return, without requiring a scheduled cleanup job.

Booking reads are scoped to the signed-in owner. Legacy unowned bookings remain
stored but are not assigned to accounts by matching email. No payment is collected.

## Website pages

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/vehicles` | Vehicle search, filters and date-based availability |
| `/vehicles/[id]` | Vehicle details, quote, extras, terms and checkout |
| `/sign-in` | Local login |
| `/sign-up` | Local registration |
| `/account` | Signed-in account information |
| `/bookings` | Private, paginated booking history |
| `/bookings/[id]` | Private booking details and saved receipt |
| `/bookings/[id]/confirmation` | Confirmation following checkout |

## API routes

Browser requests reach these through the web app's `/api` prefix. The API container
is not published on a host port in the full Compose stack.

| Method | API path | Purpose |
| --- | --- | --- |
| GET | `/health` | API health, including database connectivity |
| GET | `/vehicles` | Filtered inventory and availability |
| GET | `/vehicles/:id` | Vehicle details |
| GET | `/locations` | Rental branches |
| GET | `/geocode?q=` | Curated local location search |
| GET | `/quote` | Server-calculated rental pricing |
| GET | `/catalog` | Add-ons and protection plans |
| GET | `/terms` | Versioned rental terms |
| GET | `/auth/session` | Current session |
| POST | `/auth/register` | Create account and session |
| POST | `/auth/login` | Log in |
| POST | `/auth/logout` | Revoke session |
| GET | `/bookings` | Owner's paginated booking history |
| POST | `/bookings` | Validated, transactional checkout |
| GET | `/bookings/:id` | Owner's booking details |
| GET | `/bookings/:id/email` | Owner's confirmation delivery status |

See [the API documentation](apps/bff/README.md) for payloads and configuration.
Catalog/terms are static application data and geocoding searches a curated local
list. Inventory, accounts, sessions, bookings and email jobs are database-backed.

## How confirmation email works

Checkout saves one immutable confirmation in Rental's transactional outbox. A
background relay forwards it to Notifications over authenticated HTTP, with retries
and idempotent acceptance by booking ID. Notifications stores the message in its
own database and runs its own SMTP worker. Rental polls the same acceptance
endpoint to cache delivery status for the owner-only receipt UI.

Both queues survive restarts. Notifications outages do not block checkout; SMTP
outages do not prevent Notifications from accepting work. Once accepted, sending
continues even if Rental is offline. Already-sent rental records are not replayed,
and previously queued records transfer without a destructive migration.

By default, SMTP goes to the bundled Mailpit container. Open
http://localhost:8025 or use the receipt's inbox link to read the actual captured
message. Its recipient is the account's email, and its default sender is
`HandOff <no-reply@handoff.local>`.

This is working local SMTP delivery, not a stubbed send operation. However,
Mailpit captures messages instead of forwarding them to Gmail, Outlook or other
external inboxes. The inbox is shared by accounts on that local installation,
requires no credentials, and persists in its own Docker volume. A sent status
means the configured SMTP server accepted the message, not that an external inbox
received it.

External delivery is optional and requires a working outbound SMTP service and an
appropriate sender. Each operator supplies their own configuration; the project
contains no personal email credentials. Notifications supports `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`/`SMTP_PASSWORD`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, and `EMAIL_FROM`.
`WEB_ORIGIN` remains in Rental for booking links. Host SMTP settings
now live in `apps/notifications/.env`; Compose explicitly selects Mailpit, so
external delivery requires overriding the Notifications service environment.
The internal routes require a shared service key and are not host-exposed.
See [Notifications configuration](apps/notifications/README.md).

SMTP delivery is at least once. Mailpit deduplicates stable message IDs, but an
external SMTP service can receive duplicates after a crash at the acceptance
boundary. Existing bookings are not emailed retroactively.

## Docker and persistence

First launch:

```bash
docker compose up --build -d --wait
```

Website: http://localhost:3000. Inbox: http://localhost:8025.
Demo login: `demo@handoff.local` / `DemoRental123!`.
Subsequent runs use `docker compose stop` and `docker compose start`.
Use `docker compose ps` to check readiness after starting.

Startup applies migrations and inserts missing demo records: four branches, ten
vehicles and the demo account. Existing inventory edits, passwords and bookings
are preserved. Application containers run as non-root; web assets are packaged
in a Next.js standalone build. Health checks cover the API/database and web proxy.

The project name remains `infra`, reusing `infra_refdata-db-data` and
`infra_mailpit-data`, plus the new `infra_notifications-db-data`. Stop/start and ordinary `down` preserve these volumes;
`down --volumes` deletes them. Database and inbox ports bind to localhost.
Optional port/origin overrides are listed in [.env.example](.env.example).

## Development and validation

For host development, use Node.js 24 and pnpm 11.6.0. Stop containerized web/API
before running a development server on the same port:

```bash
pnpm install
docker compose stop api web notifications # only if the full stack was previously created
docker compose -f infra/docker-compose.yml up -d
pnpm --filter @handoff/bff db:migrate
pnpm --filter @handoff/notifications db:migrate
pnpm --filter @handoff/bff... build
pnpm --filter @handoff/bff db:seed
pnpm dev
```

Development API: http://localhost:3001. Stop `pnpm dev` with Ctrl+C.

Available checks:

```bash
pnpm build
pnpm lint
pnpm test
pnpm test:api
pnpm test:notifications
pnpm exec playwright install chromium
pnpm test:history
pnpm test:compose
```

API and browser suites use disposable databases/inboxes. The Compose suite uses
an isolated project and random ports, removes only its own volumes, and covers
the complete rental flow, mail outage recovery, stop/start and container recreation.
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an installed Chromium executable.
Stop `pnpm dev` before `test:history`, which uses port 3400.

Read-only smoke checks against a running Docker stack:

```bash
BFF_URL=http://localhost:3000/api pnpm test:smoke
```

The migration adds separate Notifications integration checks for authenticated
contracts, duplicate events, independent storage, real SMTP, worker claims and
restart recovery. Rental tests cover outbox atomicity, unavailable Notifications,
lost acknowledgements and preservation of previously sent rows. Final validation
results are tracked in [current_plan.md](current_plan.md).

## Remaining scope

Identity extraction and gateway/Rental separation are the next architecture
slices. The additional rental/account API features follow that migration. Public
deployment remains future work requiring a host, HTTPS, credentials, backups,
basic abuse protection and hosted validation. Password recovery and email
verification are not implemented. There is no payment collection, physical return
workflow or one-way rental journey; scheduled return is treated as return in this demo.
