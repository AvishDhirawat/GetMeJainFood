#!/bin/bash
# Script to run Jain Food App locally on Linux

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/.env"
ENV_EXAMPLE_FILE="$SCRIPT_DIR/.env.example"

echo "========================================"
echo "  GetMeJainFood - Local Development    "
echo "========================================"
echo ""

# Check if .env file exists, create from example if not
if [ ! -f "$ENV_FILE" ]; then
    echo "WARNING: .env file not found!"

    if [ -f "$ENV_EXAMPLE_FILE" ]; then
        echo "Creating .env from .env.example with default values..."
        cp "$ENV_EXAMPLE_FILE" "$ENV_FILE"
        echo ".env file created! You can customize it later."
    else
        echo "ERROR: Neither .env nor .env.example found!"
        echo ""
        echo "Please create a .env file with required configuration:"
        echo "  POSTGRES_USER=postgres"
        echo "  POSTGRES_PASSWORD=<your_secure_password>"
        echo "  POSTGRES_DB=jain_food"
        echo "  DATABASE_URL=postgres://postgres:<your_secure_password>@localhost:5432/jain_food?sslmode=disable"
        echo "  REDIS_ADDR=localhost:6379"
        echo "  JWT_SECRET=<generate_random_32_char_string>"
        echo "  OTP_SECRET=<generate_random_32_char_string>"
        exit 1
    fi
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start Docker first."
    echo "  On Linux: sudo systemctl start docker"
    exit 1
fi

echo "[1/4] Starting infrastructure (Postgres, Redis, MinIO)..."
cd "$SCRIPT_DIR/docker"
docker compose --env-file "$ENV_FILE" up -d postgres redis minio

echo ""
echo "[2/4] Waiting for services to be healthy..."
sleep 5

# Check if postgres is ready
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    if docker compose --env-file "$ENV_FILE" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "  PostgreSQL is ready!"
        break
    fi
    echo "  Waiting for PostgreSQL... (attempt $attempt/$max_attempts)"
    sleep 2
done

if [ $attempt -ge $max_attempts ]; then
    echo "ERROR: PostgreSQL failed to start"
    exit 1
fi

# Check Redis
if docker compose --env-file "$ENV_FILE" exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "  Redis is ready!"
else
    echo "ERROR: Redis failed to start"
    exit 1
fi

cd "$SCRIPT_DIR"

echo ""
echo "[3/4] Starting Go backend API..."
echo "  API will be available at: http://localhost:8080"

# Load environment variables for the API
set -a
source "$ENV_FILE"
set +a

# Start the Go backend in background
go run ./cmd/api &
API_PID=$!

echo ""
echo "[4/4] Starting React frontend..."
echo "  Frontend will be available at: http://localhost:3000"

# Start the frontend
cd web
npm install
npm run dev &
WEB_PID=$!

cd ..

echo ""
echo "========================================"
echo "  All services starting!               "
echo "========================================"
echo ""
echo "Access the app:"
echo "  Frontend:  http://localhost:3000"
echo "  API:       http://localhost:8080/health"
echo "  MinIO:     http://localhost:9001 (credentials in .env)"
echo ""
echo "Process IDs:"
echo "  API PID:   $API_PID"
echo "  Web PID:   $WEB_PID"
echo ""
echo "To stop:"
echo "  kill $API_PID $WEB_PID"
echo "  cd docker && docker compose --env-file ../.env down"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait and cleanup on exit
trap "kill $API_PID $WEB_PID 2>/dev/null; cd docker && docker compose --env-file ../.env down" EXIT
wait
