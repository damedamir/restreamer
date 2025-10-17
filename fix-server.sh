#!/bin/bash

echo "🔧 Fixing server deployment issues..."

# Stop and remove orphan Traefik container
echo "🛑 Stopping orphan Traefik container..."
docker stop traefik 2>/dev/null || true
docker rm traefik 2>/dev/null || true

# Stop restreamer services
echo "🛑 Stopping restreamer services..."
docker compose down

# Remove orphan containers
echo "🧹 Removing orphan containers..."
docker compose down --remove-orphans

# Start services again
echo "🚀 Starting services with fixed configuration..."
docker compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "📊 Checking service status..."
docker compose ps

# Test API
echo "🔌 Testing API..."
curl -s https://restreamer.website/api/health

echo "✅ Server fix complete!"
