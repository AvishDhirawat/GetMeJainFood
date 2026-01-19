# GetMeJainFood - Unified Run Script
# Usage:
#   .\run.ps1                          # Start dev in Docker
#   .\run.ps1 -Mode local              # Start with hot-reload (needs Go & Node)
#   .\run.ps1 -Action down             # Stop all services
#   .\run.ps1 -Action logs             # View logs
#   .\run.ps1 -Action status           # Check service status
#   .\run.ps1 -Environment qa          # Start QA environment

param(
    [ValidateSet("docker", "local")]
    [string]$Mode = "docker",

    [ValidateSet("dev", "qa", "prod")]
    [string]$Environment = "dev",

    [ValidateSet("up", "down", "logs", "status", "restart", "build")]
    [string]$Action = "up"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "     GetMeJainFood - Jain Food App     " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Select compose file based on environment
$composeFile = switch ($Environment) {
    "dev"  { "docker-compose.yml" }
    "qa"   { "docker-compose.qa.yml" }
    "prod" { "docker-compose.prod.yml" }
}
$composePath = Join-Path $ProjectRoot "docker\$composeFile"
$envFile = Join-Path $ProjectRoot ".env"

# Check if .env file exists
function Test-EnvFile {
    if (-not (Test-Path $envFile)) {
        Write-Host "ERROR: .env file not found!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please create a .env file from the example:" -ForegroundColor Yellow
        Write-Host "  Copy-Item .env.example .env" -ForegroundColor White
        Write-Host ""
        Write-Host "Then edit .env with your configuration values." -ForegroundColor Yellow
        exit 1
    }
}

# Check Docker
function Test-Docker {
    $null = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
        exit 1
    }
}

# Handle actions
switch ($Action) {
    "down" {
        Test-Docker
        Test-EnvFile
        Write-Host "Stopping all services..." -ForegroundColor Yellow
        Set-Location "$ProjectRoot\docker"
        docker compose --env-file $envFile -f $composeFile down
        Write-Host "All services stopped!" -ForegroundColor Green
        exit 0
    }
    "logs" {
        Test-Docker
        Test-EnvFile
        Set-Location "$ProjectRoot\docker"
        docker compose --env-file $envFile -f $composeFile logs -f
        exit 0
    }
    "status" {
        Test-Docker
        Test-EnvFile
        Set-Location "$ProjectRoot\docker"
        docker compose --env-file $envFile -f $composeFile ps
        exit 0
    }
    "restart" {
        Test-Docker
        Test-EnvFile
        Set-Location "$ProjectRoot\docker"
        docker compose --env-file $envFile -f $composeFile restart
        Write-Host "Services restarted!" -ForegroundColor Green
        exit 0
    }
    "build" {
        Test-Docker
        Test-EnvFile
        Set-Location "$ProjectRoot\docker"
        docker compose --env-file $envFile -f $composeFile build
        Write-Host "Build complete!" -ForegroundColor Green
        exit 0
    }
}

# Main startup logic
Test-Docker
Test-EnvFile

Write-Host "Mode:        $Mode" -ForegroundColor White
Write-Host "Environment: $Environment" -ForegroundColor White
Write-Host ""

if ($Mode -eq "docker") {
    # ========== DOCKER MODE ==========
    Write-Host "[1/3] Building and starting all services in Docker..." -ForegroundColor Yellow
    Set-Location "$ProjectRoot\docker"
    docker compose --env-file $envFile -f $composeFile up --build -d

    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to start services" -ForegroundColor Red
        exit 1
    }

    Write-Host ""
    Write-Host "[2/3] Waiting for services to be healthy..." -ForegroundColor Yellow

    # Wait for postgres
    $maxAttempts = 30
    $attempt = 0
    do {
        $attempt++
        $pgReady = docker compose --env-file $envFile -f $composeFile exec -T postgres pg_isready -U postgres 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  PostgreSQL is ready!" -ForegroundColor Green
            break
        }
        Write-Host "  Waiting for PostgreSQL... ($attempt/$maxAttempts)"
        Start-Sleep -Seconds 2
    } while ($attempt -lt $maxAttempts)

    # Wait for API health
    $attempt = 0
    do {
        $attempt++
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:8080/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                Write-Host "  API is healthy!" -ForegroundColor Green
                break
            }
        } catch {
            Write-Host "  Waiting for API... ($attempt/$maxAttempts)"
            Start-Sleep -Seconds 2
        }
    } while ($attempt -lt $maxAttempts)

    Write-Host ""
    Write-Host "[3/3] All services started!" -ForegroundColor Green

} else {
    # ========== LOCAL MODE ==========
    Write-Host "[1/4] Starting infrastructure (PostgreSQL, Redis, MinIO)..." -ForegroundColor Yellow
    Set-Location "$ProjectRoot\docker"
    docker compose --env-file $envFile -f $composeFile up -d postgres redis minio

    Write-Host ""
    Write-Host "[2/4] Waiting for infrastructure..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    # Wait for postgres
    $maxAttempts = 30
    $attempt = 0
    do {
        $attempt++
        $pgReady = docker compose --env-file $envFile -f $composeFile exec -T postgres pg_isready -U postgres 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  PostgreSQL is ready!" -ForegroundColor Green
            break
        }
        Write-Host "  Waiting for PostgreSQL... ($attempt/$maxAttempts)"
        Start-Sleep -Seconds 2
    } while ($attempt -lt $maxAttempts)

    # Check Redis
    $redisReady = docker compose --env-file $envFile -f $composeFile exec -T redis redis-cli ping 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Redis is ready!" -ForegroundColor Green
    }

    Set-Location $ProjectRoot

    Write-Host ""
    Write-Host "[3/4] Starting Go backend API (new window)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot'; Write-Host 'Starting Go API server...' -ForegroundColor Cyan; go run ./cmd/api"

    Write-Host ""
    Write-Host "[4/4] Starting React frontend (new window)..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$ProjectRoot\web'; Write-Host 'Installing npm packages...' -ForegroundColor Cyan; npm install; Write-Host 'Starting Vite dev server...' -ForegroundColor Cyan; npm run dev"
}

Set-Location $ProjectRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Application is starting!             " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan

if ($Mode -eq "docker") {
    Write-Host "  Frontend:   http://localhost:3000" -ForegroundColor White
} else {
    Write-Host "  Frontend:   http://localhost:5173" -ForegroundColor White
}
Write-Host "  API:        http://localhost:8080" -ForegroundColor White
Write-Host "  API Health: http://localhost:8080/health" -ForegroundColor White
Write-Host "  MinIO:      http://localhost:9001 (credentials in .env)" -ForegroundColor White

Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor Cyan
Write-Host "  Stop all:   .\run.ps1 -Action down" -ForegroundColor White
Write-Host "  View logs:  .\run.ps1 -Action logs" -ForegroundColor White
Write-Host "  Status:     .\run.ps1 -Action status" -ForegroundColor White
Write-Host "  Rebuild:    .\run.ps1 -Action build" -ForegroundColor White
Write-Host ""
