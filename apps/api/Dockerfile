FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# ── Build stage ──────────────────────────────────────────────
FROM base AS builder
WORKDIR /app

# Copy workspace manifests
COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# Install all deps
RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Build shared then api
RUN pnpm --filter @dentabook/shared build
RUN pnpm --filter api exec prisma generate
RUN pnpm --filter api build

# ── Production stage ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --frozen-lockfile --prod

COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

WORKDIR /app/apps/api
ENV NODE_ENV=production

EXPOSE 3001

# Run migrations then start
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
