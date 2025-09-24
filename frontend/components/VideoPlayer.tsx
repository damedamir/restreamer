'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface VideoPlayerProps {
  rtmpUrl: string;
  rtmpKey: string;
  isLive: boolean;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
}

export default function VideoPlayer({ rtmpUrl, rtmpKey, isLive, onError, onLoadStart, onCanPlay }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Memoize the setup function to prevent recreation on every render
  const setupHLS = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      onLoadStart?.();

      const video = videoRef.current;
      if (!video) return;

      // For HLS streaming, we'll use the SRS HLS endpoint
      // SRS converts RTMP to HLS automatically
      // SRS expects the raw stream key, not URL encoded
      const hlsUrl = `http://localhost:8080/live/${rtmpKey}.m3u8`;
      
      console.log('Setting up HLS stream:', hlsUrl);
      
      // Check if HLS is supported natively
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = hlsUrl;
        video.load();
      } else {
        // Use HLS.js for other browsers
        try {
          // Dynamically import HLS.js
          const Hls = (await import('hls.js')).default;
          
          if (Hls.isSupported()) {
            const hls = new Hls({
              debug: false,
              enableWorker: true,
              lowLatencyMode: true,
              backBufferLength: 90
            });
            
            hls.loadSource(hlsUrl);
            hls.attachMedia(video);
            
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
              console.log('HLS manifest parsed, starting playback');
              video.play().catch(console.error);
            });
            
                   hls.on(Hls.Events.ERROR, (event, data) => {
                     console.error('HLS error:', data);
                     
                     // Handle non-fatal errors more gracefully
                     if (data.details === 'bufferAppendError' || 
                         data.details === 'bufferStalledError') {
                       console.warn(`HLS buffer error (${data.details}) - continuing playback`);
                       return; // Don't treat buffer errors as fatal
                     }
                     
                     if (data.fatal) {
                       // If stream is not live, show offline state instead of error
                       if (!isLive) {
                         setIsLoading(false);
                         setError(null);
                       } else {
                         setError('Failed to load video stream');
                         setIsLoading(false);
                         onError?.(new Error(`HLS error: ${data.details}`));
                       }
                     }
                   });
          } else {
            throw new Error('HLS.js not supported');
          }
        } catch (hlsError) {
          console.error('HLS.js error:', hlsError);
          // Fallback to direct video source
          video.src = hlsUrl;
          video.load();
        }
      }

      // Handle video events
      video.addEventListener('loadstart', () => {
        console.log('Video load started');
      });

      video.addEventListener('canplay', () => {
        console.log('Video can play');
        setIsLoading(false);
        onCanPlay?.();
      });

      video.addEventListener('error', (e) => {
        console.error('Video error:', e);
        setError('Failed to load video stream');
        setIsLoading(false);
        onError?.(e);
      });

      video.addEventListener('playing', () => {
        console.log('Video is playing');
        setIsLoading(false);
      });

    } catch (err) {
      console.error('Error setting up HLS:', err);
      setError('Failed to connect to stream');
      setIsLoading(false);
      onError?.(err);
    }
  }, [rtmpKey, onError, onLoadStart, onCanPlay]);

  useEffect(() => {
    if (!isLive || !rtmpUrl || !rtmpKey) {
      // Stream is offline, stop video and clear source
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }
      setIsLoading(false);
      setError(null);
      return;
    }

    isMountedRef.current = true;
    setupHLS();

    return () => {
      isMountedRef.current = false;
      const video = videoRef.current;
      if (video) {
        video.pause();
        video.src = '';
        video.load();
      }
    };
  }, [isLive, setupHLS]);

  if (!isLive) {
    return (
      <div className="relative w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium">Stream Offline</p>
          <p className="text-sm text-gray-400">Waiting for stream to start...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        muted
        playsInline
        controls
        poster=""
      />
      
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <p className="text-white text-sm">Loading stream...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-white text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}