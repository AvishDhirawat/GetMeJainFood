<#
.SYNOPSIS
    JainFood Development Runner
.DESCRIPTION
    Start the JainFood application in different modes
.PARAMETER Mode
    Environment mode: local, dev, cloud, mock
.PARAMETER Action
    Action to perform: start, stop, restart, logs, status
.EXAMPLE
    .\start.ps1 -Mode dev
    .\start.ps1 -Mode local -Action stop
#>

param(
    [ValidateSet("local", "dev", "cloud", "mock")]
    [string]$Mode = "dev",

    [ValidateSet("start", "stop", "restart", "logs", "status")]
    [string]$Action = "start"
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  JainFood Development Environment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

function Start-Docker {
    param([string]$ComposeFile)

    Write-Host "Starting Docker services..." -ForegroundColor Yellow
    Push-Location "$ProjectRoot\docker"
    docker compose -f $ComposeFile up -d
    Pop-Location
    Write-Host "Docker services started!" -ForegroundColor Green
}

function Stop-Docker {
    Write-Host "Stopping Docker services..." -ForegroundColor Yellow
    Push-Location "$ProjectRoot\docker"

    # Try to stop both compose files
    docker compose -f docker-compose.yml down 2>$null
    docker compose -f docker-compose.neon.yml down 2>$null

    Pop-Location
    Write-Host "Docker services stopped!" -ForegroundColor Green
}

function Show-Status {
    Write-Host "Docker containers:" -ForegroundColor Yellow
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

switch ($Action) {
    "stop" {
        Stop-Docker
        exit 0
    }
    "restart" {
        Stop-Docker
        Start-Sleep -Seconds 2
    }
    "logs" {
        Push-Location "$ProjectRoot\docker"
        docker compose --env-file "$ProjectRoot\.env" logs -f
        Pop-Location
        exit 0
    }
    "status" {
        Show-Status
        exit 0
    }
}

# Configure environment based on mode
switch ($Mode) {
    "local" {
        Write-Host "Mode: LOCAL (all services in Docker)" -ForegroundColor Magenta
        Write-Host ""

        # Copy local env
        Copy-Item "$ProjectRoot\configs\.env.local" "$ProjectRoot\.env" -Force
        Write-Host "Loaded: configs\.env.local" -ForegroundColor Gray

        # Start all Docker services
        Start-Docker "docker-compose.yml"
    }

    "dev" {
        Write-Host "Mode: DEV (Neon DB + Upstash Redis)" -ForegroundColor Magenta
        Write-Host ""

        # Copy dev env (already has Neon + Upstash)
        Copy-Item "$ProjectRoot\configs\.env.dev" "$ProjectRoot\.env" -Force
        Write-Host "Loaded: configs\.env.dev" -ForegroundColor Gray

        # Start only MinIO
        Start-Docker "docker-compose.neon.yml"
    }

    "cloud" {
        Write-Host "Mode: CLOUD (all cloud services, MinIO local)" -ForegroundColor Magenta
        Write-Host ""

        # Use current .env (should have cloud config)
        if (-not (Test-Path "$ProjectRoot\.env")) {
            Copy-Item "$ProjectRoot\configs\.env.dev" "$ProjectRoot\.env" -Force
        }
        Write-Host "Using: .env" -ForegroundColor Gray

        # Start only MinIO
        Start-Docker "docker-compose.neon.yml"
    }

    "mock" {
        Write-Host "Mode: MOCK (frontend only, no backend)" -ForegroundColor Magenta
        Write-Host ""

        # Set mock mode in frontend
        "VITE_USE_MOCK_API=true" | Out-File "$ProjectRoot\web\.env.local" -Encoding UTF8
        Write-Host "Frontend mock mode enabled" -ForegroundColor Gray

        Write-Host ""
        Write-Host "Starting frontend only..." -ForegroundColor Yellow
        Push-Location "$ProjectRoot\web"
        npm run dev
        Pop-Location
        exit 0
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Environment Ready!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Start Backend:" -ForegroundColor White
Write-Host "     go run ./cmd/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Start Frontend (new terminal):" -ForegroundColor White
Write-Host "     cd web && npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "URLs:" -ForegroundColor Yellow
Write-Host "  Frontend:    http://localhost:5173" -ForegroundColor Gray
Write-Host "  Backend:     http://localhost:8080" -ForegroundColor Gray
Write-Host "  Health:      http://localhost:8080/health" -ForegroundColor Gray

if ($Mode -ne "mock") {
    Write-Host "  MinIO:       http://localhost:9001" -ForegroundColor Gray
}

Write-Host ""
