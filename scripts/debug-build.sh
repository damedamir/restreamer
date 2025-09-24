#!/bin/bash

# Debug Docker Build Script
echo "🔍 Debugging Docker builds..."

# Test backend build with verbose output
echo "🔧 Testing backend build with debug info..."
cd backend

echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

echo "Files in src directory:"
ls -la src/

echo "TypeScript config:"
cat tsconfig.json

echo "Package.json:"
cat package.json

echo "Building Docker image..."
docker build -t custom-restreamer-backend-debug . --no-cache --progress=plain

if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed - check output above"
fi

cd ..

echo "Debug complete!"
