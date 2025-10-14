// Feature flags for easy rollback and A/B testing
export const featureFlags = {
  // WebSocket for real-time stream status updates
  // Set to false to fallback to polling-only mode
  useWebSocket: process.env.NEXT_PUBLIC_USE_WEBSOCKET !== 'false',
  
  // Enable debug logging
  debugMode: process.env.NODE_ENV === 'development',
} as const;

export type FeatureFlags = typeof featureFlags;
