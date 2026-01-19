#!/bin/bash
# =============================================================================
# GetMeJainFood - Run WITHOUT Docker (Native Linux Services)
# =============================================================================
# This script runs the application using natively installed services:
# - PostgreSQL (with PostGIS extension)
# - Redis
# - MinIO (optional - for file uploads)
#
# Prerequisites:
#   - Go 1.20+
#   - Node.js 20+
#   - PostgreSQL 15+ with PostGIS
#   - Redis 7+
#   - MinIO (optional)
# =============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo "  GetMeJainFood - Native Linux Setup    "
echo -e "========================================${NC}"
echo ""

# =============================================================================
# CONFIGURATION - Edit these if your setup is different
# =============================================================================
POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-}"
POSTGRES_DB="${POSTGRES_DB:-jain_food}"

REDIS_HOST="${REDIS_HOST:-localhost}"
REDIS_PORT="${REDIS_PORT:-6379}"

# Optional MinIO settings (leave empty to disable)
MINIO_ENDPOINT="${MINIO_ENDPOINT:-}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-}"

# =============================================================================
# FUNCTIONS
# =============================================================================

check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo -e "${RED}ERROR: $1 is not installed${NC}"
        return 1
    fi
    echo -e "${GREEN}✓ $1 found${NC}"
    return 0
}

