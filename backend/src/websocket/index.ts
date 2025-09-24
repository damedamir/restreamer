import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  streamId?: string;
  isAlive?: boolean;
}

export const setupWebSocket = (server: Server, prisma: PrismaClient) => {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  // Store active connections by stream
  const streamConnections = new Map<string, Set<AuthenticatedWebSocket>>();

  wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    console.log('New WebSocket connection');
    
    ws.isAlive = true;
    
    // Handle pong responses
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Handle messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        switch (message.type) {
          case 'join_stream':
            await handleJoinStream(ws, message.streamId, prisma, streamConnections);
            break;
          case 'leave_stream':
            handleLeaveStream(ws, message.streamId, streamConnections);
            break;
          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }));
            break;
          default:
            console.log('Unknown message type:', message.type);
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    // Handle disconnection
    ws.on('close', () => {
      console.log('WebSocket disconnected');
      // Remove from all streams
      for (const [streamId, connections] of streamConnections.entries()) {
        connections.delete(ws);
        if (connections.size === 0) {
          streamConnections.delete(streamId);
        }
      }
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  });

  // Ping clients every 30 seconds to keep connection alive
  const pingInterval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (!ws.isAlive) {
        ws.terminate();
        return;
      }
      
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Cleanup on server close
  server.on('close', () => {
    clearInterval(pingInterval);
  });

  return wss;
};

async function handleJoinStream(
  ws: AuthenticatedWebSocket, 
  streamId: string, 
  prisma: PrismaClient,
  streamConnections: Map<string, Set<AuthenticatedWebSocket>>
) {
  try {
    // Verify stream exists
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: { config: true }
    });

    if (!stream) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Stream not found' 
      }));
      return;
    }

    // Add to stream connections
    if (!streamConnections.has(streamId)) {
      streamConnections.set(streamId, new Set());
    }
    streamConnections.get(streamId)!.add(ws);
    ws.streamId = streamId;

    // Send current stream status
    ws.send(JSON.stringify({
      type: 'stream_status',
      data: {
        isLive: stream.isLive,
        viewers: stream.viewers,
        streamUrl: stream.streamUrl,
        config: stream.config
      }
    }));

    // Log viewer join
    await prisma.viewerLog.create({
      data: {
        streamId: stream.id,
        ipAddress: ws.url, // This is a simplified approach
        userAgent: 'WebSocket'
      }
    });

    // Update viewer count
    await prisma.stream.update({
      where: { id: streamId },
      data: {
        viewers: {
          increment: 1
        }
      }
    });

    // Broadcast to other viewers
    broadcastToStream(streamId, {
      type: 'viewer_count',
      count: stream.viewers + 1
    }, streamConnections);

  } catch (error) {
    console.error('Error joining stream:', error);
    ws.send(JSON.stringify({ 
      type: 'error', 
      message: 'Failed to join stream' 
    }));
  }
}

function handleLeaveStream(
  ws: AuthenticatedWebSocket, 
  streamId: string,
  streamConnections: Map<string, Set<AuthenticatedWebSocket>>
) {
  if (streamConnections.has(streamId)) {
    streamConnections.get(streamId)!.delete(ws);
    
    if (streamConnections.get(streamId)!.size === 0) {
      streamConnections.delete(streamId);
    }
  }
  
  ws.streamId = undefined;
}

function broadcastToStream(
  streamId: string, 
  message: any, 
  streamConnections: Map<string, Set<AuthenticatedWebSocket>>
) {
  const connections = streamConnections.get(streamId);
  if (connections) {
    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }
}

// Export function to broadcast stream updates
export const broadcastStreamUpdate = (
  streamId: string, 
  update: any, 
  streamConnections: Map<string, Set<AuthenticatedWebSocket>>
) => {
  broadcastToStream(streamId, {
    type: 'stream_update',
    data: update
  }, streamConnections);
};
