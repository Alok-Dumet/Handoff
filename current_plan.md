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

## Slice 2 — Local accounts and ownership (committed: be6d04b)

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

## Slice 3 — Complete booking (complete; awaiting review/commit)

Scope:
- Date-based vehicle search and shared availability checks, including a 24-hour
  turnaround after each return and before an already scheduled later rental.
- Replace date-only booking writes with validated checkout: future UTC times,
  1-hour–90-day duration, the car's existing branch, extras, and current terms.
- Lock user/vehicle rows in a transaction; scope retry keys to their owner and
  return the original booking when the same request is repeated.
- Recompute pricing against the locked vehicle; reject stale displayed totals.
  Persist the agreed quote, extras, vehicle and branch labels for confirmation.
- Enable Reserve, preserve selections through login/signup, coordinate pending
  quote updates, recover lost responses after reload, and show private confirmation.
- Remove dormant duplicate booking creation contracts/service code and replace
  misleading payment/cancellation terms with accurate demo terms.
- Add concurrency, retry, availability-boundary, validation and redirect tests.

Decisions/limits:
- All demo times are explicitly UTC. Branch-specific timezone/DST rules and
  one-way rentals are outside this slice; pickup and return use the listed branch.
- The return time plus buffer determines availability without a scheduled worker.
  History and derived rental status remain slice 4; email remains slice 5.
- The old date-only POST payload is retired. Existing records remain readable
  and continue to block availability; their data is not invented or reassigned.
- The additive migration adds nullable checkout metadata and an owner/request-key
  index. It has been applied locally without reseeding; booking count was 0.

Validation/results (2026-10-26):
- `pnpm build` and `pnpm lint`: passed for all three packages.
- `pnpm test`: 5 tests passed, including UTC duration boundaries and safe
  internal return URLs for login, alongside the authentication regressions.
- `pnpm test:api`: 16 tests passed against disposable PostgreSQL. Coverage includes
  competing users, five simultaneous retries yielding one booking, changed-key
  payload rejection, owner isolation, preserved receipt pricing, invalid/stale
  checkout inputs, same-day rentals, legacy/cancelled bookings, and the exact
  turnaround boundary on both sides of a rental. Restart persistence still passes.
- Chromium checks on an isolated database: search → extras/terms → registration
  → checkout; simulated response loss → reload → original confirmation without
  duplication; receipt reload, mobile layout, owner-only confirmation, and search
  exclusion/reappearance at the 24-hour boundary. No runtime errors or external
  requests in the exercised flow. These were ad-hoc browser checks; the maintained
  full-flow browser suite remains part of slice 6.
- `pnpm dev` started successfully; all 33 non-mutating smoke checks passed.
- Development database migration preserved its booking count (0 before/after).
  No inventory seeding, resets, or checkout writes were performed against it.
- Development/test app processes stopped and disposable test containers removed;
  the existing development PostgreSQL container remains running.
- Changes are uncommitted. No further slice will begin before review/authorization.

## Remaining slices (not started)

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
