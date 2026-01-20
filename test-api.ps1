<#
.SYNOPSIS
    Test APIs and OTP functionality for JainFood App
.DESCRIPTION
    Comprehensive API test script for development and local testing.
    Tests OTP sending, verification, user registration, login, and other core APIs.
.PARAMETER BaseUrl
    The API base URL (default: http://localhost:8080)
.PARAMETER Phone
    Test phone number (default: 9876543210)
.PARAMETER Verbose
    Show detailed output
.EXAMPLE
    .\test-api.ps1
    .\test-api.ps1 -Phone "9999999999" -Verbose
#>

param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$Phone = "9876543210",
    [switch]$Verbose
)

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  JainFood API & OTP Test Suite        " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Test Phone: $Phone" -ForegroundColor Gray
Write-Host ""

$TestResults = @{
    Passed = 0
    Failed = 0
    Skipped = 0
}

$Token = $null
$DevOtp = $null

function Test-Api {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200,
        [scriptblock]$Validate = $null
    )

    Write-Host "[$($TestResults.Passed + $TestResults.Failed + $TestResults.Skipped + 1)] Testing: $Name" -ForegroundColor Yellow -NoNewline

    try {
        $uri = "$BaseUrl$Endpoint"
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = @{ "Content-Type" = "application/json" } + $Headers
            TimeoutSec = 30
            UseBasicParsing = $true
        }

        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
        }

        $response = Invoke-RestMethod @params -StatusCodeVariable statusCode

        if ($Validate) {
            $validateResult = & $Validate $response
            if (-not $validateResult) {
                throw "Validation failed"
            }
        }

        Write-Host " ✓ PASSED" -ForegroundColor Green
        $TestResults.Passed++

        if ($Verbose) {
            Write-Host "  Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
        }

        return $response
    }
    catch {
        $errorMsg = $_.Exception.Message

        # Check if it's an expected error status
        if ($_.Exception.Response.StatusCode.value__ -eq $ExpectedStatus -and $ExpectedStatus -ne 200) {
            Write-Host " ✓ PASSED (Expected error)" -ForegroundColor Green
            $TestResults.Passed++
            return $null
        }

        Write-Host " ✗ FAILED" -ForegroundColor Red
        Write-Host "  Error: $errorMsg" -ForegroundColor Red
        $TestResults.Failed++
        return $null
    }
}

# ==================== TEST SUITE ====================

Write-Host "--- Health & Basic Tests ---" -ForegroundColor Magenta
Write-Host ""

# Test 1: Health Check
$healthResult = Test-Api -Name "Health Check" -Method "GET" -Endpoint "/health" -Validate {
    param($r) $r.status -eq "ok"
}

# Test 2: API Version/Info (if available)
Test-Api -Name "API Root" -Method "GET" -Endpoint "/" -ExpectedStatus 404

Write-Host ""
Write-Host "--- OTP & Authentication Tests ---" -ForegroundColor Magenta
Write-Host ""

# Test 3: Check Phone (new number)
$checkResult = Test-Api -Name "Check Phone (New)" -Method "POST" -Endpoint "/v1/auth/check-phone" -Body @{
    phone = $Phone
}

# Test 4: Send OTP for Registration
$otpResult = Test-Api -Name "Send OTP (Register)" -Method "POST" -Endpoint "/v1/auth/send-otp" -Body @{
    phone = $Phone
    purpose = "register"
}

if ($otpResult -and $otpResult.otp) {
    $DevOtp = $otpResult.otp
    Write-Host "  Dev OTP received: $DevOtp" -ForegroundColor Cyan
}

# Test 5: Send OTP with cooldown (should fail or return cooldown)
if ($otpResult) {
    Test-Api -Name "Send OTP (Cooldown)" -Method "POST" -Endpoint "/v1/auth/send-otp" -Body @{
        phone = $Phone
        purpose = "register"
    } -ExpectedStatus 429
}

# Test 6: Register New User
$TestUserName = "Test User $(Get-Random -Maximum 9999)"
$registerResult = $null

