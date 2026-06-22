# @handoff/bff

NestJS backend-for-frontend for Handoff.

The BFF owns UI-shaped API responses. It fetches domain vehicles and bookings from refdata, aggregates customer profile data from the customer service, delegates reservation reads to the reservation service, validates responses with `@handoff/contracts`, and returns frontend-ready objects for the web app.

## Endpoints

- `GET /health`
- `GET /vehicles`
- `GET /customers/me`

## Commands

```bash
pnpm dev
pnpm build
pnpm test
pnpm lint
```

From the repo root, prefer:

```bash
pnpm --filter @handoff/bff <script>
```

## Environment

- `PORT` defaults to `3001`.
- `REFDATA_URL` defaults to `http://localhost:3002`.
- `CUSTOMER_SERVICE_URL` defaults to `http://localhost:3003`.
- `RESERVATION_SERVICE_URL` defaults to `http://localhost:3004`.
- `WEB_ORIGIN` defaults to `http://localhost:3000`.
