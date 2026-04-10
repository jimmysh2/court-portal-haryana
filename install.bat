<# :
@echo off
setlocal disabledelayedexpansion
title Court Portal - Automated Installation
color 0A

:: Self-Elevate to Administrator if not already running as Admin
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting Administrator privileges...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

:: Run PowerShell block
echo Starting automated deployment process...
powershell -NoProfile -ExecutionPolicy Bypass -Command "iex ((Get-Content '%~f0') -join [Environment]::NewLine)"

echo.
echo ========================================================
echo   Script finished. Press any key to close the window.
echo ========================================================
pause >nul
exit /b %errorLevel%
#>

# ==============================================================================
# PowerShell Execution Block
# ==============================================================================
$ErrorActionPreference = "Stop"

$Branch     = "master"
$RepoUrl    = "https://github.com/jimmysh2/court-portal-haryana.git"
$InstallDir = "C:\court-portal-haryana"

function Write-Step {
    param([string]$n, [string]$msg)
    Write-Host ""
    Write-Host "[$n] $msg" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$msg)
    Write-Host "    OK  $msg" -ForegroundColor Green
}

function Write-Fail {
    param([string]$msg)
    Write-Host ""
    Write-Host "    FAILED: $msg" -ForegroundColor Red
    Write-Host ""
    exit 1
}

function Find-CommandPath {
    param([string]$Name)
    $found = Get-Command $Name -ErrorAction SilentlyContinue
    if ($found) { return $found.Source }
    return $null
}

function Add-ToPath {
    param([string]$Dir)
    if (Test-Path $Dir) {
        if ($env:Path -notlike "*$Dir*") {
            $env:Path = $env:Path + ";" + $Dir
            [Environment]::SetEnvironmentVariable("Path", $env:Path, [EnvironmentVariableTarget]::Machine)
        }
    }
}

function Refresh-Path {
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
}

Write-Host "============================================================" -ForegroundColor Magenta
Write-Host "  Court Portal Haryana - Full Automated Setup" -ForegroundColor Magenta
Write-Host "============================================================" -ForegroundColor Magenta
Write-Host ""

# --- STEP 1: Interactive Prompts ----------------------------------------------
Write-Step "1" "Configuration Setup"

$DbPassword = ""
while ([string]::IsNullOrWhiteSpace($DbPassword)) {
    $secure     = Read-Host "Enter PostgreSQL Password (to be set for postgres user)" -AsSecureString
    $bstr       = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $DbPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    if ([string]::IsNullOrWhiteSpace($DbPassword)) { Write-Host "Password cannot be empty!" -ForegroundColor Yellow }
}

$AppPort = Read-Host "Enter Backend App Port (Leave blank for default: 3000)"
if ([string]::IsNullOrWhiteSpace($AppPort)) { $AppPort = "3000" }

$WebhookPort = Read-Host "Enter GitHub Webhook Port (Leave blank for default: 4001)"
if ([string]::IsNullOrWhiteSpace($WebhookPort)) { $WebhookPort = "4001" }

Write-Ok "Configuration saved."

# --- STEP 2: Node.js ----------------------------------------------------------
Write-Step "2" "Checking Node.js"

Add-ToPath "C:\Program Files\nodejs"
Add-ToPath "$env:APPDATA\npm"
Refresh-Path

