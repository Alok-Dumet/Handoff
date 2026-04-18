# Handoff — Developer Onboarding Guide

This document explains the file structure and where to go to develop specific areas of the app.

---

## Project Structure Overview

```
handoff/
├── package.json                        ← Root workspace scripts (dev, build, test, storybook)
├── pnpm-workspace.yaml                 ← Declares workspace packages
├── tsconfig.json                       ← Base TypeScript config extended by all packages
│
├── apps/
│   ├── web/                            ← Next.js frontend (customer-facing UI)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── layout.tsx          ← Root HTML layout
│   │   │   │   ├── ThemeRegistry.tsx   ← MUI + Emotion SSR setup for Next.js
│   │   │   │   ├── page.tsx            ← Redirects / to /journey/pre-checkin
│   │   │   │   └── journey/
│   │   │   │       ├── layout.tsx      ← Journey wrapper (StepperNav + BookingCard sidebar)
│   │   │   │       ├── pre-checkin/
│   │   │   │       │   └── page.tsx    ← Step 1: Check-in form + AEM banner
│   │   │   │       ├── biometric/
│   │   │   │       │   └── page.tsx    ← Step 2: GDPR biometric consent
│   │   │   │       ├── upgrade/
│   │   │   │       │   └── page.tsx    ← Step 3: Vehicle selection grid + AEM banner
│   │   │   │       └── receipt/
│   │   │   │           └── page.tsx    ← Step 4: Final summary + print
│   │   │   └── context/
│   │   │       └── JourneyContext.tsx   ← Cross-step state (persists to sessionStorage)
│   │   ├── src/__tests__/              ← Unit tests (Jest + React Testing Library)
│   │   ├── next.config.js
│   │   ├── jest.config.ts
│   │   └── .env.local                  ← BFF URL configuration
│   │
│   └── bff/                            ← NestJS Backend-for-Frontend
│       └── src/
│           ├── main.ts                 ← App bootstrap, CORS config, port 3001
│           ├── app.module.ts           ← Root module importing all feature modules
│           ├── reservation/            ← GET /api/reservation/:id (mock booking data)
│           ├── customer/               ← GET /api/customer/:id (mock customer profile)
│           ├── vehicles/               ← GET /api/vehicles (mock vehicle list)
│           ├── content/                ← GET /api/content/:pageKey (AEM mock layer)
│           │   └── aem-content.json    ← Mock AEM content with real Sling Model fields
│           └── auth/                   ← POST /api/auth/session (mock JWT token)
│
├── packages/
│   ├── ui/                             ← Shared MUI component library
│   │   ├── src/
│   │   │   ├── HandoffTheme.tsx        ← Brand theme (navy #0A1628, gold #F5A623)
│   │   │   ├── StepperNav.tsx          ← Journey stepper (responsive)
│   │   │   ├── BookingCard.tsx         ← Booking summary card
│   │   │   ├── VehicleCard.tsx         ← Vehicle upgrade option card
│   │   │   ├── ContentBanner.tsx       ← AEM-driven promotional banner
│   │   │   ├── index.ts               ← Barrel export
│   │   │   └── stories/               ← Storybook stories for each component
│   │   ├── .storybook/                 ← Storybook config
│   │   └── vite.config.ts             ← Vite library build config
│   │
│   └── hooks/                          ← Shared React hooks
│       └── src/
│           ├── useBooking.ts           ← Fetch booking from BFF
│           ├── useCustomer.ts          ← Fetch customer profile from BFF
│           ├── useVehicles.ts          ← Fetch vehicle list from BFF
│           ├── useAemContent.ts        ← Fetch AEM content from BFF (single AEM touchpoint)
│           ├── useJourneyStep.ts       ← Manage active step with sessionStorage
│           └── index.ts               ← Barrel export
```

---

## Where to Go for Specific Development Tasks

