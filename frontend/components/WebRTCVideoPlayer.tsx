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

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
          console.log('WebRTC connection state:', pc.connectionState);
          if (pc.connectionState === 'failed') {
            console.error('WebRTC connection failed');
            setConnectionError('WebRTC connection failed');
            setIsConnecting(false);
            setIsConnected(false);
            onError?.('WebRTC connection failed');
          } else if (pc.connectionState === 'connected') {
            console.log('WebRTC connection established');
            setIsConnecting(false);
            setIsConnected(true);
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

        // Modify the SDP to include required SRS attributes
        let modifiedSdp = offer.sdp;
        
        // Add BUNDLE group if not present
        if (!modifiedSdp.includes('a=group:BUNDLE')) {
          modifiedSdp = modifiedSdp.replace(/a=msid-semantic: WMS\r\n/, 'a=msid-semantic: WMS\r\na=group:BUNDLE 0 1\r\n');
        }
        
        // Add rtcp-mux to audio track if not present
        if (modifiedSdp.includes('m=audio') && !modifiedSdp.includes('a=rtcp-mux')) {
          modifiedSdp = modifiedSdp.replace(/(m=audio[^\r\n]*\r\n[^\r\n]*\r\n)/, '$1a=rtcp-mux\r\n');
        }
        
        // Add rtcp-mux to video track if not present
        if (modifiedSdp.includes('m=video') && !modifiedSdp.includes('a=rtcp-mux')) {
          modifiedSdp = modifiedSdp.replace(/(m=video[^\r\n]*\r\n[^\r\n]*\r\n)/, '$1a=rtcp-mux\r\n');
        }
        
        // Only add codecs if they don't already exist with any payload type
        if (modifiedSdp.includes('m=audio') && !modifiedSdp.includes('opus/48000/2')) {
          // Find audio section and add Opus codec with payload type 111 (SRS expects this)
          const audioMatch = modifiedSdp.match(/m=audio[^\r\n]*\r\n([^\r\n]*\r\n)*/);
          if (audioMatch) {
            const audioSection = audioMatch[0];
            // Add after the first attribute line
            const newAudioSection = audioSection.replace(/(a=[^\r\n]*\r\n)/, '$1a=rtpmap:111 opus/48000/2\r\n');
            modifiedSdp = modifiedSdp.replace(audioSection, newAudioSection);
          }
        }
        
        if (modifiedSdp.includes('m=video') && !modifiedSdp.includes('H264/90000')) {
          // Find video section and add H264 codec with payload type 109 (SRS expects this)
          const videoMatch = modifiedSdp.match(/m=video[^\r\n]*\r\n([^\r\n]*\r\n)*/);
          if (videoMatch) {
            const videoSection = videoMatch[0];
            // Add after the first attribute line
            const newVideoSection = videoSection.replace(/(a=[^\r\n]*\r\n)/, '$1a=rtpmap:109 H264/90000\r\n');
            modifiedSdp = modifiedSdp.replace(videoSection, newVideoSection);
          }
        }

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
          await pc.setRemoteDescription({ type: 'answer', sdp: data.sdp });
          console.log('Remote description set successfully');
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
