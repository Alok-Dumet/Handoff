# Notifications service

An independent NestJS service that accepts immutable rental confirmations, stores
them in its own PostgreSQL database, and delivers them through SMTP. It does not
read the rental database or require the rental API to remain online after acceptance.

## Internal API

Both confirmation routes require `X-Service-Key: <NOTIFICATIONS_SERVICE_KEY>`.
They are internal service contracts, not browser/public rental endpoints.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Database-aware service readiness |
| POST | `/internal/confirmations` | Idempotently accept a saved confirmation and return current status |
| GET | `/internal/confirmations/:id` | Read the saved delivery status |

The strict envelope is defined in `libs/contracts/src/notifications`: `bookingId`,
`recipient`, `subject`, `text`, `html`, `messageId`, and ISO `createdAt`.
Repeated IDs preserve the original content; changed receipt content returns 409.
Acceptance returns `{ status: "queued" | "retrying" | "sent", sentAt: string | null }`.
`sent` means SMTP acceptance, not delivery to a person's external mailbox.

## Storage and delivery

The service owns `confirmation_emails` in the **notifications** database. This is
separate from Rental's similarly named outbox table. There are no cross-database
queries or foreign keys. Rental retries HTTP delivery and caches the reported
status; this cache can lag Notifications by a polling interval or an outage.

The worker claims up to ten due messages every five seconds using `SKIP LOCKED`
and a five-minute lease. SMTP failures back off from five seconds to one hour.
Claims are recoverable after crashes. Delivery is at least once; a crash after
SMTP acceptance can cause a retry. Stable Message-ID values allow local Mailpit
to deduplicate; external providers may still deliver duplicates.

## Configuration and local development

The root Docker Compose stack starts and migrates this service automatically.
For host development, start `infra/docker-compose.yml`, then run:

```bash
pnpm --filter @handoff/notifications db:migrate
pnpm --filter @handoff/notifications... build
pnpm --filter @handoff/notifications dev
```

The service defaults to port 3002 and its database to localhost:5433.
Copy `.env.example` only for custom settings. In production,
`NOTIFICATIONS_DATABASE_URL` and `NOTIFICATIONS_SERVICE_KEY` are required.
Use the same private service key in Rental; the bundled demo key is not a production secret.

SMTP defaults to local Mailpit on port 1025. External delivery requires configuring
`SMTP_HOST`, `SMTP_PORT`, `EMAIL_FROM`, optional `SMTP_USER`/`SMTP_PASSWORD`, and TLS
in this service's environment. `SMTP_SECURE=true` selects direct TLS; otherwise
`SMTP_REQUIRE_TLS=true` requires STARTTLS. Both credential fields must be supplied
together. `EMAIL_WORKER_ENABLED=false` pauses sending without rejecting jobs.
Compose explicitly configures Mailpit, so external SMTP requires overriding the
Notifications container's environment, not merely adding a host `.env` file.
Rental's `WEB_ORIGIN` supplies the private booking link in the saved content.

Run `pnpm test:notifications` from the repository root for disposable PostgreSQL
and real Mailpit integration checks. `pnpm test:compose` verifies the full handoff,
including Notifications and SMTP outages, restarts and persistent volumes.
