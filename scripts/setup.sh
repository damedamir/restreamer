#!/bin/bash

# Custom Restreamer Setup Script
echo "🚀 Setting up Custom Restreamer..."

# Check if dependencies are installed
echo "🔍 Checking dependencies..."

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please run: ./scripts/install-dependencies.sh"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please run: ./scripts/install-dependencies.sh"
    exit 1
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    echo "💡 If you just installed Docker, you may need to logout and login again."
    exit 1
fi

# Check if user is in docker group
if ! groups $USER | grep -q docker; then
    echo "❌ User is not in docker group. Please run: ./scripts/install-dependencies.sh"
    echo "💡 After running the install script, logout and login again."
    exit 1
fi

echo "✅ All dependencies are installed and ready"

# Check if .env exists, if not create it
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.example .env
    
    # Generate random secrets
    WEBHOOK_SECRET=$(openssl rand -hex 32)
    JWT_SECRET=$(openssl rand -hex 32)
    
    # Update .env with generated secrets
    sed -i.bak "s/your-secret-key/$WEBHOOK_SECRET/g" .env
    sed -i.bak "s/your-jwt-secret/$JWT_SECRET/g" .env
    
    echo "✅ .env file created with secure random secrets"
else
    echo "✅ .env file already exists"
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please run: ./scripts/install-dependencies.sh"
    exit 1
fi

echo "🐳 Starting services with Docker Compose..."

# Start all services
docker-compose up -d --build

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
until docker-compose exec postgres pg_isready -U postgres; do
    echo "Waiting for database..."
    sleep 2
done

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec backend npx prisma db push

# Create default admin user
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
echo "🎉 Custom Restreamer is now running!"
echo ""
echo "📱 Access your application:"
echo "   Frontend: http://localhost:3000"
echo "   Admin Panel: http://localhost:3000/admin"
echo "   API Health: http://localhost:3001/health"
echo ""
echo "🔑 Default Admin Credentials:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo "📡 RTMP Streaming:"
echo "   Server: rtmp://localhost/live"
echo "   Stream Key: your-stream-slug"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
echo ""
echo "Happy streaming! 🎥"