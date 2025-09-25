#!/bin/bash

echo "🚀 Setting up production database..."

# Check if we're on the production server
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ This script must be run on the production server"
    exit 1
fi

# Stop backend to prevent conflicts
echo "⏹️ Stopping backend..."
docker compose -f docker-compose.prod.yml stop backend

# Wait for backend to stop
sleep 5

# Run Prisma migrations
echo "🔄 Running Prisma migrations..."
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Check if tables exist
echo "🔍 Checking if tables exist..."
TABLES_EXIST=$(docker compose -f docker-compose.prod.yml exec postgres psql -U restreamer -d restreamer -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$TABLES_EXIST" -eq "0" ]; then
    echo "📊 No tables found, creating database schema..."
    
    # Create database schema
    docker compose -f docker-compose.prod.yml exec backend npx prisma db push
    
    echo "✅ Database schema created"
else
    echo "✅ Tables already exist ($TABLES_EXIST tables found)"
fi

# Create default admin user
echo "👤 Creating default admin user..."
docker compose -f docker-compose.prod.yml exec backend node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function createAdmin() {
    const prisma = new PrismaClient();
    
    try {
        // Check if admin user already exists
        const existingAdmin = await prisma.user.findFirst({
            where: { email: 'admin@restreamer.com' }
        });
        
        if (existingAdmin) {
            console.log('✅ Admin user already exists');
            return;
        }
        
        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = await prisma.user.create({
            data: {
                email: 'admin@restreamer.com',
                password: hashedPassword,
                name: 'Admin User',
                role: 'ADMIN'
            }
        });
        
        console.log('✅ Admin user created:', adminUser.email);
        
        // Create default RTMP server
        const existingServer = await prisma.rtmpServer.findFirst({
            where: { name: 'Default SRS Server' }
        });
        
        if (!existingServer) {
            const rtmpServer = await prisma.rtmpServer.create({
                data: {
                    name: 'Default SRS Server',
                    host: 'srs',
                    port: 1935,
                    isActive: true
                }
            });
            console.log('✅ Default RTMP server created:', rtmpServer.name);
        } else {
            console.log('✅ Default RTMP server already exists');
        }
        
        // Create default RTMP configuration
        const existingConfig = await prisma.rtmpConfiguration.findFirst({
            where: { name: 'Default Stream' }
        });
        
        if (!existingConfig) {
            const rtmpConfig = await prisma.rtmpConfiguration.create({
                data: {
                    name: 'Default Stream',
                    rtmpKey: 'brokers-playbook',
                    rtmpServerId: 1,
                    isActive: true
                }
            });
            console.log('✅ Default RTMP configuration created:', rtmpConfig.name);
        } else {
            console.log('✅ Default RTMP configuration already exists');
        }
        
        // Create default branded URL
        const existingBrandedUrl = await prisma.brandedUrl.findFirst({
            where: { slug: 'brokers-playbook' }
        });
        
        if (!existingBrandedUrl) {
            const brandedUrl = await prisma.brandedUrl.create({
                data: {
                    slug: 'brokers-playbook',
                    title: 'Brokers Playbook Stream',
                    description: 'Default streaming page',
                    rtmpConfigurationId: 1,
                    isActive: true
                }
            });
            console.log('✅ Default branded URL created:', brandedUrl.slug);
        } else {
            console.log('✅ Default branded URL already exists');
        }
        
    } catch (error) {
        console.error('❌ Error creating default data:', error);
    } finally {
        await prisma.\$disconnect();
    }
}

createAdmin().catch(console.error);
"

# Start backend
echo "🚀 Starting backend..."
docker compose -f docker-compose.prod.yml up -d backend

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Verify setup
echo "✅ Verifying database setup..."
docker compose -f docker-compose.prod.yml exec postgres psql -U restreamer -d restreamer -c "SELECT COUNT(*) as user_count FROM \"User\";"
docker compose -f docker-compose.prod.yml exec postgres psql -U restreamer -d restreamer -c "SELECT COUNT(*) as rtmp_server_count FROM \"RtmpServer\";"
docker compose -f docker-compose.prod.yml exec postgres psql -U restreamer -d restreamer -c "SELECT COUNT(*) as rtmp_config_count FROM \"RtmpConfiguration\";"
docker compose -f docker-compose.prod.yml exec postgres psql -U restreamer -d restreamer -c "SELECT COUNT(*) as branded_url_count FROM \"BrandedUrl\";"

echo "🎉 Database setup completed!"
echo "🔑 Default credentials:"
echo "   Email: admin@restreamer.com"
echo "   Password: admin123"
echo "   Stream URL: http://hive.restreamer.website/live/brokers-playbook"
