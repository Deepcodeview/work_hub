#!/bin/bash
set -e

echo "🚀 Starting WorkHub deployment..."

cd /home/ubuntu/work_hub

echo "📥 Fetching latest code..."
git fetch origin main
git reset --hard origin/main

echo "📦 Installing packages..."
pnpm install --frozen-lockfile=false

echo "🗄️ Updating database schema..."
pnpm --filter @workhub/database db:generate
pnpm --filter @workhub/database db:deploy

echo "🔨 Building production assets..."
pnpm build

echo "🔄 Reloading application..."
pm2 reload workhub-api || pm2 start "pnpm --filter @workhub/api start:prod" --name "workhub-api"
pm2 reload workhub-web || pm2 start "pnpm --filter @workhub/web start" --name "workhub-web"
pm2 save

echo "🎉 Deployment successful!"
