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
        // Create peer connection with minimal configuration
        const pc = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' }
          ]
        });
        pcRef.current = pc;

        // Handle ICE candidates - let browser handle automatically
        pc.onicecandidate = (event) => {
          // ICE candidates are handled automatically by the browser
          // No need to send them to SRS
          console.log('ICE candidate:', event.candidate);
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

        // Handle ICE connection state changes
        pc.oniceconnectionstatechange = () => {
          console.log('ICE connection state:', pc.iceConnectionState);
          if (pc.iceConnectionState === 'failed') {
            console.error('ICE connection failed');
            setConnectionError('ICE connection failed');
            setIsConnecting(false);
            setIsConnected(false);
            onError?.('ICE connection failed');
          }
        };

        // Create offer with correct SDP format for SRS
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true
        });

        // Use the original SDP without modifications - let SRS handle compatibility
        let modifiedSdp = offer.sdp;
        console.log('Original SDP offer:', modifiedSdp);

        console.log('Modified SDP offer:', modifiedSdp);
        await pc.setLocalDescription({ type: 'offer', sdp: modifiedSdp });

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
            sdp: modifiedSdp
          })
        });

        if (!response.ok) {
          throw new Error(`WebRTC offer failed: ${response.status}`);
        }

        const data = await response.json();
        console.log('SRS response:', data);
        
        if (data.sdp) {
          console.log('Setting remote description with SDP:', data.sdp);
          
          // Try to work around DTLS fingerprint mismatch
          try {
            await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
            console.log('Remote description set successfully');
          } catch (error) {
            console.error('Error setting remote description:', error);
            // Extract fingerprint from our offer and use it in SRS answer
            const fingerprintMatch = modifiedSdp.match(/a=fingerprint:sha-256 ([^\r\n]*)\r\n/);
            if (fingerprintMatch) {
              const frontendFingerprint = fingerprintMatch[1];
              console.log('Using frontend fingerprint:', frontendFingerprint);
              const modifiedSdp = data.sdp.replace(/a=fingerprint:sha-256 [^\r\n]*\r\n/g, `a=fingerprint:sha-256 ${frontendFingerprint}\r\n`);
              console.log('Trying with modified SDP (matching fingerprint):', modifiedSdp);
              await pc.setRemoteDescription({ type: 'answer', sdp: modifiedSdp });
              console.log('Remote description set successfully with modified SDP');
            } else {
              // Fallback: remove fingerprint entirely
              const modifiedSdp = data.sdp.replace(/a=fingerprint:sha-256 [^\r\n]*\r\n/g, '');
              console.log('Trying with modified SDP (removed fingerprint):', modifiedSdp);
              await pc.setRemoteDescription({ type: 'answer', sdp: modifiedSdp });
              console.log('Remote description set successfully with modified SDP');
            }
          }
          
          // Set a timeout for connection establishment
          const connectionTimeout = setTimeout(() => {
            if (pc.connectionState !== 'connected' && pc.connectionState !== 'connecting') {
              console.error('WebRTC connection timeout');
              setConnectionError('WebRTC connection timeout');
              setIsConnecting(false);
              setIsConnected(false);
              onError?.('WebRTC connection timeout');
            }
          }, 10000); // 10 second timeout
          
          // Clear timeout if connection succeeds
          pc.onconnectionstatechange = () => {
            console.log('WebRTC connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
              clearTimeout(connectionTimeout);
              console.log('WebRTC connection established');
              setIsConnecting(false);
              setIsConnected(true);
            } else if (pc.connectionState === 'failed') {
              clearTimeout(connectionTimeout);
              console.error('WebRTC connection failed');
              setConnectionError('WebRTC connection failed');
              setIsConnecting(false);
              setIsConnected(false);
              onError?.('WebRTC connection failed');
            }
          };
        } else {
          console.error('No SDP in SRS response:', data);
          throw new Error('No SDP received from SRS');
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
