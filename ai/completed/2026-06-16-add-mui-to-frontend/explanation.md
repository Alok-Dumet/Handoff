# Explanation: Add MUI to the frontend

## What was the task / issue?
Install Material UI and render the vehicle list in a real component
(cards) instead of the plain `<ul>` raw text.

## What changed?
- Installed MUI and the Next App Router integration into the web app:
  `pnpm --filter web add @mui/material @emotion/react @emotion/styled @mui/material-nextjs @emotion/cache`.
- `apps/web/src/app/layout.tsx` — wrapped children in
  `AppRouterCacheProvider` (from `@mui/material-nextjs/v16-appRouter`)
  plus `CssBaseline`; updated the page title/description to HandOff.
- `apps/web/src/app/page.tsx` — replaced the plain list with MUI:
  `Container` → responsive `Box` grid → one `Card` per vehicle, with a
  status `Chip` (green when available), outlined chips for
  category/seats/location, and the formatted price. Still an async
  Server Component fetching from the BFF.

## Why this approach?
- **`@mui/material-nextjs` adapter** — makes MUI's Emotion CSS-in-JS
  render correctly during SSR (no flash of unstyled content). The
  version-specific subpath must match the installed Next major; this
  project is on Next 16, so `v16-appRouter` (an initial `v15` import was
  corrected).
- **Kept it a Server Component** — MUI display components render on the
  server, so no `"use client"` was needed and the data fetch stays
  server-side.
- **`Box` + `sx` flexbox instead of `Stack`** — MUI v9's `Stack` typing
  conflicted with React 19 (TS overload error). `Box` is the same
  primitive without the typing issue and is simpler.
- **`CssBaseline`** — standard MUI cross-browser CSS reset.

## Anything to watch for?
- The `material-nextjs` adapter subpath is pinned to the Next major
  (`v16-appRouter`). If Next is upgraded, bump this import to match.
- MUI v9 + React 19 had the `Stack` typing quirk — prefer `Box`+`sx`
  for layout until that settles, to avoid surprise type errors.
- Styling is intentionally minimal (default theme); a custom MUI theme
  can come later.
- refdata + bff must be running for the page to fetch data.

## Verification
- IDE type diagnostics: no errors after switching to `Box` and the
  `v16` adapter.
- Started refdata (:3001), bff (:3002), web (:3000); all reported ready.
- `curl http://localhost:3000` returned HTML with the vehicle data and
  server-rendered MUI classes (`MuiCard-root`, `MuiChip-colorSuccess`,
  `MuiCardContent-root`, …).
