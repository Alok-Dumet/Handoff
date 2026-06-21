# @handoff/bff

NestJS backend-for-frontend for Handoff.

The BFF owns UI-shaped API responses. It fetches domain vehicles from refdata, validates the response with `@handoff/contracts`, and returns `VehicleSummary` objects for the web app.

## Endpoints

- `GET /health`
- `GET /vehicles`

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
- `WEB_ORIGIN` defaults to `http://localhost:3000`.
