# Production Deployment Guide

## Overview
This guide covers deploying the Custom Restreamer WebRTC streaming system to production.

## Prerequisites
- Docker and Docker Compose installed
- Domain name pointing to your server
- SSL certificate (Let's Encrypt recommended)

## Quick Start

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd custom-restreamer
```

### 2. Configure Environment
```bash
cp env.production.example .env
# Edit .env with your production values
```

### 3. Deploy
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

## Manual Deployment

### 1. Environment Configuration
Create `.env` file with production values:
```bash
POSTGRES_PASSWORD=your_secure_password
JWT_SECRET=your_secure_jwt_secret
CORS_ORIGIN=https://yourdomain.com
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### 2. Deploy Services
```bash
docker-compose -f docker-compose.prod.yml up -d --build
```

### 3. Initialize Database
```bash
docker exec custom-restreamer-backend-1 npx prisma db push
docker exec custom-restreamer-backend-1 npm run seed
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Frontend | 3000 | Next.js web interface |
| Backend | 3001 | Node.js API server |
| SRS | 1935, 1985, 8080 | RTMP/WebRTC streaming server |
| Nginx | 80, 443 | Reverse proxy and SSL termination |
| PostgreSQL | 5432 | Database |

## SSL Configuration

### Option 1: Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/
```

### Option 2: Custom SSL
Place your SSL certificates in `./ssl/` directory:
- `fullchain.pem` - Full certificate chain
- `privkey.pem` - Private key

## Testing

### 1. Health Checks
```bash
curl http://yourdomain.com/api/health
curl http://yourdomain.com
curl http://yourdomain.com:1985/api/v1/streams/
```

### 2. Create Admin User
```bash
# Access the admin interface
open http://yourdomain.com

# Login with default credentials:
# Email: admin@example.com
# Password: admin123
```

### 3. Test Streaming
1. Create a branded URL in the admin interface
2. Stream to: `rtmp://yourdomain.com:1935/live/YOUR_STREAM_KEY`
3. View your branded stream page

## Monitoring

### View Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Check Status
```bash
docker-compose -f docker-compose.prod.yml ps
```

## Maintenance

### Update Application
```bash
git pull
docker-compose -f docker-compose.prod.yml up -d --build
```

### Backup Database
```bash
docker exec custom-restreamer-postgres-1 pg_dump -U restreamer restreamer > backup.sql
```

### Restore Database
```bash
docker exec -i custom-restreamer-postgres-1 psql -U restreamer restreamer < backup.sql
```

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   - Check if ports 80, 443, 1935, 3000, 3001 are available
   - Use `netstat -tulpn | grep :PORT` to check

2. **SSL Issues**
   - Verify certificate files are in `./ssl/` directory
   - Check certificate permissions
   - Ensure domain name matches certificate

3. **Database Connection**
   - Verify PostgreSQL is running
   - Check database credentials in `.env`
   - Run `docker exec custom-restreamer-backend-1 npx prisma db push`

4. **Streaming Issues**
   - Check SRS logs: `docker logs custom-restreamer-srs-1`
   - Verify RTMP port 1935 is accessible
   - Test with: `ffmpeg -f lavfi -i testsrc -f flv rtmp://yourdomain.com:1935/live/test`

### Performance Optimization

1. **Resource Limits**
   - Add resource limits to docker-compose.prod.yml
   - Monitor with `docker stats`

2. **Caching**
   - Configure Nginx caching for static assets
   - Use CDN for video content

3. **Scaling**
   - Use multiple SRS instances for load balancing
   - Implement Redis for session management

## Security

### Firewall Configuration
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 1935  # RTMP
sudo ufw enable
```

### Environment Security
- Use strong passwords
- Generate secure JWT secrets
- Regularly update dependencies
- Monitor logs for suspicious activity

## Support

For issues and questions:
1. Check the logs first
2. Review this documentation
3. Check GitHub issues
4. Contact support team