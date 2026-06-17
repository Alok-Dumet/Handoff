# Explanation: BFF fetches from refdata

## What was the task / issue?
Give the BFF a `GET /vehicles` route that fetches from refdata
(`http://localhost:3001/vehicles`), returns the list typed with the
shared `Vehicle` contract, runs on port 3002, and proves the
`web → bff → refdata` chain works.

## What changed?
- **`services/bff/src/app.service.ts`** — replaced the default
  `getHello()` with an async `getVehicles()` that uses native `fetch` to
  call refdata, then validates the response with
  `vehicleSchema.array().parse(data)`. The refdata base URL comes from
  `process.env.REFDATA_URL` with a `http://localhost:3001` fallback.
- **`services/bff/src/app.controller.ts`** — replaced the default `@Get()`
  with `@Get('vehicles')` returning `Promise<Vehicle[]>`.
- **`services/bff/src/main.ts`** — changed the port from 3000 to 3002
  (3000 is Next, 3001 is refdata).

## Why this approach?
- **Native `fetch`** (Node 18+) instead of axios / `@nestjs/axios` —
  fewer dependencies, the modern default.
- **Env var for the refdata URL** — the BFF must not hardcode where a
  domain service lives; the URL differs in Docker/prod. A localhost
  fallback keeps local dev zero-config.
- **Re-validating with the contract** — the BFF is the public guard, so
  it does not blindly trust a downstream service. If refdata drifts from
  the contract, the BFF fails loudly here rather than forwarding bad data
  to the browser.
- **`Promise<Vehicle[]>`** — Nest unwraps the promise automatically, so
  the route stays async end to end.

## Anything to watch for?
- refdata must be running for the BFF route to succeed; otherwise `fetch`
  throws and the request 500s. (A later task / resilience pass can add
  graceful handling.)
- The contracts package must be built (`dist/`) for the runtime import to
  resolve.
- The BFF still has the stale default `app.controller.spec.ts` (tests
  `getHello()`), same issue refdata has — will fail on `pnpm test` until
  cleaned up.

## Verification
- `pnpm --filter bff build` → exit 0 (compiles against the contract).
- Started refdata (:3001) and bff (:3002); both logged "Nest application
  successfully started".
- `curl http://localhost:3002/vehicles` returned the same two-vehicle
  JSON array as `curl http://localhost:3001/vehicles`.
- Stopped both background services afterward.
