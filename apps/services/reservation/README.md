# @handoff/reservation

NestJS reservation domain service for HandOff.

This service owns reservation list and detail projections. It currently reads persisted booking data from refdata so overlap prevention and booking writes remain delegated to the existing write-owning service until reservation persistence is promoted.

## Endpoints

- `GET /health`
- `GET /reservations`
- `GET /reservations/:id`

## Commands

From the repo root:

```bash
pnpm --filter @handoff/reservation build
pnpm --filter @handoff/reservation test
pnpm --filter @handoff/reservation lint
```

## Environment

- `PORT` defaults to `3004`.
- `REFDATA_URL` defaults to `http://localhost:3002`.
