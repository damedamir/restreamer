#!/bin/bash

# Custom Restreamer Local Test Script
echo "🧪 Testing Custom Restreamer locally..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down -v

# Start only database first
echo "🗄️ Starting database..."
docker-compose up -d postgres

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is ready
until docker-compose exec postgres pg_isready -U postgres; do
    echo "Waiting for database..."
    sleep 2
done

echo "✅ Database is ready!"

# Start backend
echo "🚀 Starting backend..."
docker-compose up -d backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 15

# Check backend health
echo "🔍 Checking backend health..."
curl -f http://localhost:3001/health || echo "Backend not ready yet"

# Start frontend
echo "🎨 Starting frontend..."
docker-compose up -d frontend

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
sleep 10

# Start nginx
echo "🌐 Starting nginx..."
docker-compose up -d nginx

# Wait for nginx to be ready
echo "⏳ Waiting for nginx to be ready..."
sleep 5

# Check all services
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "🎉 Local test setup complete!"
echo ""
echo "📱 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Admin Panel: http://localhost:3000/admin"
echo "   API Health: http://localhost:3001/health"
echo ""
echo "📡 RTMP Streaming:"
echo "   Server: rtmp://localhost/live"
echo "   Stream Key: test-stream"
echo ""
echo "🔍 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
echo ""
echo "Happy testing! 🎥"
