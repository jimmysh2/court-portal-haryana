# ─────────────────────────────────────────────────────────────
# Stage 1: Build the React frontend
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /build

# Install client dependencies
COPY client/package*.json ./
RUN npm install --include=dev

# Copy client source and build
COPY client ./
RUN npm run build

# ─────────────────────────────────────────────────────────────
# Stage 2: Production image
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine

# Install system tools needed for DB backup/restore
RUN apk add --no-cache postgresql-client gzip bash

WORKDIR /app

# ── Root dependencies ──────────────────────────────────────
COPY package*.json ./
RUN npm install --omit=dev

# ── Prisma schema & generate client ───────────────────────
COPY prisma ./prisma
RUN npx prisma generate

# ── Server & Scripts source ──────────────────────────────────────────
COPY server ./server
COPY scripts ./scripts

# ── Data files (for seeding) ───────────────────────────────
COPY Disrtrict_PS.csv ./
COPY Police_Stations_Haryana.xlsx ./
COPY ["TESTING COURT EXCEL FILE", "./TESTING COURT EXCEL FILE"]

# ── Pre-built frontend from Stage 1 ───────────────────────
COPY --from=frontend-builder /build/dist ./client/dist

# ── Uploads directory (persisted via volume) ───────────────
RUN mkdir -p /app/uploads /app/backups

# ── Docker entrypoint script ───────────────────────────────
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENV NODE_ENV=production

ENTRYPOINT ["./docker-entrypoint.sh"]
