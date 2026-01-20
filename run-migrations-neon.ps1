﻿Write-Host 'Running migrations on Neon...' -ForegroundColor Cyan
$dbUrl = $env:DATABASE_URL
if (-not $dbUrl) {
    Write-Host 'ERROR: DATABASE_URL not set. Load from .env first.' -ForegroundColor Red
    exit 1
}
Get-ChildItem migrations/*.up.sql | Sort-Object Name | ForEach-Object {
    Write-Host "Running: $($_.Name)" -ForegroundColor Yellow
}
Write-Host ''
Write-Host 'Copy and paste each migration file content to:' -ForegroundColor Cyan
Write-Host 'https://console.neon.tech -> SQL Editor' -ForegroundColor Green
