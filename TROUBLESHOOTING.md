# Custom Restreamer - Troubleshooting Guide

## 🐛 Common Issues and Solutions

### **Issue 1: Domain Configuration Script Not Working**

**Problem:** `./scripts/configure-domain.sh hive.restreamer.website` fails

**Solutions:**

**Option A: Use Simple Deploy Script**
```bash
./scripts/simple-deploy.sh hive.restreamer.website
```

**Option B: Manual Configuration**
```bash
# 1. Update .env file
nano .env
# Change these lines:
# CORS_ORIGIN="https://hive.restreamer.website"
# PUBLIC_HLS_URL="https://hive.restreamer.website/hls"

# 2. Update docker-compose.yml
nano docker-compose.yml
# Change these lines:
# CORS_ORIGIN="https://hive.restreamer.website"
# PUBLIC_HLS_URL="https://hive.restreamer.website/hls"
```

### **Issue 2: SSL Certificate Not Working**

**Problem:** `sudo certbot certonly --standalone -d hive.restreamer.website` fails

**Solutions:**

**Check 1: Domain DNS**
```bash
# Check if domain points to your server
nslookup hive.restreamer.website
dig hive.restreamer.website
```

**Check 2: Port 80 Available**
```bash
# Check if port 80 is free
sudo netstat -tulpn | grep :80
# If something is using port 80, stop it:
sudo systemctl stop nginx
sudo systemctl stop apache2
```

**Check 3: Firewall**
```bash
# Check firewall status
sudo ufw status
# Allow port 80 if needed
sudo ufw allow 80
```

**Check 4: Try Different Method**
```bash
# Method 1: Standalone (stops other web servers)
sudo certbot certonly --standalone -d hive.restreamer.website

# Method 2: Webroot (if nginx is running)
sudo certbot certonly --webroot -w /var/www/html -d hive.restreamer.website

# Method 3: Manual (if DNS not ready)
sudo certbot certonly --manual -d hive.restreamer.website
```

### **Issue 3: Docker Compose Not Working**

**Problem:** `docker-compose down && docker-compose up -d` fails

**Solutions:**

**Check 1: Docker Status**
```bash
# Check if Docker is running
docker --version
docker-compose --version
sudo systemctl status docker
```

**Check 2: Start Docker**
```bash
# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker
```

**Check 3: Check Logs**
```bash
# Check what's wrong
docker-compose logs
docker-compose ps
```

**Check 4: Rebuild**
```bash
# Rebuild containers
docker-compose down
docker-compose up -d --build
```

## 🔧 Step-by-Step Deployment

### **Method 1: Complete Fresh Start**

```bash
# 1. Clone repository
git clone https://github.com/damedamir/custom-restreamer.git
cd custom-restreamer

# 2. Install dependencies
./scripts/install-dependencies.sh

# 3. Logout and login again
logout
# (login again)

# 4. Setup application
./scripts/setup.sh

# 5. Configure domain
./scripts/simple-deploy.sh hive.restreamer.website

# 6. Get SSL certificate
sudo certbot certonly --standalone -d hive.restreamer.website

# 7. Start production
docker-compose down && docker-compose up -d
```

### **Method 2: Manual Configuration**

```bash
# 1. Edit .env file
nano .env
# Update these lines:
# CORS_ORIGIN="https://hive.restreamer.website"
# PUBLIC_HLS_URL="https://hive.restreamer.website/hls"

# 2. Edit docker-compose.yml
nano docker-compose.yml
# Update these lines:
# CORS_ORIGIN="https://hive.restreamer.website"
# PUBLIC_HLS_URL="https://hive.restreamer.website/hls"

# 3. Get SSL certificate
sudo certbot certonly --standalone -d hive.restreamer.website

# 4. Start services
docker-compose down && docker-compose up -d
```

## 🔍 Diagnostic Commands

### **Check System Status**
```bash
# Check Docker
docker --version
docker-compose --version
docker ps

# Check Services
docker-compose ps
docker-compose logs

# Check Ports
sudo netstat -tulpn | grep :80
sudo netstat -tulpn | grep :443
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :3001

# Check DNS
nslookup hive.restreamer.website
dig hive.restreamer.website

# Check SSL
sudo certbot certificates
```

### **Check Logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# System logs
sudo journalctl -u docker
sudo journalctl -u nginx
```

## 🚨 Emergency Fixes

### **Reset Everything**
```bash
# Stop all services
docker-compose down -v

# Remove all containers and volumes
docker system prune -a --volumes

# Start fresh
./scripts/setup.sh
```

### **Fix Permission Issues**
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
# Logout and login again

# Fix file permissions
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh
```

### **Fix Port Conflicts**
```bash
# Stop conflicting services
sudo systemctl stop nginx
sudo systemctl stop apache2
sudo systemctl stop apache
sudo systemctl stop httpd

# Check what's using ports
sudo lsof -i :80
sudo lsof -i :443
sudo lsof -i :3000
sudo lsof -i :3001
```

## 📞 Getting Help

### **Before Asking for Help, Please Provide:**

1. **System Information:**
   ```bash
   uname -a
   lsb_release -a
   docker --version
   docker-compose --version
   ```

2. **Error Messages:**
   ```bash
   docker-compose logs
   sudo journalctl -u docker
   ```

3. **Service Status:**
   ```bash
   docker-compose ps
   sudo systemctl status docker
   sudo systemctl status nginx
   ```

4. **Network Status:**
   ```bash
   sudo netstat -tulpn | grep -E ':(80|443|3000|3001|1935)'
   nslookup hive.restreamer.website
   ```

### **Common Error Messages:**

**"Docker permission denied"**
```bash
sudo usermod -aG docker $USER
# Logout and login again
```

**"Port already in use"**
```bash
sudo netstat -tulpn | grep :PORT_NUMBER
sudo systemctl stop SERVICE_NAME
```

**"SSL certificate failed"**
```bash
# Check DNS
nslookup yourdomain.com
# Check port 80
sudo netstat -tulpn | grep :80
# Try manual mode
sudo certbot certonly --manual -d yourdomain.com
```

**"Docker compose not found"**
```bash
# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

---

**Still having issues? Check the logs and provide the error messages! 🆘**
