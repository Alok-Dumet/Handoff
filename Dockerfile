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
COPY apps/web/package.json apps/web/package.json
COPY libs/contracts/package.json libs/contracts/package.json
RUN --mount=type=cache,id=handoff-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --store-dir /pnpm/store
COPY apps/bff apps/bff
COPY apps/web apps/web
COPY libs/contracts libs/contracts
RUN pnpm --filter @handoff/contracts build

FROM dependencies AS api-build
RUN pnpm --filter @handoff/bff build \
    && pnpm --filter @handoff/bff deploy --legacy --prod /out/api

FROM toolchain AS api
WORKDIR /app
ENV NODE_ENV=production
ENV CHECKPOINT_DISABLE=1
ENV PRISMA_HIDE_UPDATE_MESSAGE=true
COPY --from=api-build --chown=node:node /out/api ./
COPY --chown=node:node infra/api-entrypoint.sh ./entrypoint.sh
USER node
EXPOSE 3001
CMD ["sh", "/app/entrypoint.sh"]

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
