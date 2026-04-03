#!/bin/bash

# Exit on any error
set -e

echo "========================================"
echo "  Naib Court Portal - Deployment Script"
echo "========================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "[ERROR] .env file not found!"
    echo "Please create .env from .env.example and fill in the required values."
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "[1/3] Stopping existing containers..."
docker-compose down

echo ""
echo "[2/3] Building and starting containers..."
docker-compose up -d --build

echo ""
echo "[3/3] Seeding database with production data..."
# Wait for DB to be ready - controlled by healthcheck but sleep is a safe fallback
echo "Waiting for healthchecks..."
sleep 15
docker-compose exec -T app node prisma/seed-production.js

echo ""
echo "========================================"
echo "  SUCCESS! Portal is running on :3000"
echo "  Open: http://localhost:3000"
echo "========================================"
echo ""
