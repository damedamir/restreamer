#!/bin/bash
set -e

# Setup default configuration
# Improved version — safer and more reliable

echo "🔧 Setting up default configuration..."

# --- CONFIGURATION ---
BACKEND_CONTAINER="restreamer-backend"
HEALTH_ENDPOINT="http://localhost:3000/health"
ADMIN_EMAIL="admin@restreamer.website"
ADMIN_PASS="admin123"

echo "📦 Using container: $BACKEND_CONTAINER"
echo "👤 Admin: $ADMIN_EMAIL"
echo "🔑 Password: $ADMIN_PASS"

# --- WAIT FOR BACKEND ---
echo "⏳ Waiting for backend to be ready..."
ATTEMPTS=0
MAX_ATTEMPTS=20
until docker exec "$BACKEND_CONTAINER" curl -sf "$HEALTH_ENDPOINT" >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "❌ Backend not ready after $MAX_ATTEMPTS attempts. Exiting."
    exit 1
  fi
  echo "   ⏱️ Attempt $ATTEMPTS/$MAX_ATTEMPTS — backend not ready yet..."
  sleep 5
done
echo "✅ Backend is up!"

# --- CREATE DATABASE SCHEMA ---
echo "🗄️  Creating database schema..."
docker exec "$BACKEND_CONTAINER" npx prisma db push

# --- WAIT A MOMENT ---
sleep 3

# --- CREATE DEFAULT ADMIN USER ---
echo "👤 Creating default admin user..."
docker exec "$BACKEND_CONTAINER" node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

(async () => {
  const prisma = new PrismaClient();
  try {
    const hashedPassword = await bcrypt.hash('${ADMIN_PASS}', 12);
    await prisma.user.upsert({
      where: { email: '${ADMIN_EMAIL}' },
      update: {},
      create: {
        id: 'admin-1',
        email: '${ADMIN_EMAIL}',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
    console.log('✅ Admin user created or verified: ${ADMIN_EMAIL}');
    console.log('🔑 Password: ${ADMIN_PASS}');
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
"

echo "🎉 Setup complete!"
