#!/bin/bash

# Custom Restreamer Dependencies Installation Script
echo "🔧 Installing dependencies for Custom Restreamer..."

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "❌ Please don't run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Update system packages
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
echo "📦 Installing required packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Docker
echo "🐳 Installing Docker..."
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Add Docker repository
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index
    sudo apt update
    
    # Install Docker Engine
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    echo "✅ Docker installed successfully"
else
    echo "✅ Docker is already installed"
fi

# Install Docker Compose (standalone)
echo "🐳 Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    # Get latest version
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Download and install
    sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo "✅ Docker Compose installed successfully"
else
    echo "✅ Docker Compose is already installed"
fi

# Install Certbot
echo "🔒 Installing Certbot..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
    
    echo "✅ Certbot installed successfully"
else
    echo "✅ Certbot is already installed"
fi

# Install Nginx (for RTMP module)
echo "🌐 Installing Nginx with RTMP module..."
if ! command -v nginx &> /dev/null; then
    # Add Nginx repository
    sudo add-apt-repository -y ppa:nginx/development
    
    # Update package index
    sudo apt update
    
    # Install Nginx with RTMP module
    sudo apt install -y nginx libnginx-mod-rtmp
    
    echo "✅ Nginx with RTMP module installed successfully"
else
    echo "✅ Nginx is already installed"
fi

# Install Node.js (for development)
echo "📦 Installing Node.js..."
if ! command -v node &> /dev/null; then
    # Install Node.js 20.x
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    
    echo "✅ Node.js installed successfully"
else
    echo "✅ Node.js is already installed"
fi

# Configure firewall
echo "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow ssh
    sudo ufw allow 80
    sudo ufw allow 443
    sudo ufw allow 1935
    sudo ufw --force enable
    echo "✅ Firewall configured"
else
    echo "⚠️  UFW not available, please configure firewall manually"
fi

# Create necessary directories
echo "📁 Creating directories..."
sudo mkdir -p /var/www/hls
sudo chown -R $USER:$USER /var/www/hls
sudo chmod -R 755 /var/www/hls

# Start Docker service
echo "🚀 Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Verify installations
echo "🔍 Verifying installations..."
echo "Docker version: $(docker --version 2>/dev/null || echo 'Not installed')"
echo "Docker Compose version: $(docker-compose --version 2>/dev/null || echo 'Not installed')"
echo "Certbot version: $(certbot --version 2>/dev/null || echo 'Not installed')"
echo "Nginx version: $(nginx -v 2>&1 || echo 'Not installed')"
echo "Node.js version: $(node --version 2>/dev/null || echo 'Not installed')"

echo ""
echo "🎉 Dependencies installation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Logout and login again to apply Docker group changes"
echo "2. Run the setup script:"
echo "   ./scripts/setup.sh"
echo ""
echo "⚠️  Important: You need to logout and login again for Docker group changes to take effect!"
echo ""
echo "Happy streaming! 🎥"