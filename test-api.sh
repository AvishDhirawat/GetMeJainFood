#!/bin/bash
# =============================================================================
# JainFood API & OTP Test Suite
# =============================================================================
# Test APIs and OTP functionality for development and local testing
#
# Usage:
#   ./test-api.sh
#   ./test-api.sh --phone 9999999999 --verbose
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

# Default values
BASE_URL="${BASE_URL:-http://localhost:8080}"
PHONE="${PHONE:-+917506481803}"
VERBOSE=false

# Test counters
PASSED=0
FAILED=0
SKIPPED=0

# Auth token
TOKEN=""
DEV_OTP=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --phone)
            PHONE="$2"
            shift 2
            ;;
        --url)
            BASE_URL="$2"
            shift 2
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        *)
            shift
            ;;
    esac
done

echo ""
echo -e "${CYAN}========================================"
echo "  JainFood API & OTP Test Suite        "
echo -e "========================================${NC}"
echo ""
echo -e "${GRAY}Base URL: $BASE_URL"
echo -e "Test Phone: $PHONE${NC}"
echo ""

# Function to make API calls and test results
test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local body="$4"
    local expected_status="${5:-200}"
    local auth="${6:-}"

    local test_num=$((PASSED + FAILED + SKIPPED + 1))
    echo -n -e "${YELLOW}[$test_num] Testing: $name${NC}"

    local url="$BASE_URL$endpoint"
    local headers="-H 'Content-Type: application/json'"

    if [ -n "$auth" ]; then
        headers="$headers -H 'Authorization: Bearer $auth'"
    fi

    local curl_cmd="curl -s -w '\n%{http_code}' -X $method $headers"

    if [ -n "$body" ]; then
        curl_cmd="$curl_cmd -d '$body'"
    fi

    curl_cmd="$curl_cmd '$url'"

    # Execute curl command
    local response
    response=$(eval $curl_cmd 2>&1) || true

    # Extract status code (last line)
    local status_code=$(echo "$response" | tail -n1)
    local body_content=$(echo "$response" | sed '$d')

    # Check if status matches expected
    if [ "$status_code" = "$expected_status" ] || ([ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ] && [ "$expected_status" = "200" ]); then
        echo -e " ${GREEN}✓ PASSED${NC}"
        PASSED=$((PASSED + 1))

        if [ "$VERBOSE" = true ] && [ -n "$body_content" ]; then
            echo -e "${GRAY}  Response: $body_content${NC}"
        fi

        # Return body for parsing
        echo "$body_content"
        return 0
    else
        echo -e " ${RED}✗ FAILED${NC}"
        echo -e "${RED}  Expected: $expected_status, Got: $status_code${NC}"
        if [ -n "$body_content" ]; then
            echo -e "${RED}  Response: $body_content${NC}"
        fi
        FAILED=$((FAILED + 1))
        return 1
    fi
}

skip_test() {
    local name="$1"
    local reason="$2"
    local test_num=$((PASSED + FAILED + SKIPPED + 1))
    echo -e "${YELLOW}[$test_num] SKIP: $name - $reason${NC}"
    SKIPPED=$((SKIPPED + 1))
}

# Extract value from JSON (simple extraction)
json_value() {
    echo "$1" | grep -o "\"$2\"[[:space:]]*:[[:space:]]*\"[^\"]*\"" | sed 's/.*:\s*"\([^"]*\)"/\1/' | head -1
}

# ==================== TEST SUITE ====================

echo -e "${MAGENTA}--- Health & Basic Tests ---${NC}"
echo ""

# Test 1: Health Check
test_api "Health Check" "GET" "/health" "" "200" || true

echo ""
echo -e "${MAGENTA}--- OTP & Authentication Tests ---${NC}"
echo ""

# Test 2: Check Phone (new number)
test_api "Check Phone (New)" "POST" "/v1/auth/check-phone" "{\"phone\":\"$PHONE\"}" "200" || true

# Test 3: Send OTP for Registration
otp_response=$(test_api "Send OTP (Register)" "POST" "/v1/auth/send-otp" "{\"phone\":\"$PHONE\",\"purpose\":\"register\"}" "200") || true

DEV_OTP=$(json_value "$otp_response" "otp")
if [ -n "$DEV_OTP" ]; then
    echo -e "${CYAN}  Dev OTP received: $DEV_OTP${NC}"
fi