if (-not (Find-CommandPath "node")) {
    Write-Host "    Downloading Node.js v20 LTS..." -ForegroundColor DarkGray
    $nodeMsi = "$env:TEMP\node.msi"
    (New-Object System.Net.WebClient).DownloadFile("https://nodejs.org/dist/v20.19.1/node-v20.19.1-x64.msi", $nodeMsi)
    
    Write-Host "    Installing Node.js (silent)..." -ForegroundColor DarkGray
    $proc = Start-Process "msiexec.exe" -ArgumentList "/i `"$nodeMsi`" /qn /norestart ADDLOCAL=ALL" -Wait -PassThru
    if ($proc.ExitCode -ne 0) { Write-Fail "Node.js installer failed code $($proc.ExitCode)." }
    
    Refresh-Path
    Add-ToPath "C:\Program Files\nodejs"
    Add-ToPath "$env:APPDATA\npm"
    if (-not (Find-CommandPath "node")) { Write-Fail "Node.js installed but not found in PATH." }
}
Write-Ok "Node.js ready: $(& node --version 2>&1)"

# --- STEP 3: Git --------------------------------------------------------------
Write-Step "3" "Checking Git"

Add-ToPath "C:\Program Files\Git\cmd"
Refresh-Path

if (-not (Find-CommandPath "git")) {
    Write-Host "    Downloading Git..." -ForegroundColor DarkGray
    $gitExe = "$env:TEMP\git.exe"
    (New-Object System.Net.WebClient).DownloadFile("https://github.com/git-for-windows/git/releases/download/v2.44.0.windows.1/Git-2.44.0-64-bit.exe", $gitExe)
    
    Write-Host "    Installing Git (silent)..." -ForegroundColor DarkGray
    $proc = Start-Process $gitExe -ArgumentList "/VERYSILENT /NORESTART /NOCANCEL /SP- /CLOSEAPPLICATIONS /COMPONENTS=icons,ext\reg\shellhere,assoc,assoc_sh" -Wait -PassThru
    if ($proc.ExitCode -ne 0) { Write-Fail "Git installer failed code $($proc.ExitCode)." }
    
    Refresh-Path
    Add-ToPath "C:\Program Files\Git\cmd"
}
Write-Ok "Git ready: $(& git --version 2>&1)"

# --- STEP 4: PostgreSQL -------------------------------------------------------
Write-Step "4" "Checking PostgreSQL"

Add-ToPath "C:\Program Files\PostgreSQL\15\bin"
Refresh-Path

if (-not (Find-CommandPath "psql")) {
    Write-Host "    Downloading PostgreSQL 15..." -ForegroundColor DarkGray
    $pgExe = "$env:TEMP\postgres.exe"
    (New-Object System.Net.WebClient).DownloadFile("https://get.enterprisedb.com/postgresql/postgresql-15.6-1-windows-x64.exe", $pgExe)
    
    Write-Host "    Installing PostgreSQL (This may take 3-5 mins)..." -ForegroundColor DarkGray
    $pgArgs = "--mode unattended --unattendedmodeui none --superpassword `"$DbPassword`" --servicename postgresql-x64-15 --servicepassword `"$DbPassword`" --serverport 5432 --datadir `"C:\Program Files\PostgreSQL\15\data`""
    $proc = Start-Process $pgExe -ArgumentList $pgArgs -Wait -PassThru
    if ($proc.ExitCode -ne 0) { Write-Fail "PostgreSQL installer failed code $($proc.ExitCode)." }
    
    Refresh-Path
    Add-ToPath "C:\Program Files\PostgreSQL\15\bin"
}
Write-Ok "PostgreSQL ready."

# --- STEP 5: Clone Repository -------------------------------------------------
Write-Step "5" "Cloning Repository"

if (Test-Path $InstallDir) {
    Write-Host "    $InstallDir exists. Pulling latest $Branch branch..." -ForegroundColor DarkGray
    Set-Location $InstallDir
    & git restore .
    & git fetch origin
    & git checkout $Branch
    & git pull origin $Branch
} else {
    Set-Location "C:\"
    Write-Host "    Downloading code to $InstallDir..." -ForegroundColor DarkGray
    & git clone -b $Branch $RepoUrl $InstallDir
    if ($LASTEXITCODE -ne 0) { Write-Fail "Git clone failed." }
}
Set-Location $InstallDir
Write-Ok "Repository cloned to $InstallDir."

# --- STEP 6: Configure Environment (.env) -------------------------------------
Write-Step "6" "Creating configuration (.env)"

$envExample = Join-Path $InstallDir ".env.server.example"
$envTarget  = Join-Path $InstallDir ".env"

if (Test-Path $envExample) {
    $envContent = Get-Content $envExample -Raw
    
    # Inject variables dynamically
    $envContent = $envContent -replace 'YOUR_POSTGRES_PASSWORD', $DbPassword
    $envContent = $envContent -replace 'PORT=3000', "PORT=$AppPort"
    $envContent = $envContent -replace 'WEBHOOK_PORT=4001', "WEBHOOK_PORT=$WebhookPort"

    Set-Content -Path $envTarget -Value $envContent -Encoding UTF8
    Write-Ok ".env deployed."
} else {
    Write-Fail "Could not find .env.server.example in the repository."
}

# --- STEP 7: Create Database --------------------------------------------------
Write-Step "7" "Ensuring database exists"

$env:PGPASSWORD = $DbPassword
$dbCheck = & psql -U postgres -h localhost -p 5432 -tAc "SELECT 1 FROM pg_database WHERE datname='court_portal';" 2>&1
if ("$dbCheck" -ne "1") {
    & psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE court_portal;" 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Fail "Could not create database." }
    Write-Ok "Database 'court_portal' created."
} else {
    Write-Ok "Database already exists."
}
$env:PGPASSWORD = ""

# --- STEP 8: Install Dependencies & Build -------------------------------------
Write-Step "8" "Building Application (This takes a moment...)"

Write-Host "    Installing NPM PM2 globally..." -ForegroundColor DarkGray
& npm install -g pm2 pm2-windows-startup >$null 2>&1

Write-Host "    Installing backend dependencies..." -ForegroundColor DarkGray
& npm install --loglevel=error

Write-Host "    Installing frontend dependencies & building..." -ForegroundColor DarkGray
Push-Location "client"
& npm install --loglevel=error
& npm run build
if ($LASTEXITCODE -ne 0) { Write-Fail "Frontend build failed." }
Pop-Location
Write-Ok "App compiled successfully."

# --- STEP 9: Database Setup (Prisma) ------------------------------------------
Write-Step "9" "Applying Prisma Database Schema"

& npx prisma generate
& npx prisma migrate deploy
if ($LASTEXITCODE -ne 0) { Write-Fail "Database schema deployment failed." }

Write-Host "    Seeding database data..." -ForegroundColor DarkGray
& node prisma/seed-production.js
Write-Ok "Database schema and seeds applied."

# --- STEP 10: Start Services --------------------------------------------------
Write-Step "10" "Starting PM2 Service"

& pm2 delete court-portal >$null 2>&1
& pm2 delete webhook-listener >$null 2>&1
& pm2 start ecosystem.config.js
if ($LASTEXITCODE -ne 0) { Write-Fail "Process manager failed to start apps." }
& pm2 save

Write-Host "    Configuring PM2 to start on Windows Boot..." -ForegroundColor DarkGray
& pm2-startup install >$null 2>&1

Write-Ok "PM2 Startup installed successfully!"

# --- DONE ---------------------------------------------------------------------
Write-Host ""
Write-Host "============================================================" -ForegroundColor Green
Write-Host "                 INSTALLATION COMPLETE                      " -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Portal URL     : http://localhost:$AppPort"
Write-Host "  Webhook URI    : http://localhost:$WebhookPort/webhook"
Write-Host ""
Write-Host "  Useful Commands:"
Write-Host "    * pm2 status  (Check running programs)"
Write-Host "    * pm2 logs    (View program logs)"
Write-Host ""
