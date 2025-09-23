#!/bin/bash

# Custom Restreamer Domain Configuration Script
echo "🌐 Configuring Custom Restreamer for your domain..."

# Check if domain is provided
if [ -z "$1" ]; then
    echo "❌ Please provide your domain name"
    echo "Usage: ./scripts/configure-domain.sh yourdomain.com"
    exit 1
fi

DOMAIN=$1
echo "📝 Configuring for domain: $DOMAIN"

# Update .env file
if [ -f .env ]; then
    echo "🔧 Updating .env file..."
    
    # Update CORS_ORIGIN
    sed -i.bak "s|CORS_ORIGIN=.*|CORS_ORIGIN=\"https://$DOMAIN\"|g" .env
    
    # Update PUBLIC_HLS_URL
    sed -i.bak "s|PUBLIC_HLS_URL=.*|PUBLIC_HLS_URL=\"https://$DOMAIN/hls\"|g" .env
    
    echo "✅ .env file updated for domain: $DOMAIN"
else
    echo "❌ .env file not found. Please run ./scripts/setup.sh first"
    exit 1
fi

# Update Nginx configuration
echo "🔧 Updating Nginx configuration..."
cat > nginx/sites/production.conf << EOF
# Upstream servers
upstream backend {
    server backend:3001;
}

upstream frontend {
    server frontend:3000;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL configuration (you'll need to add your certificates)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # HLS files
    location /hls/ {
        root /var/www;
        add_header Cache-Control no-cache;
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods GET;
        add_header Access-Control-Allow-Headers Range;
        
        # CORS preflight
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin *;
            add_header Access-Control-Allow-Methods GET;
            add_header Access-Control-Allow-Headers Range;
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type text/plain;
            add_header Content-Length 0;
            return 204;
        }
    }

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket routes
    location /ws {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
    }

    # Frontend
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

echo "✅ Nginx configuration updated for domain: $DOMAIN"

# Update docker-compose.yml for production
echo "🔧 Updating Docker Compose for production..."
sed -i.bak "s|CORS_ORIGIN=.*|CORS_ORIGIN=\"https://$DOMAIN\"|g" docker-compose.yml
sed -i.bak "s|PUBLIC_HLS_URL=.*|PUBLIC_HLS_URL=\"https://$DOMAIN/hls\"|g" docker-compose.yml

echo "✅ Docker Compose updated for domain: $DOMAIN"

echo ""
echo "🎉 Domain configuration complete!"
echo ""
echo "📋 Next steps:"
echo "1. Point your domain DNS to this server's IP address"
echo "2. Install SSL certificate:"
echo "   sudo apt install certbot"
echo "   sudo certbot certonly --standalone -d $DOMAIN"
echo "3. Restart services:"
echo "   docker-compose down && docker-compose up -d"
echo ""
echo "🌐 Your app will be available at:"
echo "   https://$DOMAIN"
echo "   https://$DOMAIN/admin"
echo "   RTMP: rtmp://$DOMAIN/live"
echo ""
echo "📡 Stream URLs:"
echo "   https://$DOMAIN/stream/your-stream-slug"
echo ""
echo "Happy streaming! 🎥"
