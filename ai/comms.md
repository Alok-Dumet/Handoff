# Comms

## Task done: Scaffold the BFF service

### What I ran

```bash
pnpm dlx @nestjs/cli new bff --directory services/bff --skip-git --package-manager pnpm
```

### What it created

A standard NestJS skeleton at `services/bff/`:

- `src/main.ts` — boots the app, listens on a port.
- `src/app.module.ts` — root module wiring controller + service.
- `src/app.controller.ts` — default `GET /` route (we'll replace it).
- `src/app.service.ts` — default service (we'll replace it).
- `src/app.controller.spec.ts` — default test.
- config files — `package.json`, `tsconfig*.json`, `eslint`, `prettier`,
  `nest-cli.json`, `test/`.

### Why each flag

- **`--directory services/bff`** — drops it into our `services/`
  workspace so pnpm + Turborepo pick it up with no extra config.
- **`--skip-git`** — prevents a nested `.git` repo inside the monorepo
  (the trap we hit the first time with refdata).
- **`--package-manager pnpm`** — answers the CLI prompt so it runs
  non-interactively and installs with pnpm (not npm).

### Why this task first

The **BFF is the single backend the browser is allowed to call** — the
gateway in `web → bff → refdata`. Nothing downstream (frontend fetching
real data) can happen until this service exists. Scaffolding is the
foundation; we gut the default controller/service in the next tasks.

### Verification

- `ls services/bff/src` → all skeleton files present. ✅
- `pnpm -r list --depth -1` → **bff@0.0.1** now shows up alongside
  `web`, `@handoff/contracts`, and `refdata`. ✅
- No nested `.git` created. ✅

### Status

- **Not archived** — per your rule, I only archive when you tell me to.
- **Next task** in `tasks.md`: *Link the contract into the BFF*
  (`@handoff/contracts@workspace:*`).
