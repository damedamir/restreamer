# 🚀 Custom Restreamer v1.0.0 - Production Deployment Guide

## 📋 Overview

This is the **stable v1.0.0 production release** of Custom Restreamer - a complete live streaming platform with HTTPS support, HLS streaming, WebRTC fallback, and admin dashboard.

**⚠️ IMPORTANT: This version is production-ready and fully functional. Do not modify core configurations without thorough testing.**

## 🎯 What's Working in v1.0.0

### ✅ Core Features
- **HTTPS Support** - Let's Encrypt SSL certificates
- **HLS Streaming** - Primary streaming method (working perfectly)
- **WebRTC Fallback** - Secondary streaming method
- **Admin Dashboard** - User management and stream monitoring
- **Branded URLs** - Custom stream URLs
- **Stream Status API** - Real-time stream monitoring
- **PostgreSQL Database** - With Prisma ORM
- **Docker Compose** - Production-ready containerization

### ✅ Technical Stack
- **Frontend**: Next.js 14 with TypeScript
- **Backend**: Node.js with Express and Prisma
- **Database**: PostgreSQL 16
- **Media Server**: SRS (Simple Realtime Server) 5
- **Reverse Proxy**: Nginx with SSL termination
- **Containerization**: Docker Compose

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   OBS Studio    │───▶│   SRS Server    │───▶│   HLS Files     │
│                 │    │   (RTMP→HLS)    │    │   /var/www/hls/ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │◀───│   Nginx Proxy   │◀───│   Backend API   │
│   (Next.js)     │    │   (SSL/HTTPS)   │    │   (Node.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   PostgreSQL    │
                       │   Database      │
                       └─────────────────┘
```

## 🚀 Quick Deployment

### Prerequisites
- Ubuntu 20.04+ or similar Linux distribution
- Docker and Docker Compose installed
- Domain name pointing to your server
- Ports 80, 443, 1935 open

### 1. Clone and Setup
```bash
git clone https://github.com/damedamir/custom-restreamer.git
cd custom-restreamer
git checkout v1.0.0  # Ensure you're on the stable version
```

### 2. SSL Certificates
```bash
# Install certbot
sudo apt update
sudo apt install certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d your-domain.com

# Verify certificates
sudo ls -la /etc/letsencrypt/live/your-domain.com/
```

### 3. Deploy
```bash
# Start all services
docker compose up -d

# Wait for services to start
sleep 60

# Check status
docker compose ps
```

### 4. Verify Deployment
```bash
# Test HTTPS
curl -I https://your-domain.com/

# Test API
curl -s https://your-domain.com/api/streams/status/test

# Test HLS (when streaming)
curl -I https://your-domain.com/hls/test.m3u8
```

## 🔧 Configuration

### Environment Variables
The application uses these key environment variables:

```bash
# Database
DATABASE_URL="postgresql://postgres:password@postgres:5432/custom_restreamer"

# JWT Secret (change in production)
JWT_SECRET="your-super-secure-jwt-secret"

# Domain Configuration
NEXT_PUBLIC_API_URL="https://your-domain.com/api"
NEXT_PUBLIC_WS_URL="wss://your-domain.com/ws"
NEXT_PUBLIC_SRS_URL="https://your-domain.com"

# CORS
CORS_ORIGIN="https://your-domain.com"
```

### SRS Configuration
SRS is configured with:
- **RTMP Port**: 1935
- **WebRTC Port**: 8000
- **HLS Output**: `/var/www/hls/live/`
- **Custom Config**: `nginx/srs-minimal.conf`

### Nginx Configuration
Nginx handles:
- **SSL Termination** - Let's Encrypt certificates
- **API Routing** - `/api/*` → Backend
- **HLS Serving** - `/hls/*` → SRS files
- **Frontend** - `/*` → Next.js app

## 📺 Streaming Setup

### OBS Studio Configuration
1. **Stream Settings**:
   - Service: Custom
   - Server: `rtmp://your-domain.com:1935/live`
   - Stream Key: `your-stream-key`

2. **Output Settings**:
   - Encoder: x264
   - Bitrate: 2500-6000 kbps
   - Keyframe Interval: 2 seconds

### Stream URLs
- **Live Stream**: `https://your-domain.com/live/your-slug`
- **HLS Manifest**: `https://your-domain.com/hls/your-stream-key.m3u8`
- **Admin Panel**: `https://your-domain.com/admin`

## 🔐 Admin Access

### Default Admin User
- **Email**: `damir.fatic@hotmail.com`
- **Password**: `admin123`

### Creating New Users
```bash
# Connect to database
docker exec custom-restreamer-postgres-1 psql -U postgres -d custom_restreamer

# Create new admin user
INSERT INTO users (id, email, password, name, role, "createdAt", "updatedAt") 
VALUES ('admin-2', 'new-admin@example.com', '$2a$12$hash', 'New Admin', 'ADMIN', NOW(), NOW());
```

## 🛠️ Maintenance

### Updating to New Versions
```bash
# Create backup
docker compose down
docker volume create backup_postgres_data
docker run --rm -v postgres_data:/data -v backup_postgres_data:/backup alpine tar czf /backup/backup.tar.gz -C /data .

# Update code
git fetch origin
git checkout v1.1.0  # or newer version
docker compose up -d --build

# Restore if needed
docker run --rm -v backup_postgres_data:/backup -v postgres_data:/data alpine tar xzf /backup/backup.tar.gz -C /data
```

### Monitoring
```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f

# Check HLS files
docker exec custom-restreamer-srs-1 ls -la /var/www/hls/live/

# Test stream status
curl -s https://your-domain.com/api/streams/status/your-stream-key
```

### Backup Database
```bash
# Create backup
docker exec custom-restreamer-postgres-1 pg_dump -U postgres custom_restreamer > backup.sql

# Restore backup
docker exec -i custom-restreamer-postgres-1 psql -U postgres custom_restreamer < backup.sql
```

## 🚨 Troubleshooting

### Common Issues

#### HLS Not Working
```bash
# Check SRS logs
docker logs custom-restreamer-srs-1 | grep -i hls

# Check HLS files
docker exec custom-restreamer-srs-1 ls -la /var/www/hls/live/

# Restart SRS
docker compose restart srs
```

#### SSL Certificate Issues
```bash
# Check certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Restart nginx
docker compose restart nginx
```

#### API Not Responding
```bash
# Check backend logs
docker logs custom-restreamer-backend-1

# Check nginx logs
docker logs custom-restreamer-nginx-1

# Test API directly
curl -s https://your-domain.com/api/health
```

## 📊 Performance

### Resource Requirements
- **CPU**: 2+ cores
- **RAM**: 4GB+ (8GB recommended)
- **Storage**: 20GB+ (for HLS files and database)
- **Bandwidth**: 100Mbps+ (depends on concurrent streams)

### Optimization
- **HLS Segment Duration**: 2 seconds (configured in SRS)
- **HLS Window**: 10 segments (20 seconds)
- **Nginx Caching**: 1 hour for HLS files
- **Database**: Regular cleanup of old stream data

## 🔒 Security

### SSL/TLS
- **Protocols**: TLSv1.2, TLSv1.3
- **Ciphers**: ECDHE-RSA-AES256-GCM-SHA512
- **HSTS**: Enabled with 1 year max-age

### Headers
- **X-Frame-Options**: SAMEORIGIN
- **X-Content-Type-Options**: nosniff
- **X-XSS-Protection**: 1; mode=block
- **Referrer-Policy**: no-referrer-when-downgrade

### Rate Limiting
- **API**: 10 requests/second
- **General**: 30 requests/second

## 📝 Version History

### v1.0.0 (Current - Production Ready)
- ✅ Complete streaming platform
- ✅ HTTPS with Let's Encrypt
- ✅ HLS streaming working perfectly
- ✅ WebRTC fallback system
- ✅ Admin dashboard
- ✅ Branded URL system
- ✅ Stream status monitoring
- ✅ PostgreSQL with Prisma
- ✅ Docker Compose production setup

## 🆘 Support

### Getting Help
1. Check this documentation first
2. Review Docker logs for errors
3. Test individual components
4. Create GitHub issue with logs

### Emergency Rollback
```bash
# Rollback to v1.0.0
git checkout v1.0.0
docker compose down
docker compose up -d --build
```

---

**🎉 Congratulations! You now have a fully functional live streaming platform running in production.**

**Remember**: This v1.0.0 is the stable, working version. Always test changes in a development environment before applying to production.
