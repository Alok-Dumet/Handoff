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
- `GET /bookings` — latest 10, as before
- `GET /bookings/:id`
- `POST /bookings` — basic date-only booking

Vehicle/location/quote response shapes are unchanged. Booking creation keeps the
`{ booking, nextJourney, alternatives }` envelope, but `nextJourney` is now null
and `alternatives` is empty. Booking reads return the booking contract directly.
This legacy unauthenticated API is for local demos; ownership, full checkout,
concurrency protection, and a 24-hour turnaround are subsequent work.

The former auth/session, customer, reservation, rental, payment, and journey
routes are removed and return 404. The frontend Clerk integration remains until
the next slice; nothing in the current frontend called those removed API routes.

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
The integration tests use a separate disposable Docker database, never the local one.

## Configuration

- `DATABASE_URL`: read from `apps/bff/.env` or the environment. In development,
  defaults to `postgresql://handoff:handoff@localhost:5432/refdata`.
  Required explicitly in production.
- `PORT`: defaults to `3001`.
- `WEB_ORIGIN`: defaults to `http://localhost:3000`.

`REFDATA_URL`, `CUSTOMER_SERVICE_URL`, `RESERVATION_SERVICE_URL`,
`BFF_INTERNAL_AUTH_SECRET`, and `STRIPE_WEBHOOK_SECRET` are no longer used.
