'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

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
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const connectionAttempted = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const isDestroyed = useRef(false);

  // Reset connection state when props change
  useEffect(() => {
    if (isDestroyed.current) return;
    
    // Reset states when rtmpKey or isLive changes
    setIsConnecting(false);
    setConnectionError(null);
    setIsConnected(false);
    connectionAttempted.current = false;
    retryCount.current = 0;
    
    // Clean up existing connection
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
  }, [rtmpKey, isLive]);

  const connectWebRTC = useCallback(async () => {
    if (isDestroyed.current || isConnecting || isConnected || connectionAttempted.current) {
      console.log('❌ Skipping WebRTC connection - already connecting, connected, or attempted');
      return;
    }
    
    if (retryCount.current >= maxRetries) {
      console.log('❌ Max retries reached, giving up on WebRTC');
      setConnectionError('Connection failed after multiple attempts');
      return;
    }
    
    // Check if stream is actually live before attempting WebRTC
    try {
      const streamName = rtmpKey.replace(/\$/g, '');
      const hlsUrl = `https://hive.restreamer.website/hls/${streamName}.m3u8`;
      const response = await fetch(hlsUrl);
      if (!response.ok) {
        console.log('❌ Stream not live yet, skipping WebRTC connection');
        setConnectionError('Stream is not live yet');
        return;
      }
    } catch (error) {
      console.log('❌ Could not verify stream status, skipping WebRTC connection');
      setConnectionError('Could not verify stream status');
      return;
    }
    
    console.log(`🎯 Starting WebRTC connection attempt ${retryCount.current + 1}/${maxRetries}...`);
    connectionAttempted.current = true;
    setIsConnecting(true);
    setConnectionError(null);
    retryCount.current++;

    try {
      console.log('🔗 Creating RTCPeerConnection...');
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
      });
      pcRef.current = pc;
      console.log('✅ RTCPeerConnection created successfully');

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate generated:', event.candidate.candidate);
        } else {
          console.log('🧊 ICE gathering complete');
        }
      };

      // Handle remote stream
      pc.ontrack = (event) => {
        if (isDestroyed.current) return;
        console.log('🎥 WebRTC track received:', event.track.kind, event.track.id);
        if (videoRef.current && event.streams[0]) {
          console.log('🎥 Setting video source object...');
          videoRef.current.srcObject = event.streams[0];
          setIsConnecting(false);
          setIsConnected(true);
          console.log('✅ WebRTC connection established successfully!');
          onCanPlay?.();
        }
      };

      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        if (isDestroyed.current) return;
        console.log('🧊 ICE connection state changed:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'failed') {
          console.error('❌ ICE connection failed');
          setConnectionError('ICE connection failed');
          setIsConnecting(false);
          setIsConnected(false);
          onError?.('ICE connection failed');
        } else if (pc.iceConnectionState === 'connected') {
          console.log('✅ ICE connection established');
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        if (isDestroyed.current) return;
        console.log('🔗 Connection state changed:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          console.log('✅ WebRTC connection established');
          setIsConnecting(false);
          setIsConnected(true);
        } else if (pc.connectionState === 'failed') {
          console.error('❌ WebRTC connection failed');
          setConnectionError('WebRTC connection failed');
          setIsConnecting(false);
          setIsConnected(false);
          onError?.('WebRTC connection failed');
        }
      };

      // Create offer
      console.log('📝 Creating WebRTC offer...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      console.log('✅ WebRTC offer created:', offer.type);

      // Set local description with timeout
      console.log('📝 Setting local description...');
      try {
        const setLocalDescriptionPromise = pc.setLocalDescription(offer);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('setLocalDescription timeout')), 5000)
        );
        
        await Promise.race([setLocalDescriptionPromise, timeoutPromise]);
        console.log('✅ Local description set successfully');
      } catch (error) {
        console.error('❌ Failed to set local description:', error);
        throw error;
      }

      // Send offer to SRS
      const srsUrl = typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:1985'
        : 'https://hive.restreamer.website/webrtc';

      console.log('📡 SRS URL:', srsUrl);
      console.log('📡 Stream URL:', `${rtmpUrl}/${rtmpKey}`);
      
      const requestBody = {
        api: `${srsUrl}/api/v1`,
        streamurl: `${rtmpUrl}/${rtmpKey}`,
        sdp: offer.sdp
      };
      console.log('📡 Request body:', requestBody);

      console.log('📡 Sending offer to SRS...');
      const response = await fetch(`${srsUrl}/rtc/v1/play/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📡 SRS response status:', response.status, response.statusText);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ WebRTC offer failed:', response.status, errorText);
        throw new Error(`WebRTC offer failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('📡 SRS response data:', data);
      
      if (data.sdp) {
        console.log('📝 SRS returned SDP answer, length:', data.sdp.length);
        console.log('📝 Setting remote description...');
        await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
        console.log('✅ Remote description set successfully');
        
        console.log('🎯 WebRTC setup complete, waiting for connection...');
      } else {
        console.error('❌ No SDP in SRS response:', data);
        throw new Error('No SDP received from SRS');
      }

    } catch (error) {
      if (isDestroyed.current) return;
      
      console.error('❌ WebRTC connection error:', error);
      console.error('❌ Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      
      setIsConnecting(false);
      setIsConnected(false);
      
      // Only retry if we haven't exceeded max retries
      if (retryCount.current < maxRetries) {
        console.log(`🔄 Retrying WebRTC connection in 2 seconds... (${retryCount.current}/${maxRetries})`);
        setTimeout(() => {
          if (!isDestroyed.current) {
            connectionAttempted.current = false;
            connectWebRTC();
          }
        }, 2000);
      } else {
        console.log('❌ Max retries reached, giving up on WebRTC');
        setConnectionError('WebRTC connection failed after multiple attempts');
        onError?.('WebRTC connection failed');
      }
    }
  }, [rtmpUrl, rtmpKey, isConnecting, isConnected, onError, onCanPlay]);

  const tryHLSFirst = useCallback(async () => {
    if (isDestroyed.current) return false;
    
    console.log('🎯 Trying HLS streaming first...');
    try {
      const streamName = rtmpKey.replace(/\$/g, ''); // Remove $ character
      const hlsUrl = `https://hive.restreamer.website/hls/${streamName}.m3u8`;
      
      console.log(`📺 Testing HLS URL: ${hlsUrl}`);
      
      // Test if HLS manifest exists
      const response = await fetch(hlsUrl);
      if (response.ok) {
        const manifestText = await response.text();
        if (manifestText.includes('EXTM3U')) {
          console.log('✅ HLS manifest found, using HLS streaming');
          
          // Load HLS.js
          if (typeof window !== 'undefined' && !(window as any).Hls) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
            script.onload = () => {
              if (!isDestroyed.current) {
                console.log('✅ HLS.js loaded, starting playback');
                startHLSPlayback(streamName);
              }
            };
            document.head.appendChild(script);
          } else {
            startHLSPlayback(streamName);
          }
          return true;
        }
      } else {
        console.log(`❌ HLS manifest not found (${response.status}), stream may not be live yet`);
      }
    } catch (error) {
      console.log('❌ HLS failed, falling back to WebRTC:', error);
    }
    return false;
  }, [rtmpKey]);

  const startHLSPlayback = useCallback((streamName: string) => {
    if (isDestroyed.current || !videoRef.current) return;
    
    const hlsUrl = `https://hive.restreamer.website/hls/${streamName}.m3u8`;
    
    if ((window as any).Hls && (window as any).Hls.isSupported()) {
      const hls = new (window as any).Hls({
        // Configure HLS.js for live streaming
        liveSyncDurationCount: 3,
        liveMaxLatencyDurationCount: 5,
        liveDurationInfinity: true,
        highBufferWatchdogPeriod: 2,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        backBufferLength: 90,
        // Enable low latency mode
        lowLatencyMode: true,
        // Configure error recovery
        maxLoadingDelay: 4,
        maxBufferHole: 0.5,
        // Enable live backoff
        liveBackBufferLength: 0
      });
      
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoRef.current);
      
      hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
        if (isDestroyed.current) return;
        console.log('✅ HLS manifest parsed, starting playback');
        
        // Try to play with proper error handling
        if (videoRef.current) {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('✅ Video playback started successfully');
              setIsConnected(true);
              onCanPlay?.();
            }).catch((error) => {
              console.log('⚠️ Autoplay blocked by browser:', error);
              // Don't treat autoplay failure as a fatal error
              setIsConnected(true);
              onCanPlay?.();
            });
          }
        }
      });
      
      hls.on((window as any).Hls.Events.ERROR, (event: any, data: any) => {
        if (isDestroyed.current) return;
        console.log(`❌ HLS error: ${data.type} - ${data.details}`);
        
        // Handle different error types
        if (data.fatal) {
          switch (data.type) {
            case (window as any).Hls.ErrorTypes.NETWORK_ERROR:
              console.log('❌ Network error, trying to recover...');
              hls.startLoad();
              break;
            case (window as any).Hls.ErrorTypes.MEDIA_ERROR:
              console.log('❌ Media error, trying to recover...');
              hls.recoverMediaError();
              break;
            default:
              console.log('❌ Fatal HLS error, trying WebRTC fallback');
              hls.destroy();
              connectWebRTC();
              break;
          }
        }
      });
      
      // Store HLS instance for cleanup
      (videoRef.current as any).hls = hls;
    } else {
      console.log('❌ HLS.js not supported, trying WebRTC');
      connectWebRTC();
    }
  }, [connectWebRTC, onCanPlay]);

  useEffect(() => {
    if (isDestroyed.current) return;
    
    console.log('🚀 WebRTCVideoPlayer useEffect triggered');
    console.log('📊 Props:', { rtmpKey, isLive, rtmpUrl });
    console.log('📊 State:', { isConnecting, isConnected, connectionError });
    
    if (!rtmpKey || !isLive) {
      console.log('❌ Skipping connection - missing rtmpKey or not live');
      return;
    }

    // Try HLS first, then WebRTC as fallback
    tryHLSFirst().then((hlsSuccess) => {
      if (!hlsSuccess && !isDestroyed.current) {
        console.log('🎯 HLS failed, trying WebRTC...');
        connectWebRTC();
      }
    });

    // Cleanup
    return () => {
      isDestroyed.current = true;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      // Cleanup HLS instance
      if (videoRef.current && (videoRef.current as any).hls) {
        (videoRef.current as any).hls.destroy();
        (videoRef.current as any).hls = null;
      }
    };
  }, [rtmpKey, isLive, tryHLSFirst, connectWebRTC]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isDestroyed.current = true;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, []);

  if (connectionError) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <div>{connectionError}</div>
          {connectionError.includes('not live') && (
            <div className="text-gray-400 text-sm mt-2">
              The stream will appear here when it goes live
            </div>
          )}
        </div>
      </div>
    );
  }

  const handleVideoClick = useCallback(() => {
    if (videoRef.current && videoRef.current.paused) {
      videoRef.current.play().catch((error) => {
        console.log('⚠️ Manual play failed:', error);
      });
    }
  }, []);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        key={`${rtmpKey}-${isLive}`} // Force re-mount when stream changes
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full cursor-pointer"
        onLoadStart={onLoadStart}
        onClick={handleVideoClick}
        onError={(e) => {
          console.error('Video error:', e);
          setConnectionError('Video playback failed');
          onError?.('Video playback failed');
        }}
      />
      {isConnecting && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
            <div>Connecting to stream...</div>
          </div>
        </div>
      )}
      {!isConnecting && isConnected && videoRef.current?.paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
          <div className="text-white text-center">
            <div className="text-6xl mb-4">▶️</div>
            <div className="text-lg">Click to play</div>
          </div>
        </div>
      )}
    </div>
  );
}