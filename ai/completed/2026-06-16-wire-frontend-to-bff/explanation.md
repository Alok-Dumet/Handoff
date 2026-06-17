# Explanation: Wire the frontend to the BFF

## What was the task / issue?
Make `apps/web` fetch vehicles from the BFF (never from refdata directly)
and render a basic list, completing the `web → bff → refdata` chain.

## What changed?
- Linked the shared contract into the web app:
  `pnpm --filter web add @handoff/contracts@workspace:*`.
- Rewrote `apps/web/src/app/page.tsx` (replacing the Next.js starter) as
  an async Server Component that fetches `GET /vehicles` from the BFF and
  renders a plain `<ul>` of vehicles. The BFF base URL comes from
  `process.env.BFF_URL` with a `http://localhost:3002` fallback; price
  (stored in cents) is divided by 100 and formatted as currency.

## Why this approach?
- **Server Component, not client fetch** — the Next App Router lets a
  component be `async` and fetch on the server before sending HTML. This
  keeps `BFF_URL` server-side, avoids a loading spinner, and puts the
  data in the initial HTML. It is the modern default for initial reads.
- **Calls the BFF, never refdata** — honors the architecture: the website
  talks to exactly one backend.
- **`BFF_URL` via env var** — mirrors the BFF→refdata pattern; ready for
  Docker/prod, zero-config locally.
- **`cache: "no-store"`** — vehicle availability is dynamic, so we avoid
  serving a stale cached list.
- **Plain HTML for now** — kept the step focused on data flow; styling
  (MUI) is a separate task.

## Anything to watch for?
- The BFF (and refdata behind it) must be running or the page throws at
  request time.
- This is a Server Component fetch only. When the first interactive
  client feature arrives (filtering, booking, live availability), that's
  when TanStack Query gets introduced — tracked as its own task. Adding
  it now would be a dead dependency or force a downgrade to a client
  component.
- Styling is intentionally bare pending the MUI task.

## Verification
- `apps/web/package.json` shows `"@handoff/contracts": "workspace:*"`.
- Started refdata (:3001), bff (:3002), web (:3000); all reported ready.
- `curl http://localhost:3000` returned HTML containing "Available
  vehicles", Toyota, Corolla, Jeep, Wrangler, economy, suv, LAX — real
  data carried through web ← bff ← refdata.
- Stopped all three afterward.
