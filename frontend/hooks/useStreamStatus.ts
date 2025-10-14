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
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const rtmpKeyRef = useRef(rtmpKey);
  const lastWebSocketUpdate = useRef<Date | null>(null);

  // WebSocket integration
  const { isConnected: isWebSocketConnected } = useWebSocket({
    enabled: enableWebSocket,
    onStreamStatusUpdate: useCallback((wsRtmpKey: string, status) => {
      if (wsRtmpKey === rtmpKeyRef.current) {
        console.log('📡 [WebSocket] Received status update for current stream:', status);
        lastWebSocketUpdate.current = new Date();
        
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

  // Memoize the API call function to prevent recreation on every render
  const checkStatus = useCallback(async () => {
    if (!isMountedRef.current || !rtmpKeyRef.current) return;
    
    try {
      // Ensure we always have the correct API base URL
      let apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
      
      // If not set or if it doesn't end with /api, construct it properly
      if (!apiBaseUrl || !apiBaseUrl.endsWith('/api')) {
        if (typeof window !== 'undefined') {
          // Client-side: use current domain
          apiBaseUrl = `${window.location.protocol}//${window.location.host}/api`;
        } else {
          // Server-side fallback
          apiBaseUrl = 'https://hive.restreamer.website/api';
        }
      }
      
      const url = `${apiBaseUrl}/stream-status/${rtmpKeyRef.current}`;
      
      console.log('🔍 Checking stream status:', { 
        url, 
        rtmpKey: rtmpKeyRef.current,
        envVar: process.env.NEXT_PUBLIC_API_URL,
        constructedApiBaseUrl: apiBaseUrl
      });
      
      const response = await fetch(url);
      
      if (!isMountedRef.current) return; // Check again after async operation
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Stream status API response:', data);
        
        const newStatus: StreamStatus = {
          isLive: data.isLive,
          viewers: data.viewers || 0,
          lastChecked: new Date(data.lastChecked)
        };
        
        console.log('🔍 New stream status:', newStatus);
        
        setStreamStatus(prevStatus => {
          console.log('🔍 Previous status:', prevStatus);
          // Only update if status actually changed to prevent unnecessary re-renders
          if (prevStatus.isLive !== newStatus.isLive || 
              prevStatus.viewers !== newStatus.viewers) {
            console.log('🔍 Status changed, updating...');
            return newStatus;
          }
          console.log('🔍 Status unchanged, keeping previous');
          return prevStatus;
        });
        
        onStatusChange?.(newStatus);
      } else {
        console.error('Failed to fetch stream status:', response.statusText);
      }
    } catch (error) {
      if (isMountedRef.current) {
        console.error('Error checking stream status:', error);
      }
    }
  }, [onStatusChange]);

  // Memoize the cleanup function
  const cleanup = useCallback(() => {
    isMountedRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Update ref when rtmpKey changes
    rtmpKeyRef.current = rtmpKey;
    
    if (!rtmpKey) {
      cleanup();
      return;
    }

    // Reset mounted state
    isMountedRef.current = true;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Check status immediately
    checkStatus();
    
    // Set up interval for periodic checks
    // If WebSocket is connected, poll less frequently (60 seconds)
    // If WebSocket is not connected, poll more frequently (15 seconds)
    const pollInterval = isWebSocketConnected ? 60000 : 15000;
    console.log(`🔄 [StreamStatus] Setting poll interval to ${pollInterval}ms (WebSocket: ${isWebSocketConnected ? 'connected' : 'disconnected'})`);
    
    intervalRef.current = setInterval(checkStatus, pollInterval);

    // Return cleanup function
    return cleanup;
  }, [rtmpKey, checkStatus, cleanup, isWebSocketConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return streamStatus;
}