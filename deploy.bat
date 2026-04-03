@echo off
REM ============================================================
REM Court Portal Deployment Script
REM Single command to deploy the entire application
REM ============================================================

echo ========================================
echo Court Portal - Deployment Script
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo [1/3] Building and starting containers...
docker-compose up --build -d --remove-orphans

echo.
echo [2/3] Waiting for app to be healthy...
timeout /t 30 /nobreak > nul

REM Check container health
for /f "tokens=*" %%i in ('docker-compose ps --format json 2^>nul') do set container_status=%%i
echo Container status: %container_status%

echo.
echo [3/3] Checking application health...
curl -s http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
    echo WARNING: App may not be ready yet. Check with: docker-compose logs app
) else (
    echo SUCCESS: Application is running!
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo View logs:     docker-compose logs -f
echo Stop app:      docker-compose stop
echo Start app:     docker-compose start
echo Rebuild:       docker-compose up --build -d
echo.
echo Access the portal at: http://localhost:3000
echo.
pause
