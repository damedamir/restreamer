import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { prisma } from '../index.js';

interface StreamStatusUpdate {
  type: 'stream_status';
  rtmpKey: string;
  isLive: boolean;
  viewers: number;
  lastChecked: string;
}

class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();
  private streamStatusCache: Map<string, any> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws',
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || [process.env.FRONTEND_URL || 'http://localhost:3000'],
        credentials: true
      }
    });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 [WebSocket] Client connected');
      this.clients.add(ws);

      // Send current stream statuses to new client
      this.sendStreamStatuses(ws);

      ws.on('close', () => {
        console.log('🔌 [WebSocket] Client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('❌ [WebSocket] Client error:', error);
        this.clients.delete(ws);
      });

      // Handle ping/pong for connection health
      ws.on('pong', () => {
        // Client is alive
      });
    });

    // Ping clients every 30 seconds to keep connection alive
    setInterval(() => {
      this.clients.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        } else {
          this.clients.delete(ws);
        }
      });
    }, 30000);

    console.log('✅ [WebSocket] Server initialized on /ws');
  }

  private sendStreamStatuses(ws: WebSocket) {
    if (ws.readyState === WebSocket.OPEN) {
      const statuses = Array.from(this.streamStatusCache.entries()).map(([rtmpKey, status]) => ({
        type: 'stream_status',
        rtmpKey,
        ...status
      }));

      ws.send(JSON.stringify({
        type: 'initial_statuses',
        statuses
      }));
    }
  }

  async broadcastStreamStatus(rtmpKey: string, status: any) {
    // Update cache
    this.streamStatusCache.set(rtmpKey, status);

    const message: StreamStatusUpdate = {
      type: 'stream_status',
      rtmpKey,
      isLive: status.isLive,
      viewers: status.viewers,
      lastChecked: status.lastChecked
    };

    const messageStr = JSON.stringify(message);
    const deadClients: WebSocket[] = [];

    this.clients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
        } catch (error) {
          console.error('❌ [WebSocket] Error sending message:', error);
          deadClients.push(ws);
        }
      } else {
        deadClients.push(ws);
      }
    });

    // Clean up dead clients
    deadClients.forEach(ws => this.clients.delete(ws));

    console.log(`📡 [WebSocket] Broadcasted status for ${rtmpKey}:`, status.isLive ? 'LIVE' : 'OFFLINE');
  }

  getClientCount(): number {
    return this.clients.size;
  }

  close() {
    if (this.wss) {
      this.wss.close();
      console.log('🔌 [WebSocket] Server closed');
    }
  }
}

export const websocketService = new WebSocketService();
