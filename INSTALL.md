# Custom Restreamer - Installation Guide

## 🚀 One-Command Installation

### Option 1: Automated Setup (Recommended)

```bash
# Clone the repository
git clone https://github.com/damedamir/custom-restreamer.git
cd custom-restreamer

# Run the automated setup script
./scripts/setup.sh
```

**That's it!** The script will:
- ✅ Create `.env` file with secure random secrets
- ✅ Start all Docker services
- ✅ Run database migrations
- ✅ Create default admin user
- ✅ Display access information

### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/damedamir/custom-restreamer.git
cd custom-restreamer

# Copy environment file
cp env.example .env

# Edit configuration (optional)
nano .env

# Start services
docker-compose up -d --build

# Create admin user
docker-compose exec backend npm run create-admin
```

## 📱 Access Your Application

After installation, you can access:

- **Frontend**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **API Health**: http://localhost:3001/health

## 🔑 Default Credentials

- **Email**: admin@example.com
- **Password**: admin123

## 📡 Start Streaming

**OBS Settings:**
- **Server**: `rtmp://localhost/live`
- **Stream Key**: `your-stream-slug`

**View Stream:**
- Visit: `http://localhost:3000/stream/your-stream-slug`

## 🛠️ Management Commands

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

## 🔧 Configuration

Edit `.env` file to customize:

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

## 🐛 Troubleshooting

### Services not starting
```bash
# Check Docker status
docker --version
docker-compose --version

# Check service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx
```

### Database issues
```bash
# Reset database
docker-compose down -v
docker-compose up -d

# Check database connection
docker-compose exec postgres pg_isready -U postgres
```

### Port conflicts
```bash
# Check if ports are in use
netstat -tulpn | grep :3000
netstat -tulpn | grep :3001
netstat -tulpn | grep :1935

# Stop conflicting services
sudo systemctl stop nginx
sudo systemctl stop apache2
```

## 📊 Monitoring

### Health Checks
- **API**: `curl http://localhost:3001/health`
- **Frontend**: `curl http://localhost:3000`
- **Database**: `docker-compose exec postgres pg_isready -U postgres`

### Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

## 🔒 Production Deployment

### 1. Update Environment
```bash
# Edit .env for production
nano .env

# Update CORS_ORIGIN and PUBLIC_HLS_URL
CORS_ORIGIN="https://yourdomain.com"
PUBLIC_HLS_URL="https://yourdomain.com/hls"
```

### 2. SSL Certificate
```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update Nginx config for HTTPS
```

### 3. Security
- Change default passwords
- Use strong secrets
- Enable firewall
- Regular updates

## 🆘 Support

- **Documentation**: [README.md](./README.md)
- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **Issues**: GitHub Issues

---

**Happy Streaming! 🎥**
