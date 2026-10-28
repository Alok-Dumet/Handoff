# @handoff/bff

The single NestJS application API, running on port 3001. Its existing package/path
name is retained, but it now owns database access directly instead of calling
separate domain services.

## Routes

- `GET /health`
- `GET /vehicles`, `GET /vehicles/:id`
- `GET /locations`
- `GET /geocode?q=...` — curated local place lookup
- `GET /quote`
- `GET /catalog`, `GET /terms`
- `GET /auth/session` — `{ user: null }` for guests, public account fields for a session
- `POST /auth/register` — create an account and a session
- `POST /auth/login` — verify credentials and issue a new session
- `POST /auth/logout` — revoke the current session and clear its cookie
- `GET /bookings?cursor=...` — owner-only history, 10 records per page
- `GET /bookings/:id`
- `GET /bookings/:id/email` — owner-only delivery status and nullable sent timestamp
- `POST /bookings` — priced, confirmed checkout with retry protection

Vehicle/location/quote response shapes are unchanged. Booking creation keeps the
`{ booking, nextJourney, alternatives }` envelope, but `nextJourney` is now null
and `alternatives` is empty. Individual booking reads return the booking contract directly.
The list route returns `{ items, nextCursor }`; pass `nextCursor` as the next
request's `cursor` until it is null. Results sort by creation time and ID descending,
so equal timestamps and new bookings do not duplicate or skip older records during
pagination. Missing/foreign/unowned cursors return the same 400 response. Detail
reads still return the booking directly; no user IDs, session data or retry keys
are included. All history/detail responses remain `no-store`.
Booking routes require a session; customer name/email come from that session,
ignoring client-supplied identity. Another user's booking (or an unowned legacy
booking) returns 404. Date-only legacy records remain readable, but new writes
must use checkout. New booking details include the immutable quote and branch/
vehicle labels used at confirmation.

Checkout body:

```json
{
  "vehicleId": "veh_001",
  "requestKey": "79ed7e6c-6349-4bc4-9561-9c2d54a31ce7",
  "expectedTotalCents": 9198,
  "extras": {
    "pickupLocationId": "loc_lax",
    "dropoffLocationId": "loc_lax",
    "pickupAt": "2027-01-01T10:00",
    "dropoffAt": "2027-01-03T10:00",
    "addOnIds": [],
    "protectionPlanId": "protection_none",
    "acceptedTermsVersion": "2026-10-27"
  }
}
```

Use the car's `pickupLocationId` for both locations, current `/terms` version,
and `/quote` total; the values above are illustrative. Times are UTC in minute
precision, must start in the future and span 1 hour–90 days. The API recomputes
prices and returns 409 if the displayed total or terms are stale. Unknown extras,
invalid times, or another branch are rejected. New bookings are immediately confirmed.

Retain the same UUID request key when retrying an unchanged request. Replays return
the same booking with 201; changing the payload for an already-used key returns
409. Keys are scoped to the authenticated user. User and vehicle row locks inside
a Read Committed transaction serialize retries and competing bookings. Pricing
uses the locked vehicle; the transaction stores both totals and display labels.

`GET /vehicles?pickupAt=...&dropoffAt=...` filters availability with the same rule:
occupied interval `[pickup, return + 24 hours)`. Both dates must be supplied.
The proposed rental also needs its own turnaround before any later booking.
Pending/confirmed legacy date-only records still block availability; cancelled
records do not. Exactly 24 hours after return is available without a background job.

Customer, reservation, rental, payment, and journey routes remain removed (404).
The old identity-header auth stub has been replaced with database-backed sessions.
Clerk and its development workaround have been removed.

## Authentication boundary

Users have normalized lowercase emails and salted scrypt password hashes.
Sessions are random 256-bit tokens; only SHA-256 token hashes are stored.
Session cookies are HttpOnly, SameSite=Lax, expire after seven days, and use Secure
when `WEB_ORIGIN` is HTTPS. Login rotates the current browser's session; logout
revokes it in the database. Session and booking responses use `Cache-Control: no-store`.

Auth/booking mutations require `Origin` equal to `WEB_ORIGIN`, JSON content type,
and `X-Handoff-CSRF: 1`. The website adds the header and proxies requests through
`/api`. Direct API clients must send these headers plus the session cookie.
Spoofed user IDs, email headers, and customer fields do not grant access.

