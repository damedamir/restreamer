import { Router } from 'express';
import { prisma } from '../index.js';
import axios from 'axios';

const router = Router();

// Function to send stream status updates to connected clients (WebSocket removed)
export const sendStreamStatusUpdate = (rtmpKey: string, isLive: boolean, viewers: number) => {
  console.log(`Stream status update for ${rtmpKey}: isLive=${isLive}, viewers=${viewers}`);
};

// Check stream status by RTMP key
router.get('/:rtmpKey', async (req, res) => {
  try {
    const { rtmpKey } = req.params;

    // Find the RTMP configuration
    const rtmpConfig = await prisma.rtmpConfiguration.findUnique({
      where: { rtmpKey },
      include: {
        rtmpServer: true
      }
    });

    if (!rtmpConfig) {
      return res.status(404).json({ error: 'Stream configuration not found' });
    }

    // Check SRS for stream status
    const isLive = await checkSRSStreamStatus(rtmpKey);
    const viewers = isLive ? await getSRSViewerCount(rtmpKey) : 0;

    // Update or create stream status record - temporarily disabled due to foreign key constraint issues
    // try {
    //   await prisma.streamStatus.upsert({
    //     where: { streamId: rtmpConfig.id },
    //     update: {
    //       isLive,
    //       viewers,
    //       updatedAt: new Date()
    //     },
    //     create: {
    //       streamId: rtmpConfig.id,
    //       isLive,
    //       viewers,
    //       updatedAt: new Date()
    //     }
    //   });
    // } catch (error) {
    //   console.error('Error updating stream status:', error);
    //   // Continue without updating database if there's an error
    // }

    res.json({
      isLive,
      viewers,
      lastChecked: new Date(),
      rtmpKey,
      rtmpUrl: rtmpConfig.rtmpServer.rtmpUrl
    });
  } catch (error) {
    console.error('Error checking stream status:', error);
    res.status(500).json({ error: 'Failed to check stream status' });
  }
});

// Helper function to check SRS stream status
async function checkSRSStreamStatus(rtmpKey: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking SRS stream status for: ${rtmpKey}`);
    const response = await axios.get('http://srs:1985/api/v1/streams/');
    console.log(`🔍 SRS API response:`, response.data);
    
    const streams = response.data.streams || [];
    console.log(`🔍 Available streams:`, streams);
    
    // Check if our stream key is in the active streams AND is actually publishing
    const stream = streams.find((s: any) => s.name === rtmpKey);
    const isActive = stream ? stream.publish?.active === true : false;
    
    console.log(`🔍 SRS Stream check for ${rtmpKey}:`, {
      streamFound: !!stream,
      publishActive: stream?.publish?.active,
      isActive,
      allStreams: streams.map((s: any) => ({ name: s.name, publish: s.publish }))
    });
    
    return isActive;
  } catch (error) {
    console.error('❌ Error checking SRS stream status:', error);
    return false;
  }
}

// Helper function to get viewer count from SRS
async function getSRSViewerCount(rtmpKey: string): Promise<number> {
  try {
    const response = await axios.get('http://srs:1985/api/v1/streams/');
    const streams = response.data.streams || [];
    
    const stream = streams.find((s: any) => s.name === rtmpKey);
    return stream ? stream.clients || 0 : 0;
  } catch (error) {
    console.error('Error getting SRS viewer count:', error);
    return 0;
  }
}

export default router;