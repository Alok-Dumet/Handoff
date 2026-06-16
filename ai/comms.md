# Comms

## The refdata files — what they are, and should you hide them?

### Yes — you only modified THREE files
Confirmed. Of everything the scaffold created, you only touched:
- `src/app.controller.ts` — the HTTP routes (`GET /vehicles`)
- `src/app.service.ts`     — the logic (returns vehicles)
- `src/main.ts`            — bootstrap + port

Everything else is config or boilerplate you can mostly leave alone.

### What every file is (so "ignore" is informed, not blind)
You SHOULD know what they are, even if you rarely open them:

**Source you edited**
- `src/main.ts` — entry point; starts the server.
- `src/app.controller.ts` — routes.
- `src/app.service.ts` — business logic.

**Source you'll edit LATER (don't delete)**
- `src/app.module.ts` — wires controllers + services together. You'll
  edit this every time you add a new controller/service. Important.
- `src/app.controller.spec.ts` — unit test (currently the stale one
  referencing `getHello`). You'll fix/replace when you do testing.
- `test/app.e2e-spec.ts`, `test/jest-e2e.json` — end-to-end test setup.
  Touch when you add e2e tests.

**Config (set-and-forget — rarely opened)**
- `package.json` — deps + scripts.
- `tsconfig.json` / `tsconfig.build.json` — TypeScript settings.
- `nest-cli.json` — NestJS CLI config.
- `eslint.config.mjs` — linting rules.
- `.prettierrc` — formatting rules.
- `README.md` — the default Nest readme (safe to overwrite/delete).

### Should you HIDE them? My honest recommendation: NO — don't hide.
Hiding files in the editor is tempting but I'd advise against it here:

1. **They're not noise, they're the project's skeleton.** `app.module.ts`
   especially is something you WILL edit soon. Hiding it makes you
   forget it exists.
2. **Hiding ≠ deleting, and it can confuse you later.** A hidden file
   you forgot about causes "why isn't my change working?" moments.
3. **This is a normal, small NestJS service.** 14 files total is lean.
   Learning to glance past config files is a more durable skill than
   hiding them — every real project has them.

### Better alternatives to "hiding"
What professionals actually do to reduce clutter without hiding:

- **Just don't open them.** Your editor's file explorer shows them, but
  you only click what you need. The mental filter is the real fix.
- **Collapse folders** in the explorer (e.g. keep `test/` collapsed)
  rather than hiding files.
- **`.gitignore` handles the truly generated stuff** (`dist/`,
  `node_modules/`) — those are already hidden from git and shouldn't be
  read anyway.
- **If you truly want them out of sight**, VS Code's `files.exclude`
  setting can hide specific patterns from the explorer — but I'd only
  hide genuinely-never-touched things, and honestly I don't recommend it
  for a 14-file service.

### What you CAN safely remove (if you want less, not hidden)
If the goal is fewer files (not hidden ones), these are deletable
without harm right now:
- `README.md` (default Nest readme — meaningless to you)
- `src/app.controller.spec.ts` + `test/` (only if you're NOT doing
  testing yet — but you'll want tests eventually, so I'd keep them)

### Bottom line
- You edited the right 3 files. ✅
- Don't hide the rest — especially `app.module.ts`, which you'll need
  soon. Just learn to skim past config.
- If you want, I can delete the genuinely-useless `README.md`, or leave
  everything. Your call — say the word.
