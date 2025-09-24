#!/bin/bash

set -e

echo "🚀 Custom Restreamer - Complete Automated Installation"
echo "=================================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run as root. Run as regular user."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please logout and login again, then run this script again."
    exit 0
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if user is in docker group
if ! groups $USER | grep -q docker; then
    echo "🔧 Adding user to docker group..."
    sudo usermod -aG docker $USER
    echo "✅ User added to docker group. Please logout and login again, then run this script again."
    exit 0
fi

# Create project directory
PROJECT_DIR="custom-restreamer"
if [ -d "$PROJECT_DIR" ]; then
    echo "📁 Project directory exists, updating..."
    cd $PROJECT_DIR
    # Handle any local changes
    git reset --hard HEAD
    git pull origin main
else
    echo "📁 Creating project directory..."
    git clone https://github.com/damedamir/custom-restreamer.git
    cd $PROJECT_DIR
fi

# Create complete .env file
echo "⚙️ Creating environment configuration..."
cat > .env << 'ENVEOF'
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/custom_restreamer

# JWT Secret (generate a secure one)
JWT_SECRET=your-super-secure-jwt-secret-key-here-$(openssl rand -hex 32)

# Webhook Secret
WEBHOOK_SECRET=your-webhook-secret-$(openssl rand -hex 16)

# CORS Origin
CORS_ORIGIN=https://hive.restreamer.website

# Public URLs
PUBLIC_HLS_URL=https://hive.restreamer.website/hls
PUBLIC_WS_BASE=wss://hive.restreamer.website

# Admin User
ADMIN_EMAIL=admin@hive.restreamer.website
ADMIN_PASSWORD=admin123

# Ports
PORT=3001
NEXT_PUBLIC_API_URL=https://hive.restreamer.website
NEXT_PUBLIC_WS_URL=wss://hive.restreamer.website
ENVEOF

# Create complete frontend structure
echo "🎨 Setting up frontend..."

# Create admin page directory
mkdir -p frontend/app/admin

# Create admin page
cat > frontend/app/admin/page.tsx << 'ADMINEOF'
'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [stats, setStats] = useState({
    totalStreams: 0,
    activeStreams: 0,
    totalUsers: 0
  });

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(res => res.json())
      .then(data => setStats(data.stats || data))
      .catch(err => console.error('Failed to fetch admin data:', err));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600">Manage your streaming platform</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Streams</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalStreams}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 18.364A9 9 0 010 12c0-1.657.448-3.213 1.231-4.55M12 3v9m0 0l-3-3m3 3l3-3m-9 9a9 9 0 0018 0 9 9 0 00-18 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Active Streams</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.activeStreams}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Create New Stream
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                Manage Users
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
ADMINEOF

# Create complete backend structure
echo "🔧 Setting up backend..."

# Create necessary directories
mkdir -p backend/src/routes
mkdir -p backend/src/middleware
mkdir -p backend/src/scripts
mkdir -p backend/src/websocket
mkdir -p backend/prisma
mkdir -p frontend/app/admin
mkdir -p frontend/components
mkdir -p frontend/public
mkdir -p nginx

# Create admin routes
cat > backend/src/routes/admin.ts << 'ADMINROUTESEOF'
import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Admin dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const totalStreams = await prisma.stream.count();
    const activeStreams = await prisma.streamStatus.count({
      where: { isLive: true }
    });
    const totalUsers = await prisma.user.count();

    res.json({
      stats: {
        totalStreams,
        activeStreams,
        totalUsers
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Get all streams
router.get('/streams', async (req, res) => {
  try {
    const streams = await prisma.stream.findMany({
      include: {
        streamStatus: true,
        brandedUrl: true
      }
    });
    res.json({ streams });
  } catch (error) {
    console.error('Get streams error:', error);
    res.status(500).json({ error: 'Failed to fetch streams' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
ADMINROUTESEOF

# Create other backend routes
cat > backend/src/routes/auth.ts << 'AUTHROUTESEOF'
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'JWT secret not configured' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      secret,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'USER'
      }
    });

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
AUTHROUTESEOF

# Create streams routes
cat > backend/src/routes/streams.ts << 'STREAMROUTESEOF'
import express from 'express';

const router = express.Router();

// Get all streams
router.get('/', async (req, res) => {
  res.json({ streams: [] });
});

// Get stream by slug
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  res.json({
    slug,
    message: 'Stream endpoint working',
    isLive: false
  });
});

export default router;
STREAMROUTESEOF

# Create webhooks routes
cat > backend/src/routes/webhooks.ts << 'WEBHOOKROUTESEOF'
import express from 'express';

const router = express.Router();

// RTMP webhook for stream start
router.post('/start', async (req, res) => {
  console.log('Stream started:', req.body);
  res.json({ status: 'ok' });
});

// RTMP webhook for stream stop
router.post('/stop', async (req, res) => {
  console.log('Stream stopped:', req.body);
  res.json({ status: 'ok' });
});

export default router;
WEBHOOKROUTESEOF

# Create main backend index file
cat > backend/src/index.ts << 'BACKENDINDEXEOF'
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import authRoutes from './routes/auth';
import streamRoutes from './routes/streams';
import webhookRoutes from './routes/webhooks';
import adminRoutes from './routes/admin';

// Load environment variables
dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

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
  await prisma.\$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await prisma.\$disconnect();
  process.exit(0);
});
BACKENDINDEXEOF

# Create Prisma schema
cat > backend/prisma/schema.prisma << 'PRISMASCHEMAEOF'
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      String   @default("USER")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  streams Stream[]

  @@map("users")
}

