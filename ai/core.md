# CORE

## Stack
OS — Linux (WSL)
Version Control — Git + GitHub
Coding Assistance — Claude Code / Cursor
nodemon
pnpm workspaces
Next.js (App Router) + TypeScript
Tailwind CSS + MUI
NestJS BFF (auth, customer, reservation, rental, refdata)
Zod
Supabase + Postgres + Prisma ORM
Turborepo or Nx
Storybook
Vite
AEM
Clerk
Stripe
Resend
AWS ElastiCache (Redis)
Kafka (AWS MSK)
AWS (ECS or Lambda)
Porkbun / Cloudflare Registrar
Cloudflare (DNS / CDN / Security)
Vercel
Doppler or dotenvx
ESLint + Prettier
Sentry
PostHog
GitHub Actions
Docker + docker-compose

## Directives
We are creating HandOff. 
HandOff is a car rental platform that manages the complete customer journey across two brand-specific applications — from vehicle search and booking through to post-confirmation flows including pre-check-in, e-receipt generation, and vehicle upgrade offers.
The project is structured as a monorepo containing two brand-specific frontends, a shared React component library, a shared hooks library, and a suite of BFF services (auth, customer, reservation, rental, refdata). The frontends are visually distinct per brand but share all core logic, components, and hooks.
The central pattern is a journey strategy system — a configurable, state-driven orchestrator that determines which post-booking flows are triggered, in what order, and under what conditions (booking state, loyalty tier, region, and content config). Each flow (pre-check-in, e-receipt, upgrade) is implemented as a discrete strategy that the orchestrator composes at runtime.
Content and navigation are driven by a CMS, allowing flows and page structure to be reconfigured without code deploys. Event streaming handles booking state changes and journey triggers between services. Session state and reference data are cached for performance.

---

## Project Structure

```
ai/
├── core.md
├── tasks.md
├── issues.md
└── completed/
    └── <YYYY-MM-DD-slug>/
        ├── task.md OR issue.md
        └── explanation.md
```

---

## Procedure

Do NOT archive automatically. Only archive when the user explicitly tells you to (e.g. "archive that," "log it," "move it to completed"). On every other completion, just finish the work and stop.

### Task — only when explicitly told to archive
1. Do the work
2. Remove the entry from `tasks.md`
3. Create `completed/<YYYY-MM-DD-slug>/task.md` — copy the original task description verbatim
4. Create `completed/<YYYY-MM-DD-slug>/explanation.md` — follow Explanation Format below

### Issue — only when explicitly told to archive
1. Do the work
2. Remove the entry from `issues.md`
3. Create `completed/<YYYY-MM-DD-slug>/issue.md` — copy the original issue description verbatim
4. Create `completed/<YYYY-MM-DD-slug>/explanation.md` — follow Explanation Format below

---

## Slug Format

`YYYY-MM-DD-short-description` in kebab-case. 2–5 words. Derived from the task or issue title.

---

## Explanation Format

```
# Explanation: <title>

## What was the task / issue?
## What changed?
## Why this approach?
## Anything to watch for?
```

---

## tasks.md Format

```
# Tasks

## <Task Title>
<Description>
```

---

## issues.md Format

```
# Issues

## <Issue Title>
<Description>
```

---

## Documentation

File: `zdocs/project-map.md`

Update only when told a push is happening or explicitly asked. Not after every task or issue.

When updating, cover:
- What the project does
- Folder structure and responsibilities
- Pages, components, and where they live
- API routes and route handlers
- Key classes, hooks, and utilities
- Database schema and models
- Environment variables
- Conventions and gotchas

Remove anything that no longer exists. Write for a developer who is new to the codebase.

---

## Rules

- One task or issue at a time unless told otherwise
- Work is not done until `completed/` is updated
- Never modify anything inside `completed/`
- Ask before starting anything ambiguous
- No new libraries without asking first

---

## Context Hygiene

- Only read files relevant to the current task or issue
- Never read inside `completed/`
- Never read `zdocs/project-map.md` unless the task involves documentation or you are told to
- Read `tasks.md` and `issues.md` only to locate the current item — do not summarize or reflect back the full contents
- Read `core.md` once at the start of a session — do not re-read it mid-session