<#
.SYNOPSIS
    JainFood Environment Setup
.DESCRIPTION
    Sets up environment variables from .secrets.ps1 and creates .env file
.EXAMPLE
    .\setup-env.ps1
    .\setup-env.ps1 -Environment dev
#>

param(
    [ValidateSet("local", "dev", "qa", "prod")]
    [string]$Environment = "dev"
)

$ProjectRoot = $PSScriptRoot

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  JainFood Environment Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .secrets.ps1 exists
$secretsFile = Join-Path $ProjectRoot ".secrets.ps1"
if (-not (Test-Path $secretsFile)) {
    Write-Host "ERROR: .secrets.ps1 not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Create .secrets.ps1 with your actual secrets:" -ForegroundColor Yellow
    Write-Host @"

# Example .secrets.ps1 content:
`$env:DATABASE_URL = 'postgresql://user:pass@host/db?sslmode=require'
`$env:REDIS_URL = 'rediss://default:pass@host:6379'
`$env:SMSINDIAHUB_API_KEY = 'your_api_key'
`$env:JWT_SECRET = 'your_jwt_secret_min_32_chars'
`$env:OTP_SECRET = 'your_otp_secret_min_32_chars'
`$env:S3_ACCESS_KEY = 'your_minio_access_key'
`$env:S3_SECRET_KEY = 'your_minio_secret_key'

"@ -ForegroundColor Gray
    exit 1
}

Write-Host "Environment: $Environment" -ForegroundColor Magenta
Write-Host ""

# Load secrets into environment
Write-Host "Loading secrets from .secrets.ps1..." -ForegroundColor Yellow
. $secretsFile

# Create .env file based on environment
$envContent = @"
# JainFood Environment - Auto-generated
# DO NOT COMMIT THIS FILE!

APP_ENV=$Environment
GIN_MODE=$(if ($Environment -eq 'prod' -or $Environment -eq 'qa') { 'release' } else { 'debug' })
PORT=8080

# Database
DATABASE_URL=$env:DATABASE_URL

# Redis
REDIS_URL=$env:REDIS_URL

# Security
JWT_SECRET=$env:JWT_SECRET
OTP_SECRET=$env:OTP_SECRET

# Object Storage
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=$env:S3_ACCESS_KEY
S3_SECRET_KEY=$env:S3_SECRET_KEY
S3_BUCKET=jain-food-media

# SMS Service
NOTIFY_SERVICE=smsindiahub
SMSINDIAHUB_API_KEY=$env:SMSINDIAHUB_API_KEY
SMSINDIAHUB_SENDER_ID=JAINFO
SMSINDIAHUB_CHANNEL=Trans
"@

$envFile = Join-Path $ProjectRoot ".env"
$envContent | Out-File -FilePath $envFile -Encoding UTF8 -Force

Write-Host ""
Write-Host "Created .env file with secrets" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Your .env file is ready. To start development:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  # Start MinIO" -ForegroundColor White
Write-Host "  docker compose -f docker/docker-compose.neon.yml up -d" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Run backend" -ForegroundColor White
Write-Host "  go run ./cmd/api" -ForegroundColor Cyan
Write-Host ""
Write-Host "  # Run frontend (new terminal)" -ForegroundColor White
Write-Host "  cd web && npm run dev" -ForegroundColor Cyan
Write-Host ""
