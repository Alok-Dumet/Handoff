# Handoff — Current State

Updated October 26, 2026. This describes the implemented application, not the older
microservices design or a future deployment.

## Architecture

Handoff is a car rental demo with two application processes and two supporting
services, all runnable through the root `compose.yaml`:

| Component | Implementation | Responsibility |
| --- | --- | --- |
| Web | `apps/web`: Next.js, React, TypeScript, Tailwind CSS | Pages, local account UI, search, checkout, history and receipts |
| API | `apps/bff`: NestJS, Prisma, Nodemailer | Authentication, inventory, pricing, bookings and email delivery |
| Database | PostgreSQL 17 | Locations, vehicles, users, sessions, bookings and confirmation queue |
| Inbox | Mailpit | Receives SMTP messages and displays them locally |
| Contracts | `libs/contracts`: Zod and TypeScript | Shared request/response validation and types |

The workspace uses pnpm and Turborepo. The API owns its schema and migrations in
`apps/bff/prisma`. The former customer, reservation and refdata applications,
Clerk integration, mock payment endpoints and extra journey workflows are removed.
The retained `bff` directory is now the single application API. Existing database
and volume names still contain `refdata` to preserve local data.

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

Checkout saves one confirmation job in the same database transaction as the
booking. A background worker sends the saved HTML/text message through Nodemailer
using SMTP. It includes the rental details, agreed price and private booking link.
Failures are retried with increasing delays; pending jobs survive restarts and an
SMTP outage does not prevent booking.

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
contains no personal email credentials. The API supports `SMTP_HOST`, `SMTP_PORT`,
`SMTP_USER`/`SMTP_PASSWORD`, `SMTP_SECURE`, `SMTP_REQUIRE_TLS`, `EMAIL_FROM`, and
`WEB_ORIGIN`. Host development reads `apps/bff/.env`; the root Compose file
explicitly selects Mailpit, so external delivery there requires overriding the
API service's environment too. Merely editing `apps/bff/.env` does not reconfigure
the container. Local SMTP capture keeps the default demo self-contained.

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
`infra_mailpit-data`. Stop/start and ordinary `down` preserve these volumes;
`down --volumes` deletes them. Database and inbox ports bind to localhost.
Optional port/origin overrides are listed in [.env.example](.env.example).

## Development and validation

For host development, use Node.js 24 and pnpm 11.6.0. Stop containerized web/API
before running a development server on the same port:

```bash
pnpm install
docker compose stop api web # only if the full stack was previously created
docker compose -f infra/docker-compose.yml up -d
pnpm --filter @handoff/bff db:migrate
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

Last implementation validation: builds and lint passed; 9 unit tests, 22 API tests,
38 smoke checks and the Compose browser regression passed. Coverage includes
ownership, concurrent bookings, retry safety, exact turnaround boundaries, email
recovery and persistence. This documentation update does not rerun those suites.

## Remaining scope

Public deployment has not been completed. The next implementation slice is to
select a host and prepare HTTPS, deployment credentials, persistence/backups,
basic abuse protection and hosted validation. Password recovery and email
verification are not implemented. There is no payment collection, physical return
workflow or one-way rental journey; scheduled return is treated as return in this demo.
