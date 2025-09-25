'use client';

import { useEffect, useRef, useState } from 'react';

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

  useEffect(() => {
    if (!rtmpKey || !isLive || connectionAttempted.current) return;

    const connectWebRTC = async () => {
      if (isConnecting || isConnected) return;
      
      connectionAttempted.current = true;
      setIsConnecting(true);
      setConnectionError(null);

      try {
        // Create peer connection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        pcRef.current = pc;

        // Handle ICE candidates
        pc.onicecandidate = async (event) => {
          if (event.candidate) {
            try {
              const srsUrl = typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                ? 'http://localhost:1985'
                : 'https://hive.restreamer.website/webrtc';

              const response = await fetch(`${srsUrl}/rtc/v1/play/`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  api: `${srsUrl}/api/v1`,
                  streamurl: `${rtmpUrl}/${rtmpKey}`,
                  candidate: event.candidate.candidate
                })
              });

              if (!response.ok) {
                throw new Error(`ICE candidate failed: ${response.status}`);
              }
            } catch (error) {
              console.error('Error sending ICE candidate:', error);
            }
          }
        };

        // Handle remote stream
        pc.ontrack = (event) => {
          if (videoRef.current && event.streams[0]) {
            videoRef.current.srcObject = event.streams[0];
            setIsConnecting(false);
            setIsConnected(true);
            onCanPlay?.();
          }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          if (pc.connectionState === 'failed') {
            setConnectionError('WebRTC connection failed');
            setIsConnecting(false);
            setIsConnected(false);
            onError?.('WebRTC connection failed');
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
          : 'https://hive.restreamer.website/webrtc';

        const response = await fetch(`${srsUrl}/rtc/v1/play/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            api: `${srsUrl}/api/v1`,
            streamurl: `${rtmpUrl}/${rtmpKey}`,
            sdp: offer.sdp
          })
        });

        if (!response.ok) {
          throw new Error(`WebRTC offer failed: ${response.status}`);
        }

        const data = await response.json();
        if (data.sdp) {
          await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
        }

      } catch (error) {
        console.error('WebRTC connection error:', error);
        setConnectionError('WebRTC connection failed');
        setIsConnecting(false);
        setIsConnected(false);
        onError?.('WebRTC connection failed');
      }
    };

    connectWebRTC();

    // Cleanup
    return () => {
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      connectionAttempted.current = false;
    };
  }, [rtmpKey, isLive]); // Only depend on rtmpKey and isLive

  if (connectionError) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-red-500 mb-2">⚠️</div>
          <div>{connectionError}</div>
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
        muted
        className="w-full h-full"
        onLoadStart={onLoadStart}
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
    </div>
  );
}
