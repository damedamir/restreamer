import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createDefaultConfig() {
  try {
    // First, ensure we have RTMP servers
    const servers = [
      {
        name: 'SRS Server (Default)',
        description: 'SRS media server for live streaming',
        rtmpUrl: 'rtmp://restreamer.website:1935/live',
        isActive: true
      },
      {
        name: 'Local SRS Server',
        description: 'Local SRS server for development',
        rtmpUrl: 'rtmp://localhost:1935/live',
        isActive: true
      },
      {
        name: 'Twitch RTMP',
        description: 'Twitch RTMP endpoint - reliable for testing',
        rtmpUrl: 'rtmp://live.twitch.tv/live',
        isActive: true
      },
      {
        name: 'YouTube Live',
        description: 'YouTube Live RTMP endpoint - very stable',
        rtmpUrl: 'rtmp://a.rtmp.youtube.com/live2',
        isActive: true
      }
    ];

    console.log('Seeding RTMP servers...');
    for (const server of servers) {
      await prisma.rtmpServer.upsert({
        where: { name: server.name },
        update: server,
        create: server
      });
    }

    // Get the first user (admin)
    const user = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (!user) {
      console.error('No admin user found');
      return;
    }

    console.log('Found user:', user.email);

    // Get the SRS server
    const srsServer = await prisma.rtmpServer.findFirst({
      where: { name: 'SRS Server (Default)' }
    });

    if (!srsServer) {
      console.error('SRS server not found');
      return;
    }

    // Check if user already has configurations
    const existingConfigs = await prisma.rtmpConfiguration.findMany({
      where: { userId: user.id }
    });

    if (existingConfigs.length > 0) {
      console.log('User already has configurations:', existingConfigs.length);
      return;
    }

    // Generate unique RTMP key
    function generateRtmpKey(): string {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = '';
      for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    let rtmpKey: string;
    let isUnique = false;
    let attempts = 0;
    
    do {
      rtmpKey = generateRtmpKey();
      const existing = await prisma.rtmpConfiguration.findUnique({
        where: { rtmpKey }
      });
      isUnique = !existing;
      attempts++;
    } while (!isUnique && attempts < 10);

    if (!isUnique) {
      console.error('Failed to generate unique RTMP key');
      return;
    }

    // Create default configuration
    const config = await prisma.rtmpConfiguration.create({
      data: {
        name: 'Default Stream',
        rtmpKey,
        rtmpServerId: srsServer.id,
        status: 'Inactive',
        selected: true, // Make it the default selected configuration
        userId: user.id
      },
      include: {
        rtmpServer: true
      }
    });

    console.log('✅ Default configuration created successfully:');
    console.log('  - Name:', config.name);
    console.log('  - RTMP Key:', config.rtmpKey);
    console.log('  - RTMP URL:', `${srsServer.rtmpUrl}/${config.rtmpKey}`);
    console.log('  - Server:', srsServer.name);

  } catch (error) {
    console.error('Error creating default configuration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultConfig();
