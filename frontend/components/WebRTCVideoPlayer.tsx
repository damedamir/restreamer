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
    console.log('🚀 WebRTCVideoPlayer useEffect triggered');
    console.log('📊 Props:', { rtmpKey, isLive, rtmpUrl });
    console.log('📊 State:', { isConnecting, isConnected, connectionError });
    console.log('🔥 THIS IS THE NEW VERSION WITH DEBUGGING LOGS!');
    
    if (!rtmpKey || !isLive || connectionAttempted.current) {
      console.log('❌ Skipping WebRTC connection:', { 
        noRtmpKey: !rtmpKey, 
        notLive: !isLive, 
        alreadyAttempted: connectionAttempted.current 
      });
      return;
    }

    const connectWebRTC = async () => {
      if (isConnecting || isConnected) {
        console.log('❌ Skipping connection - already connecting or connected');
        return;
      }
      
      console.log('🎯 Starting WebRTC connection process...');
      connectionAttempted.current = true;
      setIsConnecting(true);
      setConnectionError(null);

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
        console.error('❌ WebRTC connection error:', error);
        console.error('❌ Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
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
  }, [rtmpKey, isLive, isConnecting, isConnected]);

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