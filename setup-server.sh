#!/bin/bash

# Complete Server Setup Script for Custom Restreamer
# This script installs everything from scratch on a new Ubuntu server

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to generate random strings
generate_random_string() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-32
}

# Function to check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        print_error "This script should not be run as root for security reasons"
        print_status "Please run as a regular user with sudo privileges"
        exit 1
    fi
}

# Function to check if user has sudo privileges
check_sudo() {
    # Check if user is in sudo group or can run sudo
    if ! groups | grep -q sudo && ! sudo -v 2>/dev/null; then
        print_error "This script requires sudo privileges"
        print_status "Please ensure your user has sudo access"
        print_status "You can add your user to sudo group with: sudo usermod -aG sudo $USER"
        exit 1
    fi
    print_success "Sudo privileges confirmed"
}

# Function to cleanup previous installation
cleanup_previous() {
    print_status "Cleaning up previous installation..."
    
    # Stop and remove existing containers
    if command -v docker-compose &> /dev/null; then
        if [[ -f "docker-compose.prod.yml" ]]; then
            docker-compose -f docker-compose.prod.yml down -v 2>/dev/null || true
        fi
        if [[ -f "docker-compose.srs.yml" ]]; then
            docker-compose -f docker-compose.srs.yml down -v 2>/dev/null || true
        fi
    fi
    
    # Remove existing project directory
    if [[ -d "custom-restreamer" ]]; then
        print_status "Removing existing project directory..."
        rm -rf custom-restreamer
    fi
    
    # Stop systemd service if exists
    if systemctl is-active --quiet custom-restreamer 2>/dev/null; then
        print_status "Stopping existing service..."
        sudo systemctl stop custom-restreamer 2>/dev/null || true
        sudo systemctl disable custom-restreamer 2>/dev/null || true
    fi
    
    print_success "Cleanup completed"
}

# Function to get user input with default values
get_input() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [[ -n "$default" ]]; then
        read -p "$prompt [$default]: " input
        eval "$var_name=\${input:-$default}"
    else
        read -p "$prompt: " input
        eval "$var_name=\"$input\""
    fi
}

# Function to install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install required packages
    sudo apt-get install -y \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    sudo mkdir -p /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    
    # Set up the repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    sudo apt-get update
    
    # Install Docker Engine
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully"
}

# Function to install additional tools
install_tools() {
    print_status "Installing additional tools..."
    
    sudo apt-get update
    sudo apt-get install -y \
        git \
        curl \
        wget \
        unzip \
        nano \
        htop \
        ufw \
        certbot \
        python3-certbot-nginx
    
    print_success "Additional tools installed"
}

# Function to configure firewall
configure_firewall() {
    print_status "Configuring firewall..."
    
    # Enable UFW
    sudo ufw --force enable
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80
    sudo ufw allow 443
    
    # Allow RTMP
    sudo ufw allow 1935
    
    # Allow SRS API (optional, for debugging)
    sudo ufw allow 1985
    
    print_success "Firewall configured"
}

# Function to clone repository
clone_repository() {
    print_status "Cloning repository..."
    
    if [[ -d "custom-restreamer" ]]; then
        print_status "Repository already exists, updating..."
        cd custom-restreamer
        git pull origin main
    else
        print_status "Cloning repository..."
        git clone https://github.com/damedamir/custom-restreamer.git
        cd custom-restreamer
    fi
    
    print_success "Repository ready"
}

# Function to get domain configuration
get_domain_config() {
    print_status "Domain Configuration"
    echo "=================================="
    
    if [[ -t 0 ]]; then
        # Interactive mode
        get_input "Enter your domain name" "hive.restreamer.website" "DOMAIN"
        get_input "Enter your email for SSL certificates" "" "EMAIL"
    else
        # Non-interactive mode - use defaults
        DOMAIN="hive.restreamer.website"
        EMAIL="admin@hive.restreamer.website"
        print_status "Using default domain: $DOMAIN"
        print_status "Using default email: $EMAIL"
    fi
    
    # Generate secure passwords and secrets
    DB_PASSWORD=$(generate_random_string)
    JWT_SECRET=$(generate_random_string)
    
    print_success "Configuration generated"
}

