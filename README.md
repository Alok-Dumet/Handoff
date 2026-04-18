# Handoff

A post-booking car rental customer journey app. After a customer books a car, they are guided through a multi-step flow: **Pre Check-in → Biometric Consent → Vehicle Upgrade → E-Receipt**.

## Architecture

```
handoff/
├── apps/
│   ├── web/          ← Next.js 14 App Router (customer-facing UI, port 3000)
│   └── bff/          ← NestJS Backend-for-Frontend (port 3001)
├── packages/
│   ├── ui/           ← Shared MUI component library (built with Vite)
│   └── hooks/        ← Shared React hooks (SWR-based data fetching)
├── package.json      ← Root pnpm workspace config
└── pnpm-workspace.yaml
```

## Getting Started

```bash
# Install dependencies
pnpm install

# Start both Next.js and NestJS in dev mode
pnpm dev

# Next.js: http://localhost:3000
# BFF API: http://localhost:3001
```

## Other Commands

```bash
# Run Storybook (UI component explorer)
pnpm storybook

# Run unit tests
pnpm test

# Production build
pnpm build
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 (App Router), React 18, MUI 5 |
| BFF | NestJS 10 |
| Component Library | Vite (library mode), MUI, Storybook 8 |
| Data Fetching | SWR |
| Monorepo | pnpm workspaces |
| Language | TypeScript 5 |

## AEM Integration

AEM (Adobe Experience Manager) content is **mocked** via a JSON config file served through the NestJS BFF. The mock JSON at `apps/bff/src/content/aem-content.json` uses real AEM Sling Model Exporter field names (`:type`, `:path`) so the structure is production-realistic.

**To connect a real AEM instance**, update the `ContentController` in `apps/bff/src/content/content.controller.ts` to fetch from your AEM endpoint instead of the local JSON file. No frontend changes are needed — the `useAemContent` hook and `ContentBanner` component remain unchanged.
