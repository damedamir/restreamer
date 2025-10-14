import { Router } from 'express';
import { prisma, websocketService } from '../index.js';
import axios from 'axios';

const router = Router();

// Function to send stream status updates to connected clients via WebSocket
export const sendStreamStatusUpdate = async (rtmpKey: string, isLive: boolean, viewers: number) => {
  console.log(`📡 [WebSocket] Broadcasting stream status update for ${rtmpKey}: isLive=${isLive}, viewers=${viewers}`);
  
  const status = {
    isLive,
    viewers,
    lastChecked: new Date().toISOString(),
    rtmpKey
  };
  
  await websocketService.broadcastStreamStatus(rtmpKey, status);
};

// Check stream status by RTMP key
router.get('/:rtmpKey', async (req, res) => {
  try {
    const { rtmpKey } = req.params;
    console.log(`🔍 Stream status API called for RTMP key: ${rtmpKey}`);

    // Find the RTMP configuration
    const rtmpConfig = await prisma.rtmpConfiguration.findUnique({
      where: { rtmpKey },
      include: {
        rtmpServer: true
      }
    });

    if (!rtmpConfig) {
      console.log(`❌ RTMP configuration not found for key: ${rtmpKey}`);
      return res.status(404).json({ error: 'Stream configuration not found' });
    }

    console.log(`✅ RTMP configuration found:`, {
      id: rtmpConfig.id,
      name: rtmpConfig.name,
      rtmpKey: rtmpConfig.rtmpKey
    });

    // Check SRS for stream status
    console.log(`🔍 Calling checkSRSStreamStatus for: ${rtmpKey}`);
    const isLive = await checkSRSStreamStatus(rtmpKey);
    console.log(`🔍 SRS check result - isLive: ${isLive}`);
    
    const viewers = isLive ? await getSRSViewerCount(rtmpKey) : 0;
    console.log(`🔍 Viewer count: ${viewers}`);

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

    const response = {
      isLive,
      viewers,
      lastChecked: new Date(),
      rtmpKey,
      rtmpUrl: rtmpConfig.rtmpServer.rtmpUrl
    };

    // Broadcast WebSocket update
    await sendStreamStatusUpdate(rtmpKey, isLive, viewers);

    res.json(response);
  } catch (error) {
    console.error('Error checking stream status:', error);
    res.status(500).json({ error: 'Failed to check stream status' });
  }
});

// Helper function to check SRS stream status
async function checkSRSStreamStatus(rtmpKey: string): Promise<boolean> {
  try {
    console.log(`🔍 Checking SRS stream status for: ${rtmpKey}`);
    const response = await axios.get('http://custom-restreamer-srs-1:1985/api/v1/streams/');
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
    const response = await axios.get('http://custom-restreamer-srs-1:1985/api/v1/streams/');
    const streams = response.data.streams || [];
    
    const stream = streams.find((s: any) => s.name === rtmpKey);
    return stream ? stream.clients || 0 : 0;
  } catch (error) {
    console.error('Error getting SRS viewer count:', error);
    return 0;
  }
}

export default router;