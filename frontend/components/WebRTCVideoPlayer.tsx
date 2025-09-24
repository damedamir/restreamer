'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebRTCVideoPlayerProps {
  rtmpUrl: string;
  rtmpKey: string;
  isLive: boolean;
  onError?: (error: any) => void;
  onLoadStart?: () => void;
  onCanPlay?: () => void;
}

export default function WebRTCVideoPlayer({ rtmpUrl, rtmpKey, isLive, onError, onLoadStart, onCanPlay }: WebRTCVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  // Memoize the WebRTC setup function
  const setupWebRTC = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    try {
      setIsLoading(true);
      setError(null);
      onLoadStart?.();

      const video = videoRef.current;
      if (!video) return;

      console.log('Setting up WebRTC stream for:', rtmpKey);

      // Create RTCPeerConnection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });

      pcRef.current = pc;

      // Handle incoming stream
      pc.ontrack = (event) => {
        console.log('WebRTC track received');
        if (video && event.streams[0]) {
          video.srcObject = event.streams[0];
          video.play().catch(console.error);
        }
      };

      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', pc.iceConnectionState);
        if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
          setIsLoading(false);
          onCanPlay?.();
        } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
          setError('WebRTC connection failed');
          setIsLoading(false);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = async (event) => {
        if (event.candidate) {
          try {
             // Send ICE candidate to SRS
             const srsUrl = typeof window !== 'undefined' && 
               (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
               ? 'http://localhost:1985'
               : 'http://srs:1985';
             
             const response = await fetch(`${srsUrl}/rtc/v1/play/`, {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
               },
               body: JSON.stringify({ 
                 api: `${srsUrl}/api/v1`,
                 streamurl: `rtmp://localhost:1935/live/${rtmpKey}`,
                 candidate: event.candidate.candidate 
               })
             });

            if (!response.ok) {
              throw new Error(`WebRTC ICE candidate failed: ${response.statusText}`);
            }
          } catch (err) {
            console.error('Error sending ICE candidate:', err);
          }
        }
      };

      // Create offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await pc.setLocalDescription(offer);

             // Send offer to SRS
             const srsUrl = typeof window !== 'undefined' && 
               (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
               ? 'http://localhost:1985'
               : 'http://srs:1985';
             
             const response = await fetch(`${srsUrl}/rtc/v1/play/`, {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
               },
               body: JSON.stringify({ 
                 api: `${srsUrl}/api/v1`,
                 streamurl: `rtmp://localhost:1935/live/${rtmpKey}`,
                 sdp: offer.sdp 
               })
             });

             if (!response.ok) {
               throw new Error(`WebRTC offer failed: ${response.statusText}`);
             }

             const data = await response.json();
             
             console.log('WebRTC SDP answer received:', data);
             
             if (!data.sdp || data.sdp.trim() === '') {
               throw new Error('WebRTC error: Empty SDP response from server');
             }

             // Set remote description
             await pc.setRemoteDescription({
               type: 'answer',
               sdp: data.sdp
             });

      console.log('WebRTC connection established');

    } catch (err) {
      console.error('Error setting up WebRTC:', err);
      setError('Failed to connect to stream');
      setIsLoading(false);
      onError?.(err);
    }
  }, [rtmpKey, onError, onLoadStart, onCanPlay]);

  useEffect(() => {
    if (!isLive || !rtmpUrl || !rtmpKey) {
      // Stream is offline, close WebRTC connection
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
      }
      setIsLoading(false);
      setError(null);
      return;
    }

    isMountedRef.current = true;
    setupWebRTC();

    return () => {
      isMountedRef.current = false;
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      const video = videoRef.current;
      if (video) {
        video.srcObject = null;
      }
    };
  }, [isLive, setupWebRTC]);

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
            <p className="text-white text-sm">Connecting to stream...</p>
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
