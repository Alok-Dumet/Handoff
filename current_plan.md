# Rental demo implementation plan

## Working agreement

- Deliver one roughly one-day, reviewable slice at a time on `main`.
- Leave changes uncommitted for the user to review and commit.
- Stop after the current slice; wait for approval before starting the next.
- Preserve working vehicle browsing/pricing and existing database records.
- Target: local accounts → find an available car → optional extras → book →
  confirmation email → booking history/details. No payments or extra journeys.
- Availability includes a 24-hour turnaround after the scheduled return time.

## Slice 1 — Consolidate the backend (complete; awaiting user review/commit)

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
- Changes remain uncommitted on `main`. Next action: user review/commit, then slice 2.

## Remaining slices (not started)

2. Local accounts: remove Clerk and its workaround/tests; add persisted users,
   hashed passwords, cookie sessions, login/register/logout, demo account, and
   authenticated API ownership boundaries. Add account/session integration tests.
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
