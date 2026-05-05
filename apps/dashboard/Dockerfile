# @CLAUDE_CONTEXT
# Package : apps/dashboard
# File    : Dockerfile
# Role    : Multi-stage Docker build for Aria React dashboard.
#           Stage 1 : deps    — install node_modules (dashboard only)
#           Stage 2 : builder — vite build → static files in dist/
#           Stage 3 : runner  — nginx serves static files on port 80
#
# RAILWAY SETUP — set this as a Build Variable in the Railway aria-dashboard service:
#   VITE_API_URL = https://<your-api-public-domain>
#   Find your API public domain: Railway → aria-api service → Settings → Networking → Public Domain
#   Example: https://aria-api-production.up.railway.app
#
# Vite bakes VITE_* env vars into the JS bundle at BUILD TIME.
# In Railway, add it under: Service → Variables → (toggle) "Available at build time"

ARG VITE_API_URL=""

# ---- Stage 1: Deps ----
FROM node:20-alpine AS deps
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY apps/dashboard/package.json ./apps/dashboard/

RUN pnpm install --frozen-lockfile --filter @aria/dashboard

# ---- Stage 2: Builder ----
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

COPY --from=deps /app/node_modules              ./node_modules
COPY --from=deps /app/apps/dashboard/node_modules ./apps/dashboard/node_modules

COPY apps/dashboard ./apps/dashboard

WORKDIR /app/apps/dashboard
RUN node_modules/.bin/vite build

# ---- Stage 3: Runner (nginx) ----
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/dashboard/dist /usr/share/nginx/html

RUN rm -f /etc/nginx/conf.d/default.conf

RUN printf 'server {\n\
    listen __PORT__;\n\
    root /usr/share/nginx/html;\n\
    index index.html;\n\
    gzip on;\n\
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;\n\
    location / {\n\
        try_files $uri $uri/ /index.html;\n\
    }\n\
    location ~* \\.(?:js|css|woff2?|png|jpg|svg|ico)$ {\n\
        expires 1y;\n\
        add_header Cache-Control "public, immutable";\n\
    }\n\
}\n' > /tmp/nginx.conf.template

ENV PORT=80
EXPOSE 80

CMD ["/bin/sh", "-c", "sed \"s/__PORT__/${PORT}/g\" /tmp/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