check_service() {
    local service=$1
    if systemctl is-active --quiet "$service" 2>/dev/null; then
        echo -e "${GREEN}✓ $service is running${NC}"
        return 0
    elif pgrep -x "$service" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ $service is running (process)${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠ $service is not running${NC}"
        return 1
    fi
}

# =============================================================================
# CHECK PREREQUISITES
# =============================================================================
echo -e "${YELLOW}[1/6] Checking prerequisites...${NC}"
echo ""

MISSING_DEPS=0

# Check Go
if check_command "go"; then
    GO_VERSION=$(go version | grep -oP 'go\d+\.\d+' | head -1)
    echo "      Version: $GO_VERSION"
else
    MISSING_DEPS=1
fi

# Check Node.js
if check_command "node"; then
    NODE_VERSION=$(node --version)
    echo "      Version: $NODE_VERSION"
else
    MISSING_DEPS=1
fi

# Check npm
check_command "npm" || MISSING_DEPS=1

# Check psql (PostgreSQL client)
if check_command "psql"; then
    PSQL_VERSION=$(psql --version | head -1)
    echo "      Version: $PSQL_VERSION"
else
    MISSING_DEPS=1
fi

# Check redis-cli
check_command "redis-cli" || MISSING_DEPS=1

echo ""

if [ $MISSING_DEPS -eq 1 ]; then
    echo -e "${RED}Missing dependencies! Install them first:${NC}"
    echo ""
    echo "  # Ubuntu/Debian:"
    echo "  sudo apt update"
    echo "  sudo apt install -y golang-go nodejs npm postgresql postgresql-contrib postgis redis-server"
    echo ""
    echo "  # Or install Go from https://go.dev/dl/"
    echo "  # Or install Node.js from https://nodejs.org/"
    echo ""
    exit 1
fi

# =============================================================================
# CHECK SERVICES
# =============================================================================
echo -e "${YELLOW}[2/6] Checking services...${NC}"
echo ""

SERVICES_OK=1

# Check PostgreSQL
if check_service "postgresql"; then
    :
elif check_service "postgres"; then
    :
else
    echo -e "${RED}  PostgreSQL is not running. Start it with:${NC}"
    echo "    sudo systemctl start postgresql"
    SERVICES_OK=0
fi

# Check Redis
if check_service "redis-server"; then
    :
elif check_service "redis"; then
    :
else
    echo -e "${RED}  Redis is not running. Start it with:${NC}"
    echo "    sudo systemctl start redis-server"
    SERVICES_OK=0
fi

echo ""

if [ $SERVICES_OK -eq 0 ]; then
    echo -e "${RED}Some services are not running. Start them and try again.${NC}"
    exit 1
fi

# =============================================================================
# TEST DATABASE CONNECTION
# =============================================================================
echo -e "${YELLOW}[3/6] Testing database connection...${NC}"
echo ""

# Test PostgreSQL connection
if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -c "SELECT 1" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostgreSQL connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect to PostgreSQL${NC}"
    echo ""
    echo "  Make sure PostgreSQL is configured to accept connections:"
    echo "  1. Edit /etc/postgresql/*/main/pg_hba.conf"
    echo "  2. Add: local all postgres trust"
    echo "  3. Restart: sudo systemctl restart postgresql"
    echo ""
    echo "  Or set password for postgres user:"
    echo "  sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'YOUR_SECURE_PASSWORD';\""
    echo "  export POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD"
    exit 1
fi

# Check if database exists, create if not
if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -lqt | cut -d \| -f 1 | grep -qw "$POSTGRES_DB"; then
    echo -e "${GREEN}✓ Database '$POSTGRES_DB' exists${NC}"
else
    echo -e "${YELLOW}Creating database '$POSTGRES_DB'...${NC}"
    PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -c "CREATE DATABASE $POSTGRES_DB;"
    echo -e "${GREEN}✓ Database created${NC}"
fi

# Check/enable PostGIS extension
echo "  Checking PostGIS extension..."
if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "CREATE EXTENSION IF NOT EXISTS postgis;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PostGIS extension enabled${NC}"
else
    echo -e "${RED}✗ Failed to enable PostGIS. Install it:${NC}"
    echo "    sudo apt install postgresql-15-postgis-3"
    exit 1
fi

# Test Redis connection
echo ""
if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect to Redis${NC}"
    exit 1
fi

echo ""

# =============================================================================
# RUN DATABASE MIGRATIONS
# =============================================================================
echo -e "${YELLOW}[4/6] Running database migrations...${NC}"
echo ""

for migration in migrations/*.up.sql; do
    if [ -f "$migration" ]; then
        echo "  Applying: $(basename "$migration")"
        PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -f "$migration" > /dev/null 2>&1 || true
    fi
done
echo -e "${GREEN}✓ Migrations applied${NC}"
echo ""

# =============================================================================
# CREATE ENVIRONMENT FILE
# =============================================================================
echo -e "${YELLOW}[5/6] Setting up environment...${NC}"
echo ""

# Check required secrets
if [ -z "$JWT_SECRET" ]; then
    echo -e "${YELLOW}JWT_SECRET not set. Generating a random one for development...${NC}"
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
fi

if [ -z "$OTP_SECRET" ]; then
    echo -e "${YELLOW}OTP_SECRET not set. Generating a random one for development...${NC}"
    OTP_SECRET=$(openssl rand -base64 32 | tr -d '\n')
fi

# Create .env file for the application
cat > .env << EOF
# Auto-generated for native Linux setup
PORT=8080
DATABASE_URL=postgres://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?sslmode=disable
REDIS_ADDR=${REDIS_HOST}:${REDIS_PORT}
JWT_SECRET=${JWT_SECRET}
OTP_SECRET=${OTP_SECRET}
EOF

# Add MinIO config if provided
if [ -n "$MINIO_ENDPOINT" ]; then
    cat >> .env << EOF
S3_ENDPOINT=${MINIO_ENDPOINT}
S3_REGION=us-east-1
S3_ACCESS_KEY=${MINIO_ACCESS_KEY}
S3_SECRET_KEY=${MINIO_SECRET_KEY}
S3_BUCKET=jain-food-media
EOF
fi

echo -e "${GREEN}✓ Environment file created (.env)${NC}"
echo ""

# =============================================================================
# START APPLICATIONS
# =============================================================================
echo -e "${YELLOW}[6/6] Starting applications...${NC}"
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}Shutting down...${NC}"
    [ -n "$API_PID" ] && kill $API_PID 2>/dev/null
    [ -n "$WEB_PID" ] && kill $WEB_PID 2>/dev/null
    echo -e "${GREEN}Done!${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start Go backend
echo "Starting Go backend..."
go run ./cmd/api &
API_PID=$!
sleep 3

# Check if API started
if kill -0 $API_PID 2>/dev/null; then
    echo -e "${GREEN}✓ API started (PID: $API_PID)${NC}"
else
    echo -e "${RED}✗ API failed to start${NC}"
    exit 1
fi

# Start React frontend
echo ""
echo "Starting React frontend..."
cd web
npm install --silent
npm run dev &
WEB_PID=$!
cd ..
sleep 3

if kill -0 $WEB_PID 2>/dev/null; then
    echo -e "${GREEN}✓ Frontend started (PID: $WEB_PID)${NC}"
else
    echo -e "${YELLOW}⚠ Frontend may have issues, check logs${NC}"
fi

echo ""
echo -e "${CYAN}========================================"
echo "  Application is running!              "
echo -e "========================================${NC}"
echo ""
echo "Access points:"
echo -e "  ${GREEN}Frontend:${NC}  http://localhost:5173"
echo -e "  ${GREEN}API:${NC}       http://localhost:8080"
echo -e "  ${GREEN}Health:${NC}    http://localhost:8080/health"
echo ""
echo "Process IDs:"
echo "  API PID: $API_PID"
echo "  Web PID: $WEB_PID"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for processes
wait