### "I need to change the brand colors, fonts, or overall theme"
- **File:** `packages/ui/src/HandoffTheme.tsx`
- This is the single MUI theme definition. All colors, typography, border radius, and component style overrides live here. Changes propagate to the entire app.

### "I need to add or modify a shared UI component"
- **Folder:** `packages/ui/src/`
- Create your component file, export it from `packages/ui/src/index.ts`, and add a Storybook story in `packages/ui/src/stories/`.
- Components use MUI `sx` prop for styling — no CSS modules or Tailwind.

### "I need to add a new API endpoint"
- **Folder:** `apps/bff/src/`
- Create a new folder (e.g., `apps/bff/src/payments/`) with a `*.controller.ts` and `*.module.ts`.
- Register the module in `apps/bff/src/app.module.ts`.
- Each controller handles one resource. See `apps/bff/src/reservation/reservation.controller.ts` for the pattern.

### "I need to add a new data-fetching hook"
- **Folder:** `packages/hooks/src/`
- All hooks use SWR and follow the same pattern: accept params, build the BFF URL, return `{ data, isLoading, error }`.
- Export from `packages/hooks/src/index.ts`.
- See `packages/hooks/src/useBooking.ts` for the template.

### "I need to add a new journey step / page"
1. Create a new folder under `apps/web/src/app/journey/<step-name>/page.tsx`
2. Update the `STEP_ROUTES` array in `apps/web/src/app/journey/layout.tsx`
3. Update the `STEPS` array in `packages/ui/src/StepperNav.tsx`
4. If the step needs AEM content, add an entry to `apps/bff/src/content/aem-content.json`

### "I need to change what data persists across journey steps"
- **File:** `apps/web/src/context/JourneyContext.tsx`
- This React context stores all cross-step state (form data, selected vehicle, biometric consent, session token) and persists it to `sessionStorage`.

### "I need to change AEM content or connect real AEM"
- **Mock content:** `apps/bff/src/content/aem-content.json` — edit this to change what the banners display.
- **To connect real AEM:** Modify `apps/bff/src/content/content.controller.ts` to fetch from your AEM endpoint instead of the local JSON file. The frontend hooks and components need no changes.
- The `useAemContent` hook in `packages/hooks/src/useAemContent.ts` is the **only** AEM touchpoint in the frontend.

### "I need to write or run tests"
- **Test files:** `apps/web/src/__tests__/`
- **Config:** `apps/web/jest.config.ts` and `apps/web/jest.setup.ts`
- Run: `pnpm test` from root
- Tests use Jest + React Testing Library. Wrap components in MUI `ThemeProvider` when testing.

### "I need to view or demo components in isolation"
- Run `pnpm storybook` from root
- Stories live in `packages/ui/src/stories/`
- Storybook config is at `packages/ui/.storybook/`

---

## Key Architectural Decisions

| Decision | Reason |
|----------|--------|
| All API calls go through the BFF, never directly from browser to external services | Mirrors real-world architecture; easy to swap backend services |
| `useAemContent` is the only AEM touchpoint in the frontend | Single place to change when real AEM is connected |
| AEM mock JSON uses real Sling Model Exporter field names (`:type`, `:path`) | Production-realistic, no refactor needed later |
| Shared hooks use SWR | Caching, revalidation, and loading states handled automatically |
| `JourneyContext` stores cross-step state in sessionStorage | Avoids prop drilling; cleared when tab closes |
| MUI `sx` prop only — no Tailwind or CSS modules | Consistent styling approach across the entire codebase |

---

## Environment Variables

| Variable | Location | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_BFF_URL` | `apps/web/.env.local` | BFF API base URL (default: `http://localhost:3001`) |

---

## Running the App

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start Next.js (:3000) + NestJS (:3001) concurrently
pnpm storybook        # Launch Storybook component explorer (:6006)
pnpm test             # Run unit tests
pnpm build            # Production build (UI lib → Next.js app)
```
