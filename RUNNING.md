# 🚀 JainFood - Complete Running Guide

## ✅ Current Status
- **Backend**: Running at http://localhost:8080
- **Frontend**: Running at http://localhost:5173
- **MinIO**: Running at http://localhost:9001

---

## 📋 Step-by-Step Guide for Each Environment

### 🏠 LOCAL DEVELOPMENT (Current Setup - Cloud DB)

Uses Neon PostgreSQL + Upstash Redis (cloud), MinIO (local).

#### Step 1: Ensure .env file exists
```powershell
# Check if .env exists
Get-Content .env
```

If not, create it:
```powershell
[System.IO.File]::WriteAllText(".env", @"
APP_ENV=dev
GIN_MODE=debug
PORT=8080
DATABASE_URL=postgresql://your_user:your_password@your_neon_host/jain_food?sslmode=require
REDIS_URL=rediss://default:your_upstash_password@your_upstash_host:6379
JWT_SECRET=generate_a_random_32_char_string_here
OTP_SECRET=generate_another_random_32_char_string
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=your_minio_access_key
S3_SECRET_KEY=your_minio_secret_key
S3_BUCKET=jain-food-media
NOTIFY_SERVICE=smsindiahub
SMSINDIAHUB_API_KEY=your_smsindiahub_api_key
SMSINDIAHUB_SENDER_ID=JAINFO
SMSINDIAHUB_CHANNEL=Trans
"@)
```

#### Step 2: Start MinIO (File Storage)
```powershell
cd docker
docker compose -f docker-compose.neon.yml --env-file ../.env up -d
cd ..
```

#### Step 3: Start Backend
```powershell
go run ./cmd/api
```

#### Step 4: Start Frontend (New Terminal)
```powershell
cd web
npm run dev
```

#### Step 5: Open in Browser
- **App**: http://localhost:5173
- **API**: http://localhost:8080/health
- **MinIO**: http://localhost:9001 (use credentials from .env)

---

### 🐳 FULLY LOCAL (All Docker)

Uses PostgreSQL + Redis + MinIO in Docker containers.

#### Step 1: Create local .env
```powershell
[System.IO.File]::WriteAllText(".env", @"
APP_ENV=local
GIN_MODE=debug
PORT=8080
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=jain_food
DATABASE_URL=postgres://postgres:your_secure_password_here@localhost:5432/jain_food?sslmode=disable
REDIS_ADDR=localhost:6379
JWT_SECRET=generate_a_random_32_char_string_here
OTP_SECRET=generate_another_random_32_char_string
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=your_minio_access_key
S3_SECRET_KEY=your_minio_secret_key
S3_BUCKET=jain-food-media
NOTIFY_SERVICE=console
"@)
```

#### Step 2: Start All Docker Services
```powershell
cd docker
docker compose --env-file ../.env up -d
cd ..
```

#### Step 3: Run Migrations
```powershell
# Connect to PostgreSQL and run migrations
# Or use psql command line
```

#### Step 4: Start Backend & Frontend
```powershell
# Terminal 1
go run ./cmd/api

# Terminal 2
cd web && npm run dev
```

---

### 🎭 MOCK MODE (Frontend Only)

No backend needed - uses mocked data.

#### Step 1: Create mock .env
```powershell
cd web
[System.IO.File]::WriteAllText(".env.local", "VITE_USE_MOCK_API=true")
```

#### Step 2: Start Frontend
```powershell
npm run dev
```

---

### ☁️ PRODUCTION DEPLOYMENT

#### Backend on Render.com

1. Push to GitHub
2. Go to https://render.com → New Web Service
3. Connect your repo
4. Set environment variables:
   ```
   APP_ENV=prod
   GIN_MODE=release
   DATABASE_URL=<your-neon-url>
   REDIS_URL=<your-upstash-url>
   JWT_SECRET=<generate-secure-64-chars>
   OTP_SECRET=<generate-secure-64-chars>
   NOTIFY_SERVICE=smsindiahub
   SMSINDIAHUB_API_KEY=<your-api-key>
   SMSINDIAHUB_SENDER_ID=JAINFO
   SMSINDIAHUB_CHANNEL=Trans
   ```

#### Frontend on Vercel

1. Go to https://vercel.com → Import Project
2. Root directory: `web`
3. Set environment variables:
   ```
   VITE_API_URL=https://your-api.onrender.com
   VITE_USE_MOCK_API=false
   ```

---

## 🔧 Troubleshooting

### Backend won't start
1. Check .env file exists and has no BOM encoding
2. Run: `go build ./cmd/api` to check for errors
3. Check DATABASE_URL is correct

### Frontend won't load
1. Check `npm install` completed
2. Run `npx tsc --noEmit` to check for TypeScript errors
3. Check browser console for errors

### API calls failing
1. Check backend is running: http://localhost:8080/health
2. Check frontend proxy in vite.config.ts
3. Check browser network tab

### Database connection failed
1. Verify DATABASE_URL in .env
2. Check Neon dashboard for connection issues
3. Try connecting with psql directly

---

## 📍 URLs Summary

| Service | Local URL | Description |
|---------|-----------|-------------|
| Frontend | http://localhost:5173 | React app |
| Backend API | http://localhost:8080 | Go API |
| Health Check | http://localhost:8080/health | API status |
| MinIO Console | http://localhost:9001 | File storage UI |

---

## 🗄️ Database Migrations

If you haven't run migrations on Neon yet:

1. Go to https://console.neon.tech
2. Select your project
3. Go to SQL Editor
4. Run each migration file in order:
   - `migrations/0001_init.up.sql`
   - `migrations/0002_order_code.up.sql`
   - `migrations/0003_orders_partitions_2026.up.sql`
   - `migrations/0004_orders_partitions_current.up.sql`
   - `migrations/0005_enhanced_features.up.sql`

---

## 🔐 Your Credentials (DO NOT COMMIT)

Store these safely - they're in your .env file:

- **Neon DB**: `postgresql://neondb_owner:npg_xxx@...neon.tech/jain_food`
- **Upstash Redis**: `rediss://default:xxx@...upstash.io:6379`
- **SMS India Hub**: API Key configured
