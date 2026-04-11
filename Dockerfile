# ============================================================
# Court Portal - Dockerfile
# Multi-stage build: builds frontend, then packages everything
# into a lean production image.
# ============================================================

# ── Stage 1: Build Frontend ──────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /app/client

COPY client/package*.json ./
RUN npm install

COPY client ./
RUN npm run build


# ── Stage 2: Production Runtime ──────────────────────────────
FROM node:20-alpine AS production

# Install system dependencies (curl for healthcheck CMD)
RUN apk add --no-cache curl

WORKDIR /app

# Copy root package files and install ONLY production deps
COPY package*.json ./
RUN npm install --omit=dev

# Copy Prisma schema (needed for generate + migrate)
COPY prisma ./prisma

# Generate Prisma client (uses schema, no DB connection needed here)
RUN npx prisma generate

# Copy server + scripts
COPY server ./server
COPY scripts ./scripts

# Copy static seed data
COPY ["TESTING COURT EXCEL FILE", "./TESTING COURT EXCEL FILE"]
COPY Disrtrict_PS.csv ./
COPY Police_Stations_Haryana.xlsx ./

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/client/dist ./client/dist

# Create uploads and backups directories
RUN mkdir -p /app/uploads /app/backups

# Expose API port (default 4000, overridable via PORT env var)
EXPOSE 4000

# Health check endpoint (port 4000 is the default, override PORT env var if needed)
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:4000/api/health || exit 1

# Start script: run migrations THEN start the app
# This ensures schema is always up-to-date when the container boots
CMD sh -c "npx prisma migrate deploy && node server/index.js"
