#!/bin/bash

echo "🔧 Fixing backend code..."

# Navigate to the project directory
cd /home/damir/custom-restreamer

# Force pull the latest code
echo "📥 Pulling latest code..."
git fetch origin
git reset --hard origin/main
git clean -fdx

# Verify the backend index.ts is correct
echo "🔍 Checking backend index.ts..."
if grep -q "import configurationRoutes from './routes/configurations'" backend/src/index.ts; then
    echo "✅ Backend code is correct"
else
    echo "❌ Backend code is still old, forcing update..."
    
    # Create the correct index.ts
    cat > backend/src/index.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import adminRoutes from './routes/admin';
import configurationRoutes from './routes/configurations';
import brandedUrlRoutes from './routes/branded-urls';
import rtmpServerRoutes from './routes/rtmp-servers';
import streamStatusRoutes from './routes/stream-status';

// Load environment variables
dotenv.config();

const app = express();
export const prisma = new PrismaClient();
const PORT = parseInt(process.env.PORT || '3001');

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
app.use('/api/admin', adminRoutes);
app.use('/api/configurations', configurationRoutes);
app.use('/api/branded-urls', brandedUrlRoutes);
app.use('/api/rtmp-servers', rtmpServerRoutes);
app.use('/api/stream-status', streamStatusRoutes);

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
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Backend server running on port ' + PORT);
  console.log('📊 Health check: http://localhost:' + PORT + '/health');
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
EOF
    echo "✅ Backend index.ts updated"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
sudo docker compose -f docker-compose.prod.yml down

# Remove backend image to force rebuild
echo "🗑️ Removing backend image..."
sudo docker image rm custom-restreamer-backend 2>/dev/null || true

# Build and start
echo "🚀 Building and starting services..."
sudo docker compose -f docker-compose.prod.yml build --no-cache backend
sudo docker compose -f docker-compose.prod.yml up -d

echo "✅ Done! Check the logs with: sudo docker compose -f docker-compose.prod.yml logs backend"
