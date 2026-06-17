# Tasks

## Fix refdata's stale test
Update or delete `services/refdata/src/app.controller.spec.ts`, which still references the old `getHello()` and fails on `pnpm test`.

## Add env config
Introduce dotenvx so service URLs/ports come from env vars instead of being hardcoded.

## Add a shared dev script
A root `pnpm dev` that boots web + bff + refdata together via Turborepo.

## Adopt TanStack Query on the first interactive screen
When we build the first client-side interactive feature (vehicle filter/search, a booking mutation, or live availability), introduce TanStack Query: add a `QueryClientProvider`, use `useQuery`/`useMutation` in the client components, and hydrate from server-fetched data. Keep initial reads in Server Components.
