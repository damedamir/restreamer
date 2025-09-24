#!/bin/bash

# Check Backend Files Script
echo "🔍 Checking backend source files..."

echo "Current directory: $(pwd)"
echo "Backend directory contents:"
ls -la backend/

echo ""
echo "Backend src directory contents:"
ls -la backend/src/

echo ""
echo "Looking for index.ts:"
find backend -name "index.ts" -type f

echo ""
echo "Backend package.json:"
cat backend/package.json

echo ""
echo "Backend tsconfig.json:"
cat backend/tsconfig.json