# Function to create environment file
create_env_file() {
    print_status "Creating environment configuration..."
    
    cat > .env << EOF
# Production Environment Variables
# Generated on $(date)

# Database
POSTGRES_PASSWORD=$DB_PASSWORD

# JWT Secret
JWT_SECRET=$JWT_SECRET

# CORS Origins
CORS_ORIGIN=https://$DOMAIN,https://www.$DOMAIN

# Frontend API URL
NEXT_PUBLIC_API_URL=https://$DOMAIN

# SSL Configuration
LETSENCRYPT_EMAIL=$EMAIL
LETSENCRYPT_HOST=$DOMAIN
EOF

    print_success "Environment file created"
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    # Create SSL directory
    sudo mkdir -p /etc/nginx/ssl
    
    # Generate self-signed certificate for initial setup
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout /etc/nginx/ssl/privkey.pem \
        -out /etc/nginx/ssl/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"
    
    print_success "SSL certificates generated"
}

# Function to create production nginx config
create_nginx_config() {
    print_status "Creating production Nginx configuration..."
    
    # Debug: Show current directory and files
    print_status "Current directory: $(pwd)"
    print_status "Files in current directory: $(ls -la)"
    
    # Update nginx config with domain
    if [[ -f "nginx/nginx-production.conf" ]]; then
        # Create the output file with proper directory structure
        mkdir -p nginx
        sed "s/hive\.restreamer\.website/$DOMAIN/g" nginx/nginx-production.conf > nginx/nginx-production-domain.conf
        print_success "Nginx configuration updated for domain: $DOMAIN"
    else
        print_warning "nginx/nginx-production.conf not found, using default configuration"
        print_status "Available nginx files: $(ls -la nginx/ 2>/dev/null || echo 'nginx directory not found')"
    fi
}

# Function to create systemd service
create_systemd_service() {
    print_status "Creating systemd service..."
    
    # Determine the correct docker compose command
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="/usr/bin/docker-compose"
    elif docker compose version &> /dev/null; then
        COMPOSE_CMD="/usr/bin/docker compose"
    else
        COMPOSE_CMD="/usr/bin/docker compose"
    fi
    
    sudo tee /etc/systemd/system/custom-restreamer.service > /dev/null << EOF
[Unit]
Description=Custom Restreamer
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$(pwd)
ExecStart=$COMPOSE_CMD -f docker-compose.prod.yml up -d
ExecStop=$COMPOSE_CMD -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable custom-restreamer.service
    
    print_success "Systemd service created and enabled"
}

# Function to deploy application
deploy_application() {
    print_status "Deploying application..."
    
    # Check if docker-compose is available
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        print_error "Docker Compose not found. Please install Docker Compose."
        exit 1
    fi
    
    print_status "Using Docker Compose command: $COMPOSE_CMD"
    
    # Check if user can access Docker, if not use sudo
    if ! docker ps &> /dev/null; then
        print_status "Using sudo for Docker commands (user not in docker group yet)..."
        SUDO_CMD="sudo"
    else
        SUDO_CMD=""
    fi
    
    # Pull latest code
    print_status "Pulling latest code..."
    git pull origin main
    
    # Start services
    print_status "Starting Docker services..."
    if [ -n "$SUDO_CMD" ]; then
        sudo $COMPOSE_CMD -f docker-compose.prod.yml up -d --build --no-cache
    else
        $COMPOSE_CMD -f docker-compose.prod.yml up -d --build --no-cache
    fi
    
    # Wait for services to be ready
    print_status "Waiting for services to start..."
    sleep 30
    
    # Wait for backend container to be ready
    print_status "Waiting for backend container to be ready..."
    for i in {1..30}; do
        if [ -n "$SUDO_CMD" ]; then
            if sudo docker ps | grep -q backend; then
                break
            fi
        else
            if docker ps | grep -q backend; then
                break
            fi
        fi
        print_status "Waiting for backend container... ($i/30)"
        sleep 2
    done
    
    # Get the actual backend container name
    print_status "Finding backend container..."
    if [ -n "$SUDO_CMD" ]; then
        BACKEND_CONTAINER=$(sudo docker ps --format "table {{.Names}}" | grep backend | head -1)
    else
        BACKEND_CONTAINER=$(docker ps --format "table {{.Names}}" | grep backend | head -1)
    fi
    
    if [ -z "$BACKEND_CONTAINER" ]; then
        print_error "Backend container not found!"
        return 1
    fi
    
    print_status "Found backend container: $BACKEND_CONTAINER"
    
    # Initialize database
    print_status "Initializing database..."
    if [ -n "$SUDO_CMD" ]; then
        sudo docker exec $BACKEND_CONTAINER npx prisma db push
    else
        docker exec $BACKEND_CONTAINER npx prisma db push
    fi
    
    # Seed database
    print_status "Seeding database..."
    if [ -n "$SUDO_CMD" ]; then
        sudo docker exec $BACKEND_CONTAINER npm run seed
    else
        docker exec $BACKEND_CONTAINER npm run seed
    fi
    
    print_success "Application deployed successfully"
}

