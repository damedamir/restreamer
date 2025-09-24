# Custom Restreamer - WebRTC Streaming Platform

A professional streaming platform with WebRTC support, branded streaming pages, and real-time stream management.

## Features

### 🎥 **WebRTC Streaming**
- Ultra-low latency streaming using SRS (Simple Realtime Server)
- Real-time video and audio transmission
- Automatic stream status detection
- Mobile and desktop compatible

### 🎨 **Branded Streaming Pages**
- Custom branded streaming pages for each client
- Custom logos, colors, and branding elements
- Responsive design (mobile, tablet, desktop)
- Offline content and call-to-action buttons

### 🔧 **Admin Dashboard**
- Stream configuration management
- RTMP server management
- Branded URL creation and management
- Real-time stream monitoring
- User authentication and authorization

### 🚀 **Production Ready**
- Docker containerized deployment
- SSL/HTTPS support
- Database persistence with PostgreSQL
- Nginx reverse proxy
- Environment-based configuration

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Domain name (for production)
- SSL certificate (Let's Encrypt recommended)

### Local Development
```bash
# Clone the repository
git clone <your-repo-url>
cd custom-restreamer

# Start development environment
docker-compose -f docker-compose.srs.yml up -d

# Access the application
open http://localhost:3000
```

### Production Deployment
```bash
# Configure environment
cp env.production.example .env
# Edit .env with your production values

# Deploy to production
chmod +x deploy-production.sh
./deploy-production.sh
```

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   SRS Server    │
│   (Next.js)     │◄──►│   (Node.js)     │◄──►│   (WebRTC)      │
│   Port: 3000    │    │   Port: 3001    │    │   Port: 1935    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   PostgreSQL    │    │   HLS/WebRTC    │
│   (Reverse      │    │   (Database)    │    │   (Port: 8080)  │
│    Proxy)       │    │   Port: 5432    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | 3000 | Next.js web interface |
| **Backend** | 3001 | Node.js API server |
| **SRS** | 1935, 1985, 8080 | RTMP/WebRTC streaming server |
| **Nginx** | 80, 443 | Reverse proxy and SSL termination |
| **PostgreSQL** | 5432 | Database |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Configurations
- `GET /api/configurations` - List RTMP configurations
- `POST /api/configurations` - Create new configuration
- `PUT /api/configurations/:id` - Update configuration
- `DELETE /api/configurations/:id` - Delete configuration

### Branded URLs
- `GET /api/branded-urls` - List branded URLs
- `POST /api/branded-urls` - Create branded URL
- `GET /api/branded-urls/slug/:slug` - Get branded URL by slug

### Stream Status
- `GET /api/stream-status/:rtmpKey` - Get stream status
- `WebSocket /ws/stream-status` - Real-time stream updates

## Streaming

### RTMP Input
Stream to: `rtmp://yourdomain.com:1935/live/YOUR_STREAM_KEY`

### WebRTC Output
View streams at: `https://yourdomain.com/live/YOUR_BRANDED_SLUG`

### Supported Formats
- **Input**: RTMP (H.264/AAC)
- **Output**: WebRTC, HLS
- **Resolution**: Up to 4K
- **Latency**: < 1 second (WebRTC)

## Configuration

### Environment Variables
```bash
# Database
POSTGRES_PASSWORD=your_secure_password

# JWT Secret
JWT_SECRET=your_secure_jwt_secret

# CORS Origins
CORS_ORIGIN=https://yourdomain.com

# Frontend API URL
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

### SRS Configuration
The SRS server is configured for:
- RTMP input on port 1935
- WebRTC output on port 8080
- HTTP API on port 1985
- HLS output on port 8080

## Monitoring

### Health Checks
```bash
# Backend health
curl http://yourdomain.com/api/health

# SRS status
curl http://yourdomain.com:1985/api/v1/streams/

# Frontend
curl http://yourdomain.com
```

### Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

## Security

### SSL/HTTPS
- Automatic HTTP to HTTPS redirect
- Modern TLS configuration
- Security headers

### Authentication
- JWT-based authentication
- Password hashing with bcrypt
- CORS protection

### Rate Limiting
- API rate limiting
- Stream rate limiting
- DDoS protection

## Troubleshooting

### Common Issues

1. **Stream not playing**
   - Check if stream is active: `curl http://yourdomain.com:1985/api/v1/streams/`
   - Verify RTMP key matches configuration
   - Check SRS logs: `docker logs custom-restreamer-srs-1`

2. **WebRTC connection failed**
   - Verify SRS WebRTC is enabled
   - Check browser console for errors
   - Ensure HTTPS is configured

3. **Database connection issues**
   - Check PostgreSQL is running
   - Verify database credentials
   - Run: `docker exec custom-restreamer-backend-1 npx prisma db push`

### Performance Optimization

1. **Resource Limits**
   - Configure Docker resource limits
   - Monitor with `docker stats`

2. **Caching**
   - Enable Nginx caching
   - Use CDN for static assets

3. **Scaling**
   - Multiple SRS instances
   - Load balancer configuration
   - Redis for session management

## Development

### Project Structure
```
custom-restreamer/
├── frontend/          # Next.js frontend
├── backend/           # Node.js backend
├── nginx/             # Nginx configurations
├── docker-compose.yml # Development setup
├── docker-compose.prod.yml # Production setup
└── deploy-production.sh # Deployment script
```

### Adding Features
1. Backend API routes in `backend/src/routes/`
2. Frontend components in `frontend/components/`
3. Database schema in `backend/prisma/schema.prisma`
4. Update Docker configurations as needed

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the logs first
2. Review this documentation
3. Check GitHub issues
4. Contact support team

---

**Built with ❤️ using Next.js, Node.js, SRS, and Docker**