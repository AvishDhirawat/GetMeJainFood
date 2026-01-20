# JainFood - Environment Setup & Deployment Guide

## 📁 Environment Files Structure

```
GetMeJainFood/
├── .env                      # Active environment (gitignored)
├── configs/
│   ├── .env.local           # Local dev (all services on localhost)
│   ├── .env.dev             # Development (cloud DB + Redis)
│   ├── .env.qa              # QA/Staging
│   └── .env.prod            # Production
└── web/
    ├── .env.local           # Frontend local
    └── .env.production      # Frontend production
```

---

## 🖥️ LOCAL DEVELOPMENT

### Option A: Full Cloud (Neon + Upstash) - Recommended
Uses cloud database and Redis, only MinIO runs locally.

```powershell
# 1. Use the current .env (already configured with Neon + Upstash)

# 2. Start MinIO only
cd docker
docker compose -f docker-compose.neon.yml up -d

# 3. Run backend
cd ..
go run ./cmd/api

# 4. Run frontend (new terminal)
cd web
npm run dev
```

### Option B: Fully Local (Docker services)
All services run in Docker containers locally.

```powershell
# 1. Switch to local config
Copy-Item configs\.env.local .env -Force

# 2. Start all Docker services
cd docker
docker compose up -d

# 3. Run backend
cd ..
go run ./cmd/api

# 4. Run frontend (new terminal)
cd web
npm run dev
```

### Option C: Mock Mode (No backend needed)
Frontend only with mocked data.

```powershell
cd web

# Create .env.local with mock mode
echo "VITE_USE_MOCK_API=true" > .env.local

npm run dev
```

---

## ☁️ CLOUD DEPLOYMENT

### Environment Variables by Platform

#### Render.com (Backend)
Set these in Render Dashboard → Environment:

```
APP_ENV=prod
GIN_MODE=release
PORT=8080
DATABASE_URL=postgresql://user:xxx@xxx.neon.tech/jain_food?sslmode=require
REDIS_URL=rediss://default:xxx@xxx.upstash.io:6379
JWT_SECRET=<generate-64-char-random-string>
OTP_SECRET=<generate-64-char-random-string>
NOTIFY_SERVICE=smsindiahub
SMSINDIAHUB_API_KEY=your_api_key_here
SMSINDIAHUB_SENDER_ID=JAINFO
SMSINDIAHUB_CHANNEL=Trans
```

#### Vercel (Frontend)
Set these in Vercel Dashboard → Settings → Environment Variables:

```
VITE_API_URL=https://your-app.onrender.com
VITE_USE_MOCK_API=false
```

#### Railway.app (Alternative - All-in-one)
Railway auto-injects database URLs. Add:

```
APP_ENV=prod
GIN_MODE=release
JWT_SECRET=<generate>
OTP_SECRET=<generate>
NOTIFY_SERVICE=smsindiahub
SMSINDIAHUB_API_KEY=your_api_key_here
```

---

## 🔧 SWITCHING ENVIRONMENTS

### PowerShell Commands

```powershell
# Switch to Local
Copy-Item configs\.env.local .env -Force
Write-Host "Switched to LOCAL environment"

# Switch to Dev (Cloud DB)
Copy-Item configs\.env.dev .env -Force
Write-Host "Switched to DEV environment (Neon + Upstash)"

# Switch to QA
Copy-Item configs\.env.qa .env -Force
Write-Host "Switched to QA environment"

# Switch to Production
Copy-Item configs\.env.prod .env -Force
Write-Host "Switched to PRODUCTION environment"
```

---

## 📋 ENVIRONMENT COMPARISON

| Feature | Local | Dev | QA | Prod |
|---------|-------|-----|-----|------|
| APP_ENV | local | dev | qa | prod |
| GIN_MODE | debug | debug | release | release |
| Database | localhost:5432 | Neon Cloud | Neon Cloud | Neon Cloud |
| Redis | localhost:6379 | Upstash | Upstash | Upstash |
| OTP in Response | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No |
| SMS Sending | Console | Real SMS | Real SMS | Real SMS |
| File Storage | MinIO local | MinIO/R2 | R2/S3 | R2/S3 |

---

## 🚀 QUICK START COMMANDS

### Development (Current Setup)
```powershell
# Terminal 1: MinIO
cd docker && docker compose -f docker-compose.neon.yml up -d

# Terminal 2: Backend
go run ./cmd/api

# Terminal 3: Frontend
cd web && npm run dev
```

### Build for Production
```powershell
# Backend
go build -ldflags="-s -w" -o bin/jain-api.exe ./cmd/api

# Frontend
cd web && npm run build
```

### Docker Build
```powershell
# Build backend image
docker build -t jainfood-api .

# Build frontend image
docker build -t jainfood-web ./web
```

---

## 🔐 GENERATING SECRETS

```powershell
# Generate JWT_SECRET (64 characters)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})

# Generate OTP_SECRET (64 characters)
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

---

## 📍 SERVICE URLS

### Local Development
| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8080 |
| API Health | http://localhost:8080/health |
| MinIO Console | http://localhost:9001 |

### Cloud Dashboards
| Service | URL |
|---------|-----|
| Neon (Database) | https://console.neon.tech |
| Upstash (Redis) | https://console.upstash.com |
| Render (Backend) | https://dashboard.render.com |
| Vercel (Frontend) | https://vercel.com/dashboard |
