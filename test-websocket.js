#!/usr/bin/env node

// WebSocket Connection Test Script
// Run this to test WebSocket connectivity

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://restreamer.website/ws';

console.log('🧪 Testing WebSocket connection...');
console.log(`🔗 URL: ${WEBSOCKET_URL}`);

const ws = new WebSocket(WEBSOCKET_URL);

ws.on('open', function open() {
  console.log('✅ WebSocket connected successfully!');
  console.log('📡 Connection established');
  
  // Send a test message
  ws.send(JSON.stringify({
    type: 'test',
    message: 'Hello WebSocket!'
  }));
});

ws.on('message', function message(data) {
  console.log('📨 Received message:', data.toString());
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
  console.error('🔍 Error details:', err);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 WebSocket closed: ${code} - ${reason}`);
});

// Close after 5 seconds
setTimeout(() => {
  console.log('🔄 Closing connection...');
  ws.close();
  process.exit(0);
}, 5000);
