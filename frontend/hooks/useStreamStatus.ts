'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface StreamStatus {
  isLive: boolean;
  viewers: number;
  lastChecked: Date;
}

interface UseStreamStatusProps {
  rtmpKey: string;
  onStatusChange?: (status: StreamStatus) => void;
}

export function useStreamStatus({ rtmpKey, onStatusChange }: UseStreamStatusProps) {
  const [streamStatus, setStreamStatus] = useState<StreamStatus>({
    isLive: false,
    viewers: 0,
    lastChecked: new Date()
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const rtmpKeyRef = useRef(rtmpKey);

  // Memoize the API call function to prevent recreation on every render
  const checkStatus = useCallback(async () => {
    if (!isMountedRef.current || !rtmpKeyRef.current) return;
    
    try {
      const apiBaseUrl = "https://hive.restreamer.website";
      
      const response = await fetch(`${apiBaseUrl}/api/stream-status/${rtmpKeyRef.current}`);
      
      if (!isMountedRef.current) return; // Check again after async operation
      
      if (response.ok) {
        const data = await response.json();
        const newStatus: StreamStatus = {
          isLive: data.isLive,
          viewers: data.viewers || 0,
          lastChecked: new Date(data.lastChecked)
        };
        
        setStreamStatus(prevStatus => {
          // Only update if status actually changed to prevent unnecessary re-renders
          if (prevStatus.isLive !== newStatus.isLive || 
              prevStatus.viewers !== newStatus.viewers) {
            return newStatus;
          }
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
    
    // Set up interval for periodic checks (30 seconds - more reasonable)
    intervalRef.current = setInterval(checkStatus, 30000);

    // Return cleanup function
    return cleanup;
  }, [rtmpKey, checkStatus, cleanup]);

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