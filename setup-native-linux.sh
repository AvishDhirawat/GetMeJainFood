 #!/bin/bash
# =============================================================================
# GetMeJainFood - Install Dependencies (Ubuntu/Debian)
# =============================================================================
# This script installs all required dependencies for running without Docker
# =============================================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}========================================"
echo "  GetMeJainFood - Dependency Installer  "
echo -e "========================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo -e "${RED}Please don't run as root. The script will use sudo when needed.${NC}"
    exit 1
fi

# Detect package manager
if command -v apt &> /dev/null; then
    PKG_MANAGER="apt"
elif command -v dnf &> /dev/null; then
    PKG_MANAGER="dnf"
elif command -v yum &> /dev/null; then
    PKG_MANAGER="yum"
else
    echo -e "${RED}Unsupported package manager. Please install dependencies manually.${NC}"
    exit 1
fi

echo -e "${YELLOW}Detected package manager: $PKG_MANAGER${NC}"
echo ""

# =============================================================================
# UPDATE SYSTEM
# =============================================================================
echo -e "${YELLOW}[1/6] Updating system packages...${NC}"
sudo $PKG_MANAGER update -y

# =============================================================================
# INSTALL GO
# =============================================================================
echo ""
echo -e "${YELLOW}[2/6] Installing Go 1.20...${NC}"

if command -v go &> /dev/null; then
    GO_VERSION=$(go version | grep -oP '\d+\.\d+' | head -1)
    echo -e "${GREEN}Go already installed (version $GO_VERSION)${NC}"
else
    GO_VERSION="1.20.14"
    wget -q "https://go.dev/dl/go${GO_VERSION}.linux-amd64.tar.gz" -O /tmp/go.tar.gz
    sudo rm -rf /usr/local/go
    sudo tar -C /usr/local -xzf /tmp/go.tar.gz
    rm /tmp/go.tar.gz

    # Add to PATH
    if ! grep -q '/usr/local/go/bin' ~/.bashrc; then
        echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc
    fi
    export PATH=$PATH:/usr/local/go/bin

    echo -e "${GREEN}Go ${GO_VERSION} installed${NC}"
fi

# =============================================================================
# INSTALL NODE.JS
# =============================================================================
echo ""
echo -e "${YELLOW}[3/6] Installing Node.js 20...${NC}"

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}Node.js already installed ($NODE_VERSION)${NC}"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    echo -e "${GREEN}Node.js installed${NC}"
fi

# =============================================================================
# INSTALL POSTGRESQL
# =============================================================================
echo ""
echo -e "${YELLOW}[4/6] Installing PostgreSQL 15 with PostGIS...${NC}"

if command -v psql &> /dev/null; then
    echo -e "${GREEN}PostgreSQL already installed${NC}"
else
    if [ "$PKG_MANAGER" = "apt" ]; then
        sudo apt install -y postgresql-15 postgresql-contrib-15 postgresql-15-postgis-3
    fi
fi

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Setup database
echo "  Setting up database..."
sudo -u postgres psql -c "CREATE DATABASE jain_food;" 2>/dev/null || echo "  Database may already exist"
sudo -u postgres psql -d jain_food -c "CREATE EXTENSION IF NOT EXISTS postgis;" 2>/dev/null || true

# Set password from environment variable or prompt
if [ -n "$POSTGRES_PASSWORD" ]; then
    sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$POSTGRES_PASSWORD';" 2>/dev/null || true
else
    echo -e "${YELLOW}  Note: Set POSTGRES_PASSWORD env var to configure the postgres password${NC}"
    echo -e "${YELLOW}  Example: export POSTGRES_PASSWORD=your_secure_password${NC}"
fi

echo -e "${GREEN}PostgreSQL configured${NC}"

# =============================================================================
# INSTALL REDIS
# =============================================================================
echo ""
echo -e "${YELLOW}[5/6] Installing Redis...${NC}"

if command -v redis-cli &> /dev/null; then
    echo -e "${GREEN}Redis already installed${NC}"
else
    sudo apt install -y redis-server
fi

sudo systemctl start redis-server
sudo systemctl enable redis-server

echo -e "${GREEN}Redis configured${NC}"

# =============================================================================
# RUN MIGRATIONS
# =============================================================================
echo ""
echo -e "${YELLOW}[6/6] Running database migrations...${NC}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Use POSTGRES_PASSWORD from environment or default empty (peer auth)
export PGPASSWORD="${POSTGRES_PASSWORD:-}"
for migration in migrations/*.up.sql; do
    if [ -f "$migration" ]; then
        echo "  Applying: $(basename "$migration")"
        psql -h localhost -U postgres -d jain_food -f "$migration" > /dev/null 2>&1 || true
    fi
done

echo -e "${GREEN}Migrations applied${NC}"

# =============================================================================
# SUMMARY
# =============================================================================
echo ""
echo -e "${CYAN}========================================"
echo "  Installation Complete!               "
echo -e "========================================${NC}"
echo ""
echo "Installed:"
echo -e "  ${GREEN}✓${NC} Go $(go version | grep -oP 'go\d+\.\d+\.\d+' || echo '1.20')"
echo -e "  ${GREEN}✓${NC} Node.js $(node --version)"
echo -e "  ${GREEN}✓${NC} PostgreSQL with PostGIS"
echo -e "  ${GREEN}✓${NC} Redis"
echo -e "  ${GREEN}✓${NC} Database 'jain_food' created"
echo ""
echo "Next steps:"
echo -e "  1. ${YELLOW}source ~/.bashrc${NC}  (to update PATH)"
echo -e "  2. ${YELLOW}./run-native-linux.sh${NC}  (to start the app)"
echo ""
echo "Or run manually:"
echo "  Terminal 1: go run ./cmd/api"
echo "  Terminal 2: cd web && npm install && npm run dev"
echo ""
