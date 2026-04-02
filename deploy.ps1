<#
.SYNOPSIS
  Naib Court Portal - Windows Deployment Script
  Single-line usage from PowerShell:
  powershell -ExecutionPolicy Bypass -File deploy.ps1

.DESCRIPTION
  Clones (or updates) the repo, validates .env, builds Docker image,
  starts all services, and waits for the portal to be healthy.
  Also supports --update to rebuild only the app (keeping DB data).
#>

param(
    [switch]$Update   # Pass -Update to rebuild app only, keep DB data
)

# ── Colour helpers ────────────────────────────────────────────
function Write-OK    { param($m) Write-Host "[OK]  $m" -ForegroundColor Green }
function Write-Warn  { param($m) Write-Host "[!!]  $m" -ForegroundColor Yellow }
function Write-Fail  { param($m) Write-Host "[ERR] $m" -ForegroundColor Red; exit 1 }

$REPO_URL = "https://github.com/jimmysh2/court-portal-haryana.git"
$APP_DIR  = "C:\court-portal"
$ENV_FILE = "$APP_DIR\.env"

Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "  Naib Court Portal - Windows Deployment" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan
Write-Host ""

# ── 1. Check Docker is installed and running ──────────────────
Write-OK "Checking Docker..."
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Fail "Docker is not installed. Download from: https://www.docker.com/products/docker-desktop"
}
try {
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { throw }
} catch {
    Write-Fail "Docker is not running. Please start Docker Desktop and try again."
}
$dockerVersion = (docker --version)
Write-OK "Docker ready — $dockerVersion"

# ── 2. Clone or update repository ────────────────────────────
if (Test-Path "$APP_DIR\.git") {
    Write-OK "Repository found. Pulling latest code..."
    git -C $APP_DIR pull origin master
    if ($LASTEXITCODE -ne 0) { Write-Fail "git pull failed. Check your internet connection." }
} else {
    Write-OK "Cloning repository to $APP_DIR ..."
    git clone $REPO_URL $APP_DIR
    if ($LASTEXITCODE -ne 0) { Write-Fail "git clone failed. Check your internet connection and that Git is installed." }
}

Set-Location $APP_DIR

# ── 3. Validate / create .env file ───────────────────────────
if (-not (Test-Path $ENV_FILE)) {
    Write-Warn ".env not found - copying from template..."
    Copy-Item "$APP_DIR\.env.example" $ENV_FILE
    Write-Warn ""
    Write-Warn "  ACTION REQUIRED: Edit the .env file with your real passwords."
    Write-Warn "  Open with:  notepad $ENV_FILE"
    Write-Warn "  Then re-run this script."
    Write-Host ""
    notepad $ENV_FILE
    Write-Fail "Stopped. Re-run deploy.ps1 after saving your .env file."
}

# Parse .env into a hashtable
$envVars = @{}
Get-Content $ENV_FILE | Where-Object { $_ -match '^\s*[^#]\w+=' } | ForEach-Object {
    $parts = $_ -split '=', 2
    $envVars[$parts[0].Trim()] = $parts[1].Trim()
}

if (-not $envVars['DB_PASSWORD']) {
    Write-Fail "DB_PASSWORD is not set in .env"
}
if ($envVars['DB_PASSWORD'] -eq 'replace-me-with-a-strong-password') {
    Write-Fail "DB_PASSWORD is still the placeholder - set a real password in .env"
}
if (-not $envVars['JWT_SECRET']) {
    Write-Fail "JWT_SECRET is not set in .env"
}
if ($envVars['JWT_SECRET'] -eq 'replace-me-with-a-long-random-string') {
    Write-Fail "JWT_SECRET is still the placeholder - set a real secret in .env"
}
Write-OK ".env validated."

# ── 4. Build and start containers ────────────────────────────
if ($Update) {
    Write-OK "Update mode: Rebuilding app only (database data preserved)..."
    docker compose build --no-cache app
    if ($LASTEXITCODE -ne 0) { Write-Fail "Docker build failed. See errors above." }
    docker compose up -d app
    if ($LASTEXITCODE -ne 0) { Write-Fail "docker compose up failed." }
} else {
    Write-OK "Building Docker image (first run may take 3-5 minutes)..."
    docker compose build --no-cache
    if ($LASTEXITCODE -ne 0) { Write-Fail "Docker build failed. See errors above." }
    Write-OK "Starting all services..."
    docker compose up -d
    if ($LASTEXITCODE -ne 0) { Write-Fail "docker compose up failed." }
}

# ── 5. Wait for app health check ─────────────────────────────
$port     = if ($envVars['APP_PORT']) { $envVars['APP_PORT'] } else { "3000" }
$healthUrl = "http://localhost:$port/api/health"
Write-OK "Waiting for portal to be ready at $healthUrl ..."

$maxWait = 120
$elapsed = 0
$ready   = $false

while ($elapsed -lt $maxWait) {
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch { }
    Start-Sleep -Seconds 2
    $elapsed += 2
    Write-Host "  ... waiting ($elapsed/$maxWait s)" -ForegroundColor DarkGray
}

if (-not $ready) {
    Write-Warn "App did not become healthy in ${maxWait}s."
    Write-Warn "Check logs with:  docker compose logs app"
    exit 1
}

# ── 6. Done ───────────────────────────────────────────────────
Write-Host ""
Write-Host "=================================================" -ForegroundColor Cyan
Write-OK  "Deployment complete!"
Write-Host ""
Write-Host "  Portal URL  : http://localhost:$port" -ForegroundColor White
Write-Host "  Health URL  : $healthUrl" -ForegroundColor White
Write-Host ""
Write-Host "  Useful commands:" -ForegroundColor Gray
Write-Host "    View logs   :  docker compose logs -f app" -ForegroundColor Gray
Write-Host "    Stop portal :  docker compose down" -ForegroundColor Gray
Write-Host "    Update only :  powershell -ExecutionPolicy Bypass -File deploy.ps1 -Update" -ForegroundColor Gray
Write-Host "=================================================" -ForegroundColor Cyan
