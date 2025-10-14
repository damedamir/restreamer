'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface FLVVideoPlayerProps {
  rtmpUrl: string;
  rtmpKey: string;
  isLive: boolean;
  onError?: (error: string) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
}

export default function FLVVideoPlayer({ 
  rtmpUrl, 
  rtmpKey, 
  isLive, 
  onError, 
  onLoadStart, 
  onCanPlay 
}: FLVVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const flvPlayerRef = useRef<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFLVReady, setIsFLVReady] = useState(false);
  const isDestroyed = useRef(false);

  // Reset connection state when props change
  useEffect(() => {
    if (isDestroyed.current) return;
    
    setIsConnecting(false);
    setConnectionError(null);
    setIsConnected(false);
    setIsPlaying(false);
    setIsFLVReady(false);
    
    // Clean up existing player
    if (flvPlayerRef.current) {
      flvPlayerRef.current.destroy();
      flvPlayerRef.current = null;
    }
  }, [rtmpKey, isLive]);

  // Start FLV playback
  const startFLVPlayback = useCallback(() => {
    if (isDestroyed.current || !videoRef.current || !isLive) return;
    
    console.log('🎬 [FLV] Starting FLV playback for stream:', rtmpKey);
    setIsConnecting(true);
    setConnectionError(null);
    onLoadStart?.();
    
    // Clean up existing player
    if (flvPlayerRef.current) {
      flvPlayerRef.current.destroy();
      flvPlayerRef.current = null;
    }
    
    const flvUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/live/${rtmpKey}.flv`;
    console.log('🔗 [FLV] FLV URL:', flvUrl);
    
    // Check if FLV.js is available
    if (typeof window === 'undefined') {
      console.log('❌ [FLV] Not in browser environment');
      setConnectionError('Not in browser environment');
      setIsConnecting(false);
      onError?.('Not in browser environment');
      return;
    }
    
    const flvjs = (window as any).flvjs;
    if (!flvjs) {
      console.log('❌ [FLV] FLV.js not loaded');
      setConnectionError('FLV.js not loaded');
      setIsConnecting(false);
      onError?.('FLV.js not loaded');
      return;
    }
    
    if (!flvjs.isSupported()) {
      console.log('❌ [FLV] FLV.js not supported');
      setConnectionError('FLV.js not supported');
      setIsConnecting(false);
      onError?.('FLV.js not supported');
      return;
    }
    
    console.log('✅ [FLV] FLV.js is available and supported, creating player');
    
    const flvPlayer = flvjs.createPlayer({
      type: 'flv',
      url: flvUrl,
      isLive: true,
      hasAudio: true,
      hasVideo: true,
      enableWorker: false,
      enableStashBuffer: false,
      stashInitialSize: 128,
      autoCleanupSourceBuffer: true,
      autoCleanupMaxBackwardDuration: 3,
      autoCleanupMinBackwardDuration: 2,
      fixAudioTimestampGap: true,
      accurateSeek: false,
      seekType: 'range',
      rangeLoadZeroStart: false,
      lazyLoad: false,
      lazyLoadMaxDuration: 3 * 60,
      lazyLoadRecoverDuration: 30,
      deferLoadAfterSourceOpen: false,
      autoOnloadStart: true,
      autoOnloadEnd: true,
      autoOnloadStartTime: 0,
      autoOnloadEndTime: 0,
      autoOnloadSeekTime: 0,
      liveBufferLatencyChasing: true,
      liveBufferLatencyMaxLatency: 1.5,
      liveBufferLatencyMinRemain: 0.3,
      liveBackBufferLength: 0,
      liveFlvPlayer: true
    });
    
    // Store player reference
    flvPlayerRef.current = flvPlayer;
    
    // Attach media element
    flvPlayer.attachMediaElement(videoRef.current);
    
    // Handle FLV events
    flvPlayer.on('loadstart', () => {
      if (isDestroyed.current) return;
      console.log('✅ [FLV] Load started');
    });
    
    flvPlayer.on('loadedmetadata', () => {
      if (isDestroyed.current) return;
      console.log('✅ [FLV] Metadata loaded');
      if (videoRef.current) {
        videoRef.current.muted = isMuted;
        videoRef.current.play().catch(e => {
          console.log('⚠️ [FLV] Autoplay prevented:', e);
        });
      }
    });
    
    flvPlayer.on('canplay', () => {
      if (isDestroyed.current) return;
      console.log('✅ [FLV] Can play');
      setIsConnected(true);
      setIsConnecting(false);
      onCanPlay?.();
    });
    
    flvPlayer.on('play', () => {
      if (isDestroyed.current) return;
      console.log('▶️ [FLV] Play started');
      setIsPlaying(true);
        setIsConnecting(false);
        setIsConnected(true);
    });
    
    flvPlayer.on('pause', () => {
      if (isDestroyed.current) return;
      console.log('⏸️ [FLV] Paused');
      setIsPlaying(false);
    });
    
    flvPlayer.on('error', (errorType: any, errorDetail: any, errorInfo: any) => {
      if (isDestroyed.current) return;
      console.error('❌ [FLV] Player error:', errorType, errorDetail, errorInfo);
      setConnectionError(`FLV error: ${errorDetail}`);
      setIsConnecting(false);
      onError?.(`FLV error: ${errorDetail}`);
    });
    
    // Handle video element events
    if (videoRef.current) {
      videoRef.current.onplay = () => {
        console.log('▶️ [FLV] Video playing');
        setIsPlaying(true);
        setIsConnecting(false);
        setIsConnected(true);
      };
      
      videoRef.current.onpause = () => {
        console.log('⏸️ [FLV] Video paused');
        setIsPlaying(false);
      };
      
      videoRef.current.onerror = (e) => {
        console.error('❌ [FLV] Video error:', e);
        setConnectionError('Video playback error');
        setIsConnecting(false);
        onError?.('Video playback error');
      };
    }
    
    // Load and start playback
    console.log('🔄 [FLV] Loading FLV stream:', flvUrl);
    flvPlayer.load();
  }, [rtmpKey, isLive, onError, onLoadStart, onCanPlay]);

  // Start playback when component mounts or stream becomes live
  useEffect(() => {
    if (isLive && !isConnecting && !isConnected && isFLVReady) {
      console.log('🔄 [FLV] Starting playback - FLV.js is ready');
      startFLVPlayback();
    }
  }, [isLive, isConnecting, isConnected, isFLVReady, startFLVPlayback]);

  // Load FLV.js script
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).flvjs) {
      console.log('🔄 [FLV] Loading FLV.js script...');
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/flv.js@latest/dist/flv.min.js';
      script.onload = () => {
        console.log('✅ [FLV] FLV.js loaded successfully');
        // Wait a bit for the script to fully initialize
        setTimeout(() => {
          console.log('✅ [FLV] FLV.js is ready for playback');
          setIsFLVReady(true);
        }, 100);
      };
      script.onerror = () => {
        console.log('❌ [FLV] Failed to load FLV.js');
        setConnectionError('Failed to load FLV.js');
        onError?.('Failed to load FLV.js');
      };
      document.head.appendChild(script);
    } else if ((window as any).flvjs) {
      console.log('✅ [FLV] FLV.js already loaded');
      console.log('✅ [FLV] FLV.js is ready for playback');
      setIsFLVReady(true);
    }
  }, [onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isDestroyed.current = true;
      if (flvPlayerRef.current) {
        flvPlayerRef.current.destroy();
        flvPlayerRef.current = null;
      }
    };
  }, []);

  // Handle mute/unmute
  const handleUnmuteClick = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      console.log('✅ Video unmuted');
    }
  }, []);

  const handleMuteClick = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = true;
      setIsMuted(true);
      console.log('✅ Video muted');
    }
  }, []);

  if (connectionError) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-red-500 mb-2">❌ Connection Error</div>
          <div className="text-sm text-gray-300">{connectionError}</div>
          <button 
            onClick={startFLVPlayback}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />
      
      {/* Loading overlay */}
      {isConnecting && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <div>Loading stream...</div>
          </div>
        </div>
      )}
      
      {/* Mute/Unmute button */}
      {isConnected && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
          {isMuted ? (
            <button
              onClick={handleUnmuteClick}
              className="bg-black bg-opacity-50 text-white px-4 py-2 rounded hover:bg-opacity-70 flex items-center gap-2"
            >
              🔊 Unmute
            </button>
          ) : (
            <button
              onClick={handleMuteClick}
              className="bg-black bg-opacity-50 text-white px-4 py-2 rounded hover:bg-opacity-70 flex items-center gap-2"
            >
              🔇 Mute
            </button>
          )}
        </div>
      )}
      
      {/* Live indicator */}
      {isLive && (
        <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-sm font-bold">
          LIVE NOW
        </div>
      )}
    </div>
  );
}