# Test 4: Register New User
TEST_NAME="Test User $RANDOM"
if [ -n "$DEV_OTP" ]; then
    register_response=$(test_api "Register New User" "POST" "/v1/auth/register" \
        "{\"phone\":\"$PHONE\",\"otp\":\"$DEV_OTP\",\"name\":\"$TEST_NAME\",\"email\":\"test$RANDOM@example.com\",\"role\":\"buyer\"}" \
        "200") || true

    TOKEN=$(json_value "$register_response" "token")
    if [ -n "$TOKEN" ]; then
        echo -e "${CYAN}  Token received: ${TOKEN:0:20}...${NC}"
    fi
else
    skip_test "Register New User" "No OTP available"
fi

echo ""

# Test 5: Send OTP for Login
login_otp_response=$(test_api "Send OTP (Login)" "POST" "/v1/auth/send-otp" "{\"phone\":\"$PHONE\",\"purpose\":\"login\"}" "200") || true

DEV_OTP=$(json_value "$login_otp_response" "otp")
if [ -n "$DEV_OTP" ]; then
    echo -e "${CYAN}  Login OTP received: $DEV_OTP${NC}"

    # Test 6: Login User
    login_response=$(test_api "Login User" "POST" "/v1/auth/login" \
        "{\"phone\":\"$PHONE\",\"otp\":\"$DEV_OTP\"}" "200") || true

    TOKEN=$(json_value "$login_response" "token")
    if [ -n "$TOKEN" ]; then
        echo -e "${CYAN}  Login Token: ${TOKEN:0:20}...${NC}"
    fi
fi

echo ""
echo -e "${MAGENTA}--- Protected API Tests ---${NC}"
echo ""

if [ -n "$TOKEN" ]; then
    # Test 7: Get Current User
    test_api "Get Current User" "GET" "/v1/users/me" "" "200" "$TOKEN" || true

    # Test 8: Search Providers
    test_api "Search Providers" "GET" "/v1/providers?city=Mumbai&limit=5" "" "200" || true

    # Test 9: Search Menu Items
    test_api "Search Menu Items" "GET" "/v1/menus/search?query=paneer&limit=5" "" "200" || true
else
    skip_test "Get Current User" "No auth token available"
    skip_test "Search Providers" "No auth token available"
    skip_test "Search Menu Items" "No auth token available"
fi

echo ""
echo -e "${MAGENTA}--- Error Handling Tests ---${NC}"
echo ""

# Test: Invalid OTP
test_api "Invalid OTP" "POST" "/v1/auth/login" "{\"phone\":\"9999999999\",\"otp\":\"000000\"}" "401" || true

# Test: Invalid Phone Format
test_api "Invalid Phone Format" "POST" "/v1/auth/send-otp" "{\"phone\":\"123\",\"purpose\":\"login\"}" "400" || true

# Test: Missing Required Field
test_api "Missing Required Field" "POST" "/v1/auth/register" "{\"phone\":\"9876543210\"}" "400" || true

# ==================== RESULTS ====================

echo ""
echo -e "${CYAN}========================================"
echo "  Test Results Summary                 "
echo -e "========================================${NC}"
echo ""

if [ $PASSED -gt 0 ]; then
    echo -e "  ${GREEN}Passed:  $PASSED${NC}"
else
    echo -e "  ${GRAY}Passed:  $PASSED${NC}"
fi

if [ $FAILED -gt 0 ]; then
    echo -e "  ${RED}Failed:  $FAILED${NC}"
else
    echo -e "  ${GRAY}Failed:  $FAILED${NC}"
fi

if [ $SKIPPED -gt 0 ]; then
    echo -e "  ${YELLOW}Skipped: $SKIPPED${NC}"
else
    echo -e "  ${GRAY}Skipped: $SKIPPED${NC}"
fi

echo ""

TOTAL=$((PASSED + FAILED + SKIPPED))
if [ $TOTAL -gt 0 ]; then
    SUCCESS_RATE=$((PASSED * 100 / TOTAL))
else
    SUCCESS_RATE=0
fi

if [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "  ${GREEN}Success Rate: $SUCCESS_RATE%${NC}"
elif [ $SUCCESS_RATE -ge 50 ]; then
    echo -e "  ${YELLOW}Success Rate: $SUCCESS_RATE%${NC}"
else
    echo -e "  ${RED}Success Rate: $SUCCESS_RATE%${NC}"
fi

echo ""

if [ $FAILED -gt 0 ]; then
    echo -e "${YELLOW}Some tests failed. Make sure:${NC}"
    echo -e "${GRAY}  1. The API server is running (go run ./cmd/api)"
    echo "  2. PostgreSQL and Redis are running"
    echo -e "  3. The .env file is properly configured${NC}"
    exit 1
fi

exit 0
