#!/bin/bash

set -e

echo "🚀 Complete Application Fix"
echo "=========================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run as root. Run as regular user."
    exit 1
fi

# Update the repository
echo "📁 Updating repository..."
git pull origin main

# Check current status
echo "🔍 Checking current status..."
docker-compose ps

# Fix database first
echo "🗄️ Setting up database..."
docker-compose exec postgres pg_isready -U postgres
docker-compose exec backend npx prisma migrate deploy
docker-compose exec backend npx prisma generate
docker-compose exec backend npx tsx src/scripts/create-admin.js

# Fix HTTPS
echo "🔐 Setting up HTTPS..."
docker-compose stop nginx
sudo certbot certonly --standalone -d hive.restreamer.website --non-interactive --agree-tos --email damir.fatic@hotmail.com
docker-compose build nginx
docker-compose up -d nginx

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 15

# Test everything
echo "🧪 Testing all services..."
curl -f http://localhost:3001/health > /dev/null && echo "✅ Backend API working" || echo "❌ Backend API failed"
curl -f http://localhost:3000 > /dev/null && echo "✅ Frontend working" || echo "❌ Frontend failed"
curl -f https://hive.restreamer.website > /dev/null && echo "✅ HTTPS working" || echo "❌ HTTPS failed"

# Show final status
echo "📊 Final status:"
docker-compose ps

echo ""
echo "🎉 Complete fix applied!"
echo "======================="
echo "Frontend: https://hive.restreamer.website"
echo "Admin: https://hive.restreamer.website/admin"
echo "API: https://hive.restreamer.website/api/health"
