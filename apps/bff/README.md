# API gateway (`@handoff/bff`)

The web-facing NestJS gateway runs on port 3001. It owns no database, migrations,
inventory, pricing, bookings or email worker. Next.js continues to call it through
same-origin `/api` routes; the public URLs and JSON contracts are unchanged.

## Routing

| Routes | Owner / behavior |
| --- | --- |
| `GET /health` | Gateway process readiness; does not depend on Rental availability |
| `GET /auth/session`, `POST /auth/register`, `/auth/login`, `/auth/logout` | Identity; gateway validates input and manages browser cookies |
| `GET /vehicles`, `/vehicles/:id`, `/locations`, `/geocode`, `/quote`, `/catalog`, `/terms` | Forwarded to Rental |
| `GET /bookings`, `/bookings/:id`, `/bookings/:id/email`; `POST /bookings` | Forwarded to Rental; Rental validates session and ownership |

Only these explicit public routes are forwarded. Internal auth/notification routes
and removed workflows remain unavailable. See [Rental](../rental/README.md) for
checkout, filtering, history and receipt payloads, and [Identity](../identity/README.md)
for account/session behavior.

## Request boundaries

Auth and booking mutations require the configured browser `Origin`, JSON content
type, and `X-Handoff-CSRF: 1`. The gateway never forwards caller-supplied service keys
or user-ID headers. It adds its own Rental service key and forwards only a valid
`handoff_session` cookie. Rental independently asks Identity to validate that token.

Session cookies remain HttpOnly, SameSite=Lax, and Secure when `WEB_ORIGIN` uses
HTTPS. Raw internal tokens and service credentials never appear in public response
bodies. Rental responses are marked `no-store` and preserve HTTP status codes.
Network failures or timeouts return a generic 503; internal redirects are rejected.
The gateway uses a 20-second Rental timeout to accommodate transactional checkout;
Identity calls retain a five-second timeout. Checkout retries remain idempotent.

Gateway and Rental readiness are separate. When Rental is offline, rental routes
return 503 while account access can continue through Identity. Restarting the
gateway does not affect service databases, sessions or queued confirmations.

## Configuration and development

See `.env.example`:

- `PORT`: 3001 by default.
- `WEB_ORIGIN`: exact browser origin, default `http://localhost:3000`.
- `IDENTITY_URL` / `IDENTITY_SERVICE_KEY`: internal Identity connection.
- `RENTAL_URL` / `RENTAL_SERVICE_KEY`: internal Rental connection.

Service keys have local demo defaults and must be supplied explicitly in production.
Compose injects local values automatically; replace them before public deployment.
No database or Notifications credentials belong in this gateway.

`pnpm dev` from the repository root starts all applications. Database migration
and inventory seeding commands now belong to `@handoff/rental`. If you have custom
host settings, move the database/outbox settings from the old `apps/bff/.env` into
`apps/rental/.env`. Default Docker usage needs no environment file changes.

`pnpm test:api` builds the gateway, Rental and Identity, then tests their real HTTP
boundary against disposable databases. It includes internal-route protection,
forged-header rejection, cookie/CSRF behavior, booking ownership, concurrency and
independent-service outage recovery. Browser suites verify the same public flow.
