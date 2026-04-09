@echo off
setlocal enabledelayedexpansion
title Court Portal - Deploy Update
color 0B

REM ============================================================
REM Court Portal - Deploy / Update Script
REM Run this every time new code is pushed to master.
REM First time? Run install.bat instead.
REM
REM What this does:
REM   1. Pull latest code from GitHub (master branch)
REM   2. Back up current build for rollback
REM   3. Install/update dependencies
REM   4. Rebuild frontend
REM   5. Apply any new DB migrations
REM   6. Restart app via PM2
REM   7. Health check — auto-rollback if failed
REM ============================================================

echo.
echo  ================================================
echo   Court Portal  -  Deploy Update
echo  ================================================
echo.

REM ── 1. Check prerequisites ────────────────────────────────
echo [1/7] Checking prerequisites...
where node >nul 2>&1
if errorlevel 1 ( echo  ERROR: Node.js not installed. Run install.bat first. & pause & exit /b 1 )
where git >nul 2>&1
if errorlevel 1 ( echo  ERROR: Git not installed. Run install.bat first. & pause & exit /b 1 )
where pm2 >nul 2>&1
if errorlevel 1 ( echo  ERROR: PM2 not installed. Run install.bat first. & pause & exit /b 1 )
if not exist ".env" (
    echo  ERROR: .env file missing. Copy .env.server to .env first.
    pause & exit /b 1
)
echo  OK

REM ── 2. Pull latest code ───────────────────────────────────
echo.
echo [2/7] Pulling latest code from origin...

REM ⚠️ Change to Lalit-deployBr for testing, but revert before merging!
set TARGET_BRANCH=master

git fetch origin %TARGET_BRANCH%
git checkout %TARGET_BRANCH%
git pull origin %TARGET_BRANCH%
if errorlevel 1 (
    echo  ERROR: Git pull failed. Check network and repo access.
    pause & exit /b 1
)
echo  OK - Code up to date.

REM ── 3. Backup current build for rollback ─────────────────
echo.
echo [3/7] Backing up current build for rollback safety...
if exist "_backup" rmdir /s /q _backup >nul 2>&1
mkdir _backup >nul 2>&1
if exist "client\dist" xcopy /e /q /i client\dist _backup\client_dist >nul 2>&1
if exist "server" xcopy /e /q /i server _backup\server >nul 2>&1
echo  OK - Backup saved to _backup\

REM ── 4. Install dependencies ───────────────────────────────
echo.
echo [4/7] Installing dependencies...
call npm install --omit=dev
if errorlevel 1 ( echo  ERROR: npm install failed & goto :rollback )

REM ── 5. Build frontend ─────────────────────────────────────
echo.
echo [5/7] Building frontend...
cd client
call npm install
call npm run build
if errorlevel 1 ( cd .. & echo  ERROR: Frontend build failed & goto :rollback )
cd ..
echo  OK - Frontend built.

REM ── Generate Prisma client ────────────────────────────────
call npx prisma generate >nul 2>&1

REM ── 6. Apply DB migrations ────────────────────────────────
echo.
echo [6/7] Applying database migrations...
call npx prisma migrate deploy
if errorlevel 1 (
    echo  ERROR: DB migration failed! Rolling back...
    goto :rollback
)
echo  OK - Migrations applied.

REM ── 7. Restart app via PM2 ────────────────────────────────
echo.
echo [7/7] Restarting app...
pm2 restart court-portal
if errorlevel 1 (
    echo  ERROR: PM2 restart failed. Starting fresh...
    pm2 start ecosystem.config.js
)
pm2 save >nul 2>&1

REM ── Health Check ──────────────────────────────────────────
echo.
echo  Running health check (waiting 15 seconds)...
timeout /t 15 /nobreak >nul

set RETRIES=5
:health_loop
if !RETRIES! == 0 goto :health_failed
curl -sf http://localhost:3000/api/health >nul 2>&1
if not errorlevel 1 goto :health_done
set /a RETRIES=!RETRIES!-1
echo  ... Not ready. Retrying (!RETRIES! left)
timeout /t 8 /nobreak >nul
goto :health_loop

:health_failed
echo  FAILED: App did not become healthy. Rolling back...
goto :rollback

:health_done
echo  OK - Application is healthy!

REM ── Success ───────────────────────────────────────────────
echo.
echo  ================================================
echo    Deployment SUCCESSFUL!
echo  ================================================
echo.
echo   Portal: http://localhost:3000
echo.
echo   Commands:
echo     Status : pm2 status
echo     Logs   : pm2 logs court-portal
echo     Stop   : pm2 stop court-portal
echo.
pause
exit /b 0

REM ── Rollback ─────────────────────────────────────────────
:rollback
echo.
echo  ================================================
echo    DEPLOYMENT FAILED - Auto-Rollback Starting
echo  ================================================
echo.
if not exist "_backup\server" (
    echo  No backup found. Cannot auto-rollback.
    echo  Check logs: pm2 logs court-portal
    pause & exit /b 1
)
echo  Restoring previous build...
if exist "client\dist" rmdir /s /q client\dist >nul 2>&1
xcopy /e /q /i _backup\client_dist client\dist >nul 2>&1
xcopy /e /q /y /i _backup\server server >nul 2>&1

echo  Restarting with previous build...
pm2 restart court-portal
timeout /t 10 /nobreak >nul
curl -sf http://localhost:3000/api/health >nul 2>&1
if errorlevel 1 (
    echo  CRITICAL: Rollback also failed! Run: pm2 logs court-portal
) else (
    echo  Rollback SUCCESSFUL - Previous version is live.
    echo  Portal: http://localhost:3000
)
echo.
pause
exit /b 1
