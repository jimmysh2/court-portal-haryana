@echo off
echo.
echo ========================================
echo   Naib Court Portal - Deployment Script
echo ========================================
echo.

REM Check that .env exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo Please create .env from .env.example and fill in the required values.
    echo   copy .env.example .env
    pause
    exit /b 1
)

REM Check that Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

echo [1/4] Stopping existing containers...
docker-compose down

echo.
echo [2/4] Building and starting containers...
docker-compose up -d --build

echo.
echo [3/4] Waiting for database to be healthy...
timeout /t 15 /nobreak > NUL

echo.
echo [4/4] Seeding database with production data...
docker-compose exec app node prisma/seed-production.js

echo.
echo ========================================
echo   SUCCESS! Portal is running on :3000
echo   Open: http://localhost:3000
echo ========================================
echo.
pause
