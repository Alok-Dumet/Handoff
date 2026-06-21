
---

## Vehicle-listing vertical slice — how it's wired to run

The first feature flows end-to-end with **no database** (hardcoded data), proving the web → BFF → service chain.

**The chain (3 hops):**
1. **refdata** (`:3002`) — `GET /vehicles` returns 4 hardcoded cars (the raw domain shape). Lives in a `vehicles` feature module; generic `app.*` stub reduced to a `/health` route.
2. **BFF** (`:3001`) — `GET /vehicles` calls refdata via `fetch`, then **reshapes** each car for the frontend: adds `title` ("2024 Toyota Corolla") and `priceLabel` ("$42/day"). This is the BFF's job — shape data per the UI so the web layer stays presentation-only.
3. **web** (`:3000`) — the home page is a **Server Component** that fetches the BFF and renders the list. Runs on the server, so it calls the BFF directly.

**Ports (no collisions):** web `3000`, BFF `3001`, refdata `3002`. Overridable via `PORT`. BFF→refdata URL is `REFDATA_URL`; web→BFF is `BFF_URL`; BFF allows CORS from `WEB_ORIGIN` (defaults to localhost:3000).

**To run it:**
- All at once: `pnpm dev` (turbo runs every app's `dev` in parallel), then open http://localhost:3000.
- The data direction: browser → web (SSR) → BFF → refdata, and back.

**Verified:** `turbo run build` → 3/3 pass; curling `/vehicles` on both services shows the reshape; the rendered web HTML contains the car titles and prices.

**Still skeleton:** data is hardcoded in refdata (no DB), no shared types yet (web and BFF each declare their own interface — that's what `@handoff/contracts` will unify next), plain CSS (no MUI).

---

## Added @handoff/contracts — shared Zod schemas (schema-first)

**What:** Created the first shared library, `libs/contracts` (`@handoff/contracts`),
holding Zod schemas as the single source of truth. TypeScript types are derived
via `z.infer`, so types can never drift from validation. All three apps now import
from it instead of declaring their own duplicated interfaces.

**Schemas (vehicles bounded context):**
- `VehicleSchema` / `Vehicle` — the domain shape refdata owns.
- `VehicleSummarySchema` / `VehicleSummary` — the BFF-tailored frontend shape.
- Shared enums: `TransmissionSchema`, `VehicleClassSchema`.
- List variants + their inferred types for array payloads.

**Why this was the right next step:** it kills the duplication that made the
slice feel like "hassle" — the `VehicleSummary` interface was hand-copied in both
BFF and web. Now there's one definition. It also adds **runtime validation at
every boundary**, not just compile-time types:
- refdata validates its seed data with `VehicleListSchema.parse(...)` at load.
- BFF validates refdata's response with `VehicleListSchema.parse(...)` — if a
  domain service drifts, we fail loudly at the boundary instead of leaking bad
  data to the UI.
- web validates the BFF response with `VehicleSummaryListSchema.parse(...)`.

**How it builds:** contracts compiles with `tsc` to `dist/`; turbo's `^build`
(dependsOn) guarantees it builds before its consumers. `pnpm install` now reports
**5 workspace projects**; `turbo run build` → **4/4 successful**; re-curled the
chain — refdata raw domain → BFF validated+reshaped → unchanged output.

**Still skeleton:** data still hardcoded (no DB yet — Phase 3 Prisma will derive
its model from these same schemas), plain CSS (no MUI).

---

## Fixed `pnpm dev` (BFF + refdata weren't starting)

**What was wrong (two issues):**
1. **No `dev` script on the Nest apps.** turbo runs the `dev` task across packages, but the BFF and refdata only had `start:dev` (from `nest new`). turbo silently skips a package that lacks the task — so only web + contracts ran, and nothing listened on 3001/3002. Web's fetch to the BFF 404'd in a loop.
2. **Stale `next-server` squatting on port 3000.** A leftover dev process from an earlier run held 3000, so web fell back to 3001 — colliding with where the BFF should be.

**Fix:** added `"dev": "nest start --watch"` to both `apps/bff` and `apps/services/refdata` so turbo starts them; killed the stale process to free 3000.

**How to run/check the app now:**
- `pnpm dev` from the repo root → starts all four packages (web, bff, refdata, contracts watcher).
- Open **http://localhost:3000** — the vehicle list renders.
- Health checks: `curl localhost:3001/health` and `curl localhost:3002/health`.
- If 3000 is "in use by an unknown process," a previous `pnpm dev` didn't shut down — kill the stale `next-server`/`node` process (`ss -ltnp | grep :3000`) and re-run.

**Verified:** all three return 200, page shows the cars.

---

## Phase 3 setup — getting Docker Postgres running (action required from you)

**Decision:** local dev uses **Docker Postgres**; Supabase stays as the hosted DB for deployment later. Both are in the stack — different jobs (Docker = local inner loop, Supabase = deployed env). The Prisma code is identical either way; only the connection string differs.

### Environment note: this IS WSL2 (not a VM)
- Kernel `microsoft-standard-WSL2`, `/mnt/c` mounted, `wsl.exe` present → genuine WSL2.
- "bash doesn't recognize `wsl`" is normal: **`wsl` is a Windows command**, run from PowerShell/CMD to enter Linux. Inside the Linux shell you're already in it — there's nothing to run. Not an error.

### What you need to do (one-time)
Docker Desktop runs on Windows; "WSL integration" exposes the `docker` command into this Linux shell. Right now it's off.

1. **Install Docker Desktop for Windows** (if not installed): https://www.docker.com/products/docker-desktop/ — during setup choose the WSL 2 backend.
2. **Enable WSL integration for this distro:** Docker Desktop → Settings → Resources → WSL Integration → toggle this distro ON → Apply & Restart.
3. **Verify from THIS Linux shell:**
   ```bash
   docker --version      # should print a version
   docker ps             # should list containers (daemon reachable)
   ```
   If `docker ps` works, you're done — tell me and I'll create infra/docker-compose.yml and wire Prisma.

### Do you need a Postgres client (psql)?
**Not required.** Prisma talks to the DB directly; I can also seed/inspect via Prisma. A `psql` client is only a convenience for poking the DB by hand. If you want it:
```bash
sudo apt update && sudo apt install -y postgresql-client   # gives `psql` only, no server
```
(Optional — skip unless you want a manual SQL shell. We are NOT installing the full postgresql server; Docker provides that.)

### What I'll do once `docker ps` works
1. `infra/docker-compose.yml` — a `postgres` service (db name, user, password, port 5432) with a named volume.
2. You run: `docker compose -f infra/docker-compose.yml up -d`.
3. Add Prisma to refdata (`prisma`, `@prisma/client` — new libs), `Vehicle` model matching the contract schema, `.env` with `DATABASE_URL`.
4. `prisma migrate dev` + seed the 4 cars; swap VehiclesService to query Prisma. Endpoint contract unchanged → BFF/web untouched.

---

## Phase 3 — refdata now reads from Postgres (Prisma)

**What:** Swapped refdata's hardcoded vehicle array for a real Postgres database via Prisma. The endpoint contract (`GET /vehicles`) is unchanged, so the BFF and web layers were untouched — data now flows **web ← BFF ← refdata ← Postgres**.

**Pieces:**
- `infra/docker-compose.yml` — Postgres 17 (`handoff-refdata-db`, db/user/pass `refdata`/`handoff`/`handoff`, port 5432, named volume, healthcheck, `restart: unless-stopped`).
- Prisma in refdata: `schema.prisma` with a `Vehicle` model + `Transmission`/`VehicleClass` enums mirroring `@handoff/contracts`. Migration `init_vehicles` created the `vehicles` table.
- `prisma/seed.ts` seeds the 4 cars, validated against the contract (`VehicleListSchema.parse`) so the seed can't drift. Idempotent upsert.
- `PrismaService`/`PrismaModule` (Nest injectable wrapping PrismaClient with connect/disconnect lifecycle). `VehiclesService` now does `prisma.vehicle.findMany`.

**Verified:** `turbo build` 4/4; `pnpm dev` brings all three up in ~3s; web renders DB data. Live-data proof: updated a row to `pricePerDay=999` directly in Postgres → API returned 999 → reverted to 42. Confirms it's reading the DB per-request, not hardcoded.

### Prisma 7 gotchas (this is NOT the old Prisma — important for future work)
Prisma 7 changed a lot from older tutorials. What bit us and how it's resolved:
1. **Driver adapter is mandatory.** No built-in engine connection — needs `@prisma/adapter-pg` (PrismaPg) passed to `new PrismaClient({ adapter })`. Added.
2. **`url` removed from `schema.prisma` datasource.** Connection config moved to **`prisma.config.ts`** (`datasource.url: env('DATABASE_URL')`). The CLI reads the URL from there for migrate/generate.
3. **Generator is `prisma-client` (not `prisma-client-js`)** and **requires an explicit `output` path** — we generate into `src/generated/prisma` (git-ignored; it's a build artifact). Import `PrismaClient` from there, NOT from `@prisma/client`.
4. **No runtime `.env` autoload.** Added `import 'dotenv/config'` to `main.ts` and the seed; `prisma.config.ts` imports it too.

### Extra libs Phase 3 required (beyond the prisma/@prisma/client you approved)
All are mandatory plumbing for Prisma 7 / running TS seeds, not feature choices:
- `@prisma/adapter-pg` — required Postgres driver adapter (see #1).
- `dotenv` — load `.env` at runtime + in prisma.config.
- `tsx` (dev) — run the TypeScript seed; pulled in `esbuild` (approved its build script in pnpm-workspace allowBuilds, alongside prisma/sharp).

### Build-layout fix (tsc footgun, worth remembering)
Adding `prisma.config.ts` + `prisma/seed.ts` at the package root made tsc recompute its rootDir, nesting output to `dist/src/main.js` and breaking `nest start`. Also, the incremental `.tsbuildinfo` lived outside `dist`, so `deleteOutDir` wiped dist but tsc skipped re-emitting ("0 errors", 0 files) — watch mode couldn't find `dist/main`. Fixed in `tsconfig.build.json`: pinned `rootDir: src`, moved `tsBuildInfoFile` into `./dist`, and excluded `prisma.config.ts` + `prisma/` from the Nest build.

### Operational note (environment, not code)
Docker Desktop must be running on Windows for the DB to be reachable. After a machine/WSL restart it may not auto-start — symptoms are `docker: command not found` in WSL and Prisma `P1001 Can't reach database server at 127.0.0.1:5432`. Fix: start Docker Desktop (the container auto-restarts via its policy), then `pnpm dev`. If port 3001/3002/3000 shows EADDRINUSE, an orphaned `node dist/main.js` survived a prior run — `pkill -f dist/main` (match the actual argv, which is just `dist/main.js`).

---

## Phase 4 — UI libraries: MUI, TanStack Query, Storybook (all latest)

**What:** Added the three deferred frontend libraries to `apps/web` and rebuilt the vehicle list with MUI. All on the latest versions as requested.

**Versions installed:**
- `@mui/material` 9.1.1, `@mui/material-nextjs` 9.1.1, `@emotion/react` 11.14, `@emotion/styled` 11.14, `@emotion/cache` 11.14, `@fontsource/roboto` 5.2
- `@tanstack/react-query` 5.101, `@tanstack/react-query-devtools` 5.101
- `storybook` 10.4.6 + `@storybook/nextjs-vite` 10.4.6 (Vite-based, per the stack doc) + addons (a11y, docs, vitest, chromatic, mcp)

**MUI (the real Phase-4 value):**
- `src/theme.ts` — `createTheme` with `cssVariables: true`, Roboto via CSS var, primary color.
- `layout.tsx` wires `AppRouterCacheProvider` (from `@mui/material-nextjs/v16-appRouter` — matched to Next 16) + `ThemeProvider` + `CssBaseline` + Roboto font. The cache provider does SSR-safe style injection (styles land in `<head>`, no flash of unstyled content — verified `MuiCard-root`/`MuiChip-root`/`MuiContainer-root` appear in the server HTML).
- Extracted `components/VehicleCard.tsx` (pure presentational, props-in) and rebuilt `page.tsx` with `Container`/`Stack`/`Card`/`Chip`/`Typography`. Removed the old CSS module; slimmed globals.css.

**TanStack Query:** `src/providers.tsx` — a `'use client'` `QueryClientProvider` (client created in `useState` so it's stable and not shared across server requests) + devtools, wired into the layout. NOTE: not yet exercised — the vehicle read is still a Server Component (correct: initial server reads stay server-side per the stack doc). The provider is ready for the first interactive/client component (search filters, booking mutations).

**Storybook:** initialized in `apps/web` (nextjs-vite framework). Removed the boilerplate sample stories; added `VehicleCard.stories.tsx` (Economy/Premium/Suv). `.storybook/preview.tsx` wraps every story in the app's MUI theme + CssBaseline so stories match production. Run with `pnpm --filter @handoff/web storybook` (port 6006). Added a `build-storybook` turbo task (output `storybook-static/**`); left `storybook` dev OUT of the default `pnpm dev` so it doesn't auto-launch — it's on-demand.

**Verified:** `turbo build` 4/4 (Next correctly ignores `.stories.tsx` — not imported by any route); `build-storybook` succeeds; `pnpm dev` brings the stack up in ~2s and the page renders DB vehicles with MUI styling; Storybook dev serves the VehicleCard stories.

**Gotcha (MUI 9):** `Stack` no longer takes `justifyContent`/`alignItems`/`flexWrap` as direct props — they go through `sx`. Fixed in VehicleCard.

**Honest note on scope:** MUI is fully exercised. TanStack Query + Storybook are correctly wired but lightly used so far (one component story; no client-side queries yet) — they'll earn their keep as interactive components and a shared component library appear. This matches the deferred-libs plan.
