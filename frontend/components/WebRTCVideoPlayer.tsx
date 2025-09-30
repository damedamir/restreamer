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
  const hlsInstanceRef = useRef<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const connectionAttempted = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const isDestroyed = useRef(false);
  const hlsConnectionAttempted = useRef(false);
  const healthCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Reset connection state when props change
  useEffect(() => {
    if (isDestroyed.current) return;
    
    // Reset states when rtmpKey or isLive changes
    setIsConnecting(false);
    setConnectionError(null);
    setIsConnected(false);
    connectionAttempted.current = false;
    hlsConnectionAttempted.current = false;
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
    
    // Check if HLS instance already exists and is working
    if (hlsInstanceRef.current && hlsInstanceRef.current.media) {
      console.log('⚠️ HLS instance already exists and is attached, skipping creation');
      return;
    }
    
    // Clean up existing HLS instance more carefully
    if (hlsInstanceRef.current) {
      console.log('🧹 Cleaning up existing HLS instance');
      const existingHls = hlsInstanceRef.current;
      
      // Detach media before destroying to prevent detachment events
      if (existingHls.media) {
        console.log('🔌 Detaching media from existing HLS instance');
        existingHls.detachMedia();
      }
      
      // Now destroy
      existingHls.destroy();
      hlsInstanceRef.current = null;
    }
    
    // Also clean up from video element
    if (videoRef.current && (videoRef.current as any).hls) {
      (videoRef.current as any).hls = null;
    }
    
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
        // Enable live backoff
        liveBackBufferLength: 0,
        // Add delay to prevent race conditions
        startLevel: -1,
        capLevelToPlayerSize: true,
        // Fix buffering issues
        maxBufferSize: 60 * 1000 * 1000, // 60MB
        maxBufferHole: 0.1, // Smaller buffer hole tolerance
        maxSeekHole: 2,
        seekHoleNudgeDuration: 0.1,
        seekHoleNudgeOffset: 0.1,
        // Better error recovery
        fragLoadingTimeOut: 20000,
        manifestLoadingTimeOut: 10000,
        levelLoadingTimeOut: 10000,
        // Prevent manifest reloading issues
        manifestLoadingMaxRetry: 1,
        manifestLoadingRetryDelay: 2000,
        // Prevent segment cancellation
        fragLoadingMaxRetry: 3,
        fragLoadingRetryDelay: 1000,
        // Disable problematic features
        enableWorker: false,
        enableSoftwareAES: true,
        // Force segment loading
        forceKeyFrameOnDiscontinuity: true,
        // Better segment handling
        maxFragLookUpTolerance: 0.25
      });
      
      // Store HLS instance before loading
      hlsInstanceRef.current = hls;
      (videoRef.current as any).hls = hls;
      
      // Attach media first, then load source
      if (videoRef.current) {
        console.log('🔗 [HLS] Attaching media to video element');
        console.log('📊 [HLS] Video element before attach:', {
          readyState: videoRef.current.readyState,
          paused: videoRef.current.paused,
          currentTime: videoRef.current.currentTime,
          duration: videoRef.current.duration,
          src: videoRef.current.src,
          srcObject: videoRef.current.srcObject
        });
        
        hls.attachMedia(videoRef.current);
        
        console.log('🔗 [HLS] Loading source:', hlsUrl);
        hls.loadSource(hlsUrl);
        
        console.log('📊 [HLS] Video element after attach:', {
          readyState: videoRef.current.readyState,
          paused: videoRef.current.paused,
          currentTime: videoRef.current.currentTime,
          duration: videoRef.current.duration,
          src: videoRef.current.src,
          srcObject: videoRef.current.srcObject
        });
      } else {
        console.error('❌ Video element not available for HLS attachment');
        return;
      }
      
      hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
        if (isDestroyed.current) return;
        console.log('✅ HLS manifest parsed, waiting for first segment...');
        console.log('📊 Video element state:', {
          readyState: videoRef.current?.readyState,
          paused: videoRef.current?.paused,
          currentTime: videoRef.current?.currentTime,
          duration: videoRef.current?.duration
        });
        
        // Don't try to play yet - wait for first segment
        setIsConnected(true);
        onCanPlay?.();
        
        // Start health check for HLS stream
        startHLSHealthCheck();
      });
      
      // Wait for first segment to be loaded
      hls.on((window as any).Hls.Events.FRAG_LOADED, () => {
        if (isDestroyed.current) return;
        console.log('✅ [HLS] First segment loaded, starting playback');
        console.log('📊 [HLS] Video element state after segment:', {
          readyState: videoRef.current?.readyState,
          paused: videoRef.current?.paused,
          currentTime: videoRef.current?.currentTime,
          duration: videoRef.current?.duration
        });
        
        // Now try to play (muted autoplay is always allowed)
        if (videoRef.current && videoRef.current.readyState >= 1) {
          console.log('🎬 [HLS] Attempting to play video (muted autoplay)');
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              console.log('✅ [HLS] Video playback started successfully (muted)');
              setIsPlaying(true);
            }).catch((error) => {
              console.log('⚠️ [HLS] Autoplay blocked by browser:', error);
              // Show play button if autoplay fails
              setIsPlaying(false);
            });
          }
        } else {
          console.log('⚠️ [HLS] Video element not ready for playback');
        }
      });
      
      // Add video element event listeners for debugging
      if (videoRef.current) {
        const video = videoRef.current;
        
        video.addEventListener('loadstart', () => {
          console.log('🎬 [VIDEO] loadstart event');
        });
        
        video.addEventListener('loadedmetadata', () => {
          console.log('🎬 [VIDEO] loadedmetadata event');
          console.log('📊 [VIDEO] Metadata loaded:', {
            readyState: video.readyState,
            paused: video.paused,
            currentTime: video.currentTime,
            duration: video.duration,
            videoWidth: video.videoWidth,
            videoHeight: video.videoHeight
          });
        });
        
        video.addEventListener('loadeddata', () => {
          console.log('🎬 [VIDEO] loadeddata event');
          console.log('📊 [VIDEO] Data loaded:', {
            readyState: video.readyState,
            paused: video.paused,
            currentTime: video.currentTime,
            duration: video.duration
          });
        });
        
        video.addEventListener('canplay', () => {
          console.log('🎬 [VIDEO] canplay event');
          console.log('📊 [VIDEO] Can play:', {
            readyState: video.readyState,
            paused: video.paused,
            currentTime: video.currentTime,
            duration: video.duration
          });
        });
        
        video.addEventListener('canplaythrough', () => {
          console.log('🎬 [VIDEO] canplaythrough event');
          console.log('📊 [VIDEO] Can play through:', {
            readyState: video.readyState,
            paused: video.paused,
            currentTime: video.currentTime,
            duration: video.duration
          });
        });
        
        video.addEventListener('play', () => {
          console.log('🎬 [VIDEO] play event');
        });
        
        video.addEventListener('playing', () => {
          console.log('🎬 [VIDEO] playing event');
        });
        
        video.addEventListener('pause', () => {
          console.log('🎬 [VIDEO] pause event');
        });
        
        video.addEventListener('error', (e) => {
          console.log('❌ [VIDEO] error event:', e);
          console.log('📊 [VIDEO] Error details:', {
            error: video.error,
            readyState: video.readyState,
            paused: video.paused,
            currentTime: video.currentTime,
            duration: video.duration
          });
        });
        
        video.addEventListener('stalled', () => {
          console.log('⚠️ [VIDEO] stalled event');
        });
        
        video.addEventListener('waiting', () => {
          console.log('⚠️ [VIDEO] waiting event');
        });
        
        video.addEventListener('progress', () => {
          console.log('🔄 [VIDEO] progress event');
        });
      }
      
      // ===== COMPREHENSIVE HLS DEBUGGING =====
      
      // 1. Manifest Loading Events
      hls.on((window as any).Hls.Events.MANIFEST_LOADING, (event: any, data: any) => {
        console.log('🔄 [HLS] Loading manifest:', data.url);
        console.log('📊 [HLS] Manifest loading details:', {
          url: data.url,
          type: data.type,
          level: data.level
        });
      });
      
      hls.on((window as any).Hls.Events.MANIFEST_LOADED, (event: any, data: any) => {
        console.log('✅ [HLS] Manifest loaded successfully:', data.url);
        console.log('📊 [HLS] Manifest details:', {
          url: data.url,
          levels: data.levels?.length || 0,
          audioTracks: data.audioTracks?.length || 0,
          subtitles: data.subtitles?.length || 0,
          live: data.live,
          duration: data.duration
        });
      });
      
      hls.on((window as any).Hls.Events.MANIFEST_LOAD_ERROR, (event: any, data: any) => {
        console.log('❌ [HLS] Manifest load error:', data.url, data.details);
        console.log('📊 [HLS] Error details:', {
          url: data.url,
          details: data.details,
          response: data.response,
          fatal: data.fatal
        });
      });
      
      // 2. Level Loading Events
      hls.on((window as any).Hls.Events.LEVEL_LOADING, (event: any, data: any) => {
        console.log('🔄 [HLS] Loading level:', data.level, data.url);
        console.log('📊 [HLS] Level loading details:', {
          level: data.level,
          url: data.url,
          bitrate: data.details?.bitrate,
          width: data.details?.width,
          height: data.details?.height
        });
      });
      
      hls.on((window as any).Hls.Events.LEVEL_LOADED, (event: any, data: any) => {
        console.log('✅ [HLS] Level loaded:', data.level);
        console.log('📊 [HLS] Level details:', {
          level: data.level,
          bitrate: data.details?.bitrate,
          width: data.details?.width,
          height: data.details?.height,
          fragments: data.details?.fragments?.length || 0
        });
      });
      
      hls.on((window as any).Hls.Events.LEVEL_LOAD_ERROR, (event: any, data: any) => {
        console.log('❌ [HLS] Level load error:', data.level, data.details);
        console.log('📊 [HLS] Level error details:', {
          level: data.level,
          details: data.details,
          fatal: data.fatal
        });
      });
      
      // 3. Fragment Loading Events
      hls.on((window as any).Hls.Events.FRAG_LOADING, (event: any, data: any) => {
        console.log('🔄 [HLS] Loading fragment:', data.frag?.url);
        console.log('📊 [HLS] Fragment details:', {
          url: data.frag?.url,
          sn: data.frag?.sn,
          level: data.frag?.level,
          start: data.frag?.start,
          duration: data.frag?.duration,
          type: data.frag?.type
        });
      });
      
      hls.on((window as any).Hls.Events.FRAG_LOADED, (event: any, data: any) => {
        console.log('✅ [HLS] Fragment loaded:', data.frag?.url);
        console.log('📊 [HLS] Fragment loaded details:', {
          url: data.frag?.url,
          sn: data.frag?.sn,
          level: data.frag?.level,
          start: data.frag?.start,
          duration: data.frag?.duration,
          type: data.frag?.type,
          payload: data.payload?.length || 0
        });
      });
      
      hls.on((window as any).Hls.Events.FRAG_LOAD_ERROR, (event: any, data: any) => {
        console.log('❌ [HLS] Fragment load error:', data.frag?.url, data.details);
        console.log('📊 [HLS] Fragment error details:', {
          url: data.frag?.url,
          sn: data.frag?.sn,
          level: data.frag?.level,
          details: data.details,
          fatal: data.fatal
        });
      });
      
      // 4. Buffer Events
      hls.on((window as any).Hls.Events.BUFFER_APPENDING, (event: any, data: any) => {
        console.log('🔄 [HLS] Buffer appending:', data.type, data.frag?.url);
        console.log('📊 [HLS] Buffer details:', {
          type: data.type,
          frag: data.frag?.url,
          parent: data.parent,
          data: data.data?.length || 0
        });
      });
      
      hls.on((window as any).Hls.Events.BUFFER_APPENDED, (event: any, data: any) => {
        console.log('✅ [HLS] Buffer appended:', data.type, data.frag?.url);
        console.log('📊 [HLS] Buffer appended details:', {
          type: data.type,
          frag: data.frag?.url,
          parent: data.parent,
          data: data.data?.length || 0
        });
      });
      
      hls.on((window as any).Hls.Events.BUFFER_APPEND_ERROR, (event: any, data: any) => {
        console.log('❌ [HLS] Buffer append error:', data.type, data.details);
        console.log('📊 [HLS] Buffer error details:', {
          type: data.type,
          details: data.details,
          frag: data.frag?.url
        });
      });
      
      // 5. Media Events
      hls.on((window as any).Hls.Events.MEDIA_ATTACHING, (event: any, data: any) => {
        console.log('🔄 [HLS] Media attaching to:', data.media);
        console.log('📊 [HLS] Media details:', {
          media: data.media,
          tagName: data.media?.tagName,
          src: data.media?.src
        });
      });
      
      hls.on((window as any).Hls.Events.MEDIA_ATTACHED, (event: any, data: any) => {
        console.log('✅ [HLS] Media attached successfully');
        console.log('📊 [HLS] Media attached details:', {
          media: data.media,
          tagName: data.media?.tagName,
          src: data.media?.src
        });
      });
      
      hls.on((window as any).Hls.Events.MEDIA_DETACHING, (event: any, data: any) => {
        console.log('🔄 [HLS] Media detaching from:', data.media);
      });
      
      hls.on((window as any).Hls.Events.MEDIA_DETACHED, (event: any, data: any) => {
        console.log('✅ [HLS] Media detached successfully');
      });
      
      // 6. Playback Events
      hls.on((window as any).Hls.Events.BUFFER_STALLED, (event: any, data: any) => {
        console.log('⚠️ [HLS] Buffer stalled');
        console.log('📊 [HLS] Buffer stalled details:', {
          type: data.type,
          details: data.details
        });
        
        // Try to recover from buffer stall
        if (hlsInstanceRef.current) {
          console.log('🔄 Attempting to recover from buffer stall...');
          setTimeout(() => {
            if (hlsInstanceRef.current && !isDestroyed.current) {
              hlsInstanceRef.current.startLoad();
            }
          }, 1000);
        }
      });
      
      hls.on((window as any).Hls.Events.BUFFER_SEEK_OVER_HOLE, (event: any, data: any) => {
        console.log('⚠️ [HLS] Buffer seek over hole');
        console.log('📊 [HLS] Buffer seek details:', {
          type: data.type,
          details: data.details
        });
        
        // Try to recover from seek over hole
        if (hlsInstanceRef.current) {
          console.log('🔄 Attempting to recover from seek over hole...');
          setTimeout(() => {
            if (hlsInstanceRef.current && !isDestroyed.current) {
              hlsInstanceRef.current.startLoad();
            }
          }, 500);
        }
      });
      
      // 7. Level Switching Events
      hls.on((window as any).Hls.Events.LEVEL_SWITCHING, (event: any, data: any) => {
        console.log('🔄 [HLS] Level switching:', data.level);
        console.log('📊 [HLS] Level switch details:', {
          level: data.level,
          bitrate: data.details?.bitrate
        });
      });
      
      hls.on((window as any).Hls.Events.LEVEL_SWITCHED, (event: any, data: any) => {
        console.log('✅ [HLS] Level switched to:', data.level);
        console.log('📊 [HLS] Level switched details:', {
          level: data.level,
          bitrate: data.details?.bitrate
        });
      });
      
      hls.on((window as any).Hls.Events.LEVEL_SWITCH_ERROR, (event: any, data: any) => {
        console.log('❌ [HLS] Level switch error:', data.level, data.details);
        console.log('📊 [HLS] Level switch error details:', {
          level: data.level,
          details: data.details,
          fatal: data.fatal
        });
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
        } else {
          // Handle non-fatal errors (like bufferStalledError, bufferSeekOverHole)
          switch (data.details) {
            case 'bufferStalledError':
              console.log('⚠️ Buffer stalled, trying to recover...');
              hls.startLoad();
              break;
            case 'bufferSeekOverHole':
              console.log('⚠️ Buffer seek over hole, trying to recover...');
              hls.startLoad();
              break;
            default:
              console.log(`⚠️ Non-fatal HLS error: ${data.details}`);
              break;
          }
        }
      });
      
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
    console.log('📊 HLS Connection Attempted:', hlsConnectionAttempted.current);
    
    if (!rtmpKey || !isLive) {
      console.log('❌ Skipping connection - missing rtmpKey or not live');
      hlsConnectionAttempted.current = false;
      return;
    }

    // Prevent multiple HLS connection attempts
    if (hlsConnectionAttempted.current) {
      console.log('⚠️ HLS connection already attempted, skipping');
      return;
    }

    hlsConnectionAttempted.current = true;

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
      // Stop health check
      stopHLSHealthCheck();
      
      // Cleanup HLS instance
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
      if (videoRef.current && (videoRef.current as any).hls) {
        (videoRef.current as any).hls = null;
      }
    };
  }, [rtmpKey, isLive]);

  // Handle tab visibility changes to prevent HLS throttling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      console.log('👁️ Tab visibility changed:', isVisible ? 'visible' : 'hidden');
      setIsTabVisible(isVisible);
      
      if (isVisible && hlsInstanceRef.current && videoRef.current) {
        console.log('🔄 Tab became visible, checking HLS state...');
        
        // Check if video is paused due to tab being hidden
        if (videoRef.current.paused && isPlaying) {
          console.log('🎬 Video was paused due to tab being hidden, resuming...');
          videoRef.current.play().then(() => {
            console.log('✅ Video resumed after tab became visible');
          }).catch((error) => {
            console.log('❌ Failed to resume video:', error);
          });
        }
        
        // Restart HLS if it's stalled
        if (hlsInstanceRef.current && hlsInstanceRef.current.media) {
          console.log('🔄 Restarting HLS after tab became visible');
          hlsInstanceRef.current.startLoad();
        }
      }
    };

    const handleFocus = () => {
      console.log('🎯 Window focused');
      if (hlsInstanceRef.current && videoRef.current && videoRef.current.paused && isPlaying) {
        console.log('🎬 Resuming video after window focus');
        videoRef.current.play().catch((error) => {
          console.log('❌ Failed to resume video on focus:', error);
        });
      }
    };

    const handleBlur = () => {
      console.log('👁️ Window blurred');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isPlaying]);

  const stopHLSHealthCheck = useCallback(() => {
    if (healthCheckInterval.current) {
      clearInterval(healthCheckInterval.current);
      healthCheckInterval.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isDestroyed.current = true;
      stopHLSHealthCheck();
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      if (hlsInstanceRef.current) {
        hlsInstanceRef.current.destroy();
        hlsInstanceRef.current = null;
      }
    };
  }, [stopHLSHealthCheck]);

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
    console.log('🖱️ Video clicked');
    console.log('📊 Video element state on click:', {
      readyState: videoRef.current?.readyState,
      paused: videoRef.current?.paused,
      currentTime: videoRef.current?.currentTime,
      duration: videoRef.current?.duration,
      muted: videoRef.current?.muted
    });
    
    if (videoRef.current) {
      if (videoRef.current.paused) {
        console.log('🎬 Video is paused, trying to play...');
        videoRef.current.play().then(() => {
          console.log('✅ Manual play successful');
          setIsPlaying(true);
        }).catch((error) => {
          console.log('❌ Manual play failed:', error);
        });
      } else {
        console.log('⏸️ Video is playing, pausing...');
        videoRef.current.pause();
        setIsPlaying(false);
      }
    } else {
      console.log('❌ Video element not found');
    }
  }, []);

  const handleUnmuteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔊 Unmute button clicked');
    
    if (videoRef.current) {
      videoRef.current.muted = false;
      setIsMuted(false);
      console.log('✅ Video unmuted');
    }
  }, []);

  const handleMuteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('🔇 Mute button clicked');
    
    if (videoRef.current) {
      videoRef.current.muted = true;
      setIsMuted(true);
      console.log('✅ Video muted');
    }
  }, []);

  const startHLSHealthCheck = useCallback(() => {
    // Clear existing health check
    if (healthCheckInterval.current) {
      clearInterval(healthCheckInterval.current);
    }

    // Start new health check every 5 seconds
    healthCheckInterval.current = setInterval(() => {
      if (isDestroyed.current || !hlsInstanceRef.current || !videoRef.current) {
        return;
      }

      const video = videoRef.current;
      const hls = hlsInstanceRef.current;
      
      console.log('🏥 HLS Health Check:', {
        readyState: video.readyState,
        paused: video.paused,
        currentTime: video.currentTime,
        duration: video.duration,
        isPlaying: isPlaying,
        isTabVisible: isTabVisible
      });

      // Check if video is stuck (paused but should be playing)
      if (video.paused && isPlaying && isTabVisible) {
        console.log('⚠️ Video is paused but should be playing, attempting to resume...');
        video.play().catch((error) => {
          console.log('❌ Failed to resume video in health check:', error);
        });
      }

      // Check if HLS is stalled and restart if needed
      if (hls && hls.media && video.readyState < 2) {
        console.log('⚠️ HLS appears stalled, restarting...');
        hls.startLoad();
      }

      // Check if video duration is NaN (indicates no data)
      if (isNaN(video.duration) && video.readyState >= 1) {
        console.log('⚠️ Video has no duration, restarting HLS...');
        hls.startLoad();
      }
    }, 5000);
  }, [isPlaying, isTabVisible]);

  return (
    <div className="relative bg-black rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        className="w-full h-full cursor-pointer"
        onLoadStart={onLoadStart}
        onClick={handleVideoClick}
        onPlay={() => {
          console.log('🎬 Video started playing');
          setIsPlaying(true);
        }}
        onPause={() => {
          console.log('⏸️ Video paused');
          setIsPlaying(false);
        }}
        onError={(e) => {
          console.error('Video error:', e);
          setConnectionError('Video playback failed');
          onError?.('Video playback failed');
        }}
        key={`video-${rtmpKey}`}
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
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer z-10"
          onClick={handleVideoClick}
        >
          <div className="text-white text-center">
            <div className="text-6xl mb-4">▶️</div>
            <div className="text-lg">Click to play</div>
          </div>
        </div>
      )}
      
      {/* Unmute button when video is playing but muted */}
      {!isConnecting && isConnected && isPlaying && isMuted && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={handleUnmuteClick}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200 flex items-center gap-2"
            title="Unmute"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L5.5 14H2a1 1 0 01-1-1V7a1 1 0 011-1h3.5l2.883-2.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
            <span className="text-sm">Unmute</span>
          </button>
        </div>
      )}
      
      {/* Mute button when video is playing and unmuted */}
      {!isConnecting && isConnected && isPlaying && !isMuted && (
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={handleMuteClick}
            className="bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-3 rounded-full transition-all duration-200 flex items-center gap-2"
            title="Mute"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.617.793L5.5 14H2a1 1 0 01-1-1V7a1 1 0 011-1h3.5l2.883-2.793a1 1 0 011.617.793zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
              <path d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06L3.28 2.22z" />
            </svg>
            <span className="text-sm">Mute</span>
          </button>
        </div>
      )}
    </div>
  );
}