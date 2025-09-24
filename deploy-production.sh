#!/bin/bash

# Production Deployment Script for Custom Restreamer
# This script deploys the complete WebRTC streaming system to production

set -e

echo "🚀 Starting production deployment..."

# Stop any existing containers
echo "📦 Stopping existing containers..."
docker-compose -f docker-compose.srs.yml down

# Remove old images to free up space
echo "🧹 Cleaning up old images..."
docker image prune -f

# Build and start services
echo "🔨 Building and starting services..."
docker-compose -f docker-compose.srs.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose -f docker-compose.srs.yml ps

# Test database connection
echo "🗄️ Testing database connection..."
docker exec custom-restreamer-backend-1 npx prisma db push

# Seed the database
echo "🌱 Seeding database..."
docker exec custom-restreamer-backend-1 npm run seed

# Test API endpoints
echo "🧪 Testing API endpoints..."
curl -f http://localhost:3001/api/health || echo "❌ Backend health check failed"
curl -f http://localhost:3000 || echo "❌ Frontend health check failed"
curl -f http://localhost:1985/api/v1/streams/ || echo "❌ SRS health check failed"

echo "✅ Production deployment completed!"
echo ""
echo "🌐 Services available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:3001"
echo "   SRS API: http://localhost:1985"
echo "   RTMP: rtmp://localhost:1935/live"
echo ""
echo "📊 To view logs:"
echo "   docker-compose -f docker-compose.srs.yml logs -f"
echo ""
echo "🎯 To test streaming:"
echo "   1. Open http://localhost:3000"
echo "   2. Login with admin credentials"
echo "   3. Create a branded URL"
echo "   4. Stream to rtmp://localhost:1935/live/YOUR_STREAM_KEY"
echo "   5. View your branded stream page"
