# Rental demo implementation plan

## Working agreement

- Deliver one roughly one-day, reviewable slice at a time on `main`.
- Leave changes uncommitted for the user to review and commit.
- Stop after the current slice; wait for approval before starting the next.
- Preserve working vehicle browsing/pricing and existing database records.
- Target: local accounts → find an available car → optional extras → book →
  confirmation email → booking history/details. No payments or extra journeys.
- Availability includes a 24-hour turnaround after the scheduled return time.

## Slice 1 — Consolidate the backend (committed: d8811a1)

The initial authentication-first idea was adjusted after inspection: database
ownership must move into the retained API before adding durable accounts.

Scope:
- Retain `apps/bff` / `@handoff/bff` as the single NestJS API on port 3001.
  Keep its path/name stable to avoid unrelated frontend/configuration churn.
- Move Prisma schema, migrations, seed, and data access into that API.
- Preserve web-facing vehicle, location, quote, catalog, terms, and basic booking routes.
- Remove the separate refdata/customer/reservation applications and BFF mock
  authentication/customer, payment, rental, and journey modules/contracts.
- Keep basic booking creation's response envelope (`booking`, `nextJourney`,
  `alternatives`), with `nextJourney: null` and `alternatives: []`; no fake links.
- Add database-backed integration coverage for preserved routes and removed mocks.
- Update local setup and smoke tests; verify build, lint, tests, and browser pages.

Deliberately deferred: Clerk removal/local login, booking ownership, complete
checkout, email, history UI, turnaround/atomic availability, and full Docker setup.
The legacy booking endpoints remain demo-only and unauthenticated until slice 2/3.
Existing PostgreSQL container/volume names and migration history remain unchanged.

Acceptance:
- Only web + API application processes are needed; no HTTP calls to domain services.
- Current browsing and quote pages work against the same database.
- A basic booking persists and can be read through the API.
- Removed mock endpoints return 404.
- Tests use an isolated database, never resetting or seeding the user's database.
- Test processes are stopped before handoff.

Validation/results (2026-10-26):
- `pnpm build`: passed for web, API, and contracts.
- `pnpm lint`: passed for all remaining packages.
- `pnpm test`: redirect regression suite passed (Clerk remains until slice 2).
- `pnpm test:api`: 7 integration tests passed with a disposable PostgreSQL 17
  container; migration/seed, route contracts, price filters, quote arithmetic,
  booking writes/reads, overlap rejection, removed routes, and restart persistence.
- `pnpm test:smoke`: 27 non-mutating API/page checks passed on the normal dev stack.
- Browser checks: landing, SUV filtering, quote/protection/add-on recalculation,
  sign-in/up rendering, mobile layout, and no runtime errors in the exercised flow.
- All 7 migration/history files preserved byte-for-byte; existing local database
  reports all 6 migrations applied. No reset, reseeding, or booking writes against
  the user's database were performed during this slice.
- `pnpm dev` starts only the API, web, and contracts watcher. Test processes stopped
  before handoff; the existing database container is left running.
- The inherited seed's undeclared direct Zod import was replaced with the shared
  schema's array parser. No dependency versions were upgraded.
- Corrected price filtering to use the advertised sale rate; covered by integration tests.

Local migration/cleanup notes:
- Moved the existing ignored `apps/services/refdata/.env` to `apps/bff/.env`.
  Other checkouts with custom settings must perform this configuration move too.
- Remaining ignored artifacts from retired service folders were moved to
  `/tmp/handoff-retired-services.zoqiIg/services` (temporary recovery copy).
  Deleted tracked service/mock sources remain recoverable from Git.
- Unrelated `temporary.md` deletion and `Current_State.md` addition appeared while
  work was in progress; neither was edited as part of this slice.
- User reviewed/committed this slice as `d8811a1` and authorized slice 2.

## Slice 2 — Local accounts and ownership (complete; awaiting review/commit)

Scope:
- Remove Clerk dependencies, components, middleware, and temporary-key workaround.
- Persist local users and opaque, revocable sessions in PostgreSQL; store password
  hashes and session-token hashes, never plaintext passwords or session tokens.
- Add register/login/session/logout API routes, same-origin request protection,
  HttpOnly cookies, and no-store session responses.
- Replace sign-in/up screens, add a simple account page and working logout.
- Proxy browser API requests through the website's `/api` path.
- Add a demo account through an idempotent seed that does not reset existing users.
- Require authentication for booking routes and scope reads/writes to their owner.
  Preserve existing bookings as unowned; do not attach them by matching email.
- Add authentication/session/ownership integration tests and browser checks.

Deferred: working checkout, history UI, email, turnaround/concurrency rules,
password recovery/email verification, and deployment hardening/full-stack Compose.
No additional slice will begin before user review and commit.

Validation/results (2026-10-26):
- `pnpm build`, `pnpm lint`, and password/session-cookie unit tests passed.
- `pnpm test:api`: 13 integration tests passed against disposable PostgreSQL,
  including registration, login, logout, expiry, session rotation/restart
  persistence, request protection, booking ownership, and legacy record isolation.
- `pnpm test:smoke`: all 30 checks passed on the normal development stack.
- Browser checks passed for registration, account details, invalid credentials,
  duplicate email, login/logout, demo login, protected-page redirects, session
  persistence after API restart, existing quotes, and mobile layout. No external
  service requests or browser runtime errors occurred in the exercised flow.
- Applied the additive accounts migration to the local development database and
  seeded only the demo account. Existing booking count stayed unchanged; no
  database reset or inventory reseeding was performed.
- Demo credentials: `demo@handoff.local` / `DemoRental123!`.
- Removed Clerk dependencies without upgrading other dependency versions.
- Stopped development/test application processes before handoff. Changes remain
  uncommitted for user review; checkout and the remaining slices are not started.
- Unrelated `Handoff_AWS_Architecture.drawio.png` appeared during work and was
  left untouched.

## Remaining slices (not started)

3. Complete booking: availability-aware search, 24-hour turnaround, transactional
   conflict prevention, retry-safe submission, server pricing, stored quote/extras,
   and a working checkout/confirmation page. Test concurrency and date boundaries.
4. Booking history/details: owner-scoped summary cards and details, derived rental
   lifecycle, accessible loading/error/empty states, and browser tests.
5. Confirmation email: persistent delivery queue/retries, local SMTP inbox, and
   configurable deployment SMTP. Booking success must survive mail outages.
6. Full-stack Compose and end-to-end tests: automatic non-destructive migration/
   initial seeding, web/API/database/mail inbox, health checks, persistent volumes,
   one-command first launch, start/stop/restart verification, and a complete browser flow.
7. Deployment: select a host with the user; prepare HTTPS, private internal
   services, credentials, persistence/backups, and deployment validation. Deploy
   only after the deployment target and authority are established.

## Decisions

- No Clerk or Stripe in the final app; no payment collection.
- Local email is visible in a bundled inbox; actual external delivery requires SMTP.
- Scheduled return counts as actual return in this demo; no separate return journey.
- Keep static catalog/terms and curated location search; these are working features.
- No infrastructure changes or public deployment in slice 1.
