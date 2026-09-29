# syntax=docker/dockerfile:1
# Khel Setu (NSDE Delivery Platform) — production image.
# Build:  docker build -t khel-setu .
# Stages: deps -> builder -> tools (migrations/seed) and runner (the app that serves traffic).

ARG NODE_VERSION=22

FROM node:${NODE_VERSION}-bookworm-slim AS base
# Prisma's query engine needs OpenSSL; ca-certificates is needed to fetch Google Fonts at build time.
RUN apt-get update -y \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- deps: exact versions from package-lock.json -------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: generate the Prisma client and build Next.js ---------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate && npm run build

# ---- tools: one-off jobs (prisma migrate deploy, db seed). Not used to serve traffic. --
FROM builder AS tools
CMD ["npx", "prisma", "migrate", "deploy"]

# ---- runner: the small image that serves the app -------------------------------------
FROM base AS runner
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=Asia/Kolkata

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
# Belt and braces: make sure the generated Prisma client and its engine are present.
COPY --from=builder --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=node:node /app/node_modules/@prisma/client ./node_modules/@prisma/client

USER node
EXPOSE 3000

# /api/auth/csrf is public and touches neither the database nor a session.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/auth/csrf').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
