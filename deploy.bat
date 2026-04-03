@echo off
title Naib Court Portal - Deployment
echo.
echo ========================================
echo   Naib Court Portal - Deployment Script
echo ========================================
echo.

REM Check that .env exists
if not exist .env (
    echo [ERROR] .env file not found!
    echo.
    echo Please create .env from .env.example and set the required values.
    echo Run this command first:
    echo   copy .env.example .env
    echo.
    goto :end
)

REM Check that Docker is running
echo Checking Docker...
docker info >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Docker is not running!
    echo.
    echo Please start Docker Desktop, wait for it to fully load,
    echo then run this script again.
    echo.
    goto :end
)

echo Docker is running. Starting deployment...
echo.

echo [1/4] Stopping existing containers...
docker-compose down
echo.

echo [2/4] Building and starting containers (this may take a few minutes)...
docker-compose up -d --build
if errorlevel 1 (
    echo.
    echo [ERROR] docker-compose failed. See error above.
    goto :end
)
echo.

echo [3/4] Waiting for database to initialize (20 seconds)...
timeout /t 20 /nobreak > NUL
echo.

echo [4/4] Seeding database with production data...
docker-compose exec app node prisma/seed-production.js
echo.

echo ========================================
echo   SUCCESS! Portal is running on :3000
echo   Open: http://localhost:3000
echo ========================================

:end
echo.
echo Press any key to close this window...
pause > nul
