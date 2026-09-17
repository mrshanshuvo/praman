# Stage 1: Base image with pnpm enabled
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@12.4.2 --activate
WORKDIR /app

# Stage 2: Install dependencies across monorepo
FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY packages/schemas/package.json ./packages/schemas/
COPY apps/api/package.json ./apps/api/
RUN pnpm install --frozen-lockfile

# Stage 3: Build application and emitted contracts
FROM deps AS builder
COPY packages/schemas ./packages/schemas
COPY apps/api ./apps/api
COPY tsconfig.base.json ./
RUN pnpm --filter @praman/schemas build
RUN pnpm --filter api contract:emit
RUN pnpm --filter api build

# Stage 4: Production runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8000

# Install curl for container health check
RUN apk add --no-cache curl

USER node

COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/packages ./packages
COPY --from=builder --chown=node:node /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=builder --chown=node:node /app/apps/api/package.json ./apps/api/package.json

WORKDIR /app/apps/api

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

CMD ["node", "dist/main.js"]
