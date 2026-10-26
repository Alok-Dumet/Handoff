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
- `GET /bookings` — latest 10 belonging to the authenticated user
- `GET /bookings/:id`
- `POST /bookings` — basic date-only booking

Vehicle/location/quote response shapes are unchanged. Booking creation keeps the
`{ booking, nextJourney, alternatives }` envelope, but `nextJourney` is now null
and `alternatives` is empty. Booking reads return the booking contract directly.
Booking routes require a session. `POST /bookings` accepts vehicleId/startDate/endDate;
customer name/email come from that session, ignoring client-supplied identity.
Another user's booking (or an unowned legacy booking) returns 404. Full checkout,
concurrency protection, and a 24-hour turnaround are subsequent work.

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
  Set the public HTTPS origin when deploying; it enables Secure session cookies.

`REFDATA_URL`, `CUSTOMER_SERVICE_URL`, `RESERVATION_SERVICE_URL`,
`BFF_INTERNAL_AUTH_SECRET`, and `STRIPE_WEBHOOK_SECRET` are no longer used.
