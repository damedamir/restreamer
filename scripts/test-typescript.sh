#!/bin/bash

# Test TypeScript Build Script
echo "🧪 Testing TypeScript builds..."

# Test backend TypeScript build
echo "🔧 Testing backend TypeScript build..."
cd backend

# Check if TypeScript is installed
if ! command -v tsc &> /dev/null; then
    echo "Installing TypeScript..."
    npm install -g typescript
fi

# Test TypeScript compilation
echo "Compiling TypeScript..."
npx tsc --noEmit

if [ $? -eq 0 ]; then
    echo "✅ Backend TypeScript compilation successful"
else
    echo "❌ Backend TypeScript compilation failed"
    echo "Checking source files..."
    ls -la src/
    echo "Checking tsconfig.json..."
    cat tsconfig.json
    exit 1
fi

cd ..

echo "🎉 TypeScript build test successful!"
