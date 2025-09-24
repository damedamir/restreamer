#!/bin/bash

# One-liner installation script
# This script downloads and runs the complete setup

set -e

echo "🚀 Custom Restreamer - One-Click Installation"
echo "=============================================="
echo ""

# Check if running on Ubuntu/Debian
if ! command -v apt-get &> /dev/null; then
    echo "❌ This script requires Ubuntu/Debian"
    exit 1
fi

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    echo "❌ Please run as a regular user with sudo privileges"
    exit 1
fi

# Download and run setup
echo "📥 Downloading and running setup script..."
curl -fsSL https://raw.githubusercontent.com/damedamir/custom-restreamer/main/setup-server.sh | bash

echo ""
echo "✅ Installation complete!"
echo "🌐 Your streaming platform is ready!"