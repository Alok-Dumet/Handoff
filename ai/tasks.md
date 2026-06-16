# Tasks

## Link the contract into the BFF
Add `@handoff/contracts@workspace:*` to the BFF so it shares the same `Vehicle` shape as refdata.

## BFF fetches from refdata
Add a `GET /vehicles` route on the BFF that fetches from refdata (`http://localhost:3001/vehicles`) and returns the list, typed with the shared `Vehicle` contract. Run it on port 3002 and confirm `web → bff → refdata` works via curl.

## Wire the frontend to the BFF
Make `apps/web` fetch vehicles from the BFF (never refdata directly) and render a basic list.

## Add MUI to the frontend
Install Material UI and render the vehicles in a real component (card or table) instead of raw text.

## Fix refdata's stale test
Update or delete `services/refdata/src/app.controller.spec.ts`, which still references the old `getHello()` and fails on `pnpm test`.

## Add env config
Introduce dotenvx so service URLs/ports come from env vars instead of being hardcoded.

## Add a shared dev script
A root `pnpm dev` that boots web + bff + refdata together via Turborepo.
