# PowerShell script to run Jain Food App locally

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  GetMeJainFood - Local Development    " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

Write-Host "[1/4] Starting infrastructure (Postgres, Redis, MinIO)..." -ForegroundColor Yellow
Set-Location -Path $PSScriptRoot\docker
docker-compose up -d postgres redis minio

Write-Host ""
Write-Host "[2/4] Waiting for services to be healthy..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if postgres is ready
$maxAttempts = 30
$attempt = 0
do {
    $attempt++
    $pgReady = docker-compose exec -T postgres pg_isready -U postgres 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PostgreSQL is ready!" -ForegroundColor Green
        break
    }
    Write-Host "  Waiting for PostgreSQL... (attempt $attempt/$maxAttempts)"
    Start-Sleep -Seconds 2
} while ($attempt -lt $maxAttempts)

if ($attempt -ge $maxAttempts) {
    Write-Host "ERROR: PostgreSQL failed to start" -ForegroundColor Red
    exit 1
}

# Check Redis
$redisReady = docker-compose exec -T redis redis-cli ping 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "  Redis is ready!" -ForegroundColor Green
} else {
    Write-Host "ERROR: Redis failed to start" -ForegroundColor Red
    exit 1
}

Set-Location -Path $PSScriptRoot

Write-Host ""
Write-Host "[3/4] Starting Go backend API..." -ForegroundColor Yellow
Write-Host "  API will be available at: http://localhost:8080" -ForegroundColor White

# Start the Go backend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; go run ./cmd/api"

Write-Host ""
Write-Host "[4/4] Starting React frontend..." -ForegroundColor Yellow
Write-Host "  Frontend will be available at: http://localhost:5173" -ForegroundColor White

# Start the frontend in a new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\web'; npm install; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services starting!               " -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access the app:" -ForegroundColor Cyan
Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor White
Write-Host "  API:       http://localhost:8080/health" -ForegroundColor White
Write-Host "  MinIO:     http://localhost:9001 (minioadmin/minioadmin)" -ForegroundColor White
Write-Host ""
Write-Host "To stop infrastructure:" -ForegroundColor Yellow
Write-Host "  cd docker && docker-compose down" -ForegroundColor White
Write-Host ""
