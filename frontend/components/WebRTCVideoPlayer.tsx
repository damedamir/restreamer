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
  // Use FLV.js as the primary solution for live streaming
  // This is much simpler and more reliable than HLS.js for live streaming
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