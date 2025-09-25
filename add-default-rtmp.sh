#!/bin/bash

echo "🚀 Adding default RTMP settings to admin panel..."

# Check if we're on the production server
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ This script must be run on the production server"
    exit 1
fi

# Add default RTMP server and configuration
docker compose -f docker-compose.prod.yml exec backend node -e "
const { PrismaClient } = require('@prisma/client');

async function addDefaultRtmp() {
    const prisma = new PrismaClient();
    
    try {
        // Get admin user
        const adminUser = await prisma.user.findFirst({
            where: { email: 'admin@example.com' }
        });
        
        if (!adminUser) {
            console.log('❌ Admin user not found. Please run setup-database.sh first.');
            return;
        }
        
        // Get the domain from environment or use default
        const domain = process.env.DOMAIN || 'hive.restreamer.website';
        const rtmpUrl = \`rtmp://\${domain}/live\`;
        
        console.log(' Using domain:', domain);
        console.log(' RTMP URL:', rtmpUrl);
        
        // Get or create RTMP server
        let rtmpServer = await prisma.rtmpServer.findFirst({
            where: { name: 'Default SRS Server' }
        });
        
        if (!rtmpServer) {
            rtmpServer = await prisma.rtmpServer.create({
                data: {
                    name: 'Default SRS Server',
                    description: 'Main streaming server for live broadcasts',
                    rtmpUrl: rtmpUrl,
                    isActive: true
                }
            });
            console.log('✅ RTMP server created:', rtmpServer.name);
        } else {
            // Update existing server with correct URL
            rtmpServer = await prisma.rtmpServer.update({
                where: { id: rtmpServer.id },
                data: { rtmpUrl: rtmpUrl }
            });
            console.log('✅ RTMP server updated with correct URL:', rtmpServer.name);
        }
        
        // Check if RTMP configuration already exists
        let rtmpConfig = await prisma.rtmpConfiguration.findFirst({
            where: { name: 'Main Stream' }
        });
        
        if (!rtmpConfig) {
            // Create default RTMP configuration with rtmpKey
            rtmpConfig = await prisma.rtmpConfiguration.create({
                data: {
                    name: 'Main Stream',
                    rtmpKey: 'main-stream-' + Date.now(), // Generate unique key
                    rtmpServerId: rtmpServer.id,
                    status: 'Inactive',
                    selected: true,
                    userId: adminUser.id
                }
            });
            console.log('✅ RTMP configuration created:', rtmpConfig.name);
            console.log('🔑 RTMP Key:', rtmpConfig.rtmpKey);
        } else {
            console.log('✅ RTMP configuration already exists:', rtmpConfig.name);
            console.log('🔑 RTMP Key:', rtmpConfig.rtmpKey);
        }
        
        // Check if branded URL already exists
        let brandedUrl = await prisma.brandedUrl.findFirst({
            where: { slug: rtmpConfig.rtmpKey }
        });
        
        if (!brandedUrl) {
            // Create branded URL
            brandedUrl = await prisma.brandedUrl.create({
                data: {
                    name: 'Main Stream Page',
                    slug: rtmpConfig.rtmpKey,
                    url: \`http://\${domain}/live/\${rtmpConfig.rtmpKey}\`,
                    views: 0,
                    rtmpConfigId: rtmpConfig.id,
                    color: '#3B82F6',
                    logoUrl: null,
                    overlayText: 'Live Stream',
                    offlineContent: false,
                    offlineMessage: 'Stream is offline. Please check back later.',
                    ctaText: 'Start Streaming',
                    ctaUrl: \`http://\${domain}/admin\`
                }
            });
            console.log('✅ Branded URL created:', brandedUrl.slug);
        } else {
            console.log('✅ Branded URL already exists:', brandedUrl.slug);
        }
        
        // Verify the setup
        console.log('\\n📊 Default RTMP Settings:');
        console.log('   Server: Default SRS Server');
        console.log('   RTMP URL:', rtmpUrl);
        console.log('   Configuration: Main Stream');
        console.log('   RTMP Key:', rtmpConfig.rtmpKey);
        console.log('   Stream URL:', brandedUrl.url);
        console.log('   Admin URL: http://' + domain + '/admin');
        
        console.log('\\n Default RTMP settings ready!');
        console.log(' Refresh the admin panel to see the settings.');
        
    } catch (error) {
        console.error('❌ Error adding default RTMP settings:', error);
    } finally {
        await prisma.\$disconnect();
    }
}

addDefaultRtmp();
"
