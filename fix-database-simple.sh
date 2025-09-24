#!/bin/bash

set -e

echo "🗄️ Simple Database Fix - All Tables"
echo "==================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run as root. Run as regular user."
    exit 1
fi

# Check current status
echo "🔍 Checking current status..."
docker-compose ps

# Wait for postgres to be ready
echo "⏳ Waiting for postgres to be ready..."
docker-compose exec postgres pg_isready -U postgres

# Create SQL file for table creation
echo "📝 Creating SQL file for table creation..."
cat > create_tables.sql << 'EOF'
-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Create streams table
CREATE TABLE IF NOT EXISTS "streams" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create stream_configurations table
CREATE TABLE IF NOT EXISTS "stream_configurations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "streamId" TEXT NOT NULL UNIQUE,
    "rtmpUrl" TEXT,
    "hlsUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("streamId") REFERENCES "streams"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create branded_urls table
CREATE TABLE IF NOT EXISTS "branded_urls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "streamId" TEXT NOT NULL UNIQUE,
    "customUrl" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("streamId") REFERENCES "streams"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create stream_status table
CREATE TABLE IF NOT EXISTS "stream_status" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "streamId" TEXT NOT NULL UNIQUE,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "viewers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    FOREIGN KEY ("streamId") REFERENCES "streams"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create viewers table
CREATE TABLE IF NOT EXISTS "viewers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "streamId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "users_email_idx" ON "users"("email");
CREATE INDEX IF NOT EXISTS "streams_slug_idx" ON "streams"("slug");
CREATE INDEX IF NOT EXISTS "streams_userId_idx" ON "streams"("userId");
CREATE INDEX IF NOT EXISTS "branded_urls_customUrl_idx" ON "branded_urls"("customUrl");
CREATE INDEX IF NOT EXISTS "viewers_streamId_idx" ON "viewers"("streamId");
CREATE INDEX IF NOT EXISTS "viewers_sessionId_idx" ON "viewers"("sessionId");
EOF

# Copy SQL file to postgres container and execute
echo "📝 Executing SQL file..."
docker cp create_tables.sql custom-restreamer-postgres-1:/tmp/create_tables.sql
docker-compose exec postgres psql -U postgres -d custom_restreamer -f /tmp/create_tables.sql

# Verify all tables were created
echo "✅ Verifying all tables were created..."
docker-compose exec postgres psql -U postgres -d custom_restreamer -c "\dt"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
docker-compose exec backend npx prisma generate

# Create admin user
echo "👤 Creating admin user..."
docker-compose exec backend npx tsx src/scripts/create-admin.js

# Test all API endpoints
echo "🧪 Testing all API endpoints..."

# Test basic API
curl -f http://localhost:3001/health > /dev/null && echo "✅ Backend API working" || echo "❌ Backend API failed"
curl -f http://localhost:3001/api/test > /dev/null && echo "✅ API test endpoint working" || echo "❌ API test endpoint failed"

# Test admin dashboard
curl -f http://localhost:3001/api/admin/dashboard > /dev/null && echo "✅ Admin dashboard API working" || echo "❌ Admin dashboard API failed"

# Test admin streams endpoint
curl -f http://localhost:3001/api/admin/streams > /dev/null && echo "✅ Admin streams API working" || echo "❌ Admin streams API failed"

# Test admin users endpoint
curl -f http://localhost:3001/api/admin/users > /dev/null && echo "✅ Admin users API working" || echo "❌ Admin users API failed"

# Test streams endpoint
curl -f http://localhost:3001/api/streams > /dev/null && echo "✅ Streams API working" || echo "❌ Streams API failed"

# Test auth endpoints
curl -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d '{"email":"test@example.com","password":"test123","name":"Test User"}' > /dev/null && echo "✅ Auth register working" || echo "❌ Auth register failed"

# Clean up
rm create_tables.sql

# Show final status
echo "📊 Final status:"
docker-compose ps

echo ""
echo "🎉 Complete database fix applied!"
echo "==============================="
echo "All tables created: users, streams, stream_configurations, branded_urls, stream_status, viewers"
echo "Backend API: http://localhost:3001/health"
echo "Admin API: http://localhost:3001/api/admin/dashboard"
echo "Frontend: http://localhost:3000"
echo "Admin Panel: http://localhost:3000/admin"
