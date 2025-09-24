#!/bin/bash

set -e

echo "🔧 Fixing HTTPS and Domain Access"
echo "================================="

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

# Stop nginx to free port 80 for certbot
echo "🛑 Stopping nginx for SSL certificate generation..."
docker-compose stop nginx

# Install certbot if not present
echo "📦 Installing certbot..."
sudo apt update
sudo apt install -y certbot

# Get SSL certificates
echo "🔐 Getting SSL certificates..."
sudo certbot certonly --standalone -d hive.restreamer.website --non-interactive --agree-tos --email damir.fatic@hotmail.com

# Verify certificates exist
if [ ! -f "/etc/letsencrypt/live/hive.restreamer.website/fullchain.pem" ]; then
    echo "❌ SSL certificate generation failed!"
    exit 1
fi

echo "✅ SSL certificates created successfully"

# Rebuild nginx with HTTPS configuration
echo "🔨 Rebuilding nginx with HTTPS configuration..."
docker-compose build nginx

# Start nginx
echo "🚀 Starting nginx with HTTPS..."
docker-compose up -d nginx

# Wait for nginx to start
echo "⏳ Waiting for nginx to start..."
sleep 10

# Test HTTPS
echo "🧪 Testing HTTPS connection..."
if curl -I https://hive.restreamer.website > /dev/null 2>&1; then
    echo "✅ HTTPS is working!"
    echo "🌐 Your application is available at: https://hive.restreamer.website"
    echo "👤 Admin panel: https://hive.restreamer.website/admin"
else
    echo "❌ HTTPS test failed. Checking nginx logs..."
    docker-compose logs nginx | tail -20
fi

# Show final status
echo "📊 Final status:"
docker-compose ps

echo ""
echo "🎉 HTTPS setup complete!"
echo "========================="
echo "Frontend: https://hive.restreamer.website"
echo "Admin: https://hive.restreamer.website/admin"
echo "API: https://hive.restreamer.website/api/health"
