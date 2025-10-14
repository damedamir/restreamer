import { Router } from 'express';
import { websocketService } from '../index.js';

const router = Router();

// SRS HTTP Callback endpoint for stream events
router.post('/srs-callback', async (req, res) => {
  try {
    const { action, client_id, ip, vhost, app, stream, param } = req.body;
    
    console.log('📡 [SRS Callback] Received event:', {
      action,
      client_id,
      ip,
      vhost,
      app,
      stream,
      param
    });

    // Extract stream key from the stream name
    const streamKey = stream || param?.stream || 'unknown';
    
    switch (action) {
      case 'on_publish':
        console.log(`📡 [SRS Callback] Stream started: ${streamKey}`);
        await websocketService.broadcastStreamStatus(streamKey, {
          isLive: true,
          viewers: 0, // Will be updated by next check
          lastChecked: new Date().toISOString(),
          rtmpKey: streamKey
        });
        break;
        
      case 'on_unpublish':
        console.log(`📡 [SRS Callback] Stream stopped: ${streamKey}`);
        await websocketService.broadcastStreamStatus(streamKey, {
          isLive: false,
          viewers: 0,
          lastChecked: new Date().toISOString(),
          rtmpKey: streamKey
        });
        break;
        
      case 'on_play':
        console.log(`📡 [SRS Callback] Viewer started watching: ${streamKey}`);
        // We'll update viewer count in the next status check
        break;
        
      case 'on_stop':
        console.log(`📡 [SRS Callback] Viewer stopped watching: ${streamKey}`);
        // We'll update viewer count in the next status check
        break;
        
      default:
        console.log(`📡 [SRS Callback] Unknown action: ${action}`);
    }

    // SRS expects a 200 response
    res.status(200).json({ code: 0, msg: 'OK' });
    
  } catch (error) {
    console.error('❌ [SRS Callback] Error processing callback:', error);
    res.status(500).json({ code: 1, msg: 'Error processing callback' });
  }
});

export default router;