# Function to create admin user
create_admin_user() {
    print_status "Creating admin user..."
    
    # Generate admin credentials
    ADMIN_EMAIL="admin@$DOMAIN"
    ADMIN_PASSWORD=$(generate_random_string | cut -c1-12)
    
    # Create admin user via API
    sleep 10  # Wait for backend to be ready
    
    curl -X POST "http://localhost:3001/api/auth/register" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"$ADMIN_EMAIL\",
            \"password\": \"$ADMIN_PASSWORD\",
            \"name\": \"Admin User\"
        }" || print_warning "Admin user creation failed, you may need to create manually"
    
    print_success "Admin user created"
    print_status "Admin Email: $ADMIN_EMAIL"
    print_status "Admin Password: $ADMIN_PASSWORD"
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Determine the correct docker compose command
    if command -v docker-compose &> /dev/null; then
        COMPOSE_CMD="docker-compose"
    elif docker compose version &> /dev/null; then
        COMPOSE_CMD="docker compose"
    else
        COMPOSE_CMD="docker compose"
    fi
    
    # Check if user can access Docker, if not use sudo
    if ! docker ps &> /dev/null; then
        SUDO_CMD="sudo"
    else
        SUDO_CMD=""
    fi
    
    # Check if services are running
    if [ -n "$SUDO_CMD" ]; then
        if sudo $COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q "Up"; then
            print_success "All services are running"
        else
            print_error "Some services failed to start"
            return 1
        fi
    else
        if $COMPOSE_CMD -f docker-compose.prod.yml ps | grep -q "Up"; then
            print_success "All services are running"
        else
            print_error "Some services failed to start"
            return 1
        fi
    fi
    
    # Test API endpoints
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        print_success "Backend API is healthy"
    else
        print_warning "Backend API health check failed"
    fi
    
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend health check failed"
    fi
    
    if curl -f http://localhost:1985/api/v1/streams/ > /dev/null 2>&1; then
        print_success "SRS server is running"
    else
        print_warning "SRS server health check failed"
    fi
}

# Function to display final information
display_final_info() {
    print_success "Setup completed successfully!"
    echo ""
    echo "=================================="
    echo "🎉 CUSTOM RESTREAMER DEPLOYED"
    echo "=================================="
    echo ""
    echo "🌐 Access URLs:"
    echo "   Frontend: https://$DOMAIN"
    echo "   Admin: https://$DOMAIN/admin"
    echo "   API: https://$DOMAIN/api"
    echo ""
    echo "📡 Streaming:"
    echo "   RTMP: rtmp://$DOMAIN:1935/live"
    echo "   SRS API: https://$DOMAIN:1985"
    echo ""
    echo "🔑 Admin Credentials:"
    echo "   Email: admin@$DOMAIN"
    echo "   Password: $ADMIN_PASSWORD"
    echo ""
    echo "📊 Management:"
    echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo "   Restart: sudo systemctl restart custom-restreamer"
    echo "   Stop: sudo systemctl stop custom-restreamer"
    echo "   Start: sudo systemctl start custom-restreamer"
    echo ""
    echo "🔧 Configuration:"
    echo "   Environment: $(pwd)/.env"
    echo "   Logs: docker-compose -f docker-compose.prod.yml logs"
    echo ""
    echo "⚠️  Important:"
    echo "   - Change admin password after first login"
    echo "   - Backup your .env file securely"
    echo "   - Monitor logs for any issues"
    echo ""
    print_success "Deployment complete! 🚀"
}

# Main execution
main() {
    echo "=================================="
    echo "🚀 CUSTOM RESTREAMER SETUP"
    echo "=================================="
    echo ""
    echo "This script will install and configure:"
    echo "  - Docker and Docker Compose"
    echo "  - Custom Restreamer application"
    echo "  - SSL certificates"
    echo "  - Database and admin user"
    echo "  - Firewall configuration"
    echo ""
    
    # Pre-flight checks
    check_root
    check_sudo
    
    # Get user confirmation
    if [[ -t 0 ]]; then
        # Interactive mode
        read -p "Do you want to continue? (y/N): " confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            print_status "Setup cancelled"
            exit 0
        fi
    else
        # Non-interactive mode (piped from curl)
        print_status "Running in non-interactive mode..."
        confirm="y"
    fi
    
    # Cleanup previous installation
    cleanup_previous
    
    # Installation steps
    install_docker
    install_tools
    configure_firewall
    clone_repository
    get_domain_config
    create_env_file
    setup_ssl
    create_nginx_config
    create_systemd_service
    deploy_application
    create_admin_user
    run_health_checks
    display_final_info
}

# Run main function
main "$@"
