# ── Stage 1: Build ───────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

# Copy manifests first for better layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./

COPY lib/api-client-react/package.json  ./lib/api-client-react/
COPY lib/api-spec/package.json          ./lib/api-spec/
COPY lib/api-zod/package.json           ./lib/api-zod/
COPY lib/db/package.json                ./lib/db/
COPY lib/integrations/package.json      ./lib/integrations/
COPY lib/integrations-gemini-ai/package.json ./lib/integrations-gemini-ai/
COPY artifacts/api-server/package.json  ./artifacts/api-server/
COPY artifacts/guest-pro/package.json   ./artifacts/guest-pro/

RUN pnpm install --frozen-lockfile

# Copy full source
COPY . .

# Build frontend first, then API server
RUN pnpm --filter @workspace/guest-pro build
RUN pnpm --filter @workspace/api-server build

# ── Stage 2: Production runtime ──────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY lib/api-client-react/package.json  ./lib/api-client-react/
COPY lib/api-spec/package.json          ./lib/api-spec/
COPY lib/api-zod/package.json           ./lib/api-zod/
COPY lib/db/package.json                ./lib/db/
COPY lib/integrations/package.json      ./lib/integrations/
COPY lib/integrations-gemini-ai/package.json ./lib/integrations-gemini-ai/
COPY artifacts/api-server/package.json  ./artifacts/api-server/
COPY artifacts/guest-pro/package.json   ./artifacts/guest-pro/

RUN pnpm install --frozen-lockfile --prod

# Built outputs from builder stage
COPY --from=builder /app/artifacts/api-server/dist  ./artifacts/api-server/dist
COPY --from=builder /app/artifacts/guest-pro/dist   ./artifacts/guest-pro/dist

# Lib source (workspace:* imports resolve at runtime)
COPY --from=builder /app/lib ./lib

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
