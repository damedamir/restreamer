import { useEffect, useRef, useState, useCallback } from 'react';

interface StreamStatus {
  isLive: boolean;
  viewers: number;
  lastChecked: string;
  rtmpKey: string;
}

interface WebSocketMessage {
  type: 'stream_status' | 'initial_statuses';
  rtmpKey?: string;
  isLive?: boolean;
  viewers?: number;
  lastChecked?: string;
  statuses?: StreamStatus[];
}

interface UseWebSocketOptions {
  enabled?: boolean;
  onStreamStatusUpdate?: (rtmpKey: string, status: StreamStatus) => void;
  onConnectionChange?: (connected: boolean) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const { enabled = true, onStreamStatusUpdate, onConnectionChange } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 3000; // 3 seconds

  const getWebSocketUrl = useCallback(() => {
    if (typeof window === 'undefined') return null;
    
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.hostname === 'localhost' ? '3001' : window.location.port;
    
    return `${protocol}//${host}:${port}/ws`;
  }, []);

  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) return;

    const wsUrl = getWebSocketUrl();
    if (!wsUrl) {
      console.log('❌ [WebSocket] Cannot determine WebSocket URL');
      return;
    }

    console.log('🔌 [WebSocket] Connecting to:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ [WebSocket] Connected');
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
        onConnectionChange?.(true);
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'stream_status' && message.rtmpKey) {
            const status: StreamStatus = {
              isLive: message.isLive || false,
              viewers: message.viewers || 0,
              lastChecked: message.lastChecked || new Date().toISOString(),
              rtmpKey: message.rtmpKey
            };
            
            console.log('📡 [WebSocket] Received stream status:', status);
            onStreamStatusUpdate?.(message.rtmpKey, status);
          } else if (message.type === 'initial_statuses' && message.statuses) {
            console.log('📡 [WebSocket] Received initial statuses:', message.statuses);
            message.statuses.forEach(status => {
              onStreamStatusUpdate?.(status.rtmpKey, status);
            });
          }
        } catch (error) {
          console.error('❌ [WebSocket] Error parsing message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 [WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        onConnectionChange?.(false);
        
        // Attempt to reconnect if not a clean close and we haven't exceeded max attempts
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          console.log(`🔄 [WebSocket] Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectDelay);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('❌ [WebSocket] Max reconnection attempts reached');
          setConnectionError('Failed to reconnect to WebSocket');
        }
      };

      ws.onerror = (error) => {
        console.error('❌ [WebSocket] Error:', error);
        setConnectionError('WebSocket connection error');
      };

    } catch (error) {
      console.error('❌ [WebSocket] Failed to create WebSocket:', error);
      setConnectionError('Failed to create WebSocket connection');
    }
  }, [enabled, getWebSocketUrl, onStreamStatusUpdate, onConnectionChange]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close(1000, 'Manual disconnect');
      wsRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionError(null);
  }, []);

  // Connect on mount and when enabled changes
  useEffect(() => {
    if (enabled) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    isConnected,
    connectionError,
    connect,
    disconnect
  };
}
