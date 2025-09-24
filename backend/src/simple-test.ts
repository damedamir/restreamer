import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Custom Restreamer API is working!',
    timestamp: new Date().toISOString()
  });
});

// Simple stream endpoint
app.get('/api/stream/:slug', (req, res) => {
  const { slug } = req.params;
  
  res.json({
    brandedUrl: {
      id: 'test-stream',
      name: 'Test Stream',
      brandColor: '#111827',
      logoUrl: null,
      overlayText: 'Welcome to the test stream',
      offlineContent: {
        enabled: true,
        title: 'Stream Offline',
        message: 'This stream is currently offline. Please check back later.',
        imageUrl: null
      },
      customStreamUrl: null
    },
    streamConfig: {
      configId: 'test-config',
      configName: 'Test Stream',
      isLive: false
    },
    streamUrl: `https://test.com/hls/${slug}.m3u8`,
    wsUrl: `wss://test.com/ws/stream/${slug}`
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Simple test server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test`);
  console.log(`📺 Stream endpoint: http://localhost:${PORT}/api/stream/test-stream`);
});
