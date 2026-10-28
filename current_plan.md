# Microservices migration plan

## Working agreement

- Deliver one reviewable slice at a time, sized for roughly one developer-day.
- Validate and commit each completed slice to `main` with a relevant message.
- Stop for user review before starting the next slice.
- Preserve accounts, sessions, inventory, bookings, receipts and captured emails.
- Keep first launch to `docker compose up --build -d --wait`, followed by plain
  `docker compose stop` / `docker compose start`.
- Finish the architecture migration before adding the proposed API features.

## Target architecture

Three domain microservices: **Identity**, **Rental**, and **Notifications**.
Next.js accesses a thin API gateway; each domain service owns its data and exposes
an explicit contract. Inventory, pricing and bookings stay together in Rental so
availability and booking writes remain transactional. No service reads another
service's tables. Mailpit continues to provide credential-free local SMTP capture.
The gateway, frontend, databases and inbox do not count as domain microservices.

## Slice 1 — Extract Notifications (committed: aef3a71)

- Add `apps/notifications`, a separate NestJS application, image and database.
- Move SMTP configuration, worker claims, leases and retries out of the rental API.
- Keep rental's existing `confirmation_emails` table as its transactional outbox
  and delivery-status projection, preserving existing rows and sent timestamps.
- Relay immutable confirmations over authenticated HTTP with bounded timeouts.
  Notifications accepts each booking ID idempotently and rejects changed payloads.
- Notifications owns its accepted delivery records and SMTP status. Outbox replay
  handles lost responses; service outages do not prevent booking.
- Preserve SMTP's at-least-once semantics and stable Message-ID deduplication.
- Add separate service integration tests and update existing browser regressions.
- Extend Compose with Notifications and its own PostgreSQL volume; do not rename
  or reset the existing rental/inbox volumes.

Decisions:
- Use a database outbox and idempotent HTTP delivery for this slice. A separate
  message broker is not needed for reliable delivery of this single event type.
- Rental still creates the immutable receipt content; Notifications owns delivery.
- Rental temporarily retains authentication until slice 2. This slice yields two
  backend applications, not the final three-microservice architecture.
- The published internal API has a shared service key and is not host-exposed.
  The bundled key is for local demos; production requires a private replacement.
- A new Notifications database starts empty. Already-sent rental rows are never
  forwarded; queued/failed rows transfer on the next outbox attempt. Existing
  inbox contents stay in Mailpit. No destructive rental data migration is needed.

Validation/results (2026-10-27):
- `pnpm lint` and `pnpm build`: passed across all four workspace packages.
- `pnpm test`: 9 unit tests passed.
- `pnpm test:api`: 21 integration tests passed, including outbox failure rollback,
  unavailable Notifications, concurrent relays, lost acknowledgements, and no
  replay of previously sent confirmations. These tests use a disposable database.
- `pnpm test:notifications`: 5 integration tests passed with a separate disposable
  database and real Mailpit: access control, invalid payloads, idempotency, changed
  event rejection, SMTP outage/backoff, concurrent claims, expired leases, stable
  Message-ID deduplication, automatic sending and restart persistence. The service
  operates while the rental DATABASE_URL deliberately points to an unreachable DB.
- `pnpm test:history`: passed, including the actual HTTP handoff to Notifications,
  captured email, history/details, ownership, pagination, mobile/keyboard behavior,
  live rental status and recovery after an API outage.
- `pnpm test:compose`: passed the full production-container flow with six services.
  Checkout worked while Notifications was stopped; the saved outbox was accepted
  after recovery, SMTP retried independently, and messages arrived after restart.
  Accounts, sessions, bookings, edited seed data and both notification/inbox stores
  survived stop/start and container recreation without duplicate confirmations.
- Disposable test resources were cleaned up. No migrations, resets, booking writes
  or email sends were performed against the user's development database.
- Stop here for review. Identity, the gateway/Rental split, additional features,
  and public deployment have not been started.

Commit status: user committed this slice as `aef3a71` before authorizing slice 2.

Commit message: `refactor: extract notifications into an independent service`

## Slice 2 — Extract Identity (committed: 2242b1c)

- Move users, password hashes, sessions and auth endpoints into Identity with its
  own database and migration/import procedure that preserves existing credentials.
- Introduce authenticated session validation between the gateway/Rental and Identity.
- Keep booking ownership as an opaque identity ID; remove cross-service foreign keys
  without reassigning any legacy bookings or losing history.
- Test session persistence, logout, ownership and Identity outages end to end.
- Add the third domain service to Compose and document safe upgrades.

Implementation decisions:
- Add `apps/identity` with its own database, schema, service key and internal auth API.
- Keep browser routes/cookies unchanged; the current BFF forwards auth and validates
  sessions through Identity. Invalid/missing sessions are unauthorized; service
  outages fail closed with 503 and do not clear cookies on a failed logout.
- The migration job alone receives legacy and Identity database credentials. It
  imports a consistent snapshot atomically, preserves IDs/hashes/timestamps, and
  records a marker so reruns cannot resurrect revoked sessions or reset passwords.
- Stop the old application before the first upgraded Compose launch. Existing
  `users`/`sessions` stay as inactive archives in Rental; no runtime code uses them.
  Do not restart an old application version after the cutover.
- Remove only the local user foreign key from bookings; preserve owner IDs and all
  booking rows. Use transaction advisory locks instead of a user-row lock to keep
  cross-vehicle request-key replay safe without querying Identity's database.
