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

## Slice 1 — Extract Notifications (complete; awaiting commit signing)

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

Commit status: all changes are staged. The signed commit was blocked by the local
GPG passphrase prompt; no commit was created and signing settings were preserved.

Commit message: `refactor: extract notifications into an independent service`

## Slice 2 — Extract Identity (not started)

- Move users, password hashes, sessions and auth endpoints into Identity with its
  own database and migration/import procedure that preserves existing credentials.
- Introduce authenticated session validation between the gateway/Rental and Identity.
- Keep booking ownership as an opaque identity ID; remove cross-service foreign keys
  without reassigning any legacy bookings or losing history.
- Test session persistence, logout, ownership and Identity outages end to end.
- Add the third domain service to Compose and document safe upgrades.

## Slice 3 — Separate gateway from Rental (not started)

- Retain `apps/bff` as a thin web-facing gateway and move rental business logic into
  `apps/rental`, with explicit service contracts and internal access control.
- Route identity and rental requests through the gateway without exposing internal
  service keys or changing browser URLs.
- Verify all three domain services can start/restart independently; update the
  architecture inventory and validate the complete Docker rental journey.
- Remove temporary extraction adapters and document final data ownership.

## Later feature slices (after migration and review)

1. Eligible booking cancellation and availability release; downloadable receipts.
2. Quotes for revised dates/extras and transactional booking modifications.
3. Account editing, password changes, session listing/revocation.
4. Rate-limited confirmation resend.

Agree the exact feature grouping at that point. Public deployment remains separate
and requires a selected host, HTTPS, private service networking and backups.
