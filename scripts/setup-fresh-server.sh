#!/usr/bin/env bash
# ==============================================================================
# WorkHub - Fresh Server Automated Setup Script (Ubuntu 22.04 / 24.04 LTS)
# ==============================================================================
set -euo pipefail

echo "=========================================================="
echo "🚀 WorkHub Production Setup on Fresh Server"
echo "=========================================================="

# Check root or sudo
if [ "$EUID" -ne 0 ]; then
  echo "⚠️  Please run this script with sudo or as root: sudo bash $0"
  exit 1
fi

TARGET_USER="${SUDO_USER:-ubuntu}"
TARGET_HOME=$(eval echo "~$TARGET_USER")
APP_DIR="$TARGET_HOME/work_hub"
DB_PASS=$(openssl rand -hex 16)
JWT_ACCESS_SECRET=$(openssl rand -hex 32)
JWT_REFRESH_SECRET=$(openssl rand -hex 32)

echo "📌 Deploying for user: $TARGET_USER in $APP_DIR"

# 1. Update system packages
echo "📦 Updating system packages..."
apt-get update -y && apt-get upgrade -y
apt-get install -y curl wget git build-essential ufw nginx redis-server postgresql postgresql-contrib openssl

# 2. Configure Redis
echo "⚡ Configuring Redis..."
systemctl enable redis-server
systemctl start redis-server

# 3. Configure PostgreSQL
echo "🐘 Configuring PostgreSQL..."
systemctl enable postgresql
systemctl start postgresql

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'workhub'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE USER workhub WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "ALTER USER workhub WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'workhub'" | grep -q 1 || \
sudo -u postgres psql -c "CREATE DATABASE workhub OWNER workhub;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE workhub TO workhub;"

# 4. Install Node.js 20.x & pnpm & PM2
echo "🟢 Installing Node.js 20 LTS, pnpm, and PM2..."
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

npm install -g pnpm pm2
pm2 startup systemd -u "$TARGET_USER" --hp "$TARGET_HOME" || true

# 5. Clone repository
echo "📥 Cloning WorkHub repository..."
if [ -d "$APP_DIR" ]; then
  echo "Directory $APP_DIR already exists. Pulling latest main..."
  cd "$APP_DIR"
  sudo -u "$TARGET_USER" git fetch origin main
  sudo -u "$TARGET_USER" git reset --hard origin/main
else
  sudo -u "$TARGET_USER" git clone https://github.com/Deepcodeview/work_hub.git "$APP_DIR"
  cd "$APP_DIR"
fi

# 6. Create production .env
echo "🔐 Generating production environment variables..."
PUBLIC_IP=$(curl -s ifconfig.me || echo "localhost")

cat <<EOF > "$APP_DIR/.env"
NODE_ENV=production
APP_NAME=WorkHub
APP_URL=http://$PUBLIC_IP
WEB_URL=http://$PUBLIC_IP
API_URL=http://$PUBLIC_IP/api/v1
PORT=4000

DATABASE_URL="postgresql://workhub:$DB_PASS@localhost:5432/workhub?schema=public"
REDIS_URL="redis://localhost:6379"

# Object Storage
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_REGION=us-east-1
STORAGE_BUCKET=workhub-prod
STORAGE_ACCESS_KEY=workhub_storage
STORAGE_SECRET_KEY=$(openssl rand -hex 16)
STORAGE_FORCE_PATH_STYLE=true

# Security Secrets
JWT_ACCESS_SECRET=$JWT_ACCESS_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
EOF

chown "$TARGET_USER:$TARGET_USER" "$APP_DIR/.env"
cp -f "$APP_DIR/.env" "$APP_DIR/packages/database/.env"
cp -f "$APP_DIR/.env" "$APP_DIR/apps/api/.env"
chown "$TARGET_USER:$TARGET_USER" "$APP_DIR/packages/database/.env" "$APP_DIR/apps/api/.env"

# 7. Install dependencies
echo "📦 Installing workspace dependencies..."
cd "$APP_DIR"
sudo -u "$TARGET_USER" pnpm install --frozen-lockfile=false

# 8. Run Prisma Database Push and Seed Clean Admin
echo "🗄️ Setting up database schema and clean admin account..."
cd "$APP_DIR/packages/database"
sudo -u "$TARGET_USER" npx prisma generate
sudo -u "$TARGET_USER" npx prisma db push

echo "🌱 Seeding default clean admin account..."
cd "$APP_DIR/apps/api"
sudo -u "$TARGET_USER" npx ts-node src/seed.ts || true

# 9. Build API & Web
echo "🔨 Building API and Web frontend..."
cd "$APP_DIR"
sudo -u "$TARGET_USER" pnpm run build

# 10. Start PM2 Services
echo "🚀 Starting PM2 processes..."
sudo -u "$TARGET_USER" pm2 delete all || true
cd "$APP_DIR"
sudo -u "$TARGET_USER" pm2 start "pnpm --filter @workhub/api start:prod" --name "workhub-api"
sudo -u "$TARGET_USER" pm2 start "pnpm --filter @workhub/web start" --name "workhub-web"
sudo -u "$TARGET_USER" pm2 save

# 11. Configure Nginx Reverse Proxy
echo "🌐 Configuring Nginx reverse proxy..."
cat << 'EOF' > /etc/nginx/sites-available/workhub
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    # API Backend Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSockets / Socket.io
    location /socket.io/ {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js Web Frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

ln -sf /etc/nginx/sites-available/workhub /etc/nginx/sites-enabled/workhub
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

echo "=========================================================="
echo "🎉 WorkHub Successfully Deployed on Fresh Server!"
echo "=========================================================="
echo "🌐 Web Access: http://$PUBLIC_IP"
echo "🔑 Default Clean Admin Credentials:"
echo "   Email:    admin@workhub.internal"
echo "   Password: Password123!"
echo "=========================================================="