- Compose has eight running services and one successful migration job. Each of
  Identity, Rental, and Notifications owns a separate database. Gateway separation
  remains slice 3; no additional user-facing features are included here.

Validation/results (2026-10-27):
- `pnpm lint`, `pnpm build`, and all 9 unit tests passed across the five packages.
- `pnpm test:api`: 22 tests passed against real Identity HTTP calls, including
  unchanged registration/login/cookie behavior, booking ownership, concurrent
  checkout/retry protection, Identity outage 503 responses and session recovery.
- `pnpm test:identity`: 5 tests passed using disposable legacy and Identity
  databases. Verified conflicting-destination rejection, concurrent safe imports,
  unchanged IDs/password/session hashes and source booking ownership, expired
  sessions, guarded internal endpoints, session rotation, restart persistence,
  and no resurrection of logged-out sessions when the import is rerun.
- `pnpm test:history`: passed the existing UI flow through Identity, Rental and
  Notifications, including email delivery, owner isolation and API outage recovery.
- `pnpm test:compose`: passed fresh automatic migration/seeding and the complete
  rental journey. Identity outages fail closed without clearing the session;
  recovery restores the same user. Plain stop/start and down/up preserve all
  three databases, account edits, sessions, bookings and captured confirmations.
- Fixed a case-sensitive legacy foreign-key name in the additive migration and
  avoided duplicate builds of the shared Identity/runtime migration image.
- An isolated run encountered a Windows/WSL reserved random port; a fresh-port
  rerun passed. All disposable test containers were cleaned up afterward.
- No changes were applied to the user's development database. Existing installs
  must stop the old stack before running the documented upgrade command.
- Stop for review here; gateway extraction and extra features are not started.

Commit status: user committed Identity as `2242b1c` before authorizing slice 3.

Commit message: `refactor: extract identity with preserved accounts and sessions`

## Slice 3 — Separate gateway from Rental (complete; awaiting commit signing)

- Retain `apps/bff` as a thin web-facing gateway and move rental business logic into
  `apps/rental`, with explicit service contracts and internal access control.
- Route identity and rental requests through the gateway without exposing internal
  service keys or changing browser URLs.
- Verify all three domain services can start/restart independently; update the
  architecture inventory and validate the complete Docker rental journey.
- Remove temporary extraction adapters and document final data ownership.

Implementation decisions:
- `apps/rental` owns inventory, quotes, availability, bookings, receipts, the outbox,
  Prisma and migrations. The eleven migration/history files are byte-for-byte
  unchanged, and the existing PostgreSQL database and volumes remain attached.
- `apps/bff` has no Prisma dependency, migrations, database URL or notification
  worker. It exposes explicit public routes and forwards Rental requests with its
  own service key and only the recognized opaque session cookie.
- Rental requires its internal service key and validates booking sessions through
  Identity. Browser-supplied service keys and user-ID headers are never trusted.
- Public auth routes and browser-origin checks remain at the gateway. No browser
  URLs or response envelopes changed; internal endpoints are not forwarded.
- Gateway readiness is independent of Rental, so accounts remain accessible during
  Rental outages. Rental continues processing its outbox while the gateway is down.
- Compose runs nine long-lived services plus the existing Identity migration job.
  First launch and subsequent stop/start commands remain unchanged.
- No feature additions or public deployment are included in this slice.

Validation/results (2026-10-27):
- `pnpm lint` and `pnpm build`: passed across all six packages; 9 unit tests passed.
- `pnpm test:api`: all 24 tests passed through the real gateway/Rental/Identity
  HTTP boundary. Coverage includes unchanged auth/checkout/history contracts,
  concurrency and request-key replays, owner isolation, CSRF, direct Rental access
  rejection, spoofed identity/service headers, internal route exclusion, HEAD
  compatibility, and account access/recovery while Rental is offline.
- `pnpm test:history`: passed the browser flow through the gateway, including
  captured email, saved receipts, pagination, owner protection, keyboard/mobile
  behavior, rental lifecycle changes and recovery after Rental downtime.
- `pnpm test:compose`: passed first launch and the full rental journey. Verified
  the gateway image contains no Prisma client or database/Notifications credentials,
  independent gateway/Rental restarts, Identity and Notifications outage recovery,
  and all three databases/inbox surviving stop/start and container recreation.
- Verified all 11 existing migration/history files are byte-for-byte identical
  at their new location. No schema change, data copy, database reset, or writes
  against the user's development data were required for this slice.
- Improved isolated Docker tests to let Docker allocate infrastructure ports and
  retry only startup failures caused by Windows/WSL reserved browser/inbox ports.
  No application failure or test assertion is retried. Disposable resources were
  cleaned up, including the database left by an initial Nest dependency-wiring error.
- The three-domain-service architecture is complete. Stop here for review before
  starting cancellation, receipts or other feature work.

Commit status: changes are staged. GPG requires an interactive unlock, so the signed
commit could not be created in this session. No unsigned commit was made and Git's
signing configuration was preserved.

Commit message: `refactor: separate rental service from the API gateway`

## Later feature slices (after migration and review)

1. Eligible booking cancellation and availability release; downloadable receipts.
2. Quotes for revised dates/extras and transactional booking modifications.
3. Account editing, password changes, session listing/revocation.
4. Rate-limited confirmation resend.

Agree the exact feature grouping at that point. Public deployment remains separate
and requires a selected host, HTTPS, private service networking and backups.
