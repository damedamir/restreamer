# Custom Restreamer - Complete Installation Guide

## 🚀 Quick Installation (Ubuntu/Debian)

### **Step 1: Install Dependencies**

```bash
# Clone the repository
git clone https://github.com/damedamir/custom-restreamer.git
cd custom-restreamer

# Install all dependencies (Docker, Certbot, Nginx, etc.)
./scripts/install-dependencies.sh

# Logout and login again to apply Docker group changes
logout
# (login again)
```

### **Step 2: Setup Application**

```bash
# Run the automated setup
./scripts/setup.sh
```

**That's it!** Your app will be running at `http://localhost:3000`

## 🔧 What Gets Installed

### **Dependencies:**
- ✅ **Docker** - Container runtime
- ✅ **Docker Compose** - Multi-container orchestration
- ✅ **Certbot** - SSL certificate management
- ✅ **Nginx** - Web server with RTMP module
- ✅ **Node.js** - JavaScript runtime
- ✅ **UFW Firewall** - Security configuration

### **Services:**
- ✅ **PostgreSQL** - Database
- ✅ **Backend API** - Express.js server
- ✅ **Frontend** - Next.js application
- ✅ **Nginx** - Reverse proxy + RTMP server

## 🌐 Production Deployment

### **For Your Domain (hive.restreamer.website):**

```bash
# 1. Install dependencies
./scripts/install-dependencies.sh

# 2. Configure for your domain
./scripts/configure-domain.sh hive.restreamer.website

# 3. Get SSL certificate
sudo certbot certonly --standalone -d hive.restreamer.website

# 4. Start production
docker-compose down && docker-compose up -d
```

## 📋 Manual Installation Steps

If you prefer to install manually:

### **1. Install Docker**
```bash
# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Update and install
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
```

### **2. Install Docker Compose**
```bash
# Get latest version
COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)

# Download and install
sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### **3. Install Certbot**
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### **4. Install Nginx with RTMP**
```bash
# Add Nginx repository
sudo add-apt-repository -y ppa:nginx/development
sudo apt update

# Install Nginx with RTMP module
sudo apt install -y nginx libnginx-mod-rtmp
```

### **5. Configure Firewall**
```bash
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 1935
sudo ufw --force enable
```

## 🔍 Verification

### **Check if everything is installed:**
```bash
# Check Docker
docker --version
docker-compose --version

# Check Certbot
certbot --version

# Check Nginx
nginx -v

# Check if Docker is running
docker info
```

### **Test the application:**
```bash
# Check if services are running
docker-compose ps

# Check logs
docker-compose logs -f

# Test endpoints
curl http://localhost:3000
curl http://localhost:3001/health
```

## 🐛 Troubleshooting

### **Common Issues:**

**1. Docker permission denied:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
# Logout and login again
```

**2. Port already in use:**
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001
sudo netstat -tulpn | grep :1935

# Stop conflicting services
sudo systemctl stop nginx
sudo systemctl stop apache2
```

**3. SSL certificate issues:**
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

**4. Database connection issues:**
```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

## 📊 Management Commands

### **Service Management:**
```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### **Database Management:**
```bash
# Access database
docker-compose exec postgres psql -U postgres -d custom_restreamer

# Run migrations
docker-compose exec backend npx prisma db push

# Create admin user
docker-compose exec backend npm run create-admin
```

### **SSL Certificate Management:**
```bash
# Get new certificate
sudo certbot certonly --standalone -d yourdomain.com

# Renew certificates
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

## 🔒 Security

### **Firewall Configuration:**
```bash
# Check firewall status
sudo ufw status

# Allow specific ports
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 1935

# Deny specific ports
sudo ufw deny 3000
sudo ufw deny 3001
```

### **SSL Security:**
```bash
# Test SSL configuration
curl -I https://yourdomain.com

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/
```

## 📈 Performance

### **Server Optimization:**
```bash
# Increase file limits
echo "* soft nofile 65536" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65536" | sudo tee -a /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.somaxconn = 65536" | sudo tee -a /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

## 🆘 Support

- **Documentation**: [README.md](./README.md)
- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Issues**: GitHub Issues

---

**Happy Streaming! 🎥**