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
  private readonly ACTIVE_CHECK_INTERVAL = 1000; // 1 second when active
  private readonly IDLE_CHECK_INTERVAL = 30000; // 30 seconds when idle
  private currentInterval = this.IDLE_CHECK_INTERVAL;
  private hasActiveStreams = false;

  startMonitoring() {
    if (this.isMonitoring) {
      console.log('📡 [StreamMonitor] Already monitoring');
      return;
    }

    console.log('📡 [StreamMonitor] Starting smart stream monitoring...');
    this.isMonitoring = true;
    this.scheduleNextCheck();
  }

  private scheduleNextCheck() {
    if (!this.isMonitoring) return;

    this.monitoringInterval = setTimeout(async () => {
      await this.checkStreamStatus();
      this.scheduleNextCheck(); // Schedule next check
    }, this.currentInterval);
  }

  stopMonitoring() {
    if (!this.isMonitoring) return;

    console.log('📡 [StreamMonitor] Stopping stream monitoring');
    this.isMonitoring = false;

    if (this.monitoringInterval) {
      clearTimeout(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  private async checkStreamStatus() {
    try {
      const response = await axios.get<SRSResponse>(this.SRS_API_URL);
      const streams = response.data.streams || [];
      const activeStreams = streams.filter(s => s.publish?.active === true);

      // Adjust monitoring frequency based on activity
      const newHasActiveStreams = activeStreams.length > 0;
      if (newHasActiveStreams !== this.hasActiveStreams) {
        this.hasActiveStreams = newHasActiveStreams;
        this.currentInterval = newHasActiveStreams ? this.ACTIVE_CHECK_INTERVAL : this.IDLE_CHECK_INTERVAL;
        console.log(`📡 [StreamMonitor] ${newHasActiveStreams ? 'Active streams detected' : 'No active streams'} - switching to ${this.currentInterval}ms interval`);
      }

      // Only process streams if there are active ones or if we're checking for offline changes
      if (activeStreams.length > 0 || this.lastStreamStates.size > 0) {
        await this.processStreamChanges(streams);
      }

    } catch (error) {
      console.error('❌ [StreamMonitor] Error checking stream status:', error);
      // On error, use longer interval
      this.currentInterval = this.IDLE_CHECK_INTERVAL;
    }
  }

  private async processStreamChanges(streams: StreamInfo[]) {
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
        // Stream is still active, update viewer count if it changed significantly
        const lastViewers = this.lastStreamStates.get(`${streamName}_viewers`) || 0;
        if (Math.abs(lastViewers - viewers) >= 1) { // Only update if change is significant
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
  }

  getMonitoringStatus() {
    return {
      isMonitoring: this.isMonitoring,
      currentInterval: this.currentInterval,
      hasActiveStreams: this.hasActiveStreams,
      activeStreams: Array.from(this.lastStreamStates.entries())
        .filter(([key, value]) => !key.includes('_viewers') && value)
        .map(([key]) => key)
    };
  }
}

export const streamMonitorService = new StreamMonitorService();