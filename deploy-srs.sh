#!/bin/bash

echo "🚀 Deploying Restreamer Pro with SRS (Simple Realtime Server)"
echo "============================================================="

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Remove old images to force rebuild
echo "🗑️  Removing old images..."
docker image prune -f

# Build and start with SRS
echo "🔨 Building and starting with SRS..."
docker-compose -f docker-compose.srs.yml up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check database
echo "📊 Checking database..."
docker exec custom-restreamer-postgres-1 pg_isready -U postgres

# Check backend
echo "🔧 Checking backend..."
curl -s http://localhost:3001/health | head -1

# Check frontend
echo "🎨 Checking frontend..."
curl -s http://localhost:3000 | head -1

# Check SRS
echo "📡 Checking SRS..."
curl -s http://localhost:1985/api/v1/versions | head -1

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Admin:    http://localhost:3000/admin"
echo "   Backend:  http://localhost:3001/health"
echo "   SRS API:  http://localhost:1985/api/v1/versions"
echo ""
echo "📡 RTMP Streaming:"
echo "   RTMP URL: rtmp://localhost:1935/live"
echo "   WebRTC:   ws://localhost:8000"
echo "   HLS:      http://localhost:8080/hls/[stream_key]/index.m3u8"
echo ""
echo "🔑 Create a configuration in the admin panel to get your stream key!"
echo ""
