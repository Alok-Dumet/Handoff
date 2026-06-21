# @handoff/refdata

NestJS reference-data service for Handoff.

Refdata owns the domain vehicle shape and persists vehicles in Postgres through Prisma. It returns data validated against `@handoff/contracts`.

## Endpoints

- `GET /health`
- `GET /vehicles`

## Database

Local Postgres is defined in `infra/docker-compose.yml`.

Start it from the repo root:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Prisma 7 config lives in `prisma.config.ts`. The generated client is emitted to `src/generated/prisma`.

## Commands

```bash
pnpm dev
pnpm build
pnpm test
pnpm lint
```

From the repo root, prefer:

```bash
pnpm --filter @handoff/refdata <script>
```

## Environment

- `PORT` defaults to `3002`.
- `DATABASE_URL` is required for Prisma and is loaded from `.env`.
