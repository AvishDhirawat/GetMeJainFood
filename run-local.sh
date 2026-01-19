#!/bin/bash
# Script to run Jain Food App locally on Linux

echo "========================================"
echo "  GetMeJainFood - Local Development    "
echo "========================================"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "ERROR: Docker is not running. Please start Docker first."
    echo "  On Linux: sudo systemctl start docker"
    exit 1
fi

echo "[1/4] Starting infrastructure (Postgres, Redis, MinIO)..."
cd "$(dirname "$0")/docker"
docker-compose up -d postgres redis minio

echo ""
echo "[2/4] Waiting for services to be healthy..."
sleep 5

# Check if postgres is ready
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    attempt=$((attempt + 1))
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
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
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "  Redis is ready!"
else
    echo "ERROR: Redis failed to start"
    exit 1
fi

cd "$(dirname "$0")"

echo ""
echo "[3/4] Starting Go backend API..."
echo "  API will be available at: http://localhost:8080"

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
echo "  MinIO:     http://localhost:9001 (minioadmin/minioadmin)"
echo ""
echo "Process IDs:"
echo "  API PID:   $API_PID"
echo "  Web PID:   $WEB_PID"
echo ""
echo "To stop:"
echo "  kill $API_PID $WEB_PID"
echo "  cd docker && docker-compose down"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait and cleanup on exit
trap "kill $API_PID $WEB_PID 2>/dev/null; cd docker && docker-compose down" EXIT
wait
