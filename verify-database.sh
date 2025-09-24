#!/bin/bash

set -e

echo "🔍 Database Verification Script"
echo "=============================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run as root. Run as regular user."
    exit 1
fi

# Wait for postgres to be ready
echo "⏳ Waiting for postgres to be ready..."
docker-compose exec postgres pg_isready -U postgres

# Check all required tables
echo "🔍 Checking all required tables..."

TABLES=("users" "streams" "stream_configurations" "branded_urls" "stream_status" "viewers")

for table in "${TABLES[@]}"; do
    if docker-compose exec postgres psql -U postgres -d custom_restreamer -c "\d $table" > /dev/null 2>&1; then
        echo "✅ Table '$table' exists"
    else
        echo "❌ Table '$table' is missing"
    fi
done

# Show table structure
echo ""
echo "📋 Table structures:"
for table in "${TABLES[@]}"; do
    echo "--- $table ---"
    docker-compose exec postgres psql -U postgres -d custom_restreamer -c "\d $table" 2>/dev/null || echo "Table not found"
    echo ""
done

# Test all API endpoints
echo "🧪 Testing all API endpoints..."

# Test basic API
echo "Testing basic API..."
curl -f http://localhost:3001/health > /dev/null && echo "✅ Backend API working" || echo "❌ Backend API failed"

# Test admin dashboard
echo "Testing admin dashboard..."
curl -f http://localhost:3001/api/admin/dashboard > /dev/null && echo "✅ Admin dashboard working" || echo "❌ Admin dashboard failed"

# Test all admin endpoints
echo "Testing admin endpoints..."
curl -f http://localhost:3001/api/admin/streams > /dev/null && echo "✅ Admin streams working" || echo "❌ Admin streams failed"
curl -f http://localhost:3001/api/admin/users > /dev/null && echo "✅ Admin users working" || echo "❌ Admin users failed"

# Test streams endpoint
echo "Testing streams endpoint..."
curl -f http://localhost:3001/api/streams > /dev/null && echo "✅ Streams API working" || echo "❌ Streams API failed"

# Test auth endpoints
echo "Testing auth endpoints..."
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test123","name":"Test User"}' > /dev/null && echo "✅ Auth register working" || echo "❌ Auth register failed"

# Show final status
echo ""
echo "📊 Final status:"
docker-compose ps

echo ""
echo "🎉 Database verification complete!"
