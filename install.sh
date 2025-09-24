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

# Check if we're already in the project directory
if [ -f "package.json" ] && [ -f "docker-compose.yml" ]; then
    echo "📁 Already in Custom Restreamer directory"
    PROJECT_DIR="."
else
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
    PROJECT_DIR="."
fi

# Make scripts executable
chmod +x scripts/*.sh 2>/dev/null || true
chmod +x deploy.sh 2>/dev/null || true

# Install dependencies
echo "🔧 Installing dependencies..."
if [ -f "scripts/install-dependencies.sh" ]; then
    ./scripts/install-dependencies.sh
else
    echo "❌ Dependencies script not found. Please check the repository."
    exit 1
fi

# Check if user needs to logout
if ! groups $USER | grep -q docker; then
    echo ""
    echo "⚠️  IMPORTANT: You need to logout and login again for Docker group changes to take effect!"
    echo "   After logging out and back in, run:"
    echo "   cd custom-restreamer && ./scripts/setup.sh"
    echo ""
    echo "Or continue with sudo for now:"
    echo "   sudo ./scripts/setup-sudo.sh"
    exit 0
fi

# Setup application
echo "🚀 Setting up application..."
if [ -f "scripts/setup.sh" ]; then
    ./scripts/setup.sh
else
    echo "❌ Setup script not found. Please check the repository."
    exit 1
fi

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