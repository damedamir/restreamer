# WebSocket Deployment Guide

## 🚀 Step-by-Step WebSocket Configuration

### Prerequisites
- Server access to main-proxy container
- Nginx configuration access
- SSL certificates already configured

## Step 1: Check Current Nginx Configuration

```bash
# Connect to your server
ssh damir@vmi2814332.contaboserver.net

# Check current Nginx configuration
docker exec main-proxy cat /etc/nginx/nginx.conf
docker exec main-proxy cat /etc/nginx/conf.d/default.conf
```

## Step 2: Backup Current Configuration

```bash
# Create backup of current config
docker exec main-proxy cp /etc/nginx/conf.d/default.conf /etc/nginx/conf.d/default.conf.backup
```

## Step 3: Add WebSocket Configuration

### Option A: Add to existing configuration
```bash
# Edit the existing configuration
docker exec -it main-proxy nano /etc/nginx/conf.d/default.conf
```

Add this location block for WebSocket support:
```nginx
# WebSocket support for /ws path
location /ws {
    proxy_pass http://custom-restreamer-backend-1:3001;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket specific timeouts
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
    proxy_connect_timeout 60;
    
    # Buffer settings for WebSocket
    proxy_buffering off;
    proxy_cache off;
}
```

### Option B: Use the complete configuration
```bash
# Copy the complete configuration
docker cp nginx-websocket.conf main-proxy:/etc/nginx/conf.d/restreamer.conf
```

## Step 4: Test Nginx Configuration

```bash
# Test Nginx configuration
docker exec main-proxy nginx -t

# If successful, reload Nginx
docker exec main-proxy nginx -s reload
```

## Step 5: Verify WebSocket Connection

### Test from server:
```bash
# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Version: 13" \
     -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
     https://restreamer.website/ws
```

### Test from browser:
1. Open browser console on https://restreamer.website
2. Check for WebSocket connection success
3. Look for: `✅ [WebSocket] Connected`

## Step 6: Monitor Logs

```bash
# Monitor Nginx logs
docker logs main-proxy -f

# Monitor backend logs
docker logs custom-restreamer-backend-1 -f

# Monitor frontend logs
docker logs custom-restreamer-frontend-1 -f
```

## Troubleshooting

### If WebSocket still fails:

1. **Check Nginx error logs:**
   ```bash
   docker exec main-proxy tail -f /var/log/nginx/error.log
   ```

2. **Verify backend WebSocket is running:**
   ```bash
   docker exec custom-restreamer-backend-1 netstat -tlnp | grep 3001
   ```

3. **Test direct backend connection:**
   ```bash
   curl -i -N -H "Connection: Upgrade" \
        -H "Upgrade: websocket" \
        -H "Sec-WebSocket-Version: 13" \
        -H "Sec-WebSocket-Key: x3JJHMbDL1EzLkh9GBhXDw==" \
        http://custom-restreamer-backend-1:3001/ws
   ```

4. **Check container networking:**
   ```bash
   docker network ls
   docker network inspect my-server_web-proxy
   ```

### Rollback if needed:
```bash
# Restore backup configuration
docker exec main-proxy cp /etc/nginx/conf.d/default.conf.backup /etc/nginx/conf.d/default.conf
docker exec main-proxy nginx -s reload
```

## Expected Results

After successful configuration:
- ✅ WebSocket connects: `wss://restreamer.website/ws`
- ✅ Real-time stream status updates
- ✅ No more polling fallback needed
- ✅ Instant stream start/stop detection

## Next Steps

Once WebSocket is working:
1. Test stream start/stop detection
2. Verify real-time updates
3. Monitor performance
4. Consider removing polling fallback (optional)
