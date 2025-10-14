import { websocketService } from './websocket.js';
import axios from 'axios';

interface StreamInfo {
  name: string;
  publish?: {
    active: boolean;
  };
  clients?: number;
}

interface SRSResponse {
  streams: StreamInfo[];
}

class StreamMonitorService {
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private lastStreamStates = new Map<string, boolean>();
  private readonly SRS_API_URL = 'http://custom-restreamer-srs-1:1985/api/v1/streams/';
  private readonly CHECK_INTERVAL = 2000; // Check every 2 seconds

  startMonitoring() {
    if (this.isMonitoring) {
      console.log('📡 [StreamMonitor] Already monitoring');
      return;
    }

    console.log('📡 [StreamMonitor] Starting real-time stream monitoring...');
    this.isMonitoring = true;

    this.monitoringInterval = setInterval(async () => {
      await this.checkStreamStatus();
    }, this.CHECK_INTERVAL);
  }

  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    console.log('📡 [StreamMonitor] Stopping stream monitoring');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async checkStreamStatus() {
    try {
      const response = await axios.get<SRSResponse>(this.SRS_API_URL);
      const streams = response.data.streams || [];

      // Check each stream for changes
      for (const stream of streams) {
        const streamName = stream.name;
        const isActive = stream.publish?.active === true;
        const viewers = stream.clients || 0;

        // Check if stream status changed
        const lastState = this.lastStreamStates.get(streamName);
        if (lastState !== isActive) {
          console.log(`📡 [StreamMonitor] Stream ${streamName} status changed: ${lastState ? 'LIVE' : 'OFFLINE'} → ${isActive ? 'LIVE' : 'OFFLINE'}`);
          
          // Update our cache
          this.lastStreamStates.set(streamName, isActive);

          // Broadcast the change immediately
          await websocketService.broadcastStreamStatus(streamName, {
            isLive: isActive,
            viewers: isActive ? viewers : 0,
            lastChecked: new Date().toISOString(),
            rtmpKey: streamName
          });
        } else if (isActive) {
          // Stream is still active, update viewer count if it changed
          const lastViewers = this.lastStreamStates.get(`${streamName}_viewers`) || 0;
          if (lastViewers !== viewers) {
            console.log(`📡 [StreamMonitor] Stream ${streamName} viewer count changed: ${lastViewers} → ${viewers}`);
            
            // Update viewer count cache
            this.lastStreamStates.set(`${streamName}_viewers`, viewers);

            // Broadcast viewer count update
            await websocketService.broadcastStreamStatus(streamName, {
              isLive: true,
              viewers: viewers,
              lastChecked: new Date().toISOString(),
              rtmpKey: streamName
            });
          }
        }
      }

      // Check for streams that went offline (removed from SRS)
      const currentStreamNames = new Set(streams.map(s => s.name));
      for (const [streamName, wasActive] of this.lastStreamStates.entries()) {
        if (wasActive && !currentStreamNames.has(streamName)) {
          console.log(`📡 [StreamMonitor] Stream ${streamName} went offline (removed from SRS)`);
          
          // Mark as offline
          this.lastStreamStates.set(streamName, false);
          this.lastStreamStates.delete(`${streamName}_viewers`);

          // Broadcast offline status
          await websocketService.broadcastStreamStatus(streamName, {
            isLive: false,
            viewers: 0,
            lastChecked: new Date().toISOString(),
            rtmpKey: streamName
          });
        }
      }

    } catch (error) {
      console.error('❌ [StreamMonitor] Error checking stream status:', error);
    }
  }

  getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      checkInterval: this.CHECK_INTERVAL,
      activeStreams: Array.from(this.lastStreamStates.entries())
        .filter(([key, value]) => !key.includes('_viewers') && value)
        .map(([key]) => key)
    };
  }
}

export const streamMonitorService = new StreamMonitorService();
