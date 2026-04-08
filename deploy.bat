@echo off
REM ============================================================
REM Court Portal Deployment Script (Windows)
REM ============================================================

echo ========================================
echo Court Portal - Deployment Script
echo ========================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file missing. Please create it from .env.example
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo [1/4] Building and starting containers...
docker-compose up --build -d --remove-orphans

echo.
echo [2/4] Waiting for services to be ready...
timeout /t 15 /nobreak > nul

echo [3/4] Running database migrations...
docker-compose exec app npx prisma migrate deploy

echo.
echo [4/4] Seeding database...
docker-compose exec app node prisma/seed-production.js

echo.
echo SUCCESS: Application is running!
echo Access the portal at: http://localhost:3000
echo ========================================
echo.
pause
