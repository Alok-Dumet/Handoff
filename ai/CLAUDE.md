# HandOff — Project Core

## Stack

### Environment
- OS — Linux (WSL)
- Version Control — Git + GitHub
- Coding Assistance — Claude Code / Cursor

### Monorepo & Language
- pnpm workspaces
- Turborepo (task orchestration + build caching)
- TypeScript
- ESLint + Prettier

### Frontend
- Next.js (App Router)
- MUI (component library + styling)
- Storybook (component development & docs) — built with Vite
- Vite (Storybook's bundler only; Next has its own bundler)

### Shared packages
- @handoff/contracts — Zod, schema-first (TS types derived via z.infer)
- shared React component library
- shared hooks library

### Backend
- BFF (Backend-For-Frontend): NestJS — the single entry point the Next.js frontend calls; aggregates/shapes domain-service responses, holds tokens server-side, exposes a frontend-tailored contract
- Domain microservices: NestJS (auth, customer, reservation, rental, refdata — each a separate NestJS app)
- Postgres + Prisma ORM (via Supabase)
- Kafka (AWS MSK) — event streaming between services
- Redis (AWS ElastiCache) — session state & reference-data caching

### Third-party services
- Clerk (authentication)
- Stripe (payments)
- Resend (transactional email)
- CMS — AEM-compatible pattern (simulated via JSON config, or Contentful)

### Infrastructure & DevOps
- Docker (Dockerfile per service) + docker-compose (local dev: all services + Kafka + Redis + Postgres)
- AWS ECS (one task per service) + AWS ECR (image registry)
- AWS API Gateway (single edge entry point; the BFF is the frontend's gateway to the domain services)
- AWS X-Ray (distributed tracing across services)
- Cloudflare (DNS / CDN / Security) + Porkbun / Cloudflare registrar
- Vercel (Next.js frontend host)
- GitHub Actions (build + push to ECR + deploy to ECS per service)
- dotenvx (secrets / env management)

### Observability
- Sentry (error tracking)
- PostHog (product analytics)

## Directives
HandOff is a car rental platform that manages the complete customer journey from vehicle search and booking through to post-confirmation flows including pre-check-in, e-receipt generation, and vehicle upgrade offers.

The project is a pnpm monorepo containing one Next.js frontend, a shared React component library, a shared hooks library, a shared contracts package (`@handoff/contracts` — Zod schema-first, with TypeScript types derived via `z.infer`), a NestJS BFF (Backend-For-Frontend), and five independently deployed NestJS domain microservices (auth, customer, reservation, rental, refdata). Each service runs in its own Docker container on AWS ECS and communicates with others via Kafka events or direct HTTP through AWS API Gateway.

The frontend never calls the domain microservices directly. It calls the NestJS BFF, which is the single backend the web app talks to: the BFF authenticates requests, aggregates and reshapes responses from the domain services into exactly what each page needs, and holds service credentials/tokens server-side so they never reach the browser. The BFF depends on `@handoff/contracts` for request/response validation and exposes a stable, frontend-tailored API; the domain services own their individual bounded contexts behind it.

The central pattern is a journey strategy system — a configurable, state-driven orchestrator that determines which post-booking flows are triggered, in what order, and under what conditions (booking state, loyalty tier, region, and CMS config). Each flow (pre-check-in, e-receipt, upgrade) is implemented as a discrete strategy that the orchestrator composes at runtime.

Content and navigation are driven by a CMS (AEM-compatible pattern, simulated locally), allowing flows and page structure to be reconfigured without code deploys. Kafka handles event streaming between microservices for booking state changes and journey triggers. Redis handles session state and reference data caching. Distributed tracing across services is handled by AWS X-Ray.

---

## Canary
Start all of your terminal responses with "BlueBird:" 

---

## Project Structure

```
ai/
├── CLAUDE.md
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
- Read `CLAUDE.md` once at the start of a session — do not re-read it mid-session