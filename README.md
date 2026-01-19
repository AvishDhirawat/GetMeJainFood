# Jain Food App

Two-sided Jain-specific food discovery and ordering platform (buyers & providers) built in Go. Focus: strictly Jain dietary compliance, menu transparency, OTP-based order confirmation (no in-app payment yet), lightweight chat/call coordination between buyer and provider.

## 1. Goals & Non-Goals

### Goals
* Location + filter-based discovery (Jain tags: no root veggies, sattvic, etc.).
* Provider onboarding: cloud kitchens, home cooks, hotels.
* Menu & availability management (real-time toggle).
* Cart + OTP order confirmation (no payment capture now).
* Chat + optional masked call connect (3rd party voice API later).
* Basic KYC / verification for providers.
* Scalable path: modular monolith -> service extraction.

### Non-Goals (MVP)
* Payment gateway, wallet, refund flows.
* Delivery routing / logistics optimization.
* Advanced ML personalization.

## 2. High-Level Architecture

```
Clients (React Native Mobile / React Web)  
	|  REST + WebSocket (JWT)  
API Edge (Gin + Middleware: Auth, Rate Limit, Logging)  
	|- Auth / OTP Module  
	|- User & Provider Module  
	|- Menu & Items Module  
	|- Search/Geo Module (Postgres + PostGIS, future: external search)  
	|- Order Module (partitioned tables, OTP confirm, event log)  
	|- Chat Module (WS, Redis PubSub; future: dedicated service)  
	|- Media Module (signed URLs to object storage)  

Infra: Postgres (primary + partitions), Redis (cache, rate-limit, OTP), Object Storage (S3/GCS), Optional MQ (NATS/Kafka) for async events.  
Observability: Prometheus + Grafana, OpenTelemetry traces, structured logs (zap).  
CI/CD: GitHub Actions -> Docker images -> Deploy (Kubernetes or ECS/Fargate).  
```

MVP uses a modular monolith with clear package boundaries under `internal/`. Extraction path: split Chat, Search, Order into services once load or team size increases.

## 3. Low-Level Architecture

### Auth / OTP
* Phone-based login/registration. 6-digit OTP generated with crypto rand; hashed (HMAC-SHA256) & stored in Redis with TTL (5–10m).
* JWT access (short-lived) + refresh tokens (future). Roles: `buyer`, `provider`, `admin`.
* Rate limiting on OTP send & verify endpoints.

### Users / Providers
* Users hold profile + Jain preference flags.
* Providers reference user row; store geo point (PostGIS), tags, verification status.
* Verification workflow: upload docs -> admin review -> set `verified=true`.

### Menus / Items
* CRUD via provider dashboard/app. Items embed Jain compliance flags; ingredient tags for filtering.
* Search indexes (tsvector + GIN) already seeded in migration for name & ingredients.

### Orders & Unique Order Code
* Lifecycle: `CREATED` -> `PENDING_PROVIDER_ACK` (future) -> `CONFIRMED` (OTP) -> `COMPLETED` / `CANCELLED`.
* Partitioned by `created_at` month for scalable storage & pruning.
* Two identifiers:
  - Internal UUID (`id`) for database relations.
  - External human-friendly `order_code` (added in migration 0002) generated at creation.
* Format proposal: `JF-<ULID>` (e.g., `JF-01HZY0K7C5N4Y9QB9Q4K3E3T`). ULID provides time-sortable, globally unique IDs. We may display a shortened form (first 10 chars after prefix) in UI while storing full value.
* Uniqueness in partitioned table: unique index on `(order_code, created_at)`; ULID entropy keeps collisions practically impossible.

### Chat
* Initial WebSocket endpoint multiplexed by chat/order IDs; persistence in Postgres (`chats`, `messages`).
* Scaling path: move real-time layer to separate service w/ Redis PubSub or NATS streaming.

### Search & Geo
* Nearby providers via PostGIS `ST_DWithin(geo, POINT, radius)`.
* Filter pipeline: Jain flags, tags, rating, price range (future), availability.
* Later: external search (Typesense / Elastic) for fuzzy queries + pre-ranked results.

### Media
* Provider & item images stored in object storage with signed PUT/GET URLs.
* Basic image variant generation deferred to async task queue later.

### Events
* Append-only `events` table for audit & replay (e.g., ORDER_CONFIRMED). Can feed analytics or future CQRS read models.

## 4. Data Model (Key Tables)
See `migrations/0001_init.up.sql` and `0002_order_code.up.sql` (to be added). Core additions:
* `orders(order_code TEXT NOT NULL, UNIQUE(order_code, created_at))`.

## 5. API Surface (Representative)
```
POST /auth/send-otp { phone }
POST /auth/verify-otp { phone, otp }
POST /providers       (create provider)
GET  /providers/:id
POST /menus           (create menu)
POST /menu-items      (add item)
GET  /search?lat=&lng=&radius=&filters=
POST /orders          { buyer_id, provider_id, items, total_estimate }
POST /orders/:id/confirm-otp { otp }
GET  /orders/:code    (lookup by order_code)
WS   /ws/chat?chat_id=...
```

## 6. Order Code Generation (Go)
Used in `internal/orders/orders.go`:
* Library: `github.com/oklog/ulid/v2`.
* Entropy source: crypto rand + monotonic wrapper.
* Function: `GenerateOrderCode() string` returns `JF-<ulid>`.
* Stored alongside UUID in insert statement.

