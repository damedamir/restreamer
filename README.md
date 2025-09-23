# Custom Restreamer

A modern, self-hosted streaming platform for creating custom branded streaming URLs with RTMP ingestion and HLS delivery.

## Features

- 🎥 **RTMP Ingestion** - Stream from OBS, Zoom, or any RTMP source
- 🎨 **Custom Branding** - Personalized stream pages with logos, colors, and overlays
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Low Latency** - Optimized HLS delivery with minimal delay
- 🔄 **Real-time Updates** - Live viewer counts and stream status
- 🛠️ **Admin Interface** - Manage streams, configurations, and settings
- 🐳 **Docker Ready** - Easy deployment with Docker Compose
- 🔒 **SSL Ready** - Automatic HTTPS configuration

## Quick Start

### **One-Line Installation (Ubuntu/Debian)**

```bash
curl -sSL https://raw.githubusercontent.com/damedamir/custom-restreamer/main/install.sh | bash
```

### **Manual Installation**

```bash
# 1. Clone repository
git clone https://github.com/damedamir/custom-restreamer.git
cd custom-restreamer

# 2. Install dependencies (Docker, Certbot, Nginx, etc.)
./scripts/install-dependencies.sh

# 3. Logout and login again (for Docker group changes)
logout
# (login again)

# 4. Setup application
./scripts/setup.sh
```

### **Production Deployment**

```bash
# Configure for your domain
./scripts/configure-domain.sh yourdomain.com

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Start production
docker-compose down && docker-compose up -d
```

## What Gets Installed

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

## Access Your Application

After installation:

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API Health**: http://localhost:3001/health

### **Default Admin Credentials:**
- **Email**: admin@example.com
- **Password**: admin123

## Streaming Setup

### **OBS Settings:**
- **Server**: `rtmp://yourdomain.com/live`
- **Stream Key**: `your-stream-slug`

### **Zoom Settings:**
- **RTMP URL**: `rtmp://yourdomain.com/live`
- **Stream Key**: `your-stream-slug`

### **View Stream:**
- Visit: `http://yourdomain.com/stream/your-stream-slug`

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript, Prisma
- **Database**: PostgreSQL
- **Streaming**: Nginx RTMP + HLS
- **Real-time**: WebSockets
- **Deployment**: Docker, Docker Compose

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   OBS/Zoom     │───▶│  Nginx RTMP     │───▶│  HLS Segments   │
│   (RTMP)       │    │  (Ingestion)    │    │  (Delivery)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Backend API    │
                       │  (Webhooks)     │
                       └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Frontend      │
                       │  (Viewer)       │
                       └─────────────────┘
```

## Management Commands

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Update and restart
docker-compose up -d --build

# View service status
docker-compose ps
```

## Configuration

### **Environment Variables:**
```env
# Database
DATABASE_URL="postgresql://postgres:password@postgres:5432/custom_restreamer"

# Server
PORT=3001
NODE_ENV=production

# CORS (replace with your domain)
CORS_ORIGIN="http://localhost:3000,https://yourdomain.com"

# Webhooks
WEBHOOK_SECRET="your-secret-key"

# Streaming
RTMP_PORT=1935
HLS_PATH="/var/www/hls"
PUBLIC_HLS_URL="https://yourdomain.com/hls"

# Admin
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="admin123"

# JWT
JWT_SECRET="your-jwt-secret"
```

## Documentation

- **[Installation Guide](./INSTALL.md)** - Complete installation instructions
- **[Quick Start](./QUICKSTART.md)** - 5-minute setup guide
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment
- **[Local Testing](./LOCAL_TEST.md)** - Development setup

## Troubleshooting

### **Common Issues:**

**1. Docker permission denied:**
```bash
sudo usermod -aG docker $USER
# Logout and login again
```

**2. Port conflicts:**
```bash
sudo netstat -tulpn | grep :3000
sudo systemctl stop nginx
```

**3. SSL certificate issues:**
```bash
sudo certbot certificates
sudo certbot renew
```

**4. Database issues:**
```bash
docker-compose exec postgres pg_isready -U postgres
docker-compose down -v && docker-compose up -d
```

## Support

- **Issues**: [GitHub Issues](https://github.com/damedamir/custom-restreamer/issues)
- **Discussions**: [GitHub Discussions](https://github.com/damedamir/custom-restreamer/discussions)

## License

MIT

---

**Happy Streaming! 🎥**