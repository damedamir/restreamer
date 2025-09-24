#!/bin/bash

# Fix Docker Permissions Script
echo "🔧 Fixing Docker permissions..."

# Add user to docker group
echo "👤 Adding user to docker group..."
sudo usermod -aG docker $USER

# Check if user is now in docker group
echo "🔍 Checking groups..."
groups $USER

echo ""
echo "✅ Docker permissions fixed!"
echo ""
echo "⚠️  IMPORTANT: You need to logout and login again for the changes to take effect."
echo ""
echo "After logging out and back in, run:"
echo "   cd ~/custom-restreamer"
echo "   ./scripts/setup.sh"
echo ""
echo "Or continue with sudo for now:"
echo "   sudo ./scripts/setup-sudo.sh"
