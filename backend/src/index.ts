import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import authRoutes from './routes/auth';
import streamRoutes from './routes/streams';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';
import configurationRoutes from './routes/configurations';
import brandedUrlRoutes from './routes/branded-urls';
import rtmpServerRoutes from './routes/rtmp-servers';
import streamStatusRoutes from './routes/stream-status';
import webrtcRoutes from './routes/webrtc';
import rtmpRoutes from './routes/rtmp';

// Load environment variables
dotenv.config();

const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Create HTTP server
const server = createServer(app);

// Create Socket.IO server
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true
  }
});

// Store WebSocket connections by rtmpKey
const connections = new Map<string, any>();

io.on('connection', (socket) => {
  console.log('WebSocket client connected:', socket.id);
  
  socket.on('join-stream', (rtmpKey: string) => {
    console.log(`Client ${socket.id} joined stream: ${rtmpKey}`);
    connections.set(rtmpKey, socket);
    socket.join(rtmpKey);
  });
  
  socket.on('disconnect', () => {
    console.log('WebSocket client disconnected:', socket.id);
    // Remove from connections map
    for (const [key, value] of connections.entries()) {
      if (value === socket) {
        connections.delete(key);
        break;
      }
    }
  });
});

// Export io for use in other modules
export { io };

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/streams', streamRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/configurations', configurationRoutes);
app.use('/api/branded-urls', brandedUrlRoutes);
app.use('/api/rtmp-servers', rtmpServerRoutes);
app.use('/api/stream-status', streamStatusRoutes);
app.use('/api/webrtc', webrtcRoutes);
app.use('/api/rtmp', rtmpRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'custom-restreamer-backend'
  });
});

// Basic API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working!' });
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Backend server running on port ' + PORT);
  console.log('📊 Health check: http://localhost:' + PORT + '/health');
  console.log('🔌 WebSocket server ready');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});