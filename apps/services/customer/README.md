# @handoff/customer

NestJS customer domain service for HandOff.

This service owns customer profile and preference data behind a service boundary. It starts with seeded in-memory profiles so the BFF can integrate against a real service without taking on database work in the first milestone.

## Endpoints

- `GET /health`
- `GET /customers/:customerId/profile`

## Commands

From the repo root:

```bash
pnpm --filter @handoff/customer build
pnpm --filter @handoff/customer test
pnpm --filter @handoff/customer lint
```

## Environment

- `PORT` defaults to `3003`.
