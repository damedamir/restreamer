#!/bin/bash

# Test Frontend Build Script
echo "🧪 Testing frontend build..."

# Test frontend build
echo "🔧 Testing frontend build..."
cd frontend

# Check if Next.js is installed
if ! command -v next &> /dev/null; then
    echo "Installing Next.js dependencies..."
    npm install
fi

# Test Next.js build
echo "Building Next.js application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
    echo "Build output:"
    ls -la .next/
else
    echo "❌ Frontend build failed"
    exit 1
fi

cd ..

echo "🎉 Frontend build test successful!"
