# Handoff

A self-contained car rental demo. Create an account, find an available car, choose
optional extras, reserve it, and view your booking history and receipts. Cars become
available again 24 hours after their scheduled return. No payment is collected.

## Tech stack

- **Frontend:** Next.js, React, TypeScript, and Tailwind CSS.
- **Backend:** NestJS rental API and independent Notifications service, each with
  its own PostgreSQL database through Prisma. Identity extraction is planned.
- **Shared validation:** Zod, in a pnpm/Turborepo monorepo.
- **Email:** Nodemailer over SMTP, with a bundled Mailpit inbox.
- **Runtime:** Docker Compose runs the entire stack.

## Run it

Install Docker with Compose 2.20 or newer, start Docker, then run from this repository:

```bash
docker compose up --build -d --wait
```

Open **http://localhost:3000**. Register an account or sign in with:

- Email: `demo@handoff.local`
- Password: `DemoRental123!`

Booking emails arrive in **http://localhost:8025**, the local demo inbox. These are
SMTP messages captured on your machine; they are not delivered to external email
accounts. No personal email credentials, API keys, or environment file are needed.

After the first launch, stop and start the app with:

```bash
docker compose stop
docker compose start
```

Allow a few seconds after starting. Accounts, bookings, and inbox messages persist.
Startup handles database migrations and missing demo data automatically. After
pulling changes, rerun the first command to rebuild. Removing volumes with
`docker compose down --volumes` deletes your local data.

See [Current_State.md](Current_State.md) for architecture, routes, development
commands, tests, and remaining work. Optional settings are in [.env.example](.env.example).
