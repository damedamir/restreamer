#!/bin/bash

# Verify Source Files Script
echo "🔍 Verifying source files..."

echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

echo ""
echo "Backend directory:"
ls -la backend/

echo ""
echo "Backend src directory:"
ls -la backend/src/

echo ""
echo "Backend src files:"
find backend/src -name "*.ts" -type f

echo ""
echo "TypeScript config:"
cat backend/tsconfig.json

echo ""
echo "Package.json scripts:"
grep -A 10 '"scripts"' backend/package.json

echo ""
echo "Testing TypeScript compilation locally:"
cd backend
npx tsc --noEmit --listFiles | head -20
