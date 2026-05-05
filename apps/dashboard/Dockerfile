# @CLAUDE_CONTEXT
# Package : apps/dashboard
# File    : Dockerfile
# Role    : Multi-stage Docker build for Aria React dashboard.
#           Stage 1 : deps    — install node_modules (dashboard only)
#           Stage 2 : builder — vite build → static files in dist/
#           Stage 3 : runner  — nginx serves static files + proxies /api/ to API service
#
# RAILWAY SETUP — set this Runtime Variable in the Railway aria-dashboard service:
#   API_URL = https://<your-api-public-domain>
#   Find your API public domain: Railway → aria-api service → Settings → Networking → Public Domain
#   Example: https://aria-api-production.up.railway.app
#
# API_URL is read at container startup by docker-entrypoint.sh — it is NOT a build variable.

ARG VITE_API_URL=""

# ---- Stage 1: Deps ----
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/

# Install only dashboard deps (workspace filter skips all other packages)
RUN pnpm install --frozen-lockfile --filter @aria/dashboard

# ---- Stage 2: Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

# Re-declare ARG so the value flows into this stage
ARG VITE_API_URL=""
# Set as ENV so the vite build process sees it
ENV VITE_API_URL=$VITE_API_URL

COPY --from=deps /app/node_modules              ./node_modules
COPY --from=deps /app/apps/dashboard/node_modules ./apps/dashboard/node_modules

COPY apps/dashboard ./apps/dashboard

WORKDIR /app/apps/dashboard
# Use vite directly (skip tsc typecheck to avoid tsconfig reference issues in Docker)
RUN node_modules/.bin/vite build

# ---- Stage 3: Runner (nginx) ----
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

# Remove the default nginx config — entrypoint generates ours at runtime
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy entrypoint script that generates nginx config from env vars
COPY apps/dashboard/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

ENV PORT=80
EXPOSE 80

CMD ["/docker-entrypoint.sh"]
