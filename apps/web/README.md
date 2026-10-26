# @handoff/web

Next.js frontend for Handoff.

React and Tailwind CSS frontend with Clerk authentication. The vehicle listing
and quote pages fetch data from the BFF using Server Components.

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
```

From the repo root, prefer:

```bash
pnpm --filter @handoff/web <script>
```

## Environment

`BFF_URL` controls the server-side URL used by the web app. It defaults to `http://localhost:3001`.

`NEXT_PUBLIC_BFF_URL` controls browser location searches (same default).
Configure Clerk keys in `.env.local` for your authentication instance.
See the root README for database and backend startup.

## Structure

- `src/app/page.tsx` - landing page.
- `src/app/vehicles/page.tsx` - vehicle listing and filters.
- `src/app/vehicles/[id]/page.tsx` - rental quote, add-ons, and terms. Reservation submission is unfinished.
- `src/app/sign-in` and `src/app/sign-up` - Clerk authentication pages.
- `src/components/VehicleCard.tsx` - presentational vehicle card.
