# ─── Stage 1: Dependencies ──────────────────────────────────────────────────
FROM node:20-alpine AS deps

WORKDIR /app

RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000

# Copy package files
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-types/tsconfig.lib.json ./packages/shared-types/

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --ignore-scripts


# ─── Stage 2: Builder ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy installed node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy full source
COPY . .

# Build shared-types first, then both apps
RUN npm run postinstall && npm run build


# ─── Stage 3: Production dependencies (shared by api + worker) ──────────────
FROM node:20-alpine AS prod-deps

WORKDIR /app

RUN npm config set fetch-retries 5 \
 && npm config set fetch-retry-mintimeout 20000 \
 && npm config set fetch-retry-maxtimeout 120000

COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/

RUN npm ci --omit=dev --ignore-scripts


# ─── Stage 4: API Production ────────────────────────────────────────────────
FROM node:20-alpine AS api

WORKDIR /app

ENV NODE_ENV=production

# Workspace manifests so npm resolves the @app/shared-types symlink
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy shared-types compiled output (node_modules/@app/shared-types → packages/shared-types/dist/index.js)
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

# Copy compiled app output
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/apps/api/main.js"]


# ─── Stage 5: Worker Production ─────────────────────────────────────────────
FROM node:20-alpine AS worker

WORKDIR /app

ENV NODE_ENV=production

# Workspace manifests so npm resolves the @app/shared-types symlink
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy shared-types compiled output (node_modules/@app/shared-types → packages/shared-types/dist/index.js)
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist

# Copy compiled app output
COPY --from=builder /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/apps/worker/main.js"]
