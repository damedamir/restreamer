# Custom Restreamer - Deployment Guide

## 🌐 Deploy to Any Domain

### **Quick Deployment (Any Domain)**

```bash
# 1. Clone and setup
git clone https://github.com/damedamir/custom-restreamer.git
cd custom-restreamer
./scripts/setup.sh

# 2. Configure for your domain
./scripts/configure-domain.sh yourdomain.com

# 3. Get SSL certificate
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# 4. Restart with SSL
docker-compose down && docker-compose up -d
```

**That's it!** Your app is now running on `https://yourdomain.com`

## 🚀 Deployment Options

### **Option 1: Local Development**
```bash
./scripts/setup.sh
# Access: http://localhost:3000
```

### **Option 2: Production Domain**
```bash
./scripts/setup.sh
./scripts/configure-domain.sh yourdomain.com
# Access: https://yourdomain.com
```

### **Option 3: Subdomain**
```bash
./scripts/setup.sh
./scripts/configure-domain.sh stream.yourdomain.com
# Access: https://stream.yourdomain.com
```

## 🔧 Domain Configuration

### **What the configure-domain.sh script does:**

1. **Updates Environment Variables:**
   ```env
   CORS_ORIGIN="https://yourdomain.com"
   PUBLIC_HLS_URL="https://yourdomain.com/hls"
   ```

2. **Creates Nginx Configuration:**
   - HTTPS redirect
   - SSL configuration
   - Security headers
   - CORS settings

3. **Updates Docker Compose:**
   - Production environment variables
   - SSL certificate paths

## 📋 Pre-Deployment Checklist

### **Server Requirements:**
- [ ] Ubuntu 20.04+ or similar Linux
- [ ] Docker and Docker Compose installed
- [ ] Domain DNS pointing to server IP
- [ ] Ports 80, 443, 1935 open
- [ ] SSL certificate (Let's Encrypt)

### **Domain Setup:**
- [ ] DNS A record: `yourdomain.com → YOUR_SERVER_IP`
- [ ] DNS A record: `*.yourdomain.com → YOUR_SERVER_IP` (for subdomains)
- [ ] SSL certificate installed

## 🛠️ Step-by-Step Deployment

### **1. Server Setup**
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin

# Logout and login to apply group changes
```

### **2. Application Deployment**
```bash
# Clone repository
git clone https://github.com/damedamir/custom-restreamer.git
cd custom-restreamer

# Run automated setup
./scripts/setup.sh

# Configure for your domain
./scripts/configure-domain.sh yourdomain.com
```

### **3. SSL Certificate**
```bash
# Install Certbot
sudo apt install certbot

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Verify certificate
sudo certbot certificates
```

### **4. Start Production**
```bash
# Restart with SSL
docker-compose down
docker-compose up -d

# Check status
docker-compose ps
```

## 🔒 Security Configuration

### **Firewall Setup**
```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 1935
sudo ufw enable
```

### **SSL Security**
```bash
# Test SSL configuration
curl -I https://yourdomain.com

# Check SSL rating
# Visit: https://www.ssllabs.com/ssltest/
```

## 📊 Monitoring & Maintenance

### **Health Checks**
```bash
# Check all services
docker-compose ps

# Check logs
docker-compose logs -f

# Check SSL certificate
sudo certbot certificates
```

### **Backup**
```bash
# Backup database
docker-compose exec postgres pg_dump -U postgres custom_restreamer > backup.sql

# Backup configuration
tar -czf config-backup.tar.gz .env nginx/ docker-compose.yml
```

### **Updates**
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose up -d --build
```

## 🌍 Multi-Domain Setup

### **Multiple Domains on Same Server**
```bash
# Configure first domain
./scripts/configure-domain.sh domain1.com

# Configure second domain
./scripts/configure-domain.sh domain2.com

# Update Nginx to handle both domains
# Edit nginx/sites/production.conf
```

### **Load Balancer Setup**
```bash
# For high traffic, use load balancer
# Configure Nginx as load balancer
# Scale backend services
docker-compose up -d --scale backend=3
```

## 🐛 Troubleshooting

### **Common Issues**

**1. SSL Certificate Issues**
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

**2. DNS Issues**
```bash
# Check DNS resolution
nslookup yourdomain.com
dig yourdomain.com

# Check if domain points to server
curl -I http://yourdomain.com
```

**3. Port Conflicts**
```bash
# Check if ports are in use
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
sudo netstat -tulpn | grep :1935

# Stop conflicting services
sudo systemctl stop nginx
sudo systemctl stop apache2
```

**4. Docker Issues**
```bash
# Check Docker status
docker --version
docker-compose --version

# Check service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
```

## 📈 Performance Optimization

### **Server Optimization**
```bash
# Increase file limits
echo "* soft nofile 65536" >> /etc/security/limits.conf
echo "* hard nofile 65536" >> /etc/security/limits.conf

# Optimize kernel parameters
echo "net.core.somaxconn = 65536" >> /etc/sysctl.conf
echo "net.ipv4.tcp_max_syn_backlog = 65536" >> /etc/sysctl.conf
sysctl -p
```

### **Nginx Optimization**
```nginx
# In nginx.conf
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_comp_level 6;
```

## 🆘 Support

- **Documentation**: [README.md](./README.md)
- **Installation**: [INSTALL.md](./INSTALL.md)
- **Issues**: GitHub Issues

---

**Happy Streaming! 🎥**
