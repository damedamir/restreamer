'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import FLVVideoPlayer from './FLVVideoPlayer';

interface WebRTCVideoPlayerProps {
  rtmpUrl: string;
  rtmpKey: string;
  isLive: boolean;
  onError?: (error: string) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
}

export default function WebRTCVideoPlayer({ 
  rtmpUrl, 
  rtmpKey, 
  isLive, 
  onError, 
  onLoadStart, 
  onCanPlay 
}: WebRTCVideoPlayerProps) {
  const [useFLV, setUseFLV] = useState(false);
  const [hlsError, setHlsError] = useState(false);

  // Try HLS first (since it was working), fallback to FLV if needed
  const handleHLSError = useCallback((error: string) => {
    console.log('HLS failed, trying FLV fallback:', error);
    setHlsError(true);
    setUseFLV(true);
  }, []);

  // If HLS had an error, use FLV
  if (useFLV || hlsError) {
    return (
      <FLVVideoPlayer
        rtmpUrl={rtmpUrl}
        rtmpKey={rtmpKey}
        isLive={isLive}
        onError={onError}
        onLoadStart={onLoadStart}
        onCanPlay={onCanPlay}
      />
    );
  }

  // Try HLS first (restore the working HLS implementation)
  return (
    <HLSVideoPlayer
      rtmpUrl={rtmpUrl}
      rtmpKey={rtmpKey}
      isLive={isLive}
      onError={handleHLSError}
      onLoadStart={onLoadStart}
      onCanPlay={onCanPlay}
    />
  );
}