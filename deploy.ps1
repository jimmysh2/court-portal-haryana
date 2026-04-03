Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Naib Court Portal - Deployment Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check that .env exists
if (-not (Test-Path ".env")) {
    Write-Host "[ERROR] .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env from .env.example and fill in the required values." -ForegroundColor Yellow
    Write-Host "  Copy-Item .env.example .env" -ForegroundColor Yellow
    exit 1
}

# Check that Docker is running
$dockerCheck = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

Write-Host ""
Write-Host "[2/4] Building and starting containers..." -ForegroundColor Yellow
docker-compose up -d --build

Write-Host ""
Write-Host "[3/4] Waiting for database to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

Write-Host ""
Write-Host "[4/4] Seeding database with production data..." -ForegroundColor Yellow
docker-compose exec app node prisma/seed-production.js

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  SUCCESS! Portal is running on :3000"  -ForegroundColor Green
Write-Host "  Open: http://localhost:3000"           -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