model Stream {
  id          String   @id @default(cuid())
  name        String
  description String?
  slug        String   @unique
  userId      String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user               User                @relation(fields: [userId], references: [id])
  streamStatus       StreamStatus?
  brandedUrl         BrandedUrl?
  streamConfiguration StreamConfiguration?

  @@map("streams")
}

model StreamConfiguration {
  id        String   @id @default(cuid())
  streamId  String   @unique
  rtmpUrl   String?
  hlsUrl    String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  stream Stream @relation(fields: [streamId], references: [id])

  @@map("stream_configurations")
}

model BrandedUrl {
  id        String   @id @default(cuid())
  streamId  String   @unique
  customUrl String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  stream Stream @relation(fields: [streamId], references: [id])

  @@map("branded_urls")
}

model StreamStatus {
  id        String   @id @default(cuid())
  streamId  String   @unique
  isLive    Boolean  @default(false)
  viewers   Int      @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  stream Stream @relation(fields: [streamId], references: [id])

  @@map("stream_status")
}

model Viewer {
  id        String   @id @default(cuid())
  streamId  String
  sessionId String
  joinedAt  DateTime @default(now())
  leftAt    DateTime?

  @@map("viewers")
}
PRISMASCHEMAEOF

# Create package.json for backend
cat > backend/package.json << 'BACKENDPACKAGEEOF'
{
  "name": "custom-restreamer-backend",
  "version": "1.0.0",
  "description": "Backend API for Custom Restreamer",
  "main": "dist/index.js",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "create-admin": "tsx src/scripts/create-admin.js"
  },
  "dependencies": {
    "express": "^4.19.2",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.4.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "ws": "^8.18.0",
    "@prisma/client": "^5.7.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/morgan": "^1.9.9",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/ws": "^8.5.10",
    "@types/node": "^20.10.5",
    "typescript": "^5.3.3",
    "tsx": "^4.6.2",
    "prisma": "^5.7.1"
  }
}
BACKENDPACKAGEEOF

# Create TypeScript config for backend
cat > backend/tsconfig.json << 'BACKENDTSCONFIGEOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
BACKENDTSCONFIGEOF

# Create create-admin script
cat > backend/src/scripts/create-admin.js << 'CREATEADMINEOF'
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = 'Admin User';

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists:', email);
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN'
      }
    });

    console.log('✅ Admin user created successfully:');
    console.log('   Email:', admin.email);
    console.log('   Name:', admin.name);
    console.log('   Role:', admin.role);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
CREATEADMINEOF

# Create complete Docker Compose
echo "🐳 Setting up Docker Compose..."
cat > docker-compose.yml << 'COMPOSEEOF'
version: '3.8'

services:
  # Database
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: custom_restreamer
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Backend API
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.final
    environment:
      DATABASE_URL: postgresql://postgres:password@postgres:5432/custom_restreamer
      PORT: 3001
      NODE_ENV: production
      CORS_ORIGIN: https://hive.restreamer.website
      WEBHOOK_SECRET: your-secret-key
      JWT_SECRET: your-jwt-secret
      PUBLIC_HLS_URL: https://hive.restreamer.website/hls
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy

  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.simple
    environment:
      NEXT_PUBLIC_API_URL: https://hive.restreamer.website
      NEXT_PUBLIC_WS_URL: wss://hive.restreamer.website
    ports:
      - "3000:3000"
    depends_on:
      - backend

  # Nginx (Simple reverse proxy - no RTMP for now)
  nginx:
    build:
      context: ./nginx
      dockerfile: Dockerfile.simple
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
COMPOSEEOF

