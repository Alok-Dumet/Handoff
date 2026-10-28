# Identity service

Identity owns accounts, scrypt password hashes, and hashed, revocable sessions in
its own PostgreSQL database. The rental API validates sessions over authenticated
HTTP; it does not read Identity tables. Cookie handling and browser-origin checks
live in the separate web-facing gateway.

## Internal API

All `/internal/auth/*` routes require `X-Service-Key: <IDENTITY_SERVICE_KEY>` and
return `Cache-Control: no-store`. They are not published on host ports in Compose.

| Method | Route | Body / result |
| --- | --- | --- |
| GET | `/health` | Database readiness |
| POST | `/internal/auth/register` | `{ input: { name, email, password }, token? }` → `{ user, token }` |
| POST | `/internal/auth/login` | `{ input: { email, password }, token? }` → `{ user, token }` |
| POST | `/internal/auth/session` | `{ token? }` → `{ user: account | null }` |
| POST | `/internal/auth/logout` | `{ token? }` → 204 |

Tokens in these internal contracts are opaque session secrets, never user IDs.
Only their SHA-256 hashes are stored. Tokens expire after seven days; login rotates
the caller's previous token. Password hashes and session hashes never appear in
HTTP responses. The gateway still returns only `{ user }` and sets an HttpOnly cookie.

When Identity is unavailable, authenticated rental requests return 503 rather than
trusting stale user data. Failed logout does not clear the cookie or claim success.
Public inventory browsing remains available and existing sessions work on recovery.

## Safe upgrade from the combined API

Stop the old application before importing so there are no concurrent account or
session writers. From the repository root:

```bash
docker compose stop
docker compose up --build -d --wait
```

On a fresh checkout, only the second command is needed. Compose runs an
`identity-migrate` job before starting Identity and the rental API. That job:

1. Applies Identity's schema migrations.
2. Reads a consistent snapshot of legacy users and sessions from Rental.
3. Copies IDs, password hashes, session hashes and timestamps without changing them.
4. Saves a completion marker atomically with the imported records.
5. Inserts the demo account only if it is missing.

An empty legacy database is supported. A populated Identity destination without
an import marker is rejected instead of merging or overwriting accounts. A failed
import commits no partial records. Reruns skip completed imports, so logout or
password changes cannot be undone by stale legacy rows. Do not manually seed the
Identity database before importing an existing installation.

Only the one-shot migration container receives both database URLs. Runtime Identity
receives only `IDENTITY_DATABASE_URL`; Runtime Rental receives only its own URL.
Rental's additive migration removes the booking-to-local-user foreign key and
preserves every owner ID. Its old `users` and `sessions` tables remain as inactive
migration archives; runtime code no longer uses them. Keep them for now, but do not
resume an old app version after cutover: it would write to stale account tables.
Deleting archives is a separate, deliberate cleanup after backups and review.

## Host development

Start `infra/docker-compose.yml` and stop any old `pnpm dev` first. Then run:

```bash
pnpm --filter @handoff/identity db:migrate
pnpm --filter @handoff/identity db:import
pnpm --filter @handoff/identity db:seed
```

The importer defaults to the bundled rental DB on localhost:5432. For a custom
source, supply `LEGACY_IDENTITY_DATABASE_URL` to the import command only.
`IDENTITY_DATABASE_URL` defaults to localhost:5434/identity; `IDENTITY_PORT` defaults
to 3003. `pnpm dev` from the root starts Identity with the other applications.

Both Identity and Rental need the same `IDENTITY_SERVICE_KEY`. The bundled demo
value requires no setup; use a private key and private service networking for public
hosting. `IDENTITY_DATABASE_URL` and the key are required explicitly in production.

Run `pnpm test:identity` for isolated migration, authentication and restart tests.
`pnpm test:api` tests the unchanged public API over real Identity HTTP calls, and
`pnpm test:compose` exercises the complete Docker journey and outage recovery.
