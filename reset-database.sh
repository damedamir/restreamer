#!/bin/bash

set -e

echo "🗄️ Resetting Database Completely"
echo "==============================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run as root. Run as regular user."
    exit 1
fi

# Stop all services
echo "🛑 Stopping all services..."
docker-compose down

# Remove database volume
echo "🗑️ Removing database volume..."
docker volume rm custom-restreamer_postgres_data 2>/dev/null || echo "Volume already removed"

# Start postgres only
echo "🚀 Starting postgres..."
docker-compose up -d postgres

# Wait for postgres to be ready
echo "⏳ Waiting for postgres to be ready..."
sleep 10
docker-compose exec postgres pg_isready -U postgres

# Start backend
echo "🚀 Starting backend..."
docker-compose up -d backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Run migrations
echo "📝 Running migrations..."
docker-compose exec backend npx prisma migrate deploy

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker-compose exec backend npx prisma generate

# Create admin user
echo "👤 Creating admin user..."
docker-compose exec backend npx tsx src/scripts/create-admin.js

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 15

# Test everything
echo "🧪 Testing all services..."
curl -f http://localhost:3001/health > /dev/null && echo "✅ Backend API working" || echo "❌ Backend API failed"
curl -f http://localhost:3000 > /dev/null && echo "✅ Frontend working" || echo "❌ Frontend failed"
curl -f http://localhost:3001/api/admin/dashboard > /dev/null && echo "✅ Admin dashboard working" || echo "❌ Admin dashboard failed"

# Show final status
echo "📊 Final status:"
docker-compose ps

echo ""
echo "🎉 Database reset complete!"
echo "========================="
echo "Backend API: http://localhost:3001/health"
echo "Admin API: http://localhost:3001/api/admin/dashboard"
echo "Frontend: http://localhost:3000"
echo "Admin Panel: http://localhost:3000/admin"
