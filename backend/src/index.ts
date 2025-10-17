import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import configurationRoutes from './routes/configurations.js';
import brandedUrlRoutes from './routes/branded-urls.js';
import rtmpServerRoutes from './routes/rtmp-servers.js';
import streamStatusRoutes from './routes/stream-status.js';
import srsCallbackRoutes from './routes/srs-callbacks.js';
import chatRoutes from './routes/chat.js';
import { websocketService } from './services/websocket.js';
// import { streamMonitorService } from './services/streamMonitor.js';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();

const PORT = parseInt(process.env.PORT || '3001');

// Middleware
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || [process.env.FRONTEND_URL || 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/configurations', configurationRoutes);
app.use('/api/branded-urls', brandedUrlRoutes);
app.use('/api/rtmp-servers', rtmpServerRoutes);
app.use('/api/stream-status', streamStatusRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api', srsCallbackRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'restreamer-backend'
  });
});

// Basic API endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working!' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Create HTTP server
const server = createServer(app);

// Initialize WebSocket
websocketService.initialize(server);

// Start real-time stream monitoring - DISABLED, using SRS callbacks instead
// streamMonitorService.startMonitoring();

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
  console.log(`Real-time stream monitoring disabled - using SRS callbacks instead`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  // streamMonitorService.stopMonitoring();
  websocketService.close();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export { prisma, websocketService };
