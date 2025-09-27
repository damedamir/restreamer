'use client';

import { useState, useEffect, useRef } from 'react';

// Declare HLS.js types
declare global {
  interface Window {
    Hls: any;
  }
}

export default function WebRTCTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Not started');
  const [logs, setLogs] = useState<string[]>([]);
  const [streamName, setStreamName] = useState('zmr_qqusv81lv3jew'); // Updated stream name without $

  // Load HLS.js
  useEffect(() => {
    const loadHLS = () => {
      if (typeof window !== 'undefined' && !window.Hls) {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.onload = () => {
          addLog('HLS.js loaded successfully');
        };
        script.onerror = () => {
          addLog('Failed to load HLS.js');
        };
        document.head.appendChild(script);
      }
    };
    loadHLS();
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`${timestamp}: ${message}`);
  };

  // Get the correct API base URL
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost';
      }
    }
    return process.env.NEXT_PUBLIC_SRS_URL || 'https://hive.restreamer.website';
  };

  // Check if stream is active
  const checkStreamStatus = async () => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/srs-api/v1/streams/`);
      const data = await response.json();
      
      if (data.streams && data.streams.length > 0) {
        const activeStream = data.streams[0];
        setStreamName(activeStream.name);
        addLog(`Active stream found: ${activeStream.name}`);
        return true;
      } else {
        addLog('No active streams found');
        return false;
      }
    } catch (error) {
      addLog(`Error checking stream status: ${error}`);
      return false;
    }
  };

  const testHybrid = async () => {
    try {
      setStatus('Testing hybrid streaming (HLS + WebRTC)...');
      addLog('Starting hybrid streaming test...');

      // Check if stream is active first
      const hasStream = await checkStreamStatus();
      if (!hasStream) {
        setStatus('No active stream - start OBS first');
        return;
      }

      // Try HLS first (primary method for localhost)
      addLog('Trying HLS streaming first...');
      const hlsSuccess = await testHLS();
      
      if (hlsSuccess) {
        addLog('HLS streaming successful - using HLS as primary method');
        setStatus('HLS streaming active - hybrid solution working');
        return;
      }

      // Fallback to WebRTC if HLS fails
      addLog('HLS failed, trying WebRTC as fallback...');
      await testWebRTC();

    } catch (error) {
      addLog(`Hybrid test error: ${error}`);
      setStatus(`Error: ${error}`);
    }
  };

  const testHLS = async () => {
    try {
      addLog('Testing HLS streaming...');
      
      // Get HLS stream URL
      const manifestResponse = await fetch(`http://localhost/srs-api/v1/streams/`);
      const streamsData = await manifestResponse.json();
      
      if (!streamsData.streams || streamsData.streams.length === 0) {
        addLog('No active streams for HLS');
        return false;
      }

      const streamName = streamsData.streams[0].name;
      addLog(`Using stream name: ${streamName}`);

            // Get HLS manifest
            const manifestUrl = `${getApiBaseUrl()}:8080/live/${streamName}.m3u8`;
            addLog(`Fetching HLS manifest: ${manifestUrl}`);
      
      const manifestResponse2 = await fetch(manifestUrl);
      const manifestText = await manifestResponse2.text();
      
      if (!manifestText.includes('EXTM3U')) {
        addLog('Invalid HLS manifest received');
        return false;
      }

      addLog('HLS manifest received successfully');
      
      // Extract stream URL with context parameter
      const streamUrlMatch = manifestText.match(new RegExp(`/live/${streamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.m3u8\\?hls_ctx=([^\\s]+)`));
      
      if (!streamUrlMatch) {
        addLog('Could not extract HLS stream URL with context');
        return false;
      }

            const streamUrl = `${getApiBaseUrl()}:8080${streamUrlMatch[0]}`;
            addLog(`Using HLS stream URL: ${streamUrl}`);

      // Set video source
      if (videoRef.current) {
        // Clear any existing source
        videoRef.current.src = '';
        videoRef.current.load();
        
        // Add event listeners for debugging
        videoRef.current.onloadstart = () => addLog('Video: loadstart event');
        videoRef.current.onloadedmetadata = () => addLog('Video: loadedmetadata event');
        videoRef.current.onloadeddata = () => addLog('Video: loadeddata event');
        videoRef.current.oncanplay = () => addLog('Video: canplay event');
        videoRef.current.onplay = () => addLog('Video: play event');
        videoRef.current.onerror = (e) => addLog(`Video error: ${e}`);
        videoRef.current.onstalled = () => addLog('Video: stalled event');
        videoRef.current.onwaiting = () => addLog('Video: waiting event');
        
        // Check if HLS.js is available
        if (typeof window !== 'undefined' && (window as any).Hls) {
          addLog('Using HLS.js for playback');
          const hls = new (window as any).Hls();
          hls.loadSource(streamUrl);
          hls.attachMedia(videoRef.current);
          
          hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
            addLog('HLS.js: Manifest parsed, starting playback');
            videoRef.current?.play();
          });
          
          hls.on((window as any).Hls.Events.ERROR, (event: any, data: any) => {
            addLog(`HLS.js error: ${data.type} - ${data.details}`);
          });
        } else {
          addLog('HLS.js not available, using native video element');
          videoRef.current.src = streamUrl;
          videoRef.current.load();
          
          // Try to play the video
          try {
            await videoRef.current.play();
            addLog('Video play() called successfully');
          } catch (playError) {
            addLog(`Video play() failed: ${playError}`);
          }
        }
        
        return true;
      }

      return false;

    } catch (error) {
      addLog(`HLS test error: ${error}`);
      return false;
    }
  };

  const testWebRTC = async () => {
    try {
      setStatus('Testing WebRTC connection...');
      addLog('Starting WebRTC test...');

      // Check if stream is active first
      const hasStream = await checkStreamStatus();
      if (!hasStream) {
        setStatus('No active stream - start OBS first');
        return;
      }

      // Create RTCPeerConnection with localhost-optimized configuration
      const pc = new RTCPeerConnection({
        iceServers: [
          // Public STUN servers
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          // Public TURN servers for NAT traversal
          { 
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          },
          { 
            urls: 'turn:openrelay.metered.ca:443',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ],
        iceCandidatePoolSize: 10,
        iceTransportPolicy: 'all'
      });

      addLog('Created RTCPeerConnection with localhost-optimized config');

      // Handle ICE candidates with detailed logging
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          addLog(`ICE candidate: ${event.candidate.candidate}`);
          addLog(`  Type: ${event.candidate.type}, Protocol: ${event.candidate.protocol}`);
          addLog(`  Address: ${event.candidate.address}, Port: ${event.candidate.port}`);
        } else {
          addLog('ICE gathering complete');
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        addLog(`Connection state: ${pc.connectionState}`);
        setStatus(`Connection: ${pc.connectionState}`);
      };

      // Handle ICE connection state changes
      pc.oniceconnectionstatechange = () => {
        addLog(`ICE connection state: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'failed') {
          addLog('ICE connection failed - trying to restart ICE...');
          pc.restartIce();
        }
      };

      // Handle ICE gathering state changes
      pc.onicegatheringstatechange = () => {
        addLog(`ICE gathering state: ${pc.iceGatheringState}`);
      };

      // Add transceivers for video and audio
      pc.addTransceiver('video', { direction: 'recvonly' });
      pc.addTransceiver('audio', { direction: 'recvonly' });
      addLog('Added transceivers for video and audio');

      // Create offer
      addLog('Creating offer...');
      const offer = await pc.createOffer();
      addLog('Offer created');

      // Set local description
      addLog('Setting local description...');
      await pc.setLocalDescription(offer);
      addLog('Local description set');

            // Send offer to SRS WebRTC API via Nginx proxy
            const apiUrl = `${getApiBaseUrl()}/rtc/v1/play/?app=live&stream=${streamName}`;
            addLog(`Sending offer to SRS API via Nginx proxy: ${apiUrl}`);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api: `${getApiBaseUrl()}/srs-api/v1/`,
          streamurl: `webrtc://${window.location.hostname}:8000/live/${streamName}`,
          clientip: window.location.hostname,
          sdp: offer.sdp
        })
      });

      addLog(`SRS API response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        addLog(`SRS API error: ${errorText}`);
        setStatus('SRS API failed');
        return;
      }

      const sdpData = await response.json();
      addLog(`SRS API response: ${JSON.stringify(sdpData).substring(0, 100)}...`);

      if (sdpData.code !== 0) {
        addLog(`SRS API returned error code: ${sdpData.code}`);
        setStatus('SRS API error');
        return;
      }

      // Set remote description (SRS answer)
      const answer = {
        type: 'answer' as RTCSdpType,
        sdp: sdpData.sdp
      };

      addLog('Setting remote description...');
      await pc.setRemoteDescription(answer);
      addLog('Remote description set');

      // Handle incoming tracks
      pc.ontrack = (event) => {
        addLog(`Received track: ${event.track.kind}`);
        if (videoRef.current && event.streams[0]) {
          videoRef.current.srcObject = event.streams[0];
          addLog('Video stream set to video element');
          setStatus('WebRTC connection established - video should appear');
        }
      };

      // Add timeout for connection
      setTimeout(() => {
        if (pc.connectionState !== 'connected') {
          addLog('Connection timeout - WebRTC failed to connect');
          setStatus('Connection timeout');
        }
      }, 10000);

    } catch (error) {
      addLog(`Error: ${error}`);
      setStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Streaming Test Page - Phase 4 (Hybrid Solution)</h1>
      
      <div className="mb-4 p-4 bg-orange-900 rounded">
        <h2 className="text-lg font-semibold mb-2">Phase 4: Hybrid Solution - HLS Primary</h2>
        <p className="text-sm text-orange-200">
          • HLS as primary streaming method<br/>
          • WebRTC as fallback for production<br/>
          • Smart protocol selection<br/>
          • Stream name: {streamName}
        </p>
      </div>
      
      <div className="mb-4">
        <p>Status: {status}</p>
        <div className="space-x-2">
          <button 
            onClick={testHybrid}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
          >
            Test Hybrid (HLS + WebRTC)
          </button>
          <button 
            onClick={testHLS}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Test HLS Only
          </button>
          <button 
            onClick={testWebRTC}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white"
          >
            Test WebRTC Only
          </button>
          <button 
            onClick={() => setLogs([])}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded text-white"
          >
            Clear Logs
          </button>
        </div>
      </div>

      <div className="mb-4">
        <video 
          ref={videoRef}
          autoPlay
          playsInline
          controls
          className="w-full max-w-2xl bg-black rounded"
          style={{ aspectRatio: '16/9' }}
        />
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">Debug Logs:</h3>
        <div className="bg-gray-800 p-4 rounded max-h-60 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-sm text-gray-300 mb-1">{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
