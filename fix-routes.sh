#!/bin/bash

set -e

echo "🔧 Fixing Backend Routes"
echo "======================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run as root. Run as regular user."
    exit 1
fi

# Restart backend to pick up new routes
echo "🔄 Restarting backend to pick up new routes..."
docker-compose restart backend

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Test all API endpoints
echo "🧪 Testing all API endpoints..."

# Test basic API
curl -f http://localhost:3001/health > /dev/null && echo "✅ Backend API working" || echo "❌ Backend API failed"
curl -f http://localhost:3001/api/test > /dev/null && echo "✅ API test endpoint working" || echo "❌ API test endpoint failed"

# Test admin dashboard
curl -f http://localhost:3001/api/admin/dashboard > /dev/null && echo "✅ Admin dashboard working" || echo "❌ Admin dashboard failed"

# Test admin streams endpoint
curl -f http://localhost:3001/api/admin/streams > /dev/null && echo "✅ Admin streams working" || echo "❌ Admin streams failed"

# Test admin users endpoint
curl -f http://localhost:3001/api/admin/users > /dev/null && echo "✅ Admin users working" || echo "❌ Admin users failed"

# Test streams endpoint
curl -f http://localhost:3001/api/streams > /dev/null && echo "✅ Streams API working" || echo "❌ Streams API failed"

# Test auth endpoints
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d '{"email":"test2@example.com","password":"test123","name":"Test User 2"}' > /dev/null && echo "✅ Auth register working" || echo "❌ Auth register failed"

# Show final status
echo "📊 Final status:"
docker-compose ps

echo ""
echo "🎉 Routes fix complete!"
echo "======================"
echo "Backend API: http://localhost:3001/health"
echo "Admin API: http://localhost:3001/api/admin/dashboard"
echo "Frontend: http://localhost:3000"
echo "Admin Panel: http://localhost:3000/admin"
