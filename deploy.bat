@echo off
setlocal enabledelayedexpansion

echo =================================================
echo   Naib Court Portal - Windows Deployment
echo =================================================
echo.

:: 1. Check Docker
WHERE docker >nul 2>nul
IF %ERRORLEVEL% NEQ 0 (
    echo [ERR] Docker is not installed or not in PATH.
    echo Please install Docker Desktop: https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

:: 2. Check Database Environment Variables
IF NOT EXIST ".env" (
    echo [!!] .env not found - copying from template...
    copy .env.example .env >nul
    echo.
    echo   ACTION REQUIRED: Edit the .env file with your real passwords/secrets.
    echo   (Notepad will open now. Save it, close it, and then re-run this script).
    echo.
    notepad .env
    pause
    exit /b 1
)

:: 3. Build & Start App
IF "%1"=="--update" (
    echo [OK] Update mode: Rebuilding app only ^(database data preserved^)...
    docker compose build --no-cache app
    docker compose up -d app
) ELSE (
    echo [OK] Building Docker image ^(first run may take 3-5 minutes^)...
    docker compose build --no-cache
    echo [OK] Starting all services...
    docker compose up -d
)

:: 4. Done message
echo.
echo =================================================
echo [OK] Deployment complete!
echo =================================================
echo.
echo   Portal will be available shortly at: http://localhost:3000
echo.
echo   Useful commands:
echo     View logs   :  docker compose logs -f app
echo     Stop portal :  docker compose down
echo     Update only :  deploy.bat --update
echo.
pause
