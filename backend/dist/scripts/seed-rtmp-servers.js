import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function seedRtmpServers() {
    try {
        const servers = [
            {
                name: 'Owncast Server',
                description: 'Your Owncast server on Contabo (173.212.253.79)',
                rtmpUrl: 'rtmp://173.212.253.79:1935/live',
                isActive: true
            },
            {
                name: 'Your Domain RTMP',
                description: 'RTMP server on streamer.hiveologie.com (requires nginx-rtmp setup)',
                rtmpUrl: 'rtmp://streamer.hiveologie.com:1935/live',
                isActive: true
            },
            {
                name: 'Local RTMP Server',
                description: 'Local nginx-rtmp server for development',
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
        for (const server of servers) {
            await prisma.rtmpServer.upsert({
                where: { name: server.name },
                update: server,
                create: server
            });
        }
        console.log('✅ RTMP servers seeded successfully');
    }
    catch (error) {
        console.error('Error seeding RTMP servers:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
seedRtmpServers();
//# sourceMappingURL=seed-rtmp-servers.js.map