# Running GetMeJainFood WITHOUT Docker

Run the app using natively installed PostgreSQL, Redis, and Go on Linux.

## Quick Start

```bash
chmod +x run-native-linux.sh
./run-native-linux.sh
```

## Manual Installation (Ubuntu/Debian)

### 1. Install Go 1.20+
```bash
wget https://go.dev/dl/go1.20.14.linux-amd64.tar.gz
sudo rm -rf /usr/local/go
sudo tar -C /usr/local -xzf go1.20.14.linux-amd64.tar.gz
echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
source ~/.bashrc
go version
```

### 2. Install Node.js 20+
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version
```

### 3. Install PostgreSQL + PostGIS
```bash
sudo apt install -y postgresql-15 postgresql-15-postgis-3
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Setup database
sudo -u postgres psql -c "CREATE DATABASE jain_food;"
sudo -u postgres psql -d jain_food -c "CREATE EXTENSION postgis;"

# Set a secure password for postgres user
export POSTGRES_PASSWORD="your_secure_password_here"
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$POSTGRES_PASSWORD';"
```

### 4. Install Redis
```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
redis-cli ping  # Should return PONG
```

### 5. Run Migrations
```bash
# Use the password you set above
export PGPASSWORD="$POSTGRES_PASSWORD"
psql -h localhost -U postgres -d jain_food -f migrations/0001_init.up.sql
psql -h localhost -U postgres -d jain_food -f migrations/0002_order_code.up.sql
psql -h localhost -U postgres -d jain_food -f migrations/0003_orders_partitions_2026.up.sql
psql -h localhost -U postgres -d jain_food -f migrations/0004_orders_partitions_current.up.sql
```

### 6. Start Application

**Terminal 1 - Backend:**
```bash
# Use the password you set above
export DATABASE_URL="postgres://postgres:$POSTGRES_PASSWORD@localhost:5432/jain_food?sslmode=disable"
export REDIS_ADDR="localhost:6379"
export JWT_SECRET="dev-secret"
export OTP_SECRET="dev-otp-secret"
go run ./cmd/api
```

**Terminal 2 - Frontend:**
```bash
cd web && npm install && npm run dev
```

## Access Points

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API | http://localhost:8080 |
| Health | http://localhost:8080/health |

---

## Production Setup (Systemd Services)

### Build Go Binary
```bash
go build -ldflags="-s -w" -o bin/jain-api ./cmd/api
```

### Create Environment File
```bash
sudo mkdir -p /opt/jainfood
sudo tee /opt/jainfood/.env << 'EOF'
PORT=8080
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/jain_food?sslmode=disable
REDIS_ADDR=localhost:6379
JWT_SECRET=YOUR_PRODUCTION_JWT_SECRET
OTP_SECRET=YOUR_PRODUCTION_OTP_SECRET
GIN_MODE=release
EOF
sudo chmod 600 /opt/jainfood/.env
```

### Create Systemd Service
```bash
sudo tee /etc/systemd/system/jainfood.service << 'EOF'
[Unit]
Description=JainFood API Server
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=deploy
WorkingDirectory=/opt/jainfood
EnvironmentFile=/opt/jainfood/.env
ExecStart=/opt/jainfood/bin/jain-api
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl start jainfood
sudo systemctl enable jainfood
sudo systemctl status jainfood
```

### Build Frontend for Production
```bash
cd web
npm install
npm run build
# Output is in web/dist/
```

### Nginx Configuration
```bash
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/jainfood << 'EOF'
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    root /opt/jainfood/web/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API
    location /v1 {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # WebSocket
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /health {
        proxy_pass http://127.0.0.1:8080;
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/jainfood /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Add SSL with Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## Troubleshooting

### PostgreSQL Connection Failed
```bash
# Check status
sudo systemctl status postgresql

# If "peer authentication failed", edit pg_hba.conf:
sudo nano /etc/postgresql/15/main/pg_hba.conf
# Change: local all postgres peer
# To:     local all postgres md5
sudo systemctl restart postgresql
```

### Redis Connection Failed
```bash
sudo systemctl status redis-server
redis-cli ping
```

### Check Logs
```bash
# API logs
journalctl -u jainfood -f

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-15-main.log

# Nginx logs
sudo tail -f /var/log/nginx/error.log
```
