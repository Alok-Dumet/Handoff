# Explanation: Scaffold the BFF service

## What was the task / issue?
Create the NestJS skeleton for the BFF (Backend-For-Frontend) gateway at
`services/bff`, registered as a pnpm/Turborepo workspace.

## What changed?
Ran:
```bash
pnpm dlx @nestjs/cli new bff --directory services/bff --skip-git --package-manager pnpm
```
This created `services/bff/` with the standard NestJS skeleton:
`src/main.ts`, `src/app.module.ts`, `src/app.controller.ts`,
`src/app.service.ts`, `src/app.controller.spec.ts`, plus config
(`package.json`, `tsconfig*.json`, `eslint.config.mjs`, `.prettierrc`,
`nest-cli.json`) and a `test/` folder. No other files were touched.

## Why this approach?
- `--directory services/bff` places it in the existing `services/`
  workspace glob, so pnpm + Turborepo pick it up with no extra config.
- `--skip-git` prevents a nested `.git` repo inside the monorepo (the
  problem we hit the first time scaffolding refdata).
- `--package-manager pnpm` answers the CLI prompt so it runs
  non-interactively and installs with pnpm, keeping a single root
  `node_modules`.

The BFF must exist before anything downstream: it is the single backend
the browser is allowed to call (`web → bff → refdata`). Scaffolding is
the foundation; the default controller/service get replaced in later
tasks.

## Anything to watch for?
- The generated `src/app.controller.spec.ts` tests the default
  `getHello()` and will fail once we replace the controller — same
  stale-test issue refdata has. (Tracked as its own task for refdata;
  the BFF's will need the same cleanup.)
- The BFF still runs on the default port 3000 (clashes with Next). The
  port change to 3002 happens in the "BFF fetches from refdata" task.
- `services/bff/README.md` is the default NestJS readme — noise, can be
  trimmed later.

## Verification
- `ls services/bff/src` → all skeleton files present.
- `pnpm -r list --depth -1` → `bff@0.0.1` appears alongside `web`,
  `@handoff/contracts`, and `refdata`.
- No nested `.git` created.
