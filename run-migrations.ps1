# Apply SQL migrations into the local Postgres container
param(
  [string]$DatabaseUrl = "postgres://postgres:postgres@localhost:5432/jain_food?sslmode=disable"
)

Write-Host "Applying migrations to $DatabaseUrl" -ForegroundColor Yellow

# Use psql inside the postgres container to apply migrations (already mounted)
Set-Location -Path $PSScriptRoot\docker
$containers = docker-compose ps -q postgres
if (-not $containers) {
  Write-Host "Postgres container not running. Starting it..." -ForegroundColor Yellow
  docker-compose up -d postgres | Out-Null
  Start-Sleep -Seconds 5
}

# Migrations are auto-applied by docker-entrypoint on empty DB. For re-run:
Write-Host "Note: migrations mount to /docker-entrypoint-initdb.d and apply on first init." -ForegroundColor Cyan
Write-Host "If you need a clean reset, run: docker-compose down -v && docker-compose up -d postgres" -ForegroundColor Cyan