## Database and commands

Prisma schema and migrations live in `apps/bff/prisma`. The seed implementation
lives in `src/seed.ts`; `prisma/seed.ts` wraps it for development. Containers run
compiled `dist/seed.js` after `prisma migrate deploy`.
Existing migrations and local PostgreSQL volume names are preserved.

From the root:

```bash
pnpm --filter @handoff/bff db:migrate
pnpm --filter @handoff/bff... build
pnpm --filter @handoff/bff db:seed
pnpm dev
pnpm test:api
```

The seed inserts missing demo data and preserves existing vehicles, locations,
accounts and bookings. It is safe to run on each container startup.
Accounts and sessions now live in Identity. Import existing accounts before running
`pnpm --filter @handoff/identity db:seed`; see [the safe upgrade procedure](../identity/README.md).
Credentials: `demo@handoff.local` / `DemoRental123!`. Existing users are never reset.
The integration tests use a separate disposable Docker database, never the local one.

## Configuration

- `DATABASE_URL`: read from `apps/bff/.env` or the environment. In development,
  defaults to `postgresql://handoff:handoff@localhost:5432/refdata`.
  Required explicitly in production.
- `PORT`: defaults to `3001`.
- `IDENTITY_URL`: internal Identity origin, default `http://127.0.0.1:3003`.
- `IDENTITY_SERVICE_KEY`: shared service key, required in production; a bundled
  local demo value is supplied by Compose. No browser receives this key.
- `WEB_ORIGIN`: exact website origin for CSRF checks; defaults to `http://localhost:3000`.
  Set the public HTTPS origin when deploying; it enables Secure session cookies
  and supplies the origin for private booking links in confirmations.
- `NOTIFICATIONS_URL`: internal Notifications origin, default `http://127.0.0.1:3002`.
- `NOTIFICATIONS_SERVICE_KEY`: shared internal authentication key. Required in
  production; Compose supplies a local demo value. Replace it before deployment.
- `EMAIL_WORKER_ENABLED`: defaults to true. False pauses outbox forwarding/status
  synchronization while successful bookings still queue confirmations.
- SMTP settings now belong to `apps/notifications/.env`, not this API.

## Durable email delivery

Checkout saves one `confirmation_emails` row in the booking transaction. Its
recipient is the account's email; text/HTML use the immutable receipt and escape
customer content. Idempotent booking replays never create another delivery job.
Existing bookings are not backfilled. Public status is `not_requested`, `queued`,
`retrying`, or `sent`; the endpoint never exposes message content, SMTP errors,
credentials, or another account's delivery status.

The API polls its outbox every five seconds, claims rows with `SKIP LOCKED`, and
forwards immutable messages to Notifications over authenticated HTTP. Timeouts and
service failures retry with backoff; replaying an accepted event returns its current
status without creating another delivery. The cached owner-visible status updates
on subsequent polls. Already-sent rows are never forwarded during upgrades.

Notifications owns its SMTP queue and database. Once accepted, sending and SMTP
retries continue independently of Rental. Neither service reads the other's tables.
The existing outbox table remains in the rental database to preserve atomic booking
creation and old delivery status. No HTTP or SMTP call occurs inside checkout.

See [Notifications](../notifications/README.md) for SMTP settings, delivery guarantees
and its internal API. The Docker inbox remains local and persistent; no external
email account or credentials are required for the demo.

`REFDATA_URL`, `CUSTOMER_SERVICE_URL`, `RESERVATION_SERVICE_URL`,
`BFF_INTERNAL_AUTH_SECRET`, and `STRIPE_WEBHOOK_SECRET` are no longer used.

## Identity boundary

Public `/auth` routes and cookie semantics are unchanged. The API delegates account
creation, login, session validation and logout to Identity over authenticated HTTP
with five-second timeouts. Identity outages yield 503 on authenticated operations;
failed logout does not clear the browser cookie. Inventory remains readable.

Bookings retain opaque Identity user IDs without a cross-database foreign key.
Checkout uses a transaction-scoped advisory lock for the user before locking the
vehicle, preserving retry idempotency and double-booking protection. Runtime Rental
never queries legacy user/session tables. Those inactive tables are retained only
for safe import and backup; do not run an older application against them after cutover.