if ($DevOtp) {
    $registerResult = Test-Api -Name "Register New User" -Method "POST" -Endpoint "/v1/auth/register" -Body @{
        phone = $Phone
        otp = $DevOtp
        name = $TestUserName
        email = "test$(Get-Random -Maximum 9999)@example.com"
        role = "buyer"
    }

    if ($registerResult -and $registerResult.token) {
        $Token = $registerResult.token
        Write-Host "  Token received: $($Token.Substring(0, 20))..." -ForegroundColor Cyan
    }
}
else {
    Write-Host "[SKIP] Register New User - No OTP available" -ForegroundColor Yellow
    $TestResults.Skipped++
}

# Test 7: Login (need to send OTP first)
Write-Host ""
$loginOtpResult = Test-Api -Name "Send OTP (Login)" -Method "POST" -Endpoint "/v1/auth/send-otp" -Body @{
    phone = $Phone
    purpose = "login"
}

if ($loginOtpResult -and $loginOtpResult.otp) {
    $DevOtp = $loginOtpResult.otp
    Write-Host "  Login OTP received: $DevOtp" -ForegroundColor Cyan

    # Test 8: Login
    $loginResult = Test-Api -Name "Login User" -Method "POST" -Endpoint "/v1/auth/login" -Body @{
        phone = $Phone
        otp = $DevOtp
    }

    if ($loginResult -and $loginResult.token) {
        $Token = $loginResult.token
        Write-Host "  Login Token: $($Token.Substring(0, 20))..." -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "--- Protected API Tests ---" -ForegroundColor Magenta
Write-Host ""

if ($Token) {
    $authHeaders = @{ "Authorization" = "Bearer $Token" }

    # Test 9: Get Current User
    Test-Api -Name "Get Current User" -Method "GET" -Endpoint "/v1/users/me" -Headers $authHeaders

    # Test 10: Search Providers
    Test-Api -Name "Search Providers" -Method "GET" -Endpoint "/v1/providers?city=Mumbai&limit=5"

    # Test 11: Get Menu Items
    Test-Api -Name "Search Menu Items" -Method "GET" -Endpoint "/v1/menus/search?query=paneer&limit=5"
}
else {
    Write-Host "[SKIP] Protected APIs - No auth token available" -ForegroundColor Yellow
    $TestResults.Skipped += 3
}

Write-Host ""
Write-Host "--- Error Handling Tests ---" -ForegroundColor Magenta
Write-Host ""

# Test: Invalid OTP
Test-Api -Name "Invalid OTP" -Method "POST" -Endpoint "/v1/auth/login" -Body @{
    phone = "9999999999"
    otp = "000000"
} -ExpectedStatus 401

# Test: Invalid Phone Format
Test-Api -Name "Invalid Phone Format" -Method "POST" -Endpoint "/v1/auth/send-otp" -Body @{
    phone = "123"
    purpose = "login"
} -ExpectedStatus 400

# Test: Missing Required Field
Test-Api -Name "Missing Required Field" -Method "POST" -Endpoint "/v1/auth/register" -Body @{
    phone = "9876543210"
} -ExpectedStatus 400

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Test Results Summary                 " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Passed:  $($TestResults.Passed)" -ForegroundColor Green
Write-Host "  Failed:  $($TestResults.Failed)" -ForegroundColor $(if ($TestResults.Failed -gt 0) { "Red" } else { "Gray" })
Write-Host "  Skipped: $($TestResults.Skipped)" -ForegroundColor $(if ($TestResults.Skipped -gt 0) { "Yellow" } else { "Gray" })
Write-Host ""

$Total = $TestResults.Passed + $TestResults.Failed + $TestResults.Skipped
$SuccessRate = if ($Total -gt 0) { [math]::Round(($TestResults.Passed / $Total) * 100, 1) } else { 0 }
Write-Host "  Success Rate: $SuccessRate%" -ForegroundColor $(if ($SuccessRate -ge 80) { "Green" } elseif ($SuccessRate -ge 50) { "Yellow" } else { "Red" })
Write-Host ""

if ($TestResults.Failed -gt 0) {
    Write-Host "Some tests failed. Make sure:" -ForegroundColor Yellow
    Write-Host "  1. The API server is running (go run ./cmd/api)" -ForegroundColor Gray
    Write-Host "  2. PostgreSQL and Redis are running" -ForegroundColor Gray
    Write-Host "  3. The .env file is properly configured" -ForegroundColor Gray
    exit 1
}
