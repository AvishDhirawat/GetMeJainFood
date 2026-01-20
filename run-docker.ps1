# PowerShell script to run everything in Docker

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GetMeJainFood - Docker Deployment    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
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
        exit 1
    }
}

Write-Host "[1/3] Building Docker images..." -ForegroundColor Yellow
Set-Location -Path $PSScriptRoot\docker

# Build and start all services
Write-Host ""
Write-Host "[2/3] Starting all services with Docker Compose..." -ForegroundColor Yellow
docker compose --env-file ../.env up --build -d

Write-Host ""
Write-Host "[3/3] Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check health
$maxAttempts = 30
$attempt = 0
do {
    $attempt++
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "  API is healthy!" -ForegroundColor Green
            break
        }
    } catch {
        Write-Host "  Waiting for API... (attempt $attempt/$maxAttempts)"
        Start-Sleep -Seconds 3
    }
} while ($attempt -lt $maxAttempts)

Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services running in Docker!      " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the app:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:3000" -ForegroundColor White
Write-Host "  API:       http://localhost:8080/health" -ForegroundColor White
Write-Host "  MinIO:     http://localhost:9001 (credentials in .env)" -ForegroundColor White
Write-Host ""
Write-Host "Commands:" -ForegroundColor Yellow
Write-Host "  View logs:  cd docker && docker compose --env-file ../.env logs -f" -ForegroundColor White
Write-Host "  Stop:       cd docker && docker compose --env-file ../.env down" -ForegroundColor White
Write-Host "  Rebuild:    cd docker && docker compose --env-file ../.env up --build -d" -ForegroundColor White
Write-Host ""
