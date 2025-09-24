# Custom Restreamer

A complete, self-hosted streaming platform built with modern technologies. Perfect for replacing Supabase with your own backend infrastructure.

## 🚀 Quick Start

### One-Line Installation

```bash
curl -sSL https://raw.githubusercontent.com/damedamir/custom-restreamer/main/install.sh | bash
```

### Manual Installation

```bash
# Clone the repository
git clone https://github.com/damedamir/custom-restreamer.git
cd custom-restreamer

# Run the complete installation
chmod +x install-complete.sh
./install-complete.sh
```

## ✨ Features

- **Complete Admin Dashboard** - Manage streams, users, and analytics
- **Real-time Streaming** - WebSocket support for live updates
- **Modern Tech Stack** - Next.js 14, Express, Prisma, PostgreSQL
- **Docker Ready** - Full containerization with Docker Compose
- **SSL Support** - Automatic HTTPS with Let's Encrypt
- **RTMP Support** - Nginx RTMP module for streaming
- **Responsive UI** - Beautiful, mobile-friendly interface

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Beautiful UI components
- **Radix UI** - Accessible component primitives

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Prisma** - Modern database ORM
- **PostgreSQL** - Reliable database
- **WebSockets** - Real-time communication

### Infrastructure
- **Docker** - Containerization
- **Nginx** - Reverse proxy and RTMP server
- **Let's Encrypt** - SSL certificates
- **Docker Compose** - Multi-container orchestration

## 📁 Project Structure

```
custom-restreamer/
├── frontend/                 # Next.js frontend application
│   ├── app/
│   │   ├── admin/           # Admin dashboard
│   │   ├── stream/          # Stream viewer pages
│   │   └── page.tsx         # Landing page
│   ├── components/          # React components
│   └── public/              # Static assets
├── backend/                 # Express.js backend API
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Express middleware
│   │   └── scripts/         # Utility scripts
│   └── prisma/              # Database schema
├── nginx/                   # Nginx configuration
├── scripts/                 # Automation scripts
├── docker-compose.yml       # Docker services
└── install-complete.sh      # Complete installation script
```

## 🔧 Configuration

### Environment Variables

The installation script automatically creates a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://postgres:password@postgres:5432/custom_restreamer

# JWT Secret
JWT_SECRET=your-super-secure-jwt-secret-key

# Webhook Secret
WEBHOOK_SECRET=your-webhook-secret

# CORS Origin
CORS_ORIGIN=https://hive.restreamer.website

# Public URLs
PUBLIC_HLS_URL=https://hive.restreamer.website/hls
PUBLIC_WS_BASE=wss://hive.restreamer.website

# Admin User
ADMIN_EMAIL=admin@hive.restreamer.website
ADMIN_PASSWORD=admin123
```

### Domain Configuration

To configure for your domain:

```bash
./scripts/configure-domain.sh your-domain.com
```

### SSL Certificates

To get SSL certificates:

```bash
sudo certbot certonly --standalone -d your-domain.com
```

## 🚀 Deployment

### Local Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

1. **Configure your domain**:
   ```bash
   ./scripts/configure-domain.sh your-domain.com
   ```

2. **Get SSL certificates**:
   ```bash
   sudo certbot certonly --standalone -d your-domain.com
   ```

3. **Start services**:
   ```bash
   docker-compose up -d
   ```

4. **Access your application**:
   - Frontend: `https://your-domain.com`
   - Admin: `https://your-domain.com/admin`
   - API: `https://your-domain.com/api/health`

## 📊 Admin Dashboard

The admin dashboard provides:

- **Stream Management** - Create, edit, and monitor streams
- **User Management** - Manage user accounts and permissions
- **Analytics** - View streaming statistics and metrics
- **Real-time Monitoring** - Live stream status and viewer counts

Access the admin dashboard at `/admin` after installation.

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Streams
- `GET /api/streams` - List all streams
- `GET /api/streams/:slug` - Get stream by slug
- `POST /api/streams` - Create new stream
- `PUT /api/streams/:id` - Update stream

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/streams` - Admin stream management
- `GET /api/admin/users` - Admin user management

### Webhooks
- `POST /api/webhooks/start` - Stream start webhook
- `POST /api/webhooks/stop` - Stream stop webhook

## 🐳 Docker Services

The application runs with the following Docker services:

- **postgres** - PostgreSQL database
- **backend** - Express.js API server
- **frontend** - Next.js frontend application
- **nginx** - Reverse proxy and RTMP server

## 🔧 Troubleshooting

### Common Issues

1. **Port 80 already in use**:
   ```bash
   sudo systemctl stop nginx
   sudo systemctl disable nginx
   ```

2. **Docker permission denied**:
   ```bash
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

3. **Database connection failed**:
   ```bash
   docker-compose logs postgres
   docker-compose restart postgres
   ```

4. **Frontend static files not loading**:
   ```bash
   docker-compose build frontend
   docker-compose up -d frontend
   ```

### Logs

View service logs:

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues:

1. Check the troubleshooting section
2. View the logs for error messages
3. Create an issue on GitHub
4. Check the documentation

## 🎯 Roadmap

- [ ] RTMP streaming integration
- [ ] Advanced analytics
- [ ] User authentication system
- [ ] Stream recording
- [ ] Multi-tenant support
- [ ] Mobile app
- [ ] API rate limiting
- [ ] Advanced admin features

---

**Built with ❤️ for the streaming community**