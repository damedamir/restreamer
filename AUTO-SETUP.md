# 🚀 Automated Server Setup

This guide shows you how to deploy Custom Restreamer on a fresh Ubuntu server with just one command.

## ⚡ One-Command Installation

### Option 1: Direct Download & Run
```bash
curl -fsSL https://raw.githubusercontent.com/damedamir/custom-restreamer/main/setup-server.sh | bash
```

### Option 2: Clone & Run
```bash
git clone https://github.com/damedamir/custom-restreamer.git
cd custom-restreamer
chmod +x setup-server.sh
./setup-server.sh
```

## 🎯 What Gets Installed

The script automatically installs and configures:

### ✅ **System Requirements**
- Docker & Docker Compose
- Git, curl, wget, nano, htop
- UFW Firewall
- Certbot (SSL certificates)

### ✅ **Application Stack**
- Custom Restreamer Frontend (Next.js)
- Backend API (Node.js)
- SRS Streaming Server (WebRTC/RTMP)
- PostgreSQL Database
- Nginx Reverse Proxy

### ✅ **Security & SSL**
- Firewall configuration (ports 22, 80, 443, 1935)
- SSL certificates (Let's Encrypt ready)
- Secure random passwords
- JWT secret generation

### ✅ **Database & Users**
- PostgreSQL with Prisma ORM
- Database tables creation
- Admin user creation
- Sample data seeding

### ✅ **System Services**
- Systemd service for auto-start
- Docker container management
- Health monitoring

## 📋 Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ or Debian 11+
- **RAM**: Minimum 2GB (4GB recommended)
- **CPU**: 2 cores minimum
- **Storage**: 20GB free space
- **Network**: Public IP with domain name

### Domain Setup
- Point your domain to the server's IP address
- Ensure ports 80, 443, and 1935 are open

## 🔧 Configuration

During setup, you'll be prompted for:

1. **Domain Name**: `yourdomain.com`
2. **Email**: For SSL certificate notifications
3. **Admin Credentials**: Auto-generated (you can change later)

## 📊 What You Get

After installation, you'll have:

### 🌐 **Web Interface**
- **Main Site**: `https://yourdomain.com`
- **Admin Dashboard**: `https://yourdomain.com/admin`
- **API**: `https://yourdomain.com/api`

### 📡 **Streaming**
- **RTMP Input**: `rtmp://yourdomain.com:1935/live`
- **WebRTC Output**: `https://yourdomain.com/live/your-slug`
- **SRS API**: `https://yourdomain.com:1985`

### 🔑 **Admin Access**
- **Email**: `admin@yourdomain.com`
- **Password**: Auto-generated (displayed after setup)

## 🛠️ Management Commands

### Service Management
```bash
# Start service
sudo systemctl start custom-restreamer

# Stop service
sudo systemctl stop custom-restreamer

# Restart service
sudo systemctl restart custom-restreamer

# Check status
sudo systemctl status custom-restreamer
```

### Docker Management
```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Update application
git pull origin main
docker-compose -f docker-compose.prod.yml up -d --build
```

### Database Management
```bash
# Backup database
docker exec custom-restreamer-postgres-1 pg_dump -U restreamer restreamer > backup.sql

# Restore database
docker exec -i custom-restreamer-postgres-1 psql -U restreamer restreamer < backup.sql
```

## 🔍 Troubleshooting

### Check Service Status
```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check specific service logs
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs srs
```

### Common Issues

1. **Port Already in Use**
   ```bash
   sudo netstat -tulpn | grep :80
   sudo netstat -tulpn | grep :443
   ```

2. **Docker Permission Issues**
   ```bash
   sudo usermod -aG docker $USER
   # Log out and back in
   ```

3. **SSL Certificate Issues**
   ```bash
   sudo certbot --nginx -d yourdomain.com
   ```

4. **Database Connection Issues**
   ```bash
   docker exec custom-restreamer-backend-1 npx prisma db push
   ```

### Reset Everything
```bash
# Stop and remove all containers
docker-compose -f docker-compose.prod.yml down -v

# Remove all images
docker system prune -a

# Run setup again
./setup-server.sh
```

## 📈 Monitoring

### Health Checks
```bash
# API health
curl https://yourdomain.com/api/health

# SRS status
curl https://yourdomain.com:1985/api/v1/streams/

# Frontend
curl https://yourdomain.com
```

### Resource Usage
```bash
# Docker stats
docker stats

# System resources
htop
```

## 🔒 Security

### Firewall Status
```bash
sudo ufw status
```

### SSL Certificate Status
```bash
sudo certbot certificates
```

### Update SSL Certificates
```bash
sudo certbot renew --dry-run
```

## 📝 Logs

### Application Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs

# Specific service
docker-compose -f docker-compose.prod.yml logs backend
docker-compose -f docker-compose.prod.yml logs frontend
docker-compose -f docker-compose.prod.yml logs srs
```

### System Logs
```bash
# Systemd service logs
sudo journalctl -u custom-restreamer -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 🎯 Next Steps

After installation:

1. **Access Admin Dashboard**: `https://yourdomain.com/admin`
2. **Change Admin Password**: Use the generated credentials
3. **Create Branded URLs**: Set up your streaming pages
4. **Test Streaming**: Use OBS to stream to `rtmp://yourdomain.com:1935/live`
5. **Monitor Performance**: Check logs and resource usage

## 🆘 Support

If you encounter issues:

1. Check the logs first
2. Review this documentation
3. Check GitHub issues
4. Contact support

---

**🎉 Your streaming platform is ready to go!**
