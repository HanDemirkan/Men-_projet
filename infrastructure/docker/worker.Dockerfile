# syntax=docker/dockerfile:1

FROM node:20-alpine AS base
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

# --- deps: install workspace dependencies (cached unless package.json files change) ---
FROM base AS deps
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/database/prisma packages/database/prisma
COPY packages/permissions/package.json packages/permissions/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY packages/validation/package.json packages/validation/package.json
RUN pnpm install --frozen-lockfile

# --- dev: full source + hot reload via `tsx watch` ---
# Runs through turbo (not a plain `pnpm --filter dev`) so that workspace
# dependencies the worker imports at runtime (@qr-platform/database,
# @qr-platform/validation) are built first, per turbo.json's `dependsOn: ["^build"]`.
FROM deps AS dev
COPY . .
ENV NODE_ENV=development
EXPOSE 4100
CMD ["pnpm", "exec", "turbo", "run", "dev", "--filter=@qr-platform/worker"]

# --- build: compile the worker and every workspace package it depends on ---
FROM deps AS build
COPY . .
RUN pnpm turbo run build --filter=@qr-platform/worker...

# --- production: minimal runtime image ---
FROM base AS production
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/apps/worker ./apps/worker
COPY --from=build /app/packages ./packages
EXPOSE 4100
CMD ["node", "apps/worker/dist/index.js"]
