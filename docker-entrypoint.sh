#!/bin/bash
set -e

echo "──────────────────────────────────────────────"
echo "  🏛️  Naib Court Portal — Starting Up"
echo "──────────────────────────────────────────────"

# Wait for Postgres to be ready before migrating
echo "⏳ Waiting for database to be ready..."
until pg_isready -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USER" -q; do
  sleep 1
done
echo "✅ Database is ready."

# Run Prisma migrations (safe to run multiple times)
echo "🔄 Running database migrations..."
npx prisma migrate deploy

# Seed the database (idempotent — skips if already seeded)
echo "🌱 Seeding database (skips if already done)..."
node prisma/seed-production.js

# Start the application
echo "🚀 Starting Court Portal..."
exec node server/index.js
