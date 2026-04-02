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
echo.
pause
