# Production image for the Next.js app. Built and pushed to GHCR by
# .github/workflows/deploy.yml; run on EC2 via deploy/docker-compose.yml.
#
# Debian slim rather than Alpine: app/api/projects/[slug]/pdf/route.ts runs
# Puppeteer, whose bundled Chrome is linked against glibc and won't start on
# Alpine's musl.

ARG NODE_IMAGE=node:22-bookworm-slim

# Puppeteer downloads Chrome during `npm ci`; pin the location so the runner
# stage can copy it and Puppeteer finds it again at runtime.
ARG PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

# ---- deps: install node_modules (and Puppeteer's Chrome) ------------------
FROM ${NODE_IMAGE} AS deps
ARG PUPPETEER_CACHE_DIR
ENV PUPPETEER_CACHE_DIR=${PUPPETEER_CACHE_DIR} \
    HUSKY=0
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: next build -> .next/standalone -------------------------------
FROM ${NODE_IMAGE} AS builder
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- runner: only what server.js needs -------------------------------------
FROM ${NODE_IMAGE} AS runner
ARG PUPPETEER_CACHE_DIR
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    PUPPETEER_CACHE_DIR=${PUPPETEER_CACHE_DIR} \
    PUPPETEER_NO_SANDBOX=1
WORKDIR /app

# Shared libraries and fonts Chrome needs to launch and render PDFs.
RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      ca-certificates fonts-liberation fonts-noto-color-emoji \
      libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 \
      libdbus-1-3 libdrm2 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
      libpango-1.0-0 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
      libxdamage1 libxext6 libxfixes3 libxkbcommon0 libxrandr2 libxshmfence1 \
 && rm -rf /var/lib/apt/lists/*

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=deps --chown=node:node ${PUPPETEER_CACHE_DIR} ${PUPPETEER_CACHE_DIR}

USER node
EXPOSE 3000
CMD ["node", "server.js"]
