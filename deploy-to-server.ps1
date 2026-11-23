# ==============================================================================
# WorkHub - 1-Click Deploy to AWS Production Server (65.2.11.186)
# ==============================================================================
param(
    [string]$ServerIP = "65.2.11.186",
    [string]$KeyPath = "..\lightsail_key.pem"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $KeyPath)) {
    if (Test-Path ".\lightsail_key.pem") {
        $KeyPath = ".\lightsail_key.pem"
    } elseif (Test-Path "..\mumbai_key.pem") {
        $KeyPath = "..\mumbai_key.pem"
    } elseif (Test-Path ".\mumbai_key.pem") {
        $KeyPath = ".\mumbai_key.pem"
    }
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "🚀 Deploying WorkHub to Production Server: $ServerIP" -ForegroundColor Cyan
Write-Host "🔑 Using SSH Key: $KeyPath" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# Step 1: Push local git commits
Write-Host "📥 Pushing local commits to GitHub..." -ForegroundColor Yellow
git push origin main

# Step 2: Run remote update, build, and zero-downtime PM2 reload
Write-Host "🔄 Pulling on server, building, and reloading PM2..." -ForegroundColor Yellow
& ssh -i $KeyPath -o StrictHostKeyChecking=no ubuntu@$ServerIP "export PATH='/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.local/share/pnpm:$PATH' && export NODE_ENV=production && cd /home/ubuntu/work_hub && git fetch --prune origin main && git reset --hard origin/main && cp -f .env packages/database/.env 2>/dev/null || true && cp -f .env apps/api/.env 2>/dev/null || true && cd packages/database && npx prisma generate && npx prisma db push && cd /home/ubuntu/work_hub && pnpm build && pm2 reload all && pm2 status"

Write-Host "==========================================================" -ForegroundColor Green
Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
Write-Host "🌐 Live Web: http://$ServerIP" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
