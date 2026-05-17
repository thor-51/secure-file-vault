# FILE: backend/Dockerfile
# Multi-stage build for production Node.js backend

# ── Stage 1: Dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: Build (generate Prisma client) ────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate

# ── Stage 3: Production image ─────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

# Security: run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy production node_modules from deps stage
COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules

# Copy Prisma-generated client from builder
COPY --from=builder --chown=appuser:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copy application source
COPY --chown=appuser:nodejs . .

# Create logs directory
RUN mkdir -p logs && chown appuser:nodejs logs

USER appuser

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/v1/health || exit 1

CMD ["node", "src/server.js"]
