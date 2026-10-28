# syntax=docker/dockerfile:1
FROM node:24-bookworm-slim AS toolchain
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global pnpm@11.6.0
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
WORKDIR /workspace

FROM toolchain AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/bff/package.json apps/bff/package.json
COPY apps/rental/package.json apps/rental/package.json
COPY apps/notifications/package.json apps/notifications/package.json
COPY apps/identity/package.json apps/identity/package.json
COPY apps/web/package.json apps/web/package.json
COPY libs/contracts/package.json libs/contracts/package.json
RUN --mount=type=cache,id=handoff-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store
COPY apps/bff apps/bff
COPY apps/rental apps/rental
COPY apps/notifications apps/notifications
COPY apps/identity apps/identity
COPY apps/web apps/web
COPY libs/contracts libs/contracts
RUN pnpm --filter @handoff/contracts build

FROM dependencies AS api-build
RUN pnpm --filter @handoff/bff build \
    && pnpm --filter @handoff/bff deploy --legacy --prod /out/api

FROM node:24-bookworm-slim AS api
WORKDIR /app
ENV NODE_ENV=production
ENV CHECKPOINT_DISABLE=1
ENV PRISMA_HIDE_UPDATE_MESSAGE=true
COPY --from=api-build --chown=node:node /out/api ./
USER node
EXPOSE 3001
CMD ["node", "dist/main.js"]

FROM dependencies AS web-build
# Next's browser API rewrite is baked into the build; the Compose service name
# stays stable while the browser uses same-origin /api requests.
ENV BFF_URL=http://api:3001
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @handoff/web build

FROM node:24-bookworm-slim AS web
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
COPY --from=web-build --chown=node:node /workspace/apps/web/.next/standalone ./
COPY --from=web-build --chown=node:node /workspace/apps/web/.next/static ./apps/web/.next/static
COPY --from=web-build --chown=node:node /workspace/apps/web/public ./apps/web/public
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]

FROM dependencies AS notifications-build
RUN pnpm --filter @handoff/notifications build \
    && pnpm --filter @handoff/notifications deploy --legacy --prod /out/notifications

FROM toolchain AS notifications
WORKDIR /app
ENV NODE_ENV=production
ENV CHECKPOINT_DISABLE=1
ENV PRISMA_HIDE_UPDATE_MESSAGE=true
COPY --from=notifications-build --chown=node:node /out/notifications ./
COPY --chown=node:node infra/notifications-entrypoint.sh ./entrypoint.sh
USER node
EXPOSE 3002
CMD ["sh", "/app/entrypoint.sh"]

FROM dependencies AS identity-build
RUN pnpm --filter @handoff/identity build \
    && pnpm --filter @handoff/identity deploy --legacy --prod /out/identity

FROM toolchain AS identity
WORKDIR /app
ENV NODE_ENV=production
ENV CHECKPOINT_DISABLE=1
ENV PRISMA_HIDE_UPDATE_MESSAGE=true
COPY --from=identity-build --chown=node:node /out/identity ./
COPY --chown=node:node infra/identity-migrate.sh ./migrate.sh
USER node
EXPOSE 3003
CMD ["node", "dist/main.js"]

FROM dependencies AS rental-build
RUN pnpm --filter @handoff/rental build \
    && pnpm --filter @handoff/rental deploy --legacy --prod /out/rental

FROM toolchain AS rental
WORKDIR /app
ENV NODE_ENV=production
ENV CHECKPOINT_DISABLE=1
ENV PRISMA_HIDE_UPDATE_MESSAGE=true
COPY --from=rental-build --chown=node:node /out/rental ./
COPY --chown=node:node infra/rental-entrypoint.sh ./entrypoint.sh
USER node
EXPOSE 3004
CMD ["sh", "/app/entrypoint.sh"]
