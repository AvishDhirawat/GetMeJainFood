# Jain Food App - Deployment Guide

This guide provides comprehensive instructions for deploying the Jain Food App in various environments, from local development to production cloud platforms.

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment Options](#production-deployment-options)
4. [Security Best Practices](#security-best-practices)
5. [Monitoring & Observability](#monitoring--observability)
6. [Database Management](#database-management)
7. [Production Readiness Checklist](#production-readiness-checklist)

---

## Local Development Setup

### Prerequisites

- **Go 1.23+** - [Download](https://go.dev/dl/)
- **Docker** and **Docker Compose** - [Install Docker](https://docs.docker.com/get-docker/)
- **PostgreSQL 15+ with PostGIS extension** (or use Docker)
- **Redis 7+** (or use Docker)
- **Git**

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/AvishDhirawat/GetMeJainFood.git
cd GetMeJainFood

# Copy environment configuration
cp .env.example .env

# Edit .env with your local settings
# IMPORTANT: Change JWT_SECRET and OTP_SECRET in production!
```

### Environment Configuration

Edit `.env` file with appropriate values:

```env
# Server
PORT=8080

# Database (PostgreSQL with PostGIS)
DATABASE_URL=postgres://postgres:postgres@localhost:5432/jain_food?sslmode=disable

# Redis
REDIS_ADDR=localhost:6379

# Security - MUST CHANGE IN PRODUCTION!
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
OTP_SECRET=your-super-secret-otp-key-change-in-production-min-32-chars

# S3/MinIO Object Storage (optional)
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=jain-food-media
```

### Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, and MinIO using Docker Compose
cd docker
docker compose up -d

# Wait for services to be ready (about 10-15 seconds)
docker compose ps
```

### Run Database Migrations

```bash
# Make sure PostgreSQL is running
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/jain_food?sslmode=disable"

# Run migrations
for f in migrations/*.up.sql; do
    psql "$DATABASE_URL" -f "$f"
done

# Or if psql is not installed, use Docker:
for f in migrations/*.up.sql; do
    docker exec -i $(docker ps -qf "name=postgres") psql -U postgres -d jain_food < "$f"
done
```

### Install Dependencies and Build

```bash
# Download Go dependencies
go mod download

# Build the application
go build -o bin/jain-api ./cmd/api

# Or run directly
go run ./cmd/api
```

### Run the Application

```bash
# Option 1: Run from source
go run ./cmd/api

# Option 2: Run built binary
./bin/jain-api

# The API will be available at http://localhost:8080
```

### Running Tests

```bash
# Run all tests
go test -v ./...

# Run tests with coverage
go test -v -race -coverprofile=coverage.out ./...

# View coverage report
go tool cover -html=coverage.out
```

---

## Docker Deployment

### Building Docker Image

```bash
# Build the Docker image
docker build -t jain-food-api:latest .

# Run the container
docker run -p 8080:8080 \
  -e DATABASE_URL="postgres://postgres:postgres@host.docker.internal:5432/jain_food?sslmode=disable" \
  -e REDIS_ADDR="host.docker.internal:6379" \
  -e JWT_SECRET="your-secret-key" \
  -e OTP_SECRET="your-otp-secret" \
  jain-food-api:latest
```

### Docker Compose for Local Development

Create a complete local development environment with the provided `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "8080:8080"
    environment:
      - PORT=8080
      - DATABASE_URL=postgres://postgres:postgres@postgres:5432/jain_food?sslmode=disable
      - REDIS_ADDR=redis:6379
      - JWT_SECRET=dev-jwt-secret-change-in-production
      - OTP_SECRET=dev-otp-secret-change-in-production
      - S3_ENDPOINT=http://minio:9000
      - S3_REGION=us-east-1
      - S3_ACCESS_KEY=minioadmin
      - S3_SECRET_KEY=minioadmin
      - S3_BUCKET=jain-food-media
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - jain-food-net

  postgres:
    image: postgis/postgis:15-3.4
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: jain_food
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - jain-food-net

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - jain-food-net

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data
    networks:
      - jain-food-net

volumes:
  pgdata:
  redisdata:
  miniodata:

networks:
  jain-food-net:
    driver: bridge
```

**Run with Docker Compose:**

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f api

# Stop all services
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

---

## Production Deployment Options

### AWS Deployment

#### Using ECS Fargate

**Architecture:**
- ECS Fargate for containerized API
- RDS PostgreSQL with PostGIS extension
- ElastiCache Redis
- Application Load Balancer with HTTPS
- Secrets Manager for credentials
- CloudWatch for logs and metrics

**Steps:**

1. **Create RDS PostgreSQL Instance:**
```bash
# Enable PostGIS extension after creation
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
```

2. **Create ElastiCache Redis Cluster:**
- Use Redis 7.x
- Enable encryption in transit
- Place in private subnet

3. **Store Secrets in AWS Secrets Manager:**
```bash
aws secretsmanager create-secret \
  --name jain-food/jwt-secret \
  --secret-string "YOUR_STRONG_JWT_SECRET_32_CHARS_MIN"

aws secretsmanager create-secret \
  --name jain-food/otp-secret \
  --secret-string "YOUR_STRONG_OTP_SECRET_32_CHARS_MIN"

aws secretsmanager create-secret \
  --name jain-food/database-url \
  --secret-string "postgres://username:password@rds-endpoint:5432/jain_food?sslmode=require"
```

4. **Push Docker Image to ECR:**
```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag
docker build -t jain-food-api .
docker tag jain-food-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/jain-food-api:latest

# Push
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/jain-food-api:latest
```

5. **Create ECS Task Definition:**
```json
{
  "family": "jain-food-api",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [{
    "name": "api",
    "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/jain-food-api:latest",
    "portMappings": [{
      "containerPort": 8080,
      "protocol": "tcp"
    }],
    "environment": [
      {"name": "PORT", "value": "8080"}
    ],
    "secrets": [
      {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:region:account:secret:jain-food/database-url"},
      {"name": "JWT_SECRET", "valueFrom": "arn:aws:secretsmanager:region:account:secret:jain-food/jwt-secret"},
      {"name": "OTP_SECRET", "valueFrom": "arn:aws:secretsmanager:region:account:secret:jain-food/otp-secret"}
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": "/ecs/jain-food-api",
        "awslogs-region": "us-east-1",
        "awslogs-stream-prefix": "ecs"
      }
    }
  }]
}
```

6. **Create ECS Service with ALB:**
- Configure Application Load Balancer
- Enable HTTPS with ACM certificate
- Configure health checks on `/health` endpoint
- Enable auto-scaling based on CPU/memory

#### Using EKS (Kubernetes on AWS)

See [Kubernetes Deployment](#kubernetes-deployment) section below.

---

### GCP Deployment

#### Using Cloud Run

**Architecture:**
- Cloud Run for containerized API
- Cloud SQL for PostgreSQL with PostGIS
- Memorystore for Redis
- Cloud Load Balancer with HTTPS
- Secret Manager for credentials

**Steps:**

1. **Enable Required APIs:**
```bash
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

2. **Create Cloud SQL Instance:**
```bash
gcloud sql instances create jain-food-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create jain_food --instance=jain-food-db

# Enable PostGIS
gcloud sql connect jain-food-db --user=postgres
# In psql: CREATE EXTENSION postgis;
```

3. **Create Memorystore Redis:**
```bash
gcloud redis instances create jain-food-redis \
  --size=1 \
  --region=us-central1 \
  --redis-version=redis_7_0
```

4. **Store Secrets:**
```bash
echo -n "YOUR_JWT_SECRET_32_CHARS_MIN" | gcloud secrets create jwt-secret --data-file=-
echo -n "YOUR_OTP_SECRET_32_CHARS_MIN" | gcloud secrets create otp-secret --data-file=-
```

5. **Build and Push to Container Registry:**
```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Build and push
docker build -t gcr.io/PROJECT_ID/jain-food-api:latest .
docker push gcr.io/PROJECT_ID/jain-food-api:latest
```

6. **Deploy to Cloud Run:**
```bash
gcloud run deploy jain-food-api \
  --image gcr.io/PROJECT_ID/jain-food-api:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars PORT=8080 \
  --set-secrets DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,OTP_SECRET=otp-secret:latest \
  --add-cloudsql-instances PROJECT_ID:us-central1:jain-food-db \
  --vpc-connector=my-vpc-connector \
  --min-instances=1 \
  --max-instances=10 \
  --memory=512Mi \
  --cpu=1
```

#### Using GKE (Google Kubernetes Engine)

See [Kubernetes Deployment](#kubernetes-deployment) section below.

---

### Kubernetes Deployment

Generic Kubernetes deployment manifests that work on any Kubernetes cluster (EKS, GKE, AKS, or self-hosted).

#### Namespace

```yaml
# namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: jain-food
```

#### ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: jain-food-config
  namespace: jain-food
data:
  PORT: "8080"
  S3_REGION: "us-east-1"
```

#### Secrets

```yaml
# secrets.yaml
# IMPORTANT: Do not commit this file with real secrets!
# Use external secret management or sealed secrets
apiVersion: v1
kind: Secret
metadata:
  name: jain-food-secrets
  namespace: jain-food
type: Opaque
stringData:
  DATABASE_URL: "postgres://username:password@postgres-service:5432/jain_food?sslmode=require"
  REDIS_ADDR: "redis-service:6379"
  JWT_SECRET: "YOUR_STRONG_JWT_SECRET_MIN_32_CHARS"
  OTP_SECRET: "YOUR_STRONG_OTP_SECRET_MIN_32_CHARS"
  S3_ACCESS_KEY: "your-s3-access-key"
  S3_SECRET_KEY: "your-s3-secret-key"
```

**Better: Use External Secrets Operator or Sealed Secrets for production!**

#### Deployment

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jain-food-api
  namespace: jain-food
  labels:
    app: jain-food-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxUnavailable: 1
      maxSurge: 1
  selector:
    matchLabels:
      app: jain-food-api
  template:
    metadata:
      labels:
        app: jain-food-api
    spec:
      containers:
      - name: api
        image: ghcr.io/avishdhirawat/getmejainfood:latest
        imagePullPolicy: Always
        ports:
        - containerPort: 8080
          name: http
          protocol: TCP
        env:
        - name: PORT
          valueFrom:
            configMapKeyRef:
              name: jain-food-config
              key: PORT
        envFrom:
        - secretRef:
            name: jain-food-secrets
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
          limits:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 3
        securityContext:
          allowPrivilegeEscalation: false
          runAsNonRoot: true
          runAsUser: 1000
          capabilities:
            drop:
            - ALL
          readOnlyRootFilesystem: true
      securityContext:
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
```

#### Service

```yaml
# service.yaml
apiVersion: v1
kind: Service
metadata:
  name: jain-food-api-service
  namespace: jain-food
  labels:
    app: jain-food-api
spec:
  type: ClusterIP
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
    name: http
  selector:
    app: jain-food-api
```

#### Ingress (with HTTPS)

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: jain-food-ingress
  namespace: jain-food
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.jainfood.example.com
    secretName: jain-food-tls
  rules:
  - host: api.jainfood.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: jain-food-api-service
            port:
              number: 80
```

#### Horizontal Pod Autoscaler

```yaml
# hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: jain-food-api-hpa
  namespace: jain-food
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: jain-food-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### Deploy to Kubernetes

```bash
# Apply all manifests
kubectl apply -f namespace.yaml
kubectl apply -f configmap.yaml
kubectl apply -f secrets.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f ingress.yaml
kubectl apply -f hpa.yaml

# Check deployment status
kubectl get pods -n jain-food
kubectl get svc -n jain-food
kubectl get ingress -n jain-food

# View logs
kubectl logs -f deployment/jain-food-api -n jain-food

# Scale manually if needed
kubectl scale deployment jain-food-api --replicas=5 -n jain-food
```

---

## Security Best Practices

### Environment Variables and Secrets Management

**DO:**
- ✅ Use strong, randomly generated secrets (minimum 32 characters)
- ✅ Use platform-specific secret management (AWS Secrets Manager, GCP Secret Manager, Kubernetes Secrets)
- ✅ Rotate secrets regularly (every 90 days minimum)
- ✅ Use different secrets for each environment (dev, staging, prod)
- ✅ Encrypt secrets at rest and in transit
- ✅ Limit access to secrets using IAM/RBAC

**DON'T:**
- ❌ Never commit `.env` files or secrets to Git
- ❌ Never use default/example secrets in production
- ❌ Never share secrets in plain text (Slack, email, etc.)
- ❌ Never log secrets or include them in error messages

### Generate Strong Secrets

```bash
# Generate JWT secret (32+ characters)
openssl rand -hex 32

# Or using Go
go run -c 'package main; import ("crypto/rand"; "encoding/hex"; "fmt"); func main() { b := make([]byte, 32); rand.Read(b); fmt.Println(hex.EncodeToString(b)) }'

# Or using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### Database Security

1. **Use Strong Credentials:**
   - Never use default passwords
   - Use long, random passwords (20+ characters)
   - Different credentials per environment

2. **Enable SSL/TLS:**
   ```
   DATABASE_URL=postgres://user:pass@host:5432/db?sslmode=require
   ```

3. **Network Isolation:**
   - Place database in private subnet
   - Only allow connections from application security group
   - Use VPC/VPN for administrative access

4. **Regular Backups:**
   - Enable automated backups (daily minimum)
   - Test restore procedures regularly
   - Store backups in separate region/zone

### Application Security

1. **HTTPS/TLS:**
   - Always use HTTPS in production
   - Use TLS 1.2 or higher
   - Configure proper TLS certificates (Let's Encrypt, ACM, etc.)
   - Enable HSTS headers

2. **Rate Limiting:**
   - Implement rate limiting on all endpoints
   - Stricter limits on auth endpoints (OTP send/verify)
   - Use Redis for distributed rate limiting

3. **Input Validation:**
   - Validate all user inputs
   - Sanitize data before storage
   - Use prepared statements for SQL (already using pgx)

4. **Security Headers:**
   ```go
   // Add in Gin middleware
   router.Use(func(c *gin.Context) {
       c.Header("X-Content-Type-Options", "nosniff")
       c.Header("X-Frame-Options", "DENY")
       c.Header("X-XSS-Protection", "1; mode=block")
       c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
       c.Next()
   })
   ```

5. **CORS Configuration:**
   - Configure allowed origins explicitly
   - Don't use wildcard (*) in production

### OTP Security

- Hash OTPs before storage (HMAC-SHA256)
- Short TTL (5-10 minutes)
- Rate limit OTP generation (3-5 per hour per phone)
- Rate limit OTP verification attempts (5 attempts)
- Use cryptographically secure random number generator

---

## Monitoring & Observability

### Health Check Endpoints

Implement health check endpoints in your application:

```go
// GET /health - Basic health check
router.GET("/health", func(c *gin.Context) {
    c.JSON(200, gin.H{"status": "ok"})
})

// GET /health/ready - Readiness check (DB + Redis)
router.GET("/health/ready", func(c *gin.Context) {
    // Check database connection
    if err := db.Ping(context.Background()); err != nil {
        c.JSON(503, gin.H{"status": "not ready", "error": "database"})
        return
    }
    // Check Redis connection
    if err := redisClient.Ping(context.Background()).Err(); err != nil {
        c.JSON(503, gin.H{"status": "not ready", "error": "redis"})
        return
    }
    c.JSON(200, gin.H{"status": "ready"})
})
```

### Prometheus Metrics

The application should expose Prometheus metrics:

```go
// GET /metrics - Prometheus metrics endpoint
import "github.com/prometheus/client_golang/prometheus/promhttp"

router.GET("/metrics", gin.WrapH(promhttp.Handler()))
```

**Key Metrics to Track:**
- HTTP request duration (histogram)
- HTTP request count by status code (counter)
- Active connections (gauge)
- Database connection pool stats (gauge)
- Redis connection pool stats (gauge)
- Order creation rate (counter)
- OTP send/verify rate (counter)
- WebSocket connections (gauge)

### Structured Logging

The application uses `zap` for structured logging:

```go
// Log format
{"level":"info","ts":1705671234.123,"caller":"api/main.go:45","msg":"Server started","port":8080}

// Log levels: DEBUG, INFO, WARN, ERROR, FATAL
// In production: INFO or WARN level
```

**What to Log:**
- Application startup/shutdown
- Request/response (with sanitized data)
- Authentication events (login, logout, failed attempts)
- Order lifecycle events
- Errors and exceptions
- Performance metrics

**What NOT to Log:**
- Passwords or OTPs
- JWT tokens
- Credit card numbers (not used yet, but be careful)
- Full database queries with sensitive data

### Grafana Dashboard

Create dashboards to visualize:
- Request rate and latency (p50, p95, p99)
- Error rate by endpoint
- Database query performance
- Redis cache hit rate
- Active users/sessions
- Order flow metrics

### Alerting

Set up alerts for:
- High error rate (>5% over 5 minutes)
- High latency (p95 > 1s for 5 minutes)
- Low health check success rate (<90%)
- Database connection pool exhaustion
- Redis connection issues
- High memory/CPU usage (>80% for 10 minutes)
- Low disk space (<20%)

### Log Aggregation

**Options:**
- **ELK Stack** (Elasticsearch, Logstash, Kibana)
- **Loki + Grafana** (lightweight, cost-effective)
- **Cloud Solutions:** CloudWatch Logs (AWS), Cloud Logging (GCP), Azure Monitor

**Setup:**
```yaml
# Example: Ship logs to Loki using Promtail
# promtail-config.yaml
clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: jain-food-api
    docker_sd_configs:
      - host: unix:///var/run/docker.sock
        refresh_interval: 5s
    relabel_configs:
      - source_labels: ['__meta_docker_container_name']
        regex: '/(.*)'
        target_label: 'container'
```

---

## Database Management

### Running Migrations in Production

**Manual Migration:**
```bash
# Connect to production database
export DATABASE_URL="postgres://user:pass@prod-db:5432/jain_food?sslmode=require"

# Run migrations in order
for f in migrations/*.up.sql; do
    echo "Running $f..."
    psql "$DATABASE_URL" -f "$f"
done
```

**Kubernetes Job for Migrations:**
```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migration
  namespace: jain-food
spec:
  template:
    spec:
      restartPolicy: OnFailure
      containers:
      - name: migrate
        image: postgres:15
        command:
        - /bin/sh
        - -c
        - |
          for f in /migrations/*.up.sql; do
            echo "Running $f..."
            psql "$DATABASE_URL" -f "$f"
          done
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: jain-food-secrets
              key: DATABASE_URL
        volumeMounts:
        - name: migrations
          mountPath: /migrations
      volumes:
      - name: migrations
        configMap:
          name: db-migrations
```

### Backup Strategies

**Automated Backups:**

1. **AWS RDS:**
   - Enable automated backups (retention: 7-35 days)
   - Configure backup window during low traffic
   - Enable point-in-time recovery
   - Create manual snapshots before major changes

2. **GCP Cloud SQL:**
   - Enable automated backups
   - Configure backup window
   - Enable binary logging for PITR

3. **Self-Hosted:**
   ```bash
   # Daily backup script
   #!/bin/bash
   DATE=$(date +%Y%m%d_%H%M%S)
   BACKUP_FILE="jain_food_backup_$DATE.sql.gz"
   
   pg_dump "$DATABASE_URL" | gzip > "$BACKUP_FILE"
   
   # Upload to S3/GCS
   aws s3 cp "$BACKUP_FILE" "s3://backups/jain-food/$BACKUP_FILE"
   
   # Retain last 30 days
   find /backups -name "jain_food_backup_*.sql.gz" -mtime +30 -delete
   ```

**Test Restores:**
```bash
# Test restore quarterly
gunzip < backup.sql.gz | psql "$TEST_DATABASE_URL"
```

### Connection Pooling

Configure connection pooling for optimal performance:

```go
// In pgx configuration
config.MaxConns = 25                // Max connections in pool
config.MinConns = 5                 // Min connections to maintain
config.MaxConnLifetime = time.Hour  // Max lifetime of a connection
config.MaxConnIdleTime = 30 * time.Minute
config.HealthCheckPeriod = time.Minute
```

**Recommendations:**
- Start with `MaxConns = 25` for small workloads
- Scale based on: `(CPU cores * 2) + effective_spindle_count`
- Monitor connection pool usage and adjust
- Use read replicas for read-heavy workloads

---

## Production Readiness Checklist

Before deploying to production, ensure all items are checked:

### Security
- [ ] All secrets rotated from defaults and stored securely
- [ ] JWT_SECRET is 32+ characters, randomly generated
- [ ] OTP_SECRET is 32+ characters, randomly generated
- [ ] Database credentials are strong and unique
- [ ] HTTPS/TLS configured with valid certificate
- [ ] Security headers configured (HSTS, X-Frame-Options, etc.)
- [ ] CORS configured with explicit allowed origins (no wildcard)
- [ ] Rate limiting enabled on all endpoints
- [ ] Input validation implemented on all endpoints
- [ ] Database SSL/TLS enabled (`sslmode=require`)

### Infrastructure
- [ ] Database backups enabled and tested
- [ ] Database placed in private subnet/network
- [ ] Redis persistence configured (if needed)
- [ ] Multi-AZ/zone deployment for high availability
- [ ] Load balancer configured with health checks
- [ ] Auto-scaling configured based on metrics
- [ ] CDN configured for static assets (if applicable)

### Monitoring & Observability
- [ ] Health check endpoints implemented (`/health`, `/health/ready`)
- [ ] Prometheus metrics endpoint exposed (`/metrics`)
- [ ] Logs being collected and stored centrally
- [ ] Grafana dashboards created
- [ ] Alerting rules configured and tested
- [ ] On-call rotation established
- [ ] Runbooks created for common issues

### Performance
- [ ] Database indexes created for common queries
- [ ] Connection pooling configured appropriately
- [ ] Redis caching implemented for hot data
- [ ] Rate limiting tuned for expected traffic
- [ ] Load testing performed
- [ ] Database query performance optimized

### Disaster Recovery
- [ ] Backup strategy documented and implemented
- [ ] Backup restore tested
- [ ] RTO (Recovery Time Objective) defined
- [ ] RPO (Recovery Point Objective) defined
- [ ] Disaster recovery runbook created
- [ ] Multi-region failover tested (if applicable)

### Compliance & Legal
- [ ] Data retention policy defined
- [ ] Data deletion endpoints implemented
- [ ] Privacy policy updated
- [ ] Terms of service updated
- [ ] GDPR compliance reviewed (if applicable)
- [ ] Data encryption at rest enabled
- [ ] Audit logging implemented

### Operations
- [ ] CI/CD pipeline configured and tested
- [ ] Deployment process documented
- [ ] Rollback procedure documented and tested
- [ ] Database migration process documented
- [ ] Secrets rotation procedure documented
- [ ] Incident response plan created
- [ ] Post-mortem template created

### Testing
- [ ] Unit tests passing (>80% coverage)
- [ ] Integration tests passing
- [ ] Load tests performed
- [ ] Security scanning completed (SAST/DAST)
- [ ] Dependency vulnerability scanning enabled
- [ ] Penetration testing completed (for critical systems)

---

## Additional Resources

### Documentation
- [Go Documentation](https://go.dev/doc/)
- [Gin Framework](https://gin-gonic.com/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [PostGIS Documentation](https://postgis.net/documentation/)
- [Redis Documentation](https://redis.io/docs/)

### Tools
- [Docker](https://docs.docker.com/)
- [Kubernetes](https://kubernetes.io/docs/)
- [Prometheus](https://prometheus.io/docs/)
- [Grafana](https://grafana.com/docs/)

### Best Practices
- [12-Factor App](https://12factor.net/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Go Code Review Comments](https://github.com/golang/go/wiki/CodeReviewComments)

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/AvishDhirawat/GetMeJainFood/issues
- Documentation: Check the `/docs` directory

---

**Last Updated:** 2026-01-19
