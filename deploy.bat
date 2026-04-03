@echo off
setlocal EnableDelayedExpansion

echo ==============================================================================
echo                 Naib Court Portal - Windows Deployment Script
echo ==============================================================================
echo.

:: 1. Check if Docker is installed
WHERE docker >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed or not running. Please install Docker Desktop.
    echo Exiting...
    pause
    exit /b 1
)
echo [OK] Docker is installed.

:: 2. Check for .env file
IF NOT EXIST ".env" (
    echo [WARN] .env not found! Copying from .env.example...
    copy .env.example .env >nul
    echo.
    echo ==============================================================================
    echo IMPORTANT: A new .env file has been created. 
    echo Please open the .env file in a text editor, set your passwords, and run this script again.
    echo ==============================================================================
    pause
    exit /b 0
)
echo [OK] .env file loaded.

:: 3. Pull latest code (if inside git repo)
IF EXIST ".git" (
    echo [INFO] Pulling latest code from GitHub...
    git pull origin master
)

:: 4. Ensure required directories exist
IF NOT EXIST "backups" mkdir backups
IF NOT EXIST "uploads" mkdir uploads
echo [OK] Directories are ready.

:: 5. Build and Start Services
echo [INFO] Building Docker images (this may take a few minutes)...
docker compose build --no-cache

echo [INFO] Starting services...
docker compose up -d

:: 6. Display Success
echo.
echo ==============================================================================
echo                   Deployment Successful!
echo ==============================================================================
echo Your portal should be available shortly on port 3000 (or the PORT set in .env).
echo To check the logs, open a terminal here and run: docker compose logs -f app
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
