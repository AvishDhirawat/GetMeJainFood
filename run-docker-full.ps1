# PowerShell script to run everything in Docker (no Go required locally)

param(
    [switch]$Build,  # Use -Build to force rebuild images
    [switch]$Down    # Use -Down to stop all services
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GetMeJainFood - Docker Development   " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Set-Location -Path $PSScriptRoot\docker

if ($Down) {
    Write-Host "Stopping all services..." -ForegroundColor Yellow
    docker compose --env-file ../.env down
    Write-Host "All services stopped!" -ForegroundColor Green
    exit 0
}

# Check if .env file exists, create from example if not
$envFile = Join-Path $PSScriptRoot ".env"
$envExampleFile = Join-Path $PSScriptRoot ".env.example"

if (-not (Test-Path $envFile)) {
    Write-Host "WARNING: .env file not found!" -ForegroundColor Yellow

    if (Test-Path $envExampleFile) {
        Write-Host "Creating .env from .env.example with default values..." -ForegroundColor Yellow
        Copy-Item $envExampleFile $envFile
        Write-Host ".env file created! You can customize it later." -ForegroundColor Green
    } else {
        Write-Host "ERROR: Neither .env nor .env.example found!" -ForegroundColor Red
        Write-Host "Please create a .env file with required configuration." -ForegroundColor Yellow
        Set-Location -Path $PSScriptRoot
        exit 1
    }
}

# Check if Docker is running
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "Starting all services in Docker..." -ForegroundColor Yellow
Write-Host ""

if ($Build) {
    Write-Host "Building images (this may take a few minutes)..." -ForegroundColor Yellow
    docker compose --env-file ../.env up --build -d
} else {
    docker compose --env-file ../.env up -d
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Waiting for services to be ready..." -ForegroundColor Yellow

# Wait for health checks
$maxAttempts = 60
$attempt = 0
do {
    $attempt++
    Start-Sleep -Seconds 2
    $healthy = docker compose --env-file ../.env ps --format json 2>&1 | ConvertFrom-Json | Where-Object { $_.State -eq "running" }
    $runningCount = ($healthy | Measure-Object).Count
    Write-Host "  Attempt $attempt/$maxAttempts - $runningCount services running..."

    # Check if all critical services are up
    $apiHealth = docker compose --env-file ../.env exec -T api wget -q --spider http://localhost:8080/health 2>&1
    if ($LASTEXITCODE -eq 0) {
        break
    }
} while ($attempt -lt $maxAttempts)

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services are running!            " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the app:" -ForegroundColor Cyan
Write-Host "  Frontend:    http://localhost:3000" -ForegroundColor White
Write-Host "  API Health:  http://localhost:8080/health" -ForegroundColor White
Write-Host "  MinIO:       http://localhost:9001 (credentials in .env)" -ForegroundColor White
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Cyan
Write-Host "  View logs:     cd docker; docker compose --env-file ../.env logs -f" -ForegroundColor White
Write-Host "  View API logs: cd docker; docker compose --env-file ../.env logs -f api" -ForegroundColor White
Write-Host "  Stop all:      .\run-docker-full.ps1 -Down" -ForegroundColor White
Write-Host "  Rebuild:       .\run-docker-full.ps1 -Build" -ForegroundColor White
Write-Host ""

Set-Location -Path $PSScriptRoot
