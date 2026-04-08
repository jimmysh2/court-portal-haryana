@echo off
setlocal enabledelayedexpansion
title Court Portal - Deployment

REM ============================================================
REM Court Portal - Single-Click Deployment Script
REM
REM  MODE DETECTION (automatic):
REM   - If .env.docker exists  → PRODUCTION mode (Supabase DB)
REM                               Uses docker-compose.prod.yml
REM   - If .env.docker missing → TEST/VM mode (local PostgreSQL)
REM                               Uses docker-compose.yml
REM
REM  Features:
REM   - Pulls latest code from GitHub master
REM   - Builds Docker image
REM   - Health check with retries
REM   - Auto-rollback to previous image if deploy fails
REM ============================================================

echo.
echo  ==========================================
echo   Court Portal  -  Deployment Manager
echo  ==========================================
echo.

REM ── 1. Check Prerequisites ───────────────────────────────
echo [1/7] Checking prerequisites...

where docker >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Docker not installed. Get it from: https://www.docker.com/products/docker-desktop
    pause & exit /b 1
)
docker info >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Docker Desktop is not running. Please start it and retry.
    pause & exit /b 1
)
where git >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Git not installed. Get it from: https://git-scm.com
    pause & exit /b 1
)

REM ── Detect Mode ──────────────────────────────────────────
if exist ".env.docker" (
    set COMPOSE_FILE=docker-compose.prod.yml
    set MODE=PRODUCTION
    echo  MODE: PRODUCTION ^(Supabase DB via .env.docker^)
) else (
    set COMPOSE_FILE=docker-compose.yml
    set MODE=TEST
    echo  MODE: VM TEST ^(Local PostgreSQL^)
)
echo  Using compose file: %COMPOSE_FILE%
echo  OK - Prerequisites satisfied.

REM ── 2. Pull Latest Code from master ──────────────────────
echo.
echo [2/7] Pulling latest code from origin/master...
git fetch origin master
git checkout master
git pull origin master
if errorlevel 1 (
    echo  ERROR: Git pull failed. Check network or repo access.
    pause & exit /b 1
)
echo  OK - Code is up to date.

REM ── 3. Tag Current Image for Rollback ────────────────────
echo.
echo [3/7] Tagging current image for rollback safety...
docker image inspect court-portal-app:latest >nul 2>&1
if errorlevel 1 (
    echo  INFO: No previous image. First deployment — skipping rollback tag.
) else (
    docker tag court-portal-app:latest court-portal-app:rollback
    echo  OK - Previous image saved as court-portal-app:rollback
)

REM ── 4. Build and Start ───────────────────────────────────
echo.
echo [4/7] Building and starting containers (may take a few minutes)...
docker-compose -f %COMPOSE_FILE% up --build -d --remove-orphans
if errorlevel 1 (
    echo  ERROR: docker-compose failed!
    goto :rollback
)

REM ── 5. Wait for Initialization ───────────────────────────
echo.
echo [5/7] Waiting 45 seconds for app to initialize...
timeout /t 45 /nobreak >nul

REM ── 6. Health Check (with retries) ───────────────────────
echo.
echo [6/7] Running health check...
set RETRIES=6
:health_loop
if !RETRIES! == 0 goto :health_failed
curl -sf http://localhost:3000/api/health >nul 2>&1
if not errorlevel 1 goto :health_done
set /a RETRIES=!RETRIES!-1
echo  ... Not ready yet. Retrying in 10s (!RETRIES! attempts left)
timeout /t 10 /nobreak >nul
goto :health_loop

:health_failed
echo  FAILED: App did not become healthy. Attempting rollback...
goto :rollback

:health_done
echo  OK - Application is healthy!

REM ── 7. Seed DB (Test mode only, first run) ───────────────
if "%MODE%"=="TEST" (
    echo.
    echo [7/7] Running Prisma DB push for local test DB...
    docker-compose -f %COMPOSE_FILE% exec app npx prisma db push --accept-data-loss
    if errorlevel 1 (
        echo  WARNING: Prisma db push had issues. Check: docker-compose logs app
    ) else (
        echo  OK - Local DB schema applied.
    )
) else (
    echo.
    echo [7/7] Production mode - skipping local DB setup.
    echo  DB schema is managed via GitHub Action + Supabase migrations.
)

REM ── Success ───────────────────────────────────────────────
echo.
echo  ==========================================
echo    Deployment SUCCESSFUL! ^(%MODE%^)
echo  ==========================================
echo.
echo   Access portal: http://localhost:3000
echo.
echo   Useful commands:
echo     Logs    :  docker-compose -f %COMPOSE_FILE% logs -f
echo     Stop    :  docker-compose -f %COMPOSE_FILE% stop
echo     Restart :  docker-compose -f %COMPOSE_FILE% restart
echo     Redeploy:  deploy.bat
echo.
pause
exit /b 0

REM ── Rollback ─────────────────────────────────────────────
:rollback
echo.
echo  ==========================================
echo    DEPLOYMENT FAILED - Rolling Back
echo  ==========================================
docker image inspect court-portal-app:rollback >nul 2>&1
if errorlevel 1 (
    echo  No rollback image available. Cannot auto-rollback.
    echo  Check logs: docker-compose -f %COMPOSE_FILE% logs app
    pause & exit /b 1
)
echo  Restoring previous image...
docker tag court-portal-app:rollback court-portal-app:latest
docker-compose -f %COMPOSE_FILE% up -d --no-build --remove-orphans
timeout /t 20 /nobreak >nul
curl -sf http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
    echo  CRITICAL: Rollback also failed. Manual intervention needed.
) else (
    echo  Rollback SUCCESSFUL - Previous version restored.
    echo  Access: http://localhost:3000
)
echo.
pause
exit /b 1
