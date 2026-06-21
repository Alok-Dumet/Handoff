# @handoff/web

Next.js frontend for Handoff.

The home page fetches vehicle summaries from the BFF as a Server Component and renders them with MUI. TanStack Query is wired for upcoming interactive/client-side workflows, and Storybook documents reusable UI components.

## Commands

```bash
pnpm dev
pnpm build
pnpm lint
pnpm storybook
pnpm build-storybook
```

From the repo root, prefer:

```bash
pnpm --filter @handoff/web <script>
```

## Environment

`BFF_URL` controls the server-side URL used by the web app. It defaults to `http://localhost:3001`.

## Structure

- `src/app/page.tsx` - vehicle-list page.
- `src/components/VehicleCard.tsx` - presentational vehicle card.
- `src/theme.ts` - MUI theme.
- `.storybook/` - Storybook config.
