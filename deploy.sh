#!/bin/bash
# ============================================================
# Court Portal Deployment Script
# Single command to deploy the entire application on server
# ============================================================

set -e

echo "🚀 Starting Deployment..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file missing. Please create it from .env.example"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running or not accessible."
    exit 1
fi

echo "📦 [1/4] Building and starting containers..."
docker compose up --build -d --remove-orphans

echo "⏳ [2/4] Waiting for database to be healthy..."
# The healthcheck in docker-compose.yml handles most of this, 
# but we wait a bit for the app to initialize prisma.
sleep 10

echo "🔄 [3/4] Running database migrations..."
docker compose exec app npx prisma migrate deploy

echo "🌱 [4/4] Seeding database..."
docker compose exec app node prisma/seed-production.js

echo "✅ Deployment Complete!"
echo "----------------------------------------"
echo "URL: http://localhost:3000"
echo "----------------------------------------"
echo "View logs:     docker compose logs -f"
echo "Stop app:      docker compose stop"
