# Apply SQL migrations into the local Postgres container
$ProjectRoot = $PSScriptRoot
$envFile = Join-Path $ProjectRoot ".env"

# Check if .env file exists
if (-not (Test-Path $envFile)) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file from the example:" -ForegroundColor Yellow
    Write-Host "  Copy-Item .env.example .env" -ForegroundColor White
    exit 1
}

Write-Host "Applying migrations using configuration from .env" -ForegroundColor Yellow

# Use psql inside the postgres container to apply migrations (already mounted)
Set-Location -Path $PSScriptRoot\docker
$containers = docker compose --env-file $envFile ps -q postgres
if (-not $containers) {
  Write-Host "Postgres container not running. Starting it..." -ForegroundColor Yellow
  docker compose --env-file $envFile up -d postgres | Out-Null
  Start-Sleep -Seconds 5
}

# Migrations are auto-applied by docker-entrypoint on empty DB. For re-run:
Write-Host "Note: migrations mount to /docker-entrypoint-initdb.d and apply on first init." -ForegroundColor Cyan
Write-Host "If you need a clean reset, run:" -ForegroundColor Cyan
Write-Host "  docker compose --env-file ../.env down -v && docker compose --env-file ../.env up -d postgres" -ForegroundColor White
