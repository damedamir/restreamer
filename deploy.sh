#!/bin/bash

# Restreamer Pro Deployment Script
# Run this on your server to deploy the application

echo "🚀 Starting Restreamer Pro Deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "📋 Please copy production.env.example to .env and update the values:"
    echo "   cp production.env.example .env"
    echo "   nano .env"
    exit 1
fi

# Load environment variables
source .env

# Check if SRS_CANDIDATE is set
if [ -z "$SRS_CANDIDATE" ]; then
    echo "❌ SRS_CANDIDATE not set in .env file!"
    echo "📋 Please set SRS_CANDIDATE to your server's public IP address"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "🌐 SRS Candidate IP: $SRS_CANDIDATE"
echo "🔗 API URL: $NEXT_PUBLIC_API_URL"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Test SRS API
echo "🧪 Testing SRS API..."
curl -s http://localhost:1985/api/v1/streams/ | head -c 100
echo ""

# Test frontend
echo "🧪 Testing frontend..."
curl -s http://localhost:3000 | head -c 100
echo ""

echo "✅ Deployment complete!"
echo "🌐 Frontend: https://hive.restreamer.website"
echo "📊 SRS API: https://hive.restreamer.website/srs-api/v1/streams/"
echo "🎥 RTMP URL: rtmp://hive.restreamer.website:1935/live"
echo "📺 HLS URL: https://hive.restreamer.website/live/[stream-key].m3u8"
echo ""
echo "📋 Next steps:"
echo "1. Configure your domain in Nginx"
echo "2. Set up SSL certificates"
echo "3. Update DNS records"
echo "4. Test streaming with OBS Studio"