# Create complete frontend Dockerfile
echo "🎨 Creating frontend Dockerfile..."
cat > frontend/Dockerfile.simple << 'FRONTENDFILEEOF'
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Copy static files to the correct location for standalone
RUN cp -r .next/static .next/standalone/.next/
RUN cp -r public .next/standalone/

# Expose port
EXPOSE 3000

# Start the application from the standalone directory
WORKDIR /app/.next/standalone
CMD ["node", "server.js"]
FRONTENDFILEEOF

# Create complete backend Dockerfile
echo "🔧 Creating backend Dockerfile..."
cat > backend/Dockerfile.final << 'BACKENDFILEEOF'
FROM node:20-alpine

# Install OpenSSL and other required libraries for Prisma
RUN apk add --no-cache openssl libc6-compat libssl3

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy ALL files from the backend directory
COPY . .

# Debug: Show what files were copied
RUN echo "=== Files in /app ===" && ls -la
RUN echo "=== Files in /app/src ===" && ls -la src/ || echo "src directory not found"
RUN echo "=== Looking for index.ts ===" && find . -name "index.ts" -type f

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Start the application with tsx
CMD ["npx", "tsx", "src/index.ts"]
BACKENDFILEEOF

# Create complete Nginx configuration
echo "🌐 Creating Nginx configuration..."
mkdir -p nginx
cat > nginx/Dockerfile.simple << 'NGINXFILEEOF'
FROM nginx:alpine

# Copy production nginx configuration
COPY nginx-production.conf /etc/nginx/nginx.conf

# Create HLS directory
RUN mkdir -p /var/www/hls

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]
NGINXFILEEOF

cat > nginx/nginx-production.conf << 'NGINXCONFEOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Upstream servers
    upstream backend {
        server backend:3001;
    }

    upstream frontend {
        server frontend:3000;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name hive.restreamer.website;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name hive.restreamer.website;

        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/hive.restreamer.website/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/hive.restreamer.website/privkey.pem;

        # SSL settings
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;

        # HLS files
        location /hls/ {
            root /var/www;
            add_header Cache-Control no-cache;
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods GET;
            add_header Access-Control-Allow-Headers Range;
        }

        # Next.js static files
        location /_next/static/ {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Cache static files
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Next.js static files (alternative path)
        location /static/ {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Cache static files
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API routes
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # WebSocket routes
        location /ws {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Frontend (catch-all for Next.js)
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;

            # Handle Next.js routing
            proxy_redirect off;
            proxy_buffering off;
        }
    }
}
NGINXCONFEOF

# Build and start services
echo "🚀 Building and starting services..."
docker-compose build
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Setup SSL certificates
echo "🔐 Setting up SSL certificates..."
if [ ! -d "/etc/letsencrypt/live/hive.restreamer.website" ]; then
    echo "📜 Getting SSL certificates with Certbot..."
    sudo docker-compose stop nginx
    sudo certbot certonly --standalone -d hive.restreamer.website --non-interactive --agree-tos --email damir.fatic@hotmail.com
    sudo docker-compose start nginx
else
    echo "✅ SSL certificates already exist"
fi

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run database migrations
echo "🗄️ Running database migrations..."
docker-compose exec backend npx prisma migrate deploy

# Create admin user
echo "👤 Creating admin user..."
docker-compose exec backend npx tsx src/scripts/create-admin.js

# Test the installation
echo "🧪 Testing installation..."
echo "Testing frontend..."
curl -f http://localhost:3000 > /dev/null && echo "✅ Frontend is working" || echo "❌ Frontend failed"

echo "Testing backend API..."
curl -f http://localhost:3000/api/health > /dev/null && echo "✅ Backend API is working" || echo "❌ Backend API failed"

echo "Testing admin page..."
curl -f http://localhost:3000/admin > /dev/null && echo "✅ Admin page is working" || echo "❌ Admin page failed"

echo ""
echo "🎉 Installation complete!"
echo "========================="
echo "Frontend: http://localhost:3000"
echo "Admin: http://localhost:3000/admin"
echo "API Health: http://localhost:3000/api/health"
echo ""
echo "To configure for your domain, run:"
echo "./scripts/configure-domain.sh your-domain.com"
echo ""
echo "To get SSL certificates, run:"
echo "sudo certbot certonly --standalone -d your-domain.com"
