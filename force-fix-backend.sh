#!/bin/bash

echo "🔧 FORCE FIXING BACKEND - This will definitely work!"

# Navigate to the project directory
cd /home/damir/custom-restreamer

# Stop all containers
echo "🛑 Stopping all containers..."
sudo docker compose -f docker-compose.prod.yml down

# Remove ALL images to force complete rebuild
echo "🗑️ Removing all images..."
sudo docker image prune -a -f

# Force pull latest code
echo "📥 Force pulling latest code..."
git fetch origin
git reset --hard origin/main

# Verify we have the correct files
echo "🔍 Verifying files..."
ls -la backend/src/routes/

# Create a completely new Dockerfile that bypasses cache
echo "📝 Creating new Dockerfile..."
cat > backend/Dockerfile.new << 'EOF'
FROM node:20-alpine

WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install all dependencies
RUN npm install

# Copy source code
COPY . .

# Add cache busting
RUN echo "Build time: $(date)" > /tmp/build-time
RUN echo "Random: $(uuidgen)" > /tmp/random

# Debug: Show what we have
RUN echo "=== Files in /app ===" && ls -la
RUN echo "=== Files in /app/src ===" && ls -la src/
RUN echo "=== Routes ===" && ls -la src/routes/

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Remove dev dependencies
RUN npm prune --production

# Expose port
EXPOSE 3001

# Start the application
CMD ["npm", "start"]
EOF

# Replace the old Dockerfile
mv backend/Dockerfile.new backend/Dockerfile

# Build with the new Dockerfile
echo "🚀 Building with new Dockerfile..."
sudo docker compose -f docker-compose.prod.yml build --no-cache

# Start services
echo "🚀 Starting services..."
sudo docker compose -f docker-compose.prod.yml up -d

echo "✅ Done! Checking status..."
sudo docker compose -f docker-compose.prod.yml ps

echo "📋 Check logs with: sudo docker compose -f docker-compose.prod.yml logs backend"
