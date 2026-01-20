# GetMeJainFood 🍛

A two-sided Jain-specific food discovery and ordering platform connecting buyers with food providers. Built with Go (backend) and React/TypeScript (frontend), focusing on strictly Jain dietary compliance, menu transparency, and seamless ordering experience.

## 🚀 Quick Start

### Development Mode (Cloud DB + Redis)
```powershell
# 1. Start MinIO (file storage)
cd docker && docker compose -f docker-compose.neon.yml up -d && cd ..

# 2. Run backend
go run ./cmd/api

# 3. Run frontend (new terminal)
cd web && npm run dev
```

**URLs:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8080
- MinIO: http://localhost:9001

### Using Helper Script
```powershell
.\start.ps1 -Mode dev      # Cloud DB + Upstash Redis
.\start.ps1 -Mode local    # All services in Docker
.\start.ps1 -Mode mock     # Frontend only (no backend)
.\start.ps1 -Action stop   # Stop all Docker services
```

📚 **Full documentation:** See [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)

---

## 🌟 Features

### For Buyers
- **Location-based Discovery** - Find Jain-compliant food providers near you
- **Advanced Filters** - Filter by dietary preferences (Sattvic, No Root Veggies, Pure Jain, etc.)
- **Provider Categories** - Browse by type (Tiffin Center, Caterer, Bhojnalaya, Restaurant, Home Chef, etc.)
- **Food Categories** - Search by food type (Thali, Sweets, Bakery, Namkeen, Dry Fruits, etc.)
- **Reviews & Ratings** - Read and write reviews for providers
- **Multi-language Support** - English & Hindi (हिन्दी) interface
- **Cart & Orders** - Easy ordering with OTP-based confirmation

### For Providers
- **Easy Onboarding** - 5-step registration with Aadhar verification
- **Menu Management** - Create and manage menus with real-time availability toggle
- **Order Management** - View and manage incoming orders
- **Dashboard** - Track orders, ratings, and performance

### For Admins
- **User Management** - View, block/unblock users
- **Provider Verification** - Verify and manage providers
- **Review Moderation** - Monitor and moderate reviews
- **Analytics Dashboard** - Platform overview and statistics

## 🛠 Tech Stack

### Backend (Go)
- **Framework:** Gin
- **Database:** PostgreSQL with PostGIS (geospatial queries)
- **Cache/Sessions:** Redis
- **Auth:** JWT + OTP (HMAC-SHA256)
- **Logging:** Zap
- **Object Storage:** S3-compatible (MinIO for dev)

### Frontend (React/TypeScript)
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Data Fetching:** TanStack Query
- **Animations:** Framer Motion
- **Icons:** Heroicons

### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Environments:** Development, QA, Production configs

## 📁 Project Structure

```
GetMeJainFood/
├── cmd/api/main.go           # API entry point & route definitions
├── internal/                  # Backend modules
│   ├── auth/                 # OTP generation & verification
│   ├── chat/                 # WebSocket chat
│   ├── db/                   # Database connection
│   ├── events/               # Event logging
│   ├── media/                # S3 file uploads
│   ├── menus/                # Menu & item management
│   ├── middleware/           # Auth, CORS, rate limiting
│   ├── models/               # Data models
│   ├── orders/               # Order management
│   ├── providers/            # Provider CRUD
│   ├── reviews/              # Review system
│   ├── search/               # Geo-based search
│   └── users/                # User management
├── migrations/               # SQL migrations
│   ├── 0001_init.up.sql
│   ├── 0002_order_code.up.sql
│   ├── 0003_orders_partitions_2026.up.sql
│   ├── 0004_orders_partitions_current.up.sql
│   └── 0005_enhanced_features.up.sql
├── web/                      # React frontend
│   ├── src/
│   │   ├── api/             # API client & mock data
│   │   ├── components/      # Reusable components
│   │   ├── layouts/         # Page layouts
│   │   ├── pages/           # Route pages
│   │   │   ├── admin/       # Admin dashboard pages
│   │   │   ├── buyer/       # Buyer pages (cart, orders, profile)
│   │   │   └── provider/    # Provider pages (dashboard, menus)
│   │   ├── store/           # Zustand stores
│   │   ├── types/           # TypeScript types
│   │   └── utils/           # Utilities
│   └── package.json
└── docker/                   # Docker compose files
```

