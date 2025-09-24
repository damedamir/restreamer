#!/bin/bash

set -e

echo "🔍 Debugging Backend Routes"
echo "=========================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run as root. Run as regular user."
    exit 1
fi

# Check backend logs
echo "📋 Checking backend logs..."
docker-compose logs backend | tail -20

# Check if admin routes file exists in container
echo "🔍 Checking if admin routes exist in container..."
docker-compose exec backend ls -la /app/src/routes/

# Check the content of admin routes
echo "📄 Checking admin routes content..."
docker-compose exec backend cat /app/src/routes/admin.ts | head -20

# Test specific endpoints with verbose output
echo "🧪 Testing endpoints with verbose output..."

echo "Testing /api/admin/dashboard:"
curl -v http://localhost:3001/api/admin/dashboard 2>&1 | head -10

echo ""
echo "Testing /api/admin/streams:"
curl -v http://localhost:3001/api/admin/streams 2>&1 | head -10

echo ""
echo "Testing /api/admin/users:"
curl -v http://localhost:3001/api/admin/users 2>&1 | head -10

# Check what routes are actually registered
echo "🔍 Checking registered routes..."
docker-compose exec backend cat /app/src/index.ts | grep -A 10 -B 5 "admin"

# Show final status
echo "📊 Final status:"
docker-compose ps