## 7. Tech Stack (Go Focus)
* Framework: `gin-gonic/gin`.
* DB: Postgres + PostGIS (geo), partitions for orders.
* Cache/OTP: Redis.
* Logging: zap.
* ID generation: ULID (order_code), UUID (primary keys).
* Auth: JWT (golang-jwt v5), HMAC OTP hashing.
* Future Async: NATS / Kafka + worker service.

### Why Go vs Python (concise comparison)
| Aspect | Go | Python (Django/FastAPI) |
|--------|----|-------------------------|
| Concurrency | Built-in goroutines, lightweight | Async requires event loop; mixed sync/async complexity |
| Performance | Generally higher throughput | Adequate; can require scaling sooner |
| Binary deploy | Single static-ish binary | Requires runtime & virtualenv |
| Ecosystem (admin UI) | Less batteries-included | Django provides rich admin out of box |
| Learning curve | Simpler language surface | Rich dynamic features, more patterns |
Decision: Go chosen for performance, concurrency, and team preference; admin UI can be built via React Web.

## 8. Security & Compliance (MVP)
* Hash OTPs; never store plain text.
* Rate limit high-risk endpoints.
* Enforce HTTPS + secure headers.
* RBAC checks for provider actions.
* Data minimization & deletion endpoints for user privacy.

## 9. Scalability Path
* Step 1: Modular monolith (current).
* Step 2: Extract Chat + Search when latency or team ownership requires.
* Step 3: Introduce event bus & dedicated notification service.
* Step 4: Add read replicas / further partitioning (weekly) for high order volume.

## 10. Roadmap (Indicative)
1. Auth & OTP + provider onboarding.
2. Menus/items CRUD + geo search.
3. Cart + order & order_code generation + confirmation.
4. Chat WebSocket MVP.
5. Observability & partition maintenance automation.
6. Hardening: rate limits, verification workflow, image variants.
7. Service extraction (as needed).
## 11. Running the Application

### Quick Start (One Command!)

```powershell
# Start everything in Docker (recommended for first-time setup)
.\run.ps1

# Or for local development with hot-reload
.\run.ps1 -Mode local
```

### Prerequisites

- **Docker Desktop** - Required for all modes
- **Go 1.20+** - Required for local mode
- **Node.js 20+** - Required for local mode

### Available Commands

```powershell
# Development (default)
.\run.ps1                              # Start dev in Docker
.\run.ps1 -Mode local                  # Start dev with hot-reload
.\run.ps1 -Action down                 # Stop all services
.\run.ps1 -Action logs                 # View logs
.\run.ps1 -Action status               # Check service status
.\run.ps1 -Action restart              # Restart all services

# QA Environment
.\run.ps1 -Environment qa              # Start QA environment
.\run.ps1 -Environment qa -Action down # Stop QA

# Production Environment
.\run.ps1 -Environment prod            # Start production
```

### Environment Modes

| Mode | Description | Best For |
|------|-------------|----------|
| `docker` (default) | All services run in containers | Testing, CI/CD, production-like testing |
| `local` | Only infra in Docker, Go/React run natively | Development with hot-reload |

### Access Points

| Service | URL | Notes |
|---------|-----|-------|
| Frontend | http://localhost:3000 (docker) / http://localhost:5173 (local) | React app |
| API | http://localhost:8080 | Go backend |
| API Health | http://localhost:8080/health | Health check endpoint |
| MinIO Console | http://localhost:9001 | Object storage admin (minioadmin/minioadmin) |
| MinIO Console | http://localhost:9001 | Object storage admin (credentials in .env) |
### Configuration

Environment files are in `configs/`:
First, create your environment file:
```bash
cp .env.example .env
# Edit .env with your configuration values
```

Environment variables:
- `POSTGRES_PASSWORD` - Database password (required)
- `JWT_SECRET` - JWT signing key (required)
- `OTP_SECRET` - OTP signing key (required)
- `S3_ACCESS_KEY` / `S3_SECRET_KEY` - MinIO credentials
### Architecture (Services)

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose Stack                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────────────┐ │
│  │   Web   │  │   API   │  │  Redis  │  │    PostgreSQL   │ │
│  │ (React) │──│  (Go)   │──│ (Cache) │  │   (PostGIS)     │ │
│  │  :3000  │  │  :8080  │  │  :6379  │  │     :5432       │ │
│  └─────────┘  └────┬────┘  └─────────┘  └─────────────────┘ │
│                    │                                         │
│               ┌────┴────┐                                    │
│               │  MinIO  │                                    │
│               │ (S3/Obj)│                                    │
│               │  :9000  │                                    │
│               └─────────┘                                    │
└─────────────────────────────────────────────────────────────┘
```

### Troubleshooting

**Docker not running:**
```
ERROR: Docker is not running. Please start Docker Desktop first.
```
→ Start Docker Desktop and wait for it to be ready.

**Port already in use:**
```powershell
# Check what's using the port
netstat -ano | findstr :8080
# Kill the process or change PORT in .env file
```

**Database connection failed:**
```powershell
# Check if postgres is healthy
docker compose -f docker/docker-compose.yml ps
# View postgres logs
docker compose -f docker/docker-compose.yml logs postgres
```

**Clean restart:**
```powershell
.\run.ps1 -Action down
docker volume prune -f  # Warning: removes all unused volumes
.\run.ps1
```

## 12. Next Steps
* Add migration `0002_order_code.up.sql`.
* Implement `GenerateOrderCode()` and update order creation.
* Expose GET /orders/:code endpoint.

---
Feel free to request scaffolding for handlers, routing, or an OpenAPI spec.