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

:: 5. Start Database and Build App Natively
echo [INFO] Starting Database using Docker...
docker compose up -d db

echo.
echo [INFO] Waiting for database to be healthy...
timeout /t 5 /nobreak > nul

echo [INFO] Installing backend dependencies...
call npm install --omit=dev

echo [INFO] Installing frontend dependencies and building...
cd client
call npm install
call npm run build
cd ..

echo [INFO] Setting up database...
call npx prisma generate
call npx prisma migrate deploy
node prisma/seed-production.js

echo.
echo ==============================================================================
echo                   Deployment Successful!
echo ==============================================================================
echo Your portal will be available on port 3000.
echo KEEP THIS WINDOW OPEN to keep the server running!
echo.
echo To stop the server, press Ctrl+C or close this window.
echo Access the portal at: http://localhost:3000
echo ==============================================================================
echo.
echo [INFO] Starting Server...
set NODE_ENV=production
node server/index.js
pause

