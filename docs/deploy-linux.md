# GetMeJainFood - Linux Server Deployment Guide

This guide covers secure deployment of the Jain Food App on Linux servers.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Quick Start](#local-development-quick-start)
3. [Server Preparation](#server-preparation)
4. [Secure Server Setup](#secure-server-setup)
5. [Application Deployment](#application-deployment)
6. [SSL/TLS Configuration](#ssltls-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Security Hardening](#security-hardening)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Local Development
- Docker Desktop
- Go 1.23+
- Node.js 20+
- Git

### Production Server
- Ubuntu 22.04 LTS (recommended) or similar
- Minimum 2 CPU, 4GB RAM, 50GB SSD
- Docker & Docker Compose v2
- Domain name with DNS configured

---

## Local Development Quick Start

### Option 1: Using PowerShell Script (Windows)

```powershell
# From project root, run:
.\run-local.ps1
```

This will:
1. Start PostgreSQL, Redis, and MinIO via Docker
2. Run the Go API on `http://localhost:8080`
3. Run the React frontend on `http://localhost:5173`

### Option 2: Manual Steps

**Step 1: Start Infrastructure**
```bash
cd docker
docker-compose up -d postgres redis minio
```

**Step 2: Wait for services & run migrations**
```bash
# Check services are healthy
docker-compose exec postgres pg_isready -U postgres
docker-compose exec redis redis-cli ping

# Migrations run automatically on first start via init scripts
```

**Step 3: Run Go Backend**
```bash
# From project root
go run ./cmd/api
# API available at http://localhost:8080/health
```

**Step 4: Run React Frontend**
```bash
cd web
npm install
npm run dev
# Frontend available at http://localhost:5173
```

### Verify Local Setup
```bash
# Health check
curl http://localhost:8080/health

# Expected response:
# {"status":"ok","timestamp":1737100000}
```

---

## Server Preparation

### Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    ufw \
    fail2ban \
    htop \
    git \
    unzip

# Create deploy user (non-root)
sudo adduser deploy
sudo usermod -aG sudo deploy

# Switch to deploy user
su - deploy
```

### Step 2: Install Docker

```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker deploy
newgrp docker

# Verify installation
docker --version
docker compose version
```

---

## Secure Server Setup

### Step 3: Configure Firewall (UFW)

```bash
# Enable UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if using non-standard)
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable
sudo ufw status verbose
```

### Step 4: Configure Fail2Ban (SSH Protection)

```bash
# Create jail configuration
sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 86400
EOF

# Restart fail2ban
sudo systemctl restart fail2ban
sudo systemctl enable fail2ban
```

### Step 5: SSH Hardening

```bash
# Edit SSH config
sudo nano /etc/ssh/sshd_config

# Recommended settings:
# PermitRootLogin no
# PasswordAuthentication no (after setting up SSH keys)
# MaxAuthTries 3
# ClientAliveInterval 300
# ClientAliveCountMax 2

# Restart SSH
sudo systemctl restart sshd
```

---

## Application Deployment

### Step 6: Clone & Configure Application

```bash
# Create app directory
sudo mkdir -p /opt/jainfood
sudo chown deploy:deploy /opt/jainfood
cd /opt/jainfood

# Clone repository
git clone https://github.com/yourusername/GetMeJainFood.git .

# Or upload your code via SCP:
# scp -r /path/to/GetMeJainFood deploy@your-server:/opt/jainfood/
```

### Step 7: Create Production Environment File

```bash
# Create secure .env file
cat > /opt/jainfood/.env.production << 'EOF'
# Production Configuration - KEEP SECURE!

PORT=8080

# Database - internal Docker network
DATABASE_URL=postgres://jain_food_user:YOUR_STRONG_DB_PASSWORD@postgres:5432/jain_food?sslmode=disable

# Redis - internal Docker network
REDIS_ADDR=redis:6379

# Security Keys - Generate with: openssl rand -base64 64
JWT_SECRET=YOUR_GENERATED_JWT_SECRET_HERE
OTP_SECRET=YOUR_GENERATED_OTP_SECRET_HERE

# Object Storage
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_ACCESS_KEY=YOUR_MINIO_ACCESS_KEY
S3_SECRET_KEY=YOUR_MINIO_SECRET_KEY
S3_BUCKET=jain-food-media

# Docker Compose variables
POSTGRES_USER=jain_food_user
POSTGRES_PASSWORD=YOUR_STRONG_DB_PASSWORD
POSTGRES_DB=jain_food

MINIO_ROOT_USER=YOUR_MINIO_ACCESS_KEY
MINIO_ROOT_PASSWORD=YOUR_MINIO_SECRET_KEY

GIN_MODE=release
EOF

# Generate secure secrets
echo "JWT_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
echo "OTP_SECRET=$(openssl rand -base64 64 | tr -d '\n')"
echo "POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -d '\n')"
echo "MINIO_SECRET=$(openssl rand -base64 32 | tr -d '\n')"

# Secure the file
chmod 600 /opt/jainfood/.env.production
```

### Step 8: Deploy with Docker Compose

```bash
cd /opt/jainfood/docker

# Build and start services
docker compose -f docker-compose.prod.yml --env-file ../.env.production up -d --build

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f api
```

### Step 9: Run Database Migrations (First Time Only)

```bash
# Copy migrations to postgres container and run
docker compose -f docker-compose.prod.yml exec postgres psql -U jain_food_user -d jain_food -f /docker-entrypoint-initdb.d/0001_init.up.sql
docker compose -f docker-compose.prod.yml exec postgres psql -U jain_food_user -d jain_food -f /docker-entrypoint-initdb.d/0002_order_code.up.sql
docker compose -f docker-compose.prod.yml exec postgres psql -U jain_food_user -d jain_food -f /docker-entrypoint-initdb.d/0003_orders_partitions_2026.up.sql
docker compose -f docker-compose.prod.yml exec postgres psql -U jain_food_user -d jain_food -f /docker-entrypoint-initdb.d/0004_orders_partitions_current.up.sql

# Verify
docker compose -f docker-compose.prod.yml exec postgres psql -U jain_food_user -d jain_food -c "\dt"
```

---

## SSL/TLS Configuration

### Step 10: Install Nginx & Certbot

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### Step 11: Configure Nginx Reverse Proxy

```bash
sudo tee /etc/nginx/sites-available/jainfood << 'EOF'
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (will be added by Certbot)
    # ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Frontend (React app)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API endpoints
    location /v1 {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # WebSocket for chat
    location /ws {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400;
    }

    # Health check endpoint (no rate limit)
    location /health {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

# Add rate limiting zone to nginx.conf
sudo sed -i '/http {/a \    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;' /etc/nginx/nginx.conf

# Enable site
sudo ln -s /etc/nginx/sites-available/jainfood /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 12: Obtain SSL Certificate

```bash
# Get certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
sudo certbot renew --dry-run
```

---

## Monitoring & Logging

### Step 13: Setup Log Rotation

```bash
sudo tee /etc/logrotate.d/jainfood << 'EOF'
/var/log/jainfood/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        docker kill -s USR1 $(docker ps -q --filter name=api) 2>/dev/null || true
    endscript
}
EOF
```

### Step 14: Health Check Script

```bash
# Create health check script
cat > /opt/jainfood/scripts/health-check.sh << 'EOF'
#!/bin/bash

API_URL="http://localhost:8080/health"
WEBHOOK_URL="" # Optional: Slack/Discord webhook

response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ "$response" != "200" ]; then
    echo "$(date): API health check failed with status $response"
    
    # Restart the service
    cd /opt/jainfood/docker
    docker compose -f docker-compose.prod.yml restart api
    
    # Optional: Send alert
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data '{"text":"⚠️ JainFood API health check failed. Restarting..."}' \
            $WEBHOOK_URL
    fi
fi
EOF

chmod +x /opt/jainfood/scripts/health-check.sh

# Add to crontab (run every 5 minutes)
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/jainfood/scripts/health-check.sh >> /var/log/jainfood/health-check.log 2>&1") | crontab -
```

---

## Backup & Recovery

### Step 15: Database Backup Script

```bash
mkdir -p /opt/jainfood/scripts
cat > /opt/jainfood/scripts/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/jainfood/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

mkdir -p $BACKUP_DIR

# Load environment variables
source /opt/jainfood/.env.production

# Backup PostgreSQL
docker compose -f /opt/jainfood/docker/docker-compose.prod.yml exec -T postgres \
    pg_dump -U $POSTGRES_USER $POSTGRES_DB | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Backup MinIO data (optional - if using local MinIO)
# docker compose -f /opt/jainfood/docker/docker-compose.prod.yml exec -T minio \
#     mc mirror /data $BACKUP_DIR/minio_$DATE/

# Remove old backups
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "$(date): Backup completed - db_$DATE.sql.gz"
EOF

chmod +x /opt/jainfood/scripts/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/jainfood/scripts/backup.sh >> /var/log/jainfood/backup.log 2>&1") | crontab -
```

### Step 16: Restore from Backup

```bash
# To restore database:
gunzip < /opt/jainfood/backups/db_YYYYMMDD_HHMMSS.sql.gz | \
    docker compose -f /opt/jainfood/docker/docker-compose.prod.yml exec -T postgres \
    psql -U jain_food_user jain_food
```

---

## Security Hardening

### Step 17: Additional Security Measures

```bash
# 1. Disable root login via SSH
sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart sshd

# 2. Setup automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades

# 3. Install and configure auditd
sudo apt install -y auditd
sudo systemctl enable auditd

# 4. Secure Docker daemon
sudo tee /etc/docker/daemon.json << 'EOF'
{
    "icc": false,
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "100m",
        "max-file": "10"
    },
    "live-restore": true
}
EOF
sudo systemctl restart docker

# 5. Set resource limits
cat >> /etc/security/limits.conf << 'EOF'
deploy soft nofile 65535
deploy hard nofile 65535
EOF
```

### Security Checklist

- [ ] Change default passwords in `.env.production`
- [ ] Generate unique JWT_SECRET and OTP_SECRET
- [ ] Disable SSH password authentication (use keys only)
- [ ] Configure UFW firewall
- [ ] Enable Fail2Ban
- [ ] Setup SSL/TLS with Certbot
- [ ] Enable automatic security updates
- [ ] Set up regular backups
- [ ] Configure log rotation
- [ ] Review and restrict CORS settings in production

---

## Troubleshooting

### Common Issues

**1. API not starting**
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs api

# Check if database is ready
docker compose -f docker-compose.prod.yml exec postgres pg_isready
```

**2. Database connection failed**
```bash
# Test database connection
docker compose -f docker-compose.prod.yml exec postgres psql -U jain_food_user -d jain_food -c "SELECT 1"

# Check environment variables
docker compose -f docker-compose.prod.yml exec api env | grep DATABASE
```

**3. Redis connection issues**
```bash
# Test Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli ping
```

**4. Frontend not loading**
```bash
# Check nginx logs
sudo tail -f /var/log/nginx/error.log

# Check web container
docker compose -f docker-compose.prod.yml logs web
```

**5. SSL certificate issues**
```bash
# Renew certificate manually
sudo certbot renew

# Check certificate expiry
sudo certbot certificates
```

### Useful Commands

```bash
# View all container logs
docker compose -f docker-compose.prod.yml logs -f

# Restart specific service
docker compose -f docker-compose.prod.yml restart api

# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove volumes (DANGER: destroys data)
docker compose -f docker-compose.prod.yml down -v

# Check container resource usage
docker stats

# Enter container shell
docker compose -f docker-compose.prod.yml exec api sh
```

---

## Deployment Workflow Summary

1. **Prepare server** - Install Docker, configure firewall, create deploy user
2. **Clone code** - Get the application code on the server
3. **Configure environment** - Create `.env.production` with secure secrets
4. **Deploy** - Run `docker compose -f docker-compose.prod.yml up -d --build`
5. **Configure SSL** - Setup Nginx reverse proxy with Certbot
6. **Setup monitoring** - Configure health checks and log rotation
7. **Setup backups** - Schedule daily database backups
8. **Test** - Verify all endpoints work correctly

---

## Quick Reference

| Service | Internal Port | External (Dev) | External (Prod) |
|---------|--------------|----------------|-----------------|
| API | 8080 | 8080 | via Nginx |
| Web | 80 | 3000 | via Nginx |
| PostgreSQL | 5432 | 5432 | Not exposed |
| Redis | 6379 | 6379 | Not exposed |
| MinIO | 9000/9001 | 9000/9001 | Not exposed |

---

*Last updated: January 2026*
