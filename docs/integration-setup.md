# GetMeJainFood - Integration Setup Guide

This guide covers setting up all external services for the JainFood application.

## Table of Contents
1. [SMS OTP (SMS India Hub - Recommended)](#1-sms-otp-sms-india-hub---recommended)
2. [SMS OTP (Textbelt - Alternative)](#2-sms-otp-textbelt---alternative)
3. [Payment Gateway (Razorpay)](#3-payment-gateway-razorpay)
4. [Push Notifications (Firebase FCM)](#4-push-notifications-firebase-fcm)
5. [CDN for Media](#5-cdn-for-media)
6. [SSL Certificates](#6-ssl-certificates)
7. [Email Service](#7-email-service-bonus)

---

## 1. SMS OTP (SMS India Hub - Recommended)

**URL:** https://cloud.smsindiahub.in/

SMS India Hub is an Indian SMS gateway that works well for OTP delivery.

### Quick Setup
Add to your `.env` file:
```env
NOTIFY_SERVICE=smsindiahub
SMSINDIAHUB_API_KEY=your_api_key_here
SMSINDIAHUB_SENDER_ID=JAINFO
SMSINDIAHUB_CHANNEL=Trans
```

### Configuration Options
| Variable | Description | Required |
|----------|-------------|----------|
| `SMSINDIAHUB_API_KEY` | Your API key | Yes |
| `SMSINDIAHUB_SENDER_ID` | 6-character sender ID (e.g., JAINFO) | Yes |
| `SMSINDIAHUB_CHANNEL` | `Trans` (transactional) or `Promo` (promotional) | Yes |
| `SMSINDIAHUB_ROUTE` | SMS route number | No |
| `SMSINDIAHUB_PEID` | Principal Entity ID for DLT | No |

### Testing SMS India Hub
```bash
# Test from terminal (PowerShell) - Replace YOUR_API_KEY
Invoke-WebRequest -Uri "https://cloud.smsindiahub.in/api/mt/SendSMS?APIKey=YOUR_API_KEY&senderid=JAINFO&channel=Trans&DCS=0&flashsms=0&number=919876543210&text=Your%20JainFood%20OTP%20is%20123456"

# Or using curl
curl "https://cloud.smsindiahub.in/api/mt/SendSMS?APIKey=YOUR_API_KEY&senderid=JAINFO&channel=Trans&DCS=0&flashsms=0&number=919876543210&text=Your%20JainFood%20OTP%20is%20123456"
```

### Response Format
```json
{
  "ErrorCode": "000",
  "ErrorMessage": "Done",
  "JobId": "20047",
  "MessageData": [
    {"Number": "919876543210", "MessageId": "mvHdpSyS7UOs9hjxixQLvw"}
  ]
}
```

---

## 2. SMS OTP (Textbelt - Alternative)

### Option A: Free Tier (1 SMS/day)
No setup required! Just set in your `.env`:
```env
NOTIFY_SERVICE=textbelt
TEXTBELT_API_KEY=textbelt
```

### Option B: Paid Tier ($0.005/SMS)
1. Go to https://textbelt.com/
2. Purchase an API key (starts at $1 for 200 SMS)
3. Set in your `.env`:
```env
NOTIFY_SERVICE=textbelt
TEXTBELT_API_KEY=your_purchased_key
```

### Testing Textbelt
```bash
# Test from terminal
curl -X POST https://textbelt.com/text \
  --data-urlencode phone='+919876543210' \
  --data-urlencode message='Test OTP: 123456' \
  -d key=textbelt
```

---

## 3. Payment Gateway (Razorpay)

### Step 1: Create Razorpay Account
1. Go to https://dashboard.razorpay.com/signup
2. Sign up with email and phone
3. Complete KYC (takes 1-2 days)

### Step 2: Get API Keys
1. Login to Razorpay Dashboard
2. Go to **Settings** → **API Keys**
3. Click **Generate Test Key** (for development)
4. Copy the Key ID and Key Secret

### Step 3: Configure Environment
```env
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 4: Frontend Integration
Add Razorpay checkout script to your web app:

```html
<!-- In index.html -->
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

### Razorpay Pricing
- **No setup fee**
- **2% per transaction** (standard)
- **1.99% for UPI** transactions
- Test mode is **completely free**

---

## 3. Push Notifications (Firebase FCM)

### Step 1: Create Firebase Project
1. Go to https://console.firebase.google.com/
2. Click **Add project**
3. Enter project name: `jainfood` (or your choice)
4. Disable Google Analytics (optional for dev)
5. Click **Create project**

### Step 2: Get Server Key
1. In Firebase Console, click ⚙️ (Settings) → **Project settings**
2. Go to **Cloud Messaging** tab
3. Copy the **Server key** (under Cloud Messaging API)

### Step 3: Configure Environment
```env
FCM_SERVER_KEY=AAAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
FCM_PROJECT_ID=jainfood-xxxxx
```

### Step 4: Frontend Setup (Optional)
For web push notifications, add Firebase to your frontend:

```bash
cd web
npm install firebase
```

Create `src/firebase.ts`:
```typescript
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "jainfood-xxxxx.firebaseapp.com",
  projectId: "jainfood-xxxxx",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export async function requestNotificationPermission() {
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const token = await getToken(messaging, {
      vapidKey: 'your-vapid-key'
    });
    return token;
  }
  return null;
}
```

### FCM Pricing
- **Completely FREE** - unlimited notifications!

---

## 4. CDN for Media

### Option A: ImageKit (Recommended for Free Tier)
**Free: 20GB bandwidth/month with image optimization**

1. Sign up at https://imagekit.io/
2. Get your URL endpoint from dashboard
3. Configure:
```env
CDN_TYPE=imagekit
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/your_id
```

### Option B: Cloudflare (Free with your domain)
1. Sign up at https://cloudflare.com
2. Add your domain
3. Enable caching rules
4. Configure:
```env
CDN_TYPE=cloudflare
CLOUDFLARE_CDN_URL=https://your-domain.com
```

### Option C: Bunny CDN (Very Cheap)
**$0.01/GB - very affordable**

1. Sign up at https://bunny.net
2. Create a Pull Zone
3. Point it to your S3/MinIO storage
4. Configure:
```env
CDN_TYPE=bunny
BUNNY_PULLZONE_URL=https://yourzone.b-cdn.net
BUNNY_IMAGE_OPTIMIZE=true
```

### CDN Pricing Comparison
| Service | Free Tier | Paid |
|---------|-----------|------|
| ImageKit | 20GB/month | $0.04/GB |
| Cloudflare | Unlimited* | Free with domain |
| Bunny | $1 credit | $0.01/GB |
| AWS CloudFront | 1TB/year (first year) | $0.085/GB |

---

## 5. SSL Certificates

### Option A: Let's Encrypt (Free, Recommended)
Use Certbot to get free SSL certificates:

```bash
# Install certbot (Ubuntu/Debian)
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Auto-renewal (add to cron)
0 0 1 * * certbot renew --quiet
```

### Option B: Cloudflare SSL (Free with Cloudflare)
If using Cloudflare:
1. Add your domain to Cloudflare
2. Go to SSL/TLS settings
3. Select "Full (strict)" mode
4. Done! Cloudflare provides free SSL

### Option C: AWS Certificate Manager (Free with AWS)
If deploying on AWS:
1. Go to AWS Certificate Manager
2. Request a public certificate
3. Validate via DNS or email
4. Attach to your load balancer

---

## 6. Email Service (Bonus)

### Option A: Resend (Recommended)
**Free: 3,000 emails/month**

1. Sign up at https://resend.com
2. Verify your domain
3. Get API key
4. Configure:
```env
NOTIFY_SERVICE=resend
RESEND_API_KEY=re_xxxxxxxxx
RESEND_FROM_EMAIL=noreply@your-domain.com
RESEND_TO_EMAIL=test@example.com
```

### Option B: Gmail SMTP (Free)
Use your Gmail with App Password:

1. Enable 2FA on your Google account
2. Go to https://myaccount.google.com/apppasswords
3. Create an app password for "Mail"
4. Configure:
```env
NOTIFY_SERVICE=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_TO_EMAIL=test@example.com
```

---

## Quick Start Checklist

### Development (Local)
- [ ] Copy `configs/.env.dev` to `.env` in root
- [ ] Start Docker services: `docker compose up -d`
- [ ] Run backend: `go run ./cmd/api`
- [ ] Run frontend: `cd web && npm run dev`

### Production Checklist
- [ ] Set up Razorpay account and get live keys
- [ ] Set up Firebase project for push notifications
- [ ] Purchase Textbelt API key or use MSG91
- [ ] Set up CDN (ImageKit or Cloudflare)
- [ ] Get SSL certificate (Let's Encrypt)
- [ ] Set `GIN_MODE=release` in production

### Environment Variables Summary
```env
# Core (Required)
DATABASE_URL=postgres://...
REDIS_ADDR=localhost:6379
JWT_SECRET=your-secure-secret
OTP_SECRET=your-secure-secret

# SMS/OTP (Choose one)
NOTIFY_SERVICE=textbelt
TEXTBELT_API_KEY=your-key

# Payment (Required for orders)
RAZORPAY_KEY_ID=rzp_xxx
RAZORPAY_KEY_SECRET=xxx

# Push Notifications (Optional but recommended)
FCM_SERVER_KEY=AAAAxxx
FCM_PROJECT_ID=your-project

# CDN (Optional but recommended)
CDN_TYPE=imagekit
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/xxx

# Production
GIN_MODE=release
```

---

## Support & Resources

- **Textbelt**: https://textbelt.com/
- **Razorpay Docs**: https://razorpay.com/docs/
- **Firebase FCM**: https://firebase.google.com/docs/cloud-messaging
- **ImageKit**: https://docs.imagekit.io/
- **Let's Encrypt**: https://letsencrypt.org/getting-started/
