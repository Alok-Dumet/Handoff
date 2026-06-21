# Handoff

Handoff is a pnpm/turbo monorepo for a vehicle-listing vertical slice.

## Workspace

- `apps/web` - Next.js app with MUI, TanStack Query provider setup, and Storybook.
- `apps/bff` - NestJS backend-for-frontend. It calls refdata and reshapes domain vehicles for the UI.
- `apps/services/refdata` - NestJS reference-data service backed by Postgres through Prisma.
- `libs/contracts` - Shared Zod schemas and inferred TypeScript types.

## Local Development

Postgres runs through Docker:

```bash
docker compose -f infra/docker-compose.yml up -d
```

Run the app stack:

```bash
pnpm dev
```

Default ports:

- web: `http://localhost:3000`
- BFF: `http://localhost:3001`
- refdata: `http://localhost:3002`

## Validation

```bash
pnpm build
pnpm test
pnpm lint
```

Storybook is available on demand:

```bash
pnpm --filter @handoff/web storybook
```
