# ── WikiRace Frontend — build static files ──
# Output: /dist (copied to Caddy volume at runtime)

FROM node:24-slim AS builder
RUN corepack enable && corepack prepare pnpm@10.30.3 --activate
WORKDIR /app

# VITE_API_URL is baked into the JS bundle at build time.
# Leave empty for same-origin (Caddy proxies /socket.io/* and /wiki/* to API).
# Set to https://your-api.onrender.com for Render + Vercel split deployment.
ARG VITE_API_URL=""
ENV VITE_API_URL=${VITE_API_URL}

COPY pnpm-lock.yaml package.json pnpm-workspace.yaml ./
COPY packages/ ./packages/
COPY apps/web/ ./apps/web/

RUN pnpm install --frozen-lockfile
RUN pnpm --filter shared build && pnpm --filter web build

# ── Stage 2: Tiny output (static files only) ──
FROM alpine:3.20 AS output
COPY --from=builder /app/apps/web/dist /dist

# Copies dist/ to the shared volume — used by docker-compose with Caddy.
CMD ["cp", "-r", "/dist/.", "/output/"]
