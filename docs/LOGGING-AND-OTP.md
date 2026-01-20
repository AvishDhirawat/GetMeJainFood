# 🔧 JainFood - Logging, Debugging & OTP Configuration

## 📋 Viewing Logs

### Backend Logs (Go)
Backend logs are printed to the terminal where you run `go run ./cmd/api`.

```powershell
# Run with logs visible
go run ./cmd/api

# Example log output:
# {"level":"info","msg":"send-otp: request received","phone":"9876******","purpose":"register","env":"dev"}
# {"level":"info","msg":"send-otp: OTP included in response (dev mode)","otp":"123456"}
```

### Frontend Logs (React)
Open browser DevTools (F12) → Console tab to see frontend logs.

```javascript
// Example console output:
// [INFO] LoginPage: OTP API response {otp: "123456", cooldown: 30, dev_mode: true}
// [INFO] LoginPage: Dev OTP received {otp: "123456"}
```

### Network Requests
Open browser DevTools (F12) → Network tab to see API requests/responses.

---

## 🔐 OTP Configuration by Environment

### How OTP Display Works

| Environment | `APP_ENV` | OTP in UI | SMS Sent | Use Case |
|-------------|-----------|-----------|----------|----------|
| **Local** | `local` | ✅ Yes | ❌ No | Local development |
| **Dev** | `dev` | ✅ Yes | Optional | Remote dev server |
| **QA** | `qa` | ❌ No | ✅ Yes | Testing with real SMS |
| **Prod** | `prod` | ❌ No | ✅ Yes | Production |

### Environment Variables

```env
# APP_ENV controls the default behavior
APP_ENV=dev      # local, dev, qa, prod

# NOTIFY_SERVICE controls SMS provider
NOTIFY_SERVICE=console      # console (no SMS), smsindiahub, textbelt, etc.

# Override defaults (optional)
OTP_IN_RESPONSE=true        # Force show OTP in API response
OTP_IN_RESPONSE=false       # Force hide OTP
SEND_SMS=true               # Force send SMS
SEND_SMS=false              # Force disable SMS
```

---

## 🔄 Switching Between OTP Modes

### Mode 1: Dev Mode (OTP in UI, no SMS)
Best for local development - OTP shown in green box on screen.

```env
# .env file
APP_ENV=dev
NOTIFY_SERVICE=console
```

### Mode 2: Dev Mode with SMS
OTP shown in UI AND sent via SMS.

```env
# .env file
APP_ENV=dev
NOTIFY_SERVICE=smsindiahub
SMSINDIAHUB_API_KEY=d0e24cd50089410f87b127007235cdb5
SMSINDIAHUB_SENDER_ID=JAINFO
SMSINDIAHUB_CHANNEL=Trans
```

### Mode 3: Production Mode (SMS only)
OTP NOT shown in UI, only sent via SMS.

```env
# .env file
APP_ENV=prod
NOTIFY_SERVICE=smsindiahub
SMSINDIAHUB_API_KEY=your_api_key
SMSINDIAHUB_SENDER_ID=JAINFO
SMSINDIAHUB_CHANNEL=Trans
```

---

## ⏱️ OTP Cooldown Timer

- **30 seconds** between OTP requests (prevents spam)
- Timer shown in UI when cooldown is active
- Backend enforces cooldown via rate limiting

---

## 🐛 Debugging Common Issues

### Issue: OTP not showing in UI
**Cause:** `APP_ENV` is set to `qa` or `prod`
**Fix:** Set `APP_ENV=dev` or `OTP_IN_RESPONSE=true`

### Issue: SMS not being sent
**Cause:** `NOTIFY_SERVICE=console` or SMS API key not configured
**Fix:** Set `NOTIFY_SERVICE=smsindiahub` and configure API key

### Issue: "Failed to send OTP" error
**Check:**
1. Backend is running (`http://localhost:8080/health`)
2. Redis is connected (check backend logs)
3. Network tab shows API response

### Issue: Backend logs not showing
**Cause:** Logs are in JSON format
**Fix:** Look for `"msg":"..."` in the output, or pipe to `jq`:
```powershell
go run ./cmd/api 2>&1 | jq -r '.msg'
```

---

## 📊 API Response Examples

### Send OTP (Dev Mode)
```json
{
  "message": "otp_sent",
  "expires_in": 600,
  "cooldown": 30,
  "otp": "123456",
  "dev_mode": true,
  "sms_sent": false
}
```

### Send OTP (Prod Mode)
```json
{
  "message": "otp_sent",
  "expires_in": 600,
  "cooldown": 30
}
```

---

## 🚀 Quick Start Commands

```powershell
# Terminal 1: Start MinIO
cd docker && docker compose -f docker-compose.neon.yml up -d

# Terminal 2: Start Backend (logs visible here)
go run ./cmd/api

# Terminal 3: Start Frontend
cd web && npm run dev
```

Then open http://localhost:5173 and check:
- Browser DevTools Console (F12)
- Backend terminal for API logs
- Network tab for API requests
