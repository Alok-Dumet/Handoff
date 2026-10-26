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

Prisma schema, migrations, and seed now live in `apps/bff/prisma`.
Existing migrations and local PostgreSQL volume names are preserved.

From the root:

```bash
pnpm --filter @handoff/bff db:migrate
pnpm --filter @handoff/bff... build
pnpm --filter @handoff/bff db:seed
pnpm dev
pnpm test:api
```

Use the seed for initial demo data; it updates existing seeded vehicles/locations.
To add the demo account alone, use `pnpm --filter @handoff/bff db:seed-account`.
Credentials: `demo@handoff.local` / `DemoRental123!`. Existing users are never reset.
The integration tests use a separate disposable Docker database, never the local one.

## Configuration

- `DATABASE_URL`: read from `apps/bff/.env` or the environment. In development,
  defaults to `postgresql://handoff:handoff@localhost:5432/refdata`.
  Required explicitly in production.
- `PORT`: defaults to `3001`.
- `WEB_ORIGIN`: exact website origin for CSRF checks; defaults to `http://localhost:3000`.
  Set the public HTTPS origin when deploying; it enables Secure session cookies
  and supplies the origin for private booking links in confirmations.
- `SMTP_HOST` / `SMTP_PORT`: defaults to `127.0.0.1:1025` (local Mailpit).
- `SMTP_SECURE`: direct TLS, default false; use true with port 465.
- `SMTP_REQUIRE_TLS`: require STARTTLS, default true with SMTP credentials unless
  direct TLS is enabled. Use true with external providers on port 587.
- `SMTP_USER` / `SMTP_PASSWORD`: optional; set both or neither.
- `EMAIL_FROM`: defaults to `HandOff <no-reply@handoff.local>`; external SMTP
  typically requires an address verified with that provider.
- `EMAIL_WORKER_ENABLED`: defaults to true. Set false to pause the background
  worker; successful bookings still queue their confirmations.

## Durable email delivery

Checkout saves one `confirmation_emails` row in the booking transaction. Its
recipient is the account's email; text/HTML use the immutable receipt and escape
customer content. Idempotent booking replays never create another delivery job.
Existing bookings are not backfilled. Public status is `not_requested`, `queued`,
`retrying`, or `sent`; the endpoint never exposes message content, SMTP errors,
credentials, or another account's delivery status.

The API polls every 5 seconds, claims up to 10 jobs per batch using PostgreSQL
`FOR UPDATE SKIP LOCKED`, and releases the database lock before SMTP. Claims carry
a unique token and a five-minute lease, allowing recovery after a crashed worker.
Failures retry after 5s, 10s, 20s, etc., capped at one hour, without a retry limit.
Logs and stored errors omit raw provider responses and credentials. Graceful
shutdown stops polling and finishes the current attempt before closing Prisma.

Delivery is **at least once**: a crash after SMTP acceptance but before the success
write can lead to a retry. Stable Message-ID values let the configured local inbox
deduplicate that case; external providers may still show duplicates. `sent` means
SMTP accepted the message, not a guarantee that a remote mailbox delivered/read it.
No SMTP request is part of checkout, so mail outages cannot roll back a booking.

The local Compose inbox uses a persistent volume, localhost-only SMTP/UI ports,
and disables automatic remote version checks. Configuration references:
[Mailpit Docker](https://mailpit.axllent.org/docs/install/docker/),
[Mailpit runtime options](https://mailpit.axllent.org/docs/configuration/runtime-options/),
[Nodemailer SMTP](https://nodemailer.com/smtp).

`REFDATA_URL`, `CUSTOMER_SERVICE_URL`, `RESERVATION_SERVICE_URL`,
`BFF_INTERNAL_AUTH_SECRET`, and `STRIPE_WEBHOOK_SECRET` are no longer used.
