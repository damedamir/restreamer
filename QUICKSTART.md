# Custom Restreamer - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Docker and Docker Compose installed
- Git installed

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd custom-restreamer

# Copy environment file
cp env.example .env

# Edit configuration
nano .env
```

### 2. Configure Environment

Edit `.env` file with your settings:

```env
# Database
DATABASE_URL="postgresql://postgres:password@postgres:5432/custom_restreamer"

# Server
PORT=3001
NODE_ENV=production

# CORS (replace with your domain)
CORS_ORIGIN="http://localhost:3000,https://yourdomain.com"

# Webhooks
WEBHOOK_SECRET="your-secret-key-here"

# Streaming
RTMP_PORT=1935
HLS_PATH="/var/www/hls"
PUBLIC_HLS_URL="https://yourdomain.com/hls"

# Admin
ADMIN_EMAIL="admin@yourdomain.com"
ADMIN_PASSWORD="secure-password-here"

# JWT
JWT_SECRET="your-jwt-secret-here"
```

### 3. Start the Application

```bash
# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API Health**: http://localhost:3001/health

### 5. Create Your First Stream

1. Go to http://localhost:3000/admin
2. Register a new account
3. Create a new stream
4. Configure branding (colors, logo, etc.)
5. Get your RTMP URL and stream key

### 6. Start Streaming

**OBS Settings:**
- **Server**: `rtmp://yourdomain.com/live`
- **Stream Key**: `your-stream-slug`

**Zoom Settings:**
- **RTMP URL**: `rtmp://yourdomain.com/live`
- **Stream Key**: `your-stream-slug`

### 7. View Your Stream

Visit: `http://localhost:3000/stream/your-stream-slug`

## 🔧 Configuration

### RTMP Server
- **Port**: 1935
- **Application**: `live`
- **HLS Output**: `/var/www/hls/`

### HLS Settings
- **Fragment Duration**: 2 seconds
- **Playlist Length**: 10 seconds
- **Low Latency**: Enabled

### Security
- Webhook authentication
- CORS protection
- Rate limiting
- Input validation

## 📊 Features

### ✅ What's Included
- [x] RTMP ingestion
- [x] HLS delivery
- [x] Real-time viewer count
- [x] Custom branding
- [x] WebSocket updates
- [x] Admin interface
- [x] Docker deployment
- [x] Low latency streaming
- [x] Mobile responsive
- [x] Offline content

### 🎯 Admin Features
- Stream management
- Branding configuration
- Viewer analytics
- Webhook logs
- User management

## 🐛 Troubleshooting

### Common Issues

**1. Stream not going live**
```bash
# Check webhook logs
docker-compose logs backend | grep webhook

# Check RTMP logs
docker-compose logs nginx | grep rtmp
```

**2. HLS not playing**
```bash
# Check HLS files
docker-compose exec nginx ls -la /var/www/hls/

# Check Nginx config
docker-compose exec nginx nginx -t
```

**3. Database connection issues**
```bash
# Check database status
docker-compose exec postgres pg_isready -U postgres

# Reset database
docker-compose down -v
docker-compose up -d
```

### Performance Tuning

**Reduce Latency:**
```nginx
# In nginx/rtmp.conf
hls_fragment 1;        # 1 second fragments
hls_playlist_length 5; # 5 second playlist
```

**Increase Quality:**
```nginx
# In nginx/rtmp.conf
hls_fragment 3;        # 3 second fragments
hls_playlist_length 30; # 30 second playlist
```

## 🔒 Production Deployment

### 1. SSL Certificate
```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update Nginx config for HTTPS
```

### 2. Domain Configuration
Update your `.env` file:
```env
CORS_ORIGIN="https://yourdomain.com"
PUBLIC_HLS_URL="https://yourdomain.com/hls"
```

### 3. Security
- Change default passwords
- Use strong JWT secrets
- Enable firewall
- Regular updates

## 📈 Monitoring

### Health Checks
- **API**: `GET /health`
- **Database**: PostgreSQL health check
- **RTMP**: Port 1935 availability

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f nginx
```

## 🆘 Support

- **Documentation**: [README.md](./README.md)
- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

---

**Happy Streaming! 🎥**
