# ── WikiRace API — production multi-stage build ──

# ── Stage 1: Build ──
FROM node:24-slim AS builder
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

# 1. Manifests seulement — layer mis en cache tant que les package.json / lockfile ne changent pas
COPY pnpm-lock.yaml package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/

# 2. Install — cache du store pnpm entre les builds BuildKit
RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# 3. Source + build
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

RUN pnpm --filter shared build
RUN pnpm --filter api build

# ── Stage 2: Production ──
FROM node:24-slim AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules
# node_modules/@wiki-race/shared is a pnpm symlink → packages/shared; copy the target so it resolves
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json

RUN groupadd -r wikirace && useradd -r -g wikirace wikirace
USER wikirace

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/health').then(r=>{if(!r.ok)throw r;process.exit(0)}).catch(()=>process.exit(1))"

CMD ["node", "dist/main.js"]