## 🚀 Quick Start

### Prerequisites
- **Docker Desktop** (required)
- **Go 1.20+** (for local development)
- **Node.js 20+** (for local development)

### One-Command Start

```powershell
# Windows
.\run.ps1

# Or with local hot-reload
.\run.ps1 -Mode local
```

## 🌐 Deploy for Free

Deploy JainFood to the internet **completely free** using these services:

| Component | Service | Free Tier |
|-----------|---------|-----------|
| Backend | [Render.com](https://render.com) | 750 hours/month |
| Frontend | [Vercel](https://vercel.com) | Unlimited |
| Database | [Neon.tech](https://neon.tech) | 500MB |
| Redis | [Upstash](https://upstash.com) | 10K commands/day |

### Quick Deploy

1. **Push to GitHub** (if not already):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/GetMeJainFood.git
   git push -u origin main
   ```

2. **Deploy Backend** on Render:
   - Go to [render.com](https://render.com) → New Web Service
   - Connect your GitHub repo
   - Render auto-detects `render.yaml` configuration

3. **Deploy Frontend** on Vercel:
   - Go to [vercel.com](https://vercel.com) → Add New Project
   - Import your repo, set root directory to `web`
   - Add env var: `VITE_API_URL=https://your-api.onrender.com`

📚 **Full guide:** See [`docs/free-deployment-guide.md`](docs/free-deployment-guide.md)

### Manual Setup

1. **Clone & Configure**
```bash
git clone <repo>
cd GetMeJainFood
cp .env.example .env
# Edit .env with your configuration
```

2. **Start Services**
```powershell
# Docker mode (all services in containers)
.\run.ps1

# Local mode (infra in Docker, app runs natively)
.\run.ps1 -Mode local
```

3. **Access the App**
- Frontend: http://localhost:3000 (Docker) or http://localhost:5173 (Local)
- API: http://localhost:8080
- API Health: http://localhost:8080/health
- MinIO Console: http://localhost:9001

### Supported Languages
- **English (EN)** - Default
- **Hindi (हिन्दी)** - Full translation support

```powershell
.\run.ps1                              # Start dev environment
.\run.ps1 -Mode local                  # Start with hot-reload
.\run.ps1 -Action down                 # Stop all services
.\run.ps1 -Action logs                 # View logs
.\run.ps1 -Action status               # Check service status
.\run.ps1 -Action restart              # Restart services
.\run.ps1 -Environment qa              # Start QA environment
.\run.ps1 -Environment prod            # Start production
```

## 🌐 API Endpoints

### Authentication
```
POST /v1/auth/send-otp     - Send OTP to phone
POST /v1/auth/verify-otp   - Verify OTP & get JWT
```

### Users
```
GET  /v1/users/me          - Get current user profile
PUT  /v1/users/me          - Update profile
DELETE /v1/users/me        - Delete account (GDPR)
GET  /v1/users             - List users (admin)
POST /v1/users/:id/block   - Block user (admin)
POST /v1/users/:id/unblock - Unblock user (admin)
```

### Providers
```
GET  /v1/providers         - List providers
GET  /v1/providers/:id     - Get provider details
POST /v1/providers         - Create provider profile
PUT  /v1/providers/:id     - Update provider
POST /v1/providers/:id/verify - Verify provider (admin)
POST /v1/providers/:id/block  - Block provider (admin)
```

### Menus & Items
```
GET  /v1/menus/:id                    - Get menu
GET  /v1/menus/provider/:provider_id  - Get provider menus
POST /v1/menus                        - Create menu
PUT  /v1/menus/:id                    - Update menu
GET  /v1/menu-items/:id               - Get item
GET  /v1/menu-items/menu/:menu_id     - Get menu items
POST /v1/menu-items                   - Create item
PUT  /v1/menu-items/:id               - Update item
PATCH /v1/menu-items/:id/availability - Toggle availability
```

### Search
```
GET /v1/search/providers   - Search nearby providers
GET /v1/search/items       - Search menu items
```

### Orders
```
POST /v1/orders              - Create order
GET  /v1/orders/:id          - Get order
GET  /v1/orders/code/:code   - Get order by code
POST /v1/orders/:id/confirm-otp - Confirm with OTP
POST /v1/orders/:id/cancel   - Cancel order
POST /v1/orders/:id/complete - Mark complete
```

### Reviews
```
GET  /v1/reviews/provider/:id       - Get provider reviews
GET  /v1/reviews/provider/:id/stats - Get review statistics
POST /v1/reviews                    - Create review
GET  /v1/reviews/my                 - Get my reviews
DELETE /v1/reviews/:id              - Delete my review
DELETE /v1/reviews/:id/admin        - Delete review (admin)
```

### Media
```
POST /v1/media/upload-url   - Get presigned upload URL
POST /v1/media/download-url - Get presigned download URL
```

### Chat (WebSocket)
```
GET  /v1/chat/ws                    - WebSocket connection
POST /v1/chat                       - Create chat room
GET  /v1/chat/order/:order_id       - Get chat by order
GET  /v1/chat/:id/messages          - Get messages
```

## 🌍 Multi-Language Support

The app supports English and Hindi. Switch languages using the globe icon (🌐) in the header.

### Supported Languages
- **English (EN)** - Default
- **Hindi (हिन्दी)** - Full translation support

### Adding Translations

Edit `web/src/store/languageStore.ts`:

```typescript
const translations: Record<Language, Record<string, string>> = {
  en: {
    'key.name': 'English text',
    // ...
  },
  hi: {
    'key.name': 'हिन्दी टेक्स्ट',
    // ...
  },
}
```

Use in components:
```typescript
const { t, language } = useLanguageStore()
// t('key.name') returns translated text
// language === 'en' | 'hi'
```

## 📊 Database Schema

### Key Tables
- `users` - User accounts with roles (buyer, provider, admin)
- `providers` - Provider profiles with geo location
- `menus` - Provider menus
- `menu_items` - Individual menu items
- `orders` - Order records (partitioned by month)
- `reviews` - Provider reviews
- `chats` / `messages` - Chat rooms and messages
- `events` - Audit log for analytics

### Migrations
Located in `migrations/` folder, applied automatically on first container start.

## 🔒 Security

- **OTP Hashing** - OTPs are HMAC-SHA256 hashed before storage
- **JWT Auth** - Short-lived access tokens
- **Rate Limiting** - On OTP and auth endpoints
- **HTTPS** - Enforced in production
- **RBAC** - Role-based access control
- **CORS** - Configured for allowed origins

## 🐳 Docker Services

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

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | 8080 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_ADDR` | Redis address | localhost:6379 |
| `JWT_SECRET` | JWT signing key | - |
| `OTP_SECRET` | OTP HMAC key | - |
| `S3_ENDPOINT` | Object storage endpoint | - |
| `S3_ACCESS_KEY` | S3 access key | - |
| `S3_SECRET_KEY` | S3 secret key | - |
| `S3_BUCKET` | S3 bucket name | jain-food-media |

## 🧪 Development

### Running Tests
```bash
# Backend tests
go test ./...

# Frontend type check
cd web && npm run build
```

### Mock Mode
Set `VITE_USE_MOCK_API=true` in web/.env to use mock data without backend.

### Hot Reload
Use `.\run.ps1 -Mode local` for hot-reload development:
- Backend: Air for Go hot-reload
- Frontend: Vite dev server

## 📝 Roadmap

- [x] Auth & OTP system
- [x] Provider onboarding
- [x] Menu management
- [x] Geo-based search
- [x] Cart & orders
- [x] Reviews system
- [x] Admin dashboard
- [x] Multi-language support (English & Hindi)
- [ ] Push notifications
- [ ] Payment integration
- [ ] Delivery tracking
- [ ] Mobile app (React Native)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📄 License

For licensing, Contact @AvishDhirawat

---

Built with ❤️ for the Jain community

