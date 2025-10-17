# 🚀 Restreamer Installation Guide

## Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/damedamir/restreamer.git
cd restreamer
```

### 2. Run the Installation Script
```bash
./install.sh
```

The script will ask you for:
- **Domain**: Your domain (e.g., `restreamer.example.com`)
- **Protocol**: HTTP or HTTPS (HTTPS recommended for production)

### 3. Deploy
```bash
./deploy.sh
```

### 4. Setup Default Data
```bash
./setup-default-config.sh
```

## What the Installation Script Does

### 🔧 Automatic Configuration
- **Generates secure passwords** for database and JWT
- **Creates environment files** (.env) with your domain
- **Configures Docker Compose** files for your setup
- **Sets up Traefik labels** for automatic routing
- **Creates deployment scripts** tailored to your domain

### 📁 Generated Files
- `.env` - Environment variables with your domain
- `docker-compose.production.yml` - Production configuration
- `docker-compose.server.yml` - Server configuration (without Traefik)
- `deploy.sh` - Deployment script
- `setup-default-config.sh` - Default data setup

### 🔐 Security Features
- **Random JWT secret** generation
- **Secure database password** generation
- **CORS configuration** for your domain
- **Environment-specific** configurations

## Manual Installation

If you prefer manual setup:

### 1. Copy Environment Template
```bash
cp production.env.example .env
```

### 2. Edit Environment Variables
```bash
nano .env
```

Update these variables:
- `DOMAIN` - Your domain
- `JWT_SECRET` - Random secret (use `openssl rand -hex 32`)
- `DATABASE_URL` - Database connection string

### 3. Deploy
```bash
docker compose up -d --build
```

## Domain Configuration

### For Traefik Setup (Recommended)
If you're using Traefik, the installation script will configure:
- Automatic SSL certificates
- Domain-based routing
- Load balancing

### For Direct Port Access
If you're not using Traefik, the script will:
- Expose ports directly (3000, 3001, 1935)
- Configure for direct access
- Set up basic networking

## Default Credentials

After installation, you'll have:
- **Admin Email**: `admin@yourdomain.com`
- **Admin Password**: `admin123`

**⚠️ Important**: Change the default password after first login!

## Troubleshooting

### Check Service Status
```bash
docker compose ps
```

### View Logs
```bash
docker compose logs -f
```

### Restart Services
```bash
docker compose restart
```

### Rebuild and Deploy
```bash
./deploy.sh
```

## Support

If you encounter issues:
1. Check the logs: `docker compose logs`
2. Verify domain DNS settings
3. Ensure ports are open (80, 443, 1935)
4. Check firewall configuration

## Security Notes

- Change default passwords
- Use HTTPS in production
- Keep Docker and system updated
- Regular backups of database
- Monitor logs for suspicious activity
