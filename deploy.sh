#!/bin/bash

# Custom Restreamer - Simple Deployment Script
echo "🚀 Custom Restreamer - Simple Deployment"
echo "========================================"

# Check if domain is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your domain name"
    echo "Usage: ./deploy.sh yourdomain.com"
    echo "Example: ./deploy.sh hive.restreamer.website"
    exit 1
fi

DOMAIN=$1
echo "📝 Deploying for domain: $DOMAIN"

# Step 1: Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Creating from template..."
    cp env.example .env
    
    # Generate random secrets
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    JWT_SECRET=$(openssl rand -hex 32)
    
    # Update .env with generated secrets
    sed -i.bak "s/your-secret-key/$WEBHOOK_SECRET/g" .env
    sed -i.bak "s/your-jwt-secret/$JWT_SECRET/g" .env
    echo "✅ .env file created"
fi

# Step 2: Update .env for production
echo "🔧 Updating .env for production..."
sed -i.bak "s|CORS_ORIGIN=.*|CORS_ORIGIN=\"https://$DOMAIN\"|g" .env
sed -i.bak "s|PUBLIC_HLS_URL=.*|PUBLIC_HLS_URL=\"https://$DOMAIN/hls\"|g" .env
echo "✅ .env updated for domain: $DOMAIN"

# Step 3: Update docker-compose.yml for production
echo "🔧 Updating Docker Compose for production..."
sed -i.bak "s|CORS_ORIGIN=.*|CORS_ORIGIN=\"https://$DOMAIN\"|g" docker-compose.yml
sed -i.bak "s|PUBLIC_HLS_URL=.*|PUBLIC_HLS_URL=\"https://$DOMAIN/hls\"|g" docker-compose.yml
echo "✅ Docker Compose updated for domain: $DOMAIN"

# Step 4: Check if Docker is running
echo "🔍 Checking Docker status..."
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first:"
    echo "   sudo systemctl start docker"
    exit 1
fi
echo "✅ Docker is running"

# Step 5: Stop any existing services
echo "🛑 Stopping existing services..."
docker-compose down 2>/dev/null || true

# Step 6: Start services
echo "🚀 Starting services..."
docker-compose up -d --build

# Step 7: Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Step 8: Check service status
echo "🔍 Checking service status..."
docker-compose ps

# Step 9: Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose exec postgres pg_isready -U postgres 2>/dev/null; do
    echo "Waiting for database..."
    sleep 2
done

# Step 10: Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec backend npx prisma db push

# Step 11: Create default admin user
echo "👤 Creating default admin user..."
docker-compose exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const prisma = new PrismaClient();
  
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Admin user created: admin@example.com / admin123');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await prisma.\$disconnect();
  }
}

createAdmin();
"

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📱 Your application is now running:"
echo "   Frontend: http://$DOMAIN (or http://localhost:3000)"
echo "   Admin Panel: http://$DOMAIN/admin (or http://localhost:3000/admin)"
echo "   API Health: http://$DOMAIN/api/health (or http://localhost:3001/health)"
echo ""
echo "🔑 Admin Credentials:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo "📡 RTMP Streaming:"
echo "   Server: rtmp://$DOMAIN/live"
echo "   Stream Key: your-stream-slug"
echo ""
echo "🌐 Stream URLs:"
echo "   https://$DOMAIN/stream/your-stream-slug"
echo ""
echo "📋 Next steps:"
echo "1. Point your domain DNS to this server's IP address"
echo "2. Get SSL certificate:"
echo "   sudo certbot certonly --standalone -d $DOMAIN"
echo "3. Restart services:"
echo "   docker-compose down && docker-compose up -d"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
echo ""
echo "Happy streaming! 🎥"
