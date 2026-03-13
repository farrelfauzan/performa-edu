# ===== Base Stage =====
FROM node:20-alpine AS base
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# ===== Dependencies Stage =====
FROM base AS dependencies

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY libs/package.json ./libs/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# ===== Development Stage =====
FROM base AS development

WORKDIR /app

# Copy dependencies from root (pnpm hoists to root node_modules)
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm exec prisma generate --schema=./libs/src/prisma/schema.prisma || true

# Expose port
EXPOSE ${PORT:-3000}

# Run in development mode with hot reload
CMD ["pnpm", "nx", "serve", "api-gateway"]

# ===== Build Stage =====
FROM base AS build

WORKDIR /app

# Copy dependencies
COPY --from=dependencies /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm exec prisma generate --schema=./libs/src/prisma/schema.prisma || true

# Build the application
RUN pnpm nx build api-gateway --configuration=production

# ===== Production Stage =====
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy built application and its generated package.json
COPY --from=build --chown=nestjs:nodejs /app/dist/apps/api-gateway ./
COPY --from=build --chown=nestjs:nodejs /app/proto ./proto

# Install production dependencies
RUN npm install --omit=dev

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE ${PORT:-3000}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-3000}/api/health || exit 1

# Run the application
CMD ["node", "main.js"]
