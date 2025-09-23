#!/bin/bash

# Custom Restreamer - One-Line Installation Script
echo "🚀 Custom Restreamer - One-Line Installation"
echo "=============================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first:"
    echo "   sudo apt update && sudo apt install -y git"
    exit 1
fi

# Clone repository if not exists
if [ ! -d "custom-restreamer" ]; then
    echo "📥 Cloning repository..."
    git clone https://github.com/damedamir/custom-restreamer.git
    cd custom-restreamer
else
    echo "📁 Repository already exists, updating..."
    cd custom-restreamer
    git pull origin main
fi

# Make scripts executable
chmod +x scripts/*.sh

# Install dependencies
echo "🔧 Installing dependencies..."
./scripts/install-dependencies.sh

# Check if user needs to logout
if ! groups $USER | grep -q docker; then
    echo ""
    echo "⚠️  IMPORTANT: You need to logout and login again for Docker group changes to take effect!"
    echo "   After logging out and back in, run:"
    echo "   cd custom-restreamer && ./scripts/setup.sh"
    exit 0
fi

# Setup application
echo "🚀 Setting up application..."
./scripts/setup.sh

echo ""
echo "🎉 Installation complete!"
echo ""
echo "📱 Your application is now running at:"
echo "   http://localhost:3000"
echo ""
echo "🔑 Admin credentials:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo "Happy streaming! 🎥"
