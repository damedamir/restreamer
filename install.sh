#!/bin/bash

# One-liner installation for Custom Restreamer
# Usage: curl -sSL https://raw.githubusercontent.com/damedamir/custom-restreamer/main/install.sh | bash

set -e

echo "🚀 Custom Restreamer - One-Line Installation"
echo "============================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run as root. Run as regular user."
    exit 1
fi

# Install dependencies if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please logout and login again, then run this script again."
    exit 0
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if user is in docker group
if ! groups $USER | grep -q docker; then
    echo "🔧 Adding user to docker group..."
    sudo usermod -aG docker $USER
    echo "✅ User added to docker group. Please logout and login again, then run this script again."
    exit 0
fi

# Clone or update repository
if [ -d "custom-restreamer" ]; then
    echo "📁 Updating existing installation..."
    cd custom-restreamer
    git pull origin main
else
    echo "📁 Cloning repository..."
    git clone https://github.com/damedamir/custom-restreamer.git
    cd custom-restreamer
fi

# Run the complete installation
echo "🚀 Running complete installation..."
chmod +x install-complete.sh
./install-complete.sh

echo ""
echo "🎉 Installation complete!"
echo "========================="
echo "Frontend: http://localhost:3000"
echo "Admin: http://localhost:3000/admin"
echo "API Health: http://localhost:3000/api/health"
echo ""
echo "To configure for your domain, run:"
echo "cd custom-restreamer && ./scripts/configure-domain.sh your-domain.com"