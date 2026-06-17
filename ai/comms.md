# Comms

Three things done: removed Tailwind, ran a full health check, and
slimmed down copy.md.

---

## 1. Removed all Tailwind (app is now MUI-only)

You were right — `page.tsx` was clean MUI, but `layout.tsx` +
`globals.css` still carried leftover Tailwind from the original
`create-next-app --tailwind` scaffold. All gone now:

- **`globals.css`** — dropped `@import "tailwindcss"` and the `@theme`
  block; kept the plain CSS color variables.
- **`layout.tsx`** — removed the Tailwind utility classes
  (`h-full antialiased`, `min-h-full flex flex-col`) and my stray
  `//IS THIS MUI OR TAILWIND` comment. Kept the `next/font` variable
  classes (those are Next's font system, not Tailwind).
- **`postcss.config.mjs`** — deleted (Tailwind was its only plugin).
- **Dependencies** — uninstalled `tailwindcss` and
  `@tailwindcss/postcss`.

Verified zero Tailwind references remain anywhere in `apps/web`.

> Note: you may still see `-webkit-font-smoothing:antialiased` in the
> page's CSS — that's **MUI's `CssBaseline`** reset, not the Tailwind
> `antialiased` class. Expected and fine.

---

## 2. Health check — green, with 2 small fixes applied

| Check | Result |
|-------|--------|
| `pnpm build` (all 4 workspaces) | ✅ all pass; `next build` compiled + type-checked |
| `next build` route analysis | ✅ `/` correctly `ƒ (Dynamic)` — `no-store` keeps it out of build-time fetching |
| `pnpm lint` (all workspaces) | ✅ 0 errors (was 2 warnings — fixed, see below) |
| Live chain `web → bff → refdata` (prod mode) | ✅ page renders MUI cards with real data |
| Tailwind leakage in output | ✅ none |
| `apps/web/public` starter SVGs | ✅ already empty |

**Two fixes I applied during the check** (both real, both trivial):

- **Floating-promise lint warning** in `services/bff/src/main.ts` and
  `services/refdata/src/main.ts` — the scaffold's `bootstrap();` call
  wasn't awaited/handled. Changed to `void bootstrap();` (the idiomatic
  fix). Lint is now fully clean.

**Still open (known, not blocking):**

- `services/{bff,refdata}/src/app.controller.spec.ts` still test the old
  `getHello()` and will fail on `pnpm test`. Already tracked as the
  *Fix refdata's stale test* task (the BFF has the same issue — I'll fold
  it in).
- Each service has the default NestJS `README.md` — cosmetic noise.

**Overall: the app is in good shape** — one styling system (MUI), clean
builds, clean lint, working end-to-end.

---

## 3. Slimmed copy.md to minimal steps

Rewrote `copy.md` to be the shortest path to exactly where we are:

- **Biggest simplification:** scaffold Next.js with **`--no-tailwind`**
  from the start — so there's no "install Tailwind then rip it out"
  detour at all. The recipe now never adds Tailwind.
- Collapsed the verbose per-step blockquotes into a handful of
  one-liners, keeping only the genuinely non-obvious gotchas:
  compiled-CommonJS contracts (no `tsc --init`), match the MUI adapter to
  the Next major (`v16-appRouter`), and use `Box`+`sx` not `Stack`.
- 8 short sections: root → frontend → turbo → contracts → refdata → bff →
  frontend+MUI → run. Updated the final-state table to include the BFF.

---

## Tasks

These were a direct request, not items from `tasks.md`, so there's
nothing to archive. The `tasks.md` backlog is unchanged:
*Fix the stale test → env config → shared dev script → TanStack Query.*
