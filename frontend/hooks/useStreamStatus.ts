'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { featureFlags } from '../lib/featureFlags';

interface StreamStatus {
  isLive: boolean;
  viewers: number;
  lastChecked: Date;
}

interface UseStreamStatusProps {
  rtmpKey: string;
  onStatusChange?: (status: StreamStatus) => void;
  useWebSocket?: boolean; // Feature flag for rollback
}

export function useStreamStatus({ rtmpKey, onStatusChange, useWebSocket: enableWebSocket = featureFlags.useWebSocket }: UseStreamStatusProps) {
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    viewers: 0,
    lastChecked: new Date()
  });
  
  const isMountedRef = useRef(true);
  const rtmpKeyRef = useRef(rtmpKey);

  // Get the correct API base URL
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      // Client-side: check if we're on localhost
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      }
    }
    // Server-side or production: use relative URLs (will be proxied by nginx)
    return '';
  };

  // WebSocket integration
  const { isConnected: isWebSocketConnected } = useWebSocket({
    enabled: enableWebSocket,
    onStreamStatusUpdate: useCallback((wsRtmpKey: string, status) => {
      if (wsRtmpKey === rtmpKeyRef.current) {
        console.log('📡 [WebSocket] Received status update for current stream:', status);
        
        const newStatus: StreamStatus = {
          isLive: status.isLive,
          viewers: status.viewers,
          lastChecked: new Date(status.lastChecked)
        };
        
        setStreamStatus(prevStatus => {
          if (prevStatus.isLive !== newStatus.isLive || 
              prevStatus.viewers !== newStatus.viewers) {
            console.log('📡 [WebSocket] Status changed via WebSocket, updating...');
            onStatusChange?.(newStatus);
            return newStatus;
          }
          return prevStatus;
        });
      }
    }, [onStatusChange])
  });

  useEffect(() => {
    // Update ref when rtmpKey changes
    rtmpKeyRef.current = rtmpKey;
    
    if (!rtmpKey) {
      return;
    }

    // Reset mounted state
    isMountedRef.current = true;

    if (enableWebSocket && isWebSocketConnected) {
      console.log('🔄 [StreamStatus] WebSocket connected - using real-time updates only, no polling');
    } else {
      console.log('🔄 [StreamStatus] WebSocket not available - using fallback polling');
      // Fallback polling only if WebSocket is disabled
      const pollInterval = setInterval(async () => {
        if (!isMountedRef.current || !rtmpKeyRef.current) return;
        
        try {
          const apiBaseUrl = getApiBaseUrl();
          
          const response = await fetch(`${apiBaseUrl}/stream-status/${rtmpKeyRef.current}`);
          if (response.ok) {
            const data = await response.json();
            const newStatus: StreamStatus = {
              isLive: data.isLive,
              viewers: data.viewers || 0,
              lastChecked: new Date(data.lastChecked)
            };
            
            setStreamStatus(prevStatus => {
              if (prevStatus.isLive !== newStatus.isLive || 
                  prevStatus.viewers !== newStatus.viewers) {
                onStatusChange?.(newStatus);
                return newStatus;
              }
              return prevStatus;
            });
          }
        } catch (error) {
          console.error('Error checking stream status:', error);
        }
      }, 15000);
      
      return () => clearInterval(pollInterval);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [rtmpKey, onStatusChange, enableWebSocket, isWebSocketConnected]);

  return streamStatus;
}
