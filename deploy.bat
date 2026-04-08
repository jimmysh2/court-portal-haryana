@echo off
setlocal EnableDelayedExpansion

echo ==============================================================================
echo                 Naib Court Portal - Windows Deployment Script
echo ==============================================================================
echo.

:: 1. Check if Docker is installed and running
docker info >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Docker is not installed or not running. Please install Docker Desktop and start it.
    echo Exiting...
    pause
    exit /b 1
)
echo [OK] Docker is running.

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

:: 3. Pull latest code (only on master branch, skip on feature branches)
IF EXIST ".git" (
    FOR /F "tokens=*" %%b IN ('git rev-parse --abbrev-ref HEAD 2^>nul') DO SET CURRENT_BRANCH=%%b
    IF "!CURRENT_BRANCH!"=="master" (
        echo [INFO] Pulling latest code from GitHub...
        git pull --ff-only origin master
    ) ELSE (
        echo [INFO] On branch '!CURRENT_BRANCH!' - skipping git pull to avoid merge conflicts.
    )
)

:: 4. Ensure required directories exist
IF NOT EXIST "backups" mkdir backups
IF NOT EXIST "uploads" mkdir uploads
echo [OK] Directories are ready.

:: 5. Build and Start Services
echo [INFO] Building and starting Docker containers (this may take a few minutes)...
docker compose up --build -d --remove-orphans

echo.
echo [INFO] Waiting for app to be healthy...
timeout /t 10 /nobreak > nul

:: 6. Health check request
curl -s http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
    echo [WARNING] App may not be ready yet. Check logs with: docker compose logs app
) else (
    echo [SUCCESS] Application is running!
)

:: 7. Display Success
echo.
echo ==============================================================================
echo                   Deployment Successful!
echo ==============================================================================
echo Your portal should be available shortly on port 3000 (or the PORT set in .env).
echo.
echo Useful commands:
echo View logs:     docker compose logs -f
echo Stop app:      docker compose stop
echo Start app:     docker compose start
echo.
echo Access the portal at: http://localhost:3000
echo.
pause

