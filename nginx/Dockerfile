FROM nginx:alpine

# Install nginx-rtmp-module
RUN apk add --no-cache nginx-mod-rtmp

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf
COPY rtmp.conf /etc/nginx/rtmp.conf
COPY sites/ /etc/nginx/sites-available/

# Create HLS directory
RUN mkdir -p /var/www/hls

EXPOSE 80 443 1935

CMD ["nginx", "-g", "daemon off;"]
