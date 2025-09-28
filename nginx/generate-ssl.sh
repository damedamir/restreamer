#!/bin/bash

# Generate SSL certificates for HTTPS
echo "🔑 Generating SSL certificates..."

# Create SSL directory
mkdir -p /etc/nginx/ssl

# Generate self-signed certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/hive.restreamer.website.key \
    -out /etc/nginx/ssl/hive.restreamer.website.crt \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=hive.restreamer.website"

echo "✅ SSL certificates generated successfully!"
echo "📁 Certificate: /etc/nginx/ssl/hive.restreamer.website.crt"
echo "🔑 Private key: /etc/nginx/ssl/hive.restreamer.website.key"
