# Streaming Test Guide

## Current Setup
- **RTMP URL**: `rtmp://localhost:1935/live`
- **Stream Key**: `zmr_sq5a8e4k0$d0nr` (from your Broker's Playbook configuration)
- **WebRTC**: `ws://localhost:8000`
- **HLS Fallback**: `http://localhost:8080/hls/[stream_key]/index.m3u8`

## Test Steps

### 1. Test with OBS Studio
1. Open OBS Studio
2. Go to Settings > Stream
3. Set Service to "Custom"
4. Set Server to: `rtmp://localhost:1935/live`
5. Set Stream Key to: `zmr_sq5a8e4k0$d0nr`
6. Click "Start Streaming"
7. Check the branded page: http://localhost:3000/live/brokers-playbook

### 2. Test with FFmpeg (Command Line)
```bash
# Test stream with FFmpeg
ffmpeg -f avfoundation -i "0:0" -c:v libx264 -preset ultrafast -f flv rtmp://localhost:1935/live/zmr_sq5a8e4k0$d0nr
```

### 3. Check SRS Server Status
```bash
# Check SRS API
curl http://localhost:1985/api/v1/streams

# Check SRS version
curl http://localhost:1985/api/v1/versions
```

### 4. Monitor Backend Logs
```bash
# Watch backend logs for RTMP events
docker logs -f custom-restreamer-backend-1
```

## Expected Behavior
1. When you start streaming, the page should automatically detect the live stream
2. The video player should start playing the stream
3. The status should change from "OFFLINE" to "LIVE NOW"
4. Viewer count should increment
5. When you stop streaming, the page should show offline content

## Troubleshooting
- If stream doesn't start: Check SRS server logs
- If page doesn't detect stream: Check backend logs for RTMP events
- If video doesn't play: Check WebRTC connection and fallback to HLS
