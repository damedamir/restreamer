#!/bin/bash

# Server Deployment Script for Restreamer Pro
# This script ensures all containers are rebuilt with the latest configuration

echo "🚀 Starting server deployment..."

# Pull latest changes
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Stop all containers
echo "🛑 Stopping all containers..."
docker compose down

# Remove old containers and volumes to ensure clean rebuild
echo "🧹 Cleaning up old containers and volumes..."
docker system prune -f
docker volume prune -f

# Rebuild and start all services
echo "🔨 Rebuilding and starting all services..."
docker compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Check service status
echo "📊 Checking service status..."
docker compose ps

# Test main website
echo "🌐 Testing main website..."
curl -I https://restreamer.website

# Test API
echo "🔌 Testing API..."
curl -s https://restreamer.website/api/health

echo "✅ Server deployment complete!"
echo "🌐 Website: https://restreamer.website"
echo "📊 Admin: https://restreamer.website/admin"
