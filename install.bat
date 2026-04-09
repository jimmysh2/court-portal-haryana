@echo off
setlocal enabledelayedexpansion
title Court Portal - First Time Installation
color 0A

REM ============================================================
REM Court Portal - ONE-TIME Installation Script
REM Run this ONCE on a fresh Windows 10 server.
REM After this, use deploy.bat for all future updates.
REM
REM Requirements before running:
REM   1. PostgreSQL already installed and running on this server
REM   2. .env.server file created with DB credentials (by IT dept)
REM   3. Internet access (to download Node.js, Git)
REM ============================================================

echo.
echo  ================================================
echo   Court Portal  -  First Time Installation
echo  ================================================
echo.
echo  This will:
echo   [1] Check Node.js and Git are installed
echo   [2] Install PM2 (process manager)
echo   [3] Install all app dependencies
echo   [4] Build the frontend
echo   [5] Apply database schema (Prisma migrate)
echo   [6] Seed initial data (admin user, districts, PS)
echo   [7] Start the app with PM2
echo   [8] Configure PM2 to auto-start on Windows boot
echo.
pause

REM ── Check .env.server ─────────────────────────────────────
if not exist ".env.server" (
    echo.
    echo  ERROR: .env.server file not found!
    echo.
    echo  The IT department must create this file before installation.
    echo  Copy .env.server.example to .env.server and fill in:
    echo    - DATABASE_URL ^(PostgreSQL connection string^)
    echo    - JWT_SECRET
    echo    - JWT_REFRESH_SECRET
    echo.
    echo  Example DATABASE_URL format:
    echo    postgresql://postgres:YourPassword@localhost:5432/court_portal
    echo.
    pause & exit /b 1
)

REM ── Copy .env.server to .env ──────────────────────────────
echo  Copying .env.server to .env...
copy /Y .env.server .env >nul
echo  OK

REM ── Step 1: Check Node.js ─────────────────────────────────
echo.
echo [1/8] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Node.js is not installed!
    echo.
    echo  Download and install Node.js v20 LTS from:
    echo    https://nodejs.org/en/download
    echo  Then re-run this script.
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('node --version') do set NODE_VER=%%v
echo  OK - Node.js %NODE_VER%

REM ── Check Git ─────────────────────────────────────────────
echo.
echo [1b] Checking Git...
where git >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Git is not installed!
    echo  Download from: https://git-scm.com/download/win
    pause & exit /b 1
)
for /f "tokens=*" %%v in ('git --version') do set GIT_VER=%%v
echo  OK - !GIT_VER!

REM ── Step 2: Install PM2 ───────────────────────────────────
echo.
echo [2/8] Installing PM2 (process manager)...
call npm install -g pm2 >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Failed to install PM2. Check npm and internet connection.
    pause & exit /b 1
)
echo  OK - PM2 installed

REM ── Step 3: Install dependencies ─────────────────────────
echo.
echo [3/8] Installing Node.js dependencies...
call npm install
if errorlevel 1 (
    echo  ERROR: npm install failed. Check internet connection.
    pause & exit /b 1
)
echo  OK - Dependencies installed

REM ── Step 4: Build frontend ────────────────────────────────
echo.
echo [4/8] Building frontend (React app)...
cd client
call npm install
if errorlevel 1 ( cd .. & echo  ERROR: client npm install failed & pause & exit /b 1 )
call npm run build
if errorlevel 1 ( cd .. & echo  ERROR: Frontend build failed & pause & exit /b 1 )
cd ..
echo  OK - Frontend built

REM ── Generate Prisma client ────────────────────────────────
echo.
echo [4b] Generating Prisma client...
call npx prisma generate
if errorlevel 1 (
    echo  ERROR: Prisma generate failed.
    pause & exit /b 1
)
echo  OK - Prisma client generated

REM ── Step 5: Apply DB schema ───────────────────────────────
echo.
echo [5/8] Applying database schema (Prisma migrate)...
echo  Connecting to: %DATABASE_URL:~0,40%...
call npx prisma migrate deploy
if errorlevel 1 (
    echo.
    echo  ERROR: Database migration failed!
    echo.
    echo  Common causes:
    echo   - PostgreSQL is not running
    echo   - DATABASE_URL in .env.server is wrong
    echo   - Database user lacks CREATE permission
    echo   - Database 'court_portal' does not exist
    echo.
    echo  Fix the issue and re-run install.bat
    pause & exit /b 1
)
echo  OK - Database schema applied

REM ── Step 6: Seed initial data ─────────────────────────────
echo.
echo [6/8] Seeding initial data (admin user, districts, police stations)...
call node prisma/seed-production.js
if errorlevel 1 (
    echo  WARNING: Seeding had issues. You may need to run it manually:
    echo    node prisma/seed-production.js
) else (
    echo  OK - Initial data seeded
)

REM ── Step 7: Start with PM2 ────────────────────────────────
echo.
echo [7/8] Starting app with PM2...
call pm2 delete court-portal >nul 2>&1
call pm2 start ecosystem.config.js
if errorlevel 1 (
    echo  ERROR: PM2 failed to start the app.
    pause & exit /b 1
)
call pm2 save
echo  OK - App running under PM2

REM ── Step 8: Auto-start on boot ────────────────────────────
echo.
echo [8/8] Configuring auto-start on Windows boot...
echo  Installing PM2 as Windows startup service...
call npm install -g pm2-startup >nul 2>&1
call pm2-startup install >nul 2>&1
echo  OK - PM2 will auto-start on server reboot

REM ── Health Check ──────────────────────────────────────────
echo.
echo  Running health check...
timeout /t 5 /nobreak >nul
curl -sf http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
    echo  WARNING: Health check failed. App may still be starting.
    echo  Wait 10 seconds and check: http://localhost:3000
) else (
    echo  OK - Application is running!
)

REM ── Done ──────────────────────────────────────────────────
echo.
echo  ================================================
echo    Installation COMPLETE!
echo  ================================================
echo.
echo   Access the portal: http://localhost:3000
echo.
echo   Default admin login:
echo     Username: admin
echo     Password: (set in seed-production.js)
echo.
echo   For future updates, just run: deploy.bat
echo.
echo   Useful commands:
echo     Status  : pm2 status
echo     Logs    : pm2 logs court-portal
echo     Restart : pm2 restart court-portal
echo     Stop    : pm2 stop court-portal
echo.
pause
