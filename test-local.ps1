# Test script to verify local setup is working
# Run this after starting the application with run-local.ps1

$ProjectRoot = $PSScriptRoot
$envFile = Join-Path $ProjectRoot ".env"

Write-Host "========================================"
Write-Host "  GetMeJainFood - Local Setup Test     "
Write-Host "========================================"
Write-Host ""

$allPassed = $true

# Check if .env file exists
if (-not (Test-Path $envFile)) {
    Write-Host "WARNING: .env file not found. Some tests may fail." -ForegroundColor Yellow
    Write-Host "Create one with: Copy-Item .env.example .env" -ForegroundColor Gray
    Write-Host ""
}

# Test 1: Check Docker services
Write-Host "[Test 1/5] Checking Docker services..." -ForegroundColor Yellow
try {
    $dockerRunning = docker info 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Docker not running"
    }

    Push-Location $PSScriptRoot\docker

    # Check if containers are running
    $postgresStatus = docker compose --env-file $envFile ps postgres --format json 2>$null | ConvertFrom-Json
    $redisStatus = docker compose --env-file $envFile ps redis --format json 2>$null | ConvertFrom-Json

    Pop-Location

    Write-Host "  Docker is running" -ForegroundColor Green
} catch {
    Write-Host "  FAILED: Docker is not running or docker compose services not started" -ForegroundColor Red
    Write-Host "  Run '.\run-local.ps1' first to start services" -ForegroundColor Gray
    $allPassed = $false
}

# Test 2: Check PostgreSQL
Write-Host ""
Write-Host "[Test 2/5] Testing PostgreSQL connection..." -ForegroundColor Yellow
try {
    Push-Location $PSScriptRoot\docker
    $pgReady = docker compose --env-file $envFile exec -T postgres pg_isready -U postgres 2>&1
    Pop-Location

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  PostgreSQL is healthy" -ForegroundColor Green
    } else {
        throw "PostgreSQL not ready"
    }
} catch {
    Write-Host "  FAILED: PostgreSQL is not responding" -ForegroundColor Red
    $allPassed = $false
}

# Test 3: Check Redis
Write-Host ""
Write-Host "[Test 3/5] Testing Redis connection..." -ForegroundColor Yellow
try {
    Push-Location $PSScriptRoot\docker
    $redisReady = docker compose --env-file $envFile exec -T redis redis-cli ping 2>&1
    Pop-Location

    if ($LASTEXITCODE -eq 0 -and $redisReady -match "PONG") {
        Write-Host "  Redis is healthy" -ForegroundColor Green
    } else {
        throw "Redis not ready"
    }
} catch {
    Write-Host "  FAILED: Redis is not responding" -ForegroundColor Red
    $allPassed = $false
}

# Test 4: Check API health endpoint
Write-Host ""
Write-Host "[Test 4/5] Testing API health endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/health" -Method GET -TimeoutSec 5
    if ($response.status -eq "ok") {
        Write-Host "  API is healthy (status: $($response.status))" -ForegroundColor Green
    } else {
        throw "Unexpected response"
    }
} catch {
    Write-Host "  FAILED: API is not responding at http://localhost:8080/health" -ForegroundColor Red
    Write-Host "  Make sure Go backend is running: 'go run ./cmd/api'" -ForegroundColor Gray
    $allPassed = $false
}

# Test 5: Check Frontend (if running)
Write-Host ""
Write-Host "[Test 5/5] Testing Frontend..." -ForegroundColor Yellow
try {
    $webResponse = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 5 -UseBasicParsing
    if ($webResponse.StatusCode -eq 200) {
        Write-Host "  Frontend is accessible at http://localhost:5173" -ForegroundColor Green
    }
} catch {
    try {
        # Try Docker port (3000)
        $webResponse = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -UseBasicParsing
        if ($webResponse.StatusCode -eq 200) {
            Write-Host "  Frontend is accessible at http://localhost:3000 (Docker mode)" -ForegroundColor Green
        }
    } catch {
        Write-Host "  SKIPPED: Frontend not running (optional for API testing)" -ForegroundColor Yellow
    }
}

# Test 6: Test OTP API (DEV only)
Write-Host ""
Write-Host "[Test 6/6] Testing OTP API (dev mode)..." -ForegroundColor Yellow
try {
    $testPhone = "9876543210"

    # Check phone
    $checkBody = @{ phone = $testPhone } | ConvertTo-Json
    $checkResponse = Invoke-RestMethod -Uri "http://localhost:8080/v1/auth/check-phone" -Method POST -Body $checkBody -ContentType "application/json" -TimeoutSec 10
    Write-Host "  Phone check API working" -ForegroundColor Green

    # Send OTP
    $otpBody = @{ phone = $testPhone; purpose = "register" } | ConvertTo-Json
    $otpResponse = Invoke-RestMethod -Uri "http://localhost:8080/v1/auth/send-otp" -Method POST -Body $otpBody -ContentType "application/json" -TimeoutSec 10

    if ($otpResponse.otp) {
        Write-Host "  OTP API working (Dev OTP: $($otpResponse.otp))" -ForegroundColor Green
    } else {
        Write-Host "  OTP API working (SMS sent)" -ForegroundColor Green
    }
} catch {
    Write-Host "  Note: OTP API test failed or cooldown active (normal if recently tested)" -ForegroundColor Yellow
}

# Summary
Write-Host ""
Write-Host "========================================"
if ($allPassed) {
    Write-Host "  All critical tests PASSED!           " -ForegroundColor Green
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Your local environment is ready!" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Access points:" -ForegroundColor White
    Write-Host "  API:      http://localhost:8080" -ForegroundColor Gray
    Write-Host "  Health:   http://localhost:8080/health" -ForegroundColor Gray
    Write-Host "  Frontend: http://localhost:5173 (dev) or http://localhost:3000 (docker)" -ForegroundColor Gray
    Write-Host "  MinIO:    http://localhost:9001 (credentials in .env)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Try the API:" -ForegroundColor White
    Write-Host '  Invoke-RestMethod -Uri "http://localhost:8080/health"' -ForegroundColor Gray
    Write-Host '  Invoke-RestMethod -Uri "http://localhost:8080/v1/providers" -Method GET' -ForegroundColor Gray
    Write-Host ""
    Write-Host "Run comprehensive API tests:" -ForegroundColor White
    Write-Host '  .\test-api.ps1' -ForegroundColor Gray
} else {
    Write-Host "  Some tests FAILED!                   " -ForegroundColor Red
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Steps to fix:" -ForegroundColor Yellow
    Write-Host "1. Make sure Docker Desktop is running" -ForegroundColor Gray
    Write-Host "2. Create .env file: Copy-Item .env.example .env" -ForegroundColor Gray
    Write-Host "3. Run '.\run-local.ps1' to start all services" -ForegroundColor Gray
    Write-Host "4. Wait for services to be healthy (30-60 seconds)" -ForegroundColor Gray
    Write-Host "5. Run this test again: '.\test-local.ps1'" -ForegroundColor Gray
}
Write-Host ""
