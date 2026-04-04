# ─────────────────────────────────────────────────────────────
# Stage 1 – Builder  (builds the Vite frontend)
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /build

# Install client deps first (layer-cache friendly)
COPY client/package*.json ./client/
RUN cd client && npm ci

# Copy client source and build
COPY client ./client
RUN cd client && npm run build

# ─────────────────────────────────────────────────────────────
# Stage 2 – Production  (lean runtime image)
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# System deps: pg client (backup/restore), gzip, curl (for healthcheck), openssl (Prisma)
RUN apk add --no-cache postgresql-client gzip curl openssl

WORKDIR /app

# ── Root dependencies ──────────────────────────────────────
COPY package*.json ./
RUN npm ci --omit=dev

# ── Application source ────────────────────────────────────
COPY server      ./server
COPY prisma      ./prisma
COPY scripts     ./scripts

# ── Data files used by seed / CSV import ──────────────────
COPY Disrtrict_PS.csv            ./
COPY Police_Stations_Haryana.xlsx ./
COPY ["TESTING COURT EXCEL FILE/", "./TESTING COURT EXCEL FILE/"]

# ── Pre-built frontend from builder stage ─────────────────
COPY --from=builder /build/client/dist ./client/dist

# ── Generate Prisma client inside the production image ────
RUN npx prisma generate

# ── Persistent directories (mounted by docker-compose) ────
RUN mkdir -p /app/backups /app/uploads

EXPOSE 3000

ENV NODE_ENV=production

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Run migrations + seed on first boot, then start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed-production.js && node server/index.js"]
