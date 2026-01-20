# 🚀 Free Deployment Guide for JainFood

This guide will help you deploy JainFood on the internet **completely free** for development/testing.

## 📋 Architecture Overview

We'll deploy using these **FREE** services:

| Component | Service | Free Tier |
|-----------|---------|-----------|
| **Backend (Go API)** | Render.com | 750 hours/month |
| **Frontend (React)** | Vercel or Netlify | Unlimited |
| **Database (PostgreSQL)** | Neon.tech | 500MB free |
| **Redis (Cache)** | Upstash | 10K commands/day |
| **File Storage** | Cloudflare R2 | 10GB free |

**Total Cost: $0/month** 🎉

---

## 📑 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Deploy PostgreSQL on Neon](#2-deploy-postgresql-on-neon)
3. [Deploy Redis on Upstash](#3-deploy-redis-on-upstash)
4. [Deploy Backend on Render](#4-deploy-backend-on-render)
5. [Deploy Frontend on Vercel](#5-deploy-frontend-on-vercel)
6. [Configure Environment Variables](#6-configure-environment-variables)
7. [Test Your Deployment](#7-test-your-deployment)
8. [Alternative: Deploy Everything on Railway](#8-alternative-deploy-everything-on-railway)

---

## 1. Prerequisites

### Required Accounts (All Free)
1. **GitHub Account** - https://github.com/signup
2. **Neon Account** (PostgreSQL) - https://neon.tech
3. **Upstash Account** (Redis) - https://upstash.com
4. **Render Account** (Backend) - https://render.com
5. **Vercel Account** (Frontend) - https://vercel.com

### Push Your Code to GitHub

```powershell
# Initialize git if not already
cd C:\Users\avish\IdeaProjects\GetMeJainFood
git init

# Create .gitignore if not exists
@"
.env
*.exe
bin/
node_modules/
dist/
.DS_Store
*.log
"@ | Out-File -FilePath .gitignore -Encoding UTF8

# Add all files
git add .
git commit -m "Initial commit - JainFood app"

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/GetMeJainFood.git
git branch -M main
git push -u origin main
```

---

## 2. Deploy PostgreSQL on Neon

**Neon** provides a free PostgreSQL database with 500MB storage.

### Step 1: Create Neon Account
1. Go to https://neon.tech
2. Click **"Sign Up"** → Sign in with GitHub
3. Click **"Create a project"**

### Step 2: Create Database
1. **Project name:** `jainfood`
2. **Database name:** `jain_food`
3. **Region:** Choose closest to your users (e.g., Singapore for India)
4. Click **"Create project"**

### Step 3: Get Connection String
1. After creation, you'll see the **Connection string**
2. It looks like:
   ```
   postgres://username:password@ep-xxx-xxx-123456.ap-southeast-1.aws.neon.tech/jain_food?sslmode=require
   ```
3. **Copy this** - you'll need it later!

### Step 4: Run Migrations
1. In Neon dashboard, click **"SQL Editor"**
2. Copy and paste content from these files (in order):
   - `migrations/0001_init.up.sql`
   - `migrations/0002_order_code.up.sql`
   - `migrations/0003_orders_partitions_2026.up.sql`
   - `migrations/0004_orders_partitions_current.up.sql`
   - `migrations/0005_enhanced_features.up.sql`
3. Click **"Run"** for each file

✅ **Database Ready!**

---

## 3. Deploy Redis on Upstash

**Upstash** provides free serverless Redis.

### Step 1: Create Upstash Account
1. Go to https://upstash.com
2. Click **"Sign Up"** → Sign in with GitHub

### Step 2: Create Redis Database
1. Click **"Create Database"**
2. **Name:** `jainfood-redis`
3. **Type:** Regional
4. **Region:** Choose closest (e.g., `ap-south-1` for India)
5. Click **"Create"**

### Step 3: Get Connection Details
1. After creation, go to the **"Details"** tab
2. Copy these values:
   - **Endpoint:** `xxx.upstash.io:6379`
   - **Password:** `your-password`

3. Your Redis URL format:
   ```
   rediss://default:YOUR_PASSWORD@YOUR_ENDPOINT:6379
   ```

✅ **Redis Ready!**

---

## 4. Deploy Backend on Render

**Render** provides free web service hosting with 750 hours/month.

### Step 1: Create Render Account
1. Go to https://render.com
2. Click **"Get Started"** → Sign in with GitHub

### Step 2: Create Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Select **GetMeJainFood** repository

### Step 3: Configure Service
| Setting | Value |
|---------|-------|
| **Name** | `jainfood-api` |
| **Region** | Singapore (or closest) |
| **Branch** | `main` |
| **Root Directory** | _(leave empty)_ |
| **Runtime** | Docker |
| **Instance Type** | Free |

### Step 4: Add Environment Variables
Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

| Key | Value |
|-----|-------|
| `PORT` | `8080` |
| `DATABASE_URL` | `postgres://...` (from Neon) |
| `REDIS_ADDR` | `xxx.upstash.io:6379` |
| `REDIS_PASSWORD` | `your-upstash-password` |
| `JWT_SECRET` | `generate-a-random-32-char-string` |
| `OTP_SECRET` | `generate-another-random-32-char-string` |
| `GIN_MODE` | `release` |
| `NOTIFY_SERVICE` | `smsindiahub` |
| `SMSINDIAHUB_API_KEY` | Your SMS India Hub API key |
| `SMSINDIAHUB_SENDER_ID` | `JAINFO` |
| `SMSINDIAHUB_CHANNEL` | `Trans` |

### Step 5: Deploy
1. Click **"Create Web Service"**
2. Wait for build to complete (5-10 minutes)
3. Your API URL will be: `https://jainfood-api.onrender.com`

⚠️ **Note:** Free tier services sleep after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

✅ **Backend Ready!**

---

## 5. Deploy Frontend on Vercel

**Vercel** is the best free option for React apps.

### Step 1: Create Vercel Account
1. Go to https://vercel.com
2. Click **"Sign Up"** → Sign in with GitHub

### Step 2: Import Project
1. Click **"Add New..."** → **"Project"**
2. Find and select **GetMeJainFood** repository
3. Click **"Import"**

### Step 3: Configure Build Settings
| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `web` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add:

| Key | Value |
|-----|-------|
| `VITE_API_URL` | `https://jainfood-api.onrender.com` |
| `VITE_USE_MOCK_API` | `false` |

### Step 5: Deploy
1. Click **"Deploy"**
2. Wait for build (2-3 minutes)
3. Your app URL: `https://jainfood.vercel.app` (or similar)

✅ **Frontend Ready!**

---

## 6. Configure Environment Variables

### Generate Secure Secrets

Run this in PowerShell to generate random secrets:

```powershell
# Generate JWT Secret
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

# Generate OTP Secret
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
```

### Update Frontend API URL

Before deploying frontend, update the API base URL:

**Option 1:** Use environment variable (already done above)

**Option 2:** Update vite.config.ts for proxy:

```typescript
// web/vite.config.ts
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/v1': {
        target: 'https://jainfood-api.onrender.com',
        changeOrigin: true,
      },
    },
  },
})
```

---

## 7. Test Your Deployment

### 1. Test Backend Health
```powershell
# Check if API is running
Invoke-WebRequest -Uri "https://jainfood-api.onrender.com/health"
```

Expected response:
```json
{"status":"healthy","version":"1.0.0"}
```

### 2. Test SMS OTP
```powershell
# Send OTP
$body = @{phone="9876543210"} | ConvertTo-Json
Invoke-WebRequest -Uri "https://jainfood-api.onrender.com/v1/auth/send-otp" -Method POST -Body $body -ContentType "application/json"
```

### 3. Test Frontend
1. Open your Vercel URL in browser
2. Try the login flow
3. Register as a provider

---

## 8. Alternative: Deploy Everything on Railway

**Railway** is simpler but has limited free tier ($5 credit).

### One-Click Deploy
1. Go to https://railway.app
2. Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select your repository
5. Railway auto-detects and deploys!

### Add Services
1. Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Click **"+ New"** → **"Database"** → **"Add Redis"**
3. Railway automatically links them!

### Environment Variables
Railway auto-injects `DATABASE_URL` and `REDIS_URL`.

Just add:
- `JWT_SECRET`
- `OTP_SECRET`
- `NOTIFY_SERVICE=smsindiahub`
- `SMSINDIAHUB_API_KEY=your_api_key`
- etc.

---

## 9. Free Tier Limits Summary

| Service | Limit | What Happens When Exceeded |
|---------|-------|---------------------------|
| **Neon (PostgreSQL)** | 500MB storage | Upgrade required |
| **Upstash (Redis)** | 10K commands/day | Throttled |
| **Render (Backend)** | 750 hours/month, sleeps after 15min | Slow cold starts |
| **Vercel (Frontend)** | 100GB bandwidth | Upgrade required |

### Tips to Stay Within Free Limits:
1. Use Render's free tier wisely - it sleeps after inactivity
2. Cache frequently accessed data
3. Compress images before upload
4. Use lazy loading on frontend

---

## 10. Custom Domain (Optional)

### For Vercel (Frontend):
1. Go to Project Settings → Domains
2. Add your domain: `jainfood.yourdomain.com`
3. Update DNS records as shown

### For Render (Backend):
1. Go to Service Settings → Custom Domain
2. Add: `api.jainfood.yourdomain.com`
3. Update DNS records

### Free Domain Options:
- **Freenom:** Free .tk, .ml, .ga domains
- **GitHub Pages:** Free .github.io subdomain
- **Vercel:** Free .vercel.app subdomain

---

## 11. Monitoring & Logs

### Render Logs
1. Go to Render Dashboard
2. Click on your service
3. Click **"Logs"** tab

### Vercel Logs
1. Go to Vercel Dashboard
2. Click on your project
3. Click **"Deployments"** → **"Functions"** tab

### Upstash Redis Monitoring
1. Go to Upstash Dashboard
2. Click on your database
3. See **"Usage"** tab for metrics

---

## 12. Troubleshooting

### Backend Won't Start
```
Error: Required environment variable DATABASE_URL is not set
```
**Solution:** Ensure all environment variables are set in Render dashboard.

### Database Connection Failed
```
Error: connection refused
```
**Solution:** Check if Neon connection string includes `?sslmode=require`

### Redis Connection Failed
```
Error: NOAUTH Authentication required
```
**Solution:** For Upstash, you need to update the Redis client to support password auth.

### Frontend Can't Reach Backend
```
Error: Network Error / CORS
```
**Solution:** Ensure backend CORS allows your Vercel domain.

### SMS Not Sending
```
Error: SMS India Hub API error
```
**Solution:** Check API key and ensure phone number format is `91XXXXXXXXXX`

---

## 13. Quick Reference

### Your URLs (After Deployment)

| Service | URL |
|---------|-----|
| **Frontend** | `https://your-app.vercel.app` |
| **Backend API** | `https://jainfood-api.onrender.com` |
| **Health Check** | `https://jainfood-api.onrender.com/health` |

### Important Commands

```powershell
# Redeploy backend (after pushing to GitHub)
# Render auto-deploys on push!

# Redeploy frontend
# Vercel auto-deploys on push!

# View logs locally before deploy
docker compose -f docker/docker-compose.yml logs -f
```

---

## ✅ Deployment Checklist

- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Neon PostgreSQL database created
- [ ] Migrations run on Neon
- [ ] Upstash Redis created
- [ ] Render backend deployed
- [ ] Environment variables configured on Render
- [ ] Vercel frontend deployed
- [ ] Environment variables configured on Vercel
- [ ] Test login flow
- [ ] Test OTP SMS
- [ ] Test provider registration

---

## Need Help?

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **Neon Docs:** https://neon.tech/docs
- **Upstash Docs:** https://upstash.com/docs

---

**🎉 Congratulations! Your JainFood app is now live on the internet!**
