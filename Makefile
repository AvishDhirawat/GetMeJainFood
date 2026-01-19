# Makefile for JainFood API

.PHONY: help build run test lint clean docker-build docker-run dev

# Default Go version
GO_VERSION ?= 1.25

# Binary name
BINARY_NAME=jain-api
BINARY_PATH=bin/$(BINARY_NAME)

# Docker
DOCKER_IMAGE=jainfood-api
DOCKER_TAG=latest

help: ## Show this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

build: ## Build the Go binary
	@echo "Building $(BINARY_NAME)..."
	CGO_ENABLED=0 go build -ldflags="-s -w" -o $(BINARY_PATH) ./cmd/api

run: build ## Build and run the API
	@echo "Running $(BINARY_NAME)..."
	./$(BINARY_PATH)

dev: ## Run in development mode with hot reload
	@echo "Starting development server..."
	go run ./cmd/api

test: ## Run tests
	@echo "Running tests..."
	go test -v -race -coverprofile=coverage.out ./...

test-coverage: test ## Run tests with coverage report
	go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

lint: ## Run golangci-lint
	@echo "Running linter..."
	golangci-lint run ./...

lint-fix: ## Run golangci-lint with auto-fix
	golangci-lint run --fix ./...

fmt: ## Format Go code
	@echo "Formatting code..."
	go fmt ./...
	goimports -w .

vet: ## Run go vet
	go vet ./...

tidy: ## Tidy and verify Go modules
	go mod tidy
	go mod verify

clean: ## Clean build artifacts
	@echo "Cleaning..."
	rm -rf bin/
	rm -f coverage.out coverage.html

# Docker commands
docker-build: ## Build Docker image
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .

docker-run: docker-build ## Build and run Docker container
	docker run -p 8080:8080 --env-file .env $(DOCKER_IMAGE):$(DOCKER_TAG)

# Infrastructure commands
infra-up: ## Start infrastructure (postgres, redis, minio)
	cd docker && docker-compose up -d postgres redis minio

infra-down: ## Stop infrastructure
	cd docker && docker-compose down

infra-logs: ## View infrastructure logs
	cd docker && docker-compose logs -f

# Database commands
migrate: ## Run database migrations
	@echo "Running migrations..."
	@for f in migrations/*.up.sql; do \
		echo "Applying $$f..."; \
		psql "$(DATABASE_URL)" -f "$$f"; \
	done

# All-in-one commands
setup: infra-up migrate ## Setup local development environment
	@echo "Setup complete! Run 'make dev' to start the server."

all: lint test build ## Run lint, test, and build

ci: tidy lint test build ## Run CI pipeline locally
