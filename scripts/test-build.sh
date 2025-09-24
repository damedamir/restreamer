#!/bin/bash

# Test Docker Build Script
echo "🧪 Testing Docker builds..."

# Test backend build
echo "🔧 Testing backend build..."
cd backend
docker build -t custom-restreamer-backend-test .
if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi
cd ..

# Test frontend build
echo "🔧 Testing frontend build..."
cd frontend
docker build -t custom-restreamer-frontend-test .
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi
cd ..

echo "🎉 All builds successful!"
echo ""
echo "You can now run:"
echo "  docker-compose up -d --build"
