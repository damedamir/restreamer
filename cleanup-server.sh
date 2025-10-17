#!/bin/bash

# Complete Server Cleanup Script
# This script removes all traces of the previous installation
# Run this before doing a fresh installation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_header() {
    echo -e "${BLUE}"
    echo "=========================================="
    echo "$1"
    echo "=========================================="
    echo -e "${NC}"
}

# Main cleanup function
main() {
    print_header "🧹 Complete Server Cleanup"
    
    print_info "This script will remove ALL Docker containers, volumes, networks, and images"
    print_warning "This action cannot be undone!"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        print_info "Cleanup cancelled by user"
        exit 0
    fi
    
    print_header "🛑 Stopping All Containers"
    print_info "Stopping all running containers..."
    if docker ps -q | grep -q .; then
        docker stop $(docker ps -q) 2>/dev/null || true
        print_success "All containers stopped"
    else
        print_info "No running containers found"
    fi
    
    print_header "🗑️  Removing All Containers"
    print_info "Removing all containers..."
    if docker ps -aq | grep -q .; then
        docker rm $(docker ps -aq) 2>/dev/null || true
        print_success "All containers removed"
    else
        print_info "No containers found"
    fi
    
    print_header "📦 Removing All Volumes"
    print_info "Removing all Docker volumes..."
    if docker volume ls -q | grep -q .; then
        docker volume rm $(docker volume ls -q) 2>/dev/null || true
        print_success "All volumes removed"
    else
        print_info "No volumes found"
    fi
    
    print_header "🌐 Removing All Networks"
    print_info "Removing all Docker networks..."
    if docker network ls -q | grep -q .; then
        # Skip default networks
        docker network ls -q | grep -v -E '^(bridge|host|none)$' | xargs -r docker network rm 2>/dev/null || true
        print_success "All custom networks removed"
    else
        print_info "No custom networks found"
    fi
    
    print_header "🖼️  Removing All Images"
    print_info "Removing all Docker images..."
    if docker images -q | grep -q .; then
        docker rmi $(docker images -q) 2>/dev/null || true
        print_success "All images removed"
    else
        print_info "No images found"
    fi
    
    print_header "🧽 Deep Clean Docker System"
    print_info "Running deep Docker system cleanup..."
    docker system prune -a -f --volumes
    print_success "Docker system cleaned"
    
    print_header "📁 Cleaning Project Directory"
    print_info "Removing project directory..."
    
    # Remove from home directory
    if [ -d "$HOME/my-server/restreamer" ]; then
        print_info "Removing $HOME/my-server/restreamer..."
        rm -rf "$HOME/my-server/restreamer"
        print_success "Project directory removed from home"
    else
        print_info "Project directory not found in home"
    fi
    
    # Remove from current directory
    if [ -d "restreamer" ]; then
        print_info "Removing local restreamer directory..."
        rm -rf restreamer
        print_success "Local restreamer directory removed"
    else
        print_info "No local restreamer directory found"
    fi
    
    # Remove from my-server directory if we're there
    if [ -d "my-server/restreamer" ]; then
        print_info "Removing my-server/restreamer directory..."
        rm -rf my-server/restreamer
        print_success "my-server/restreamer directory removed"
    fi
    
    print_header "🔄 Re-cloning Repository"
    print_info "Creating fresh project directory..."
    mkdir -p "$HOME/my-server"
    cd "$HOME/my-server"
    
    print_info "Current directory: $(pwd)"
    print_info "Directory contents before clone:"
    ls -la
    
    print_info "Cloning repository..."
    # Force remove any existing restreamer directory
    if [ -d "restreamer" ]; then
        print_info "Force removing existing restreamer directory..."
        rm -rf restreamer
        print_success "Existing directory removed"
    fi
    
    # Double check it's gone
    if [ -d "restreamer" ]; then
        print_error "Directory still exists after removal attempt!"
        print_info "Trying alternative removal method..."
        sudo rm -rf restreamer 2>/dev/null || true
        if [ -d "restreamer" ]; then
            print_error "Failed to remove directory. Please remove manually:"
            print_info "rm -rf $HOME/my-server/restreamer"
            exit 1
        fi
    fi
    
    # Clone with retry mechanism
    for i in {1..3}; do
        if git clone https://github.com/damedamir/restreamer.git; then
            print_success "Repository cloned successfully"
            break
        else
            print_warning "Clone attempt $i failed, retrying..."
            if [ $i -eq 3 ]; then
                print_error "Failed to clone repository after 3 attempts"
                exit 1
            fi
            sleep 2
        fi
    done
    
    cd restreamer
    
    print_header "🧹 Removing Generated Files"
    print_info "Removing any generated configuration files..."
    rm -f .env
    rm -f docker-compose.production.yml
    rm -f docker-compose.traefik.yml
    rm -f deploy.sh
    rm -f setup-default-config.sh
    print_success "Generated files removed"
    
    # Ensure we're in the correct directory
    if [ ! -f "install.sh" ]; then
        print_error "install.sh not found! Something went wrong with the clone."
        print_info "Current directory: $(pwd)"
        print_info "Directory contents:"
        ls -la
        exit 1
    fi
    
    print_header "✅ Verification"
    print_info "Verifying clean state..."
    
    echo ""
    print_info "Docker containers:"
    docker ps -a || print_info "No containers"
    
    echo ""
    print_info "Docker volumes:"
    docker volume ls || print_info "No volumes"
    
    echo ""
    print_info "Docker networks:"
    docker network ls || print_info "No custom networks"
    
    echo ""
    print_info "Docker images:"
    docker images || print_info "No images"
    
    echo ""
    print_info "Project directory contents:"
    ls -la
    
    print_header "🎉 Cleanup Complete!"
    print_success "Server is now completely clean and ready for fresh installation"
    print_info "Next steps:"
    echo "  1. Run: chmod +x install.sh"
    echo "  2. Run: ./install.sh"
    echo "  3. Run: ./deploy.sh"
    echo "  4. Run: ./setup-default-config.sh"
    echo ""
    print_info "Current directory: $(pwd)"
}

# Error handling
trap 'print_error "Script failed at line $LINENO"' ERR

# Run main function
main "$@"
