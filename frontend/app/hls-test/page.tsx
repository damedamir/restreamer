'use client';

import { useState, useEffect, useRef } from 'react';

export default function HLSTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Not started');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`${timestamp}: ${message}`);
  };

  const testHLS = async () => {
    try {
      setStatus('Testing HLS connection...');
      addLog('Starting HLS test...');

      // Check if HLS is supported
      if (!videoRef.current) {
        addLog('Video element not found');
        return;
      }

      // First, get the current stream name
      addLog('Getting current stream name...');
      const streamsResponse = await fetch('http://localhost:1985/api/v1/streams/');
      const streamsData = await streamsResponse.json();
      
      if (streamsData.code !== 0 || !streamsData.streams || streamsData.streams.length === 0) {
        addLog('No active streams found');
        setStatus('No active streams');
        return;
      }
      
      const streamName = streamsData.streams[0].name;
      addLog(`Using stream name: ${streamName}`);

      // Get the HLS stream URL with context
      addLog('Getting HLS stream URL...');
      const manifestResponse = await fetch(`http://localhost:8080/live/${streamName}.m3u8`);
      const manifestText = await manifestResponse.text();
      addLog(`Manifest response: ${manifestText.substring(0, 100)}...`);
      
      // Extract the actual stream URL with context
      const streamUrlMatch = manifestText.match(new RegExp(`/live/${streamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.m3u8\\?hls_ctx=([^\\s]+)`));
      if (!streamUrlMatch) {
        addLog('Could not extract HLS stream URL from manifest');
        setStatus('HLS manifest error');
        return;
      }
      
      const streamUrl = `http://localhost:8080${streamUrlMatch[0]}`;
      addLog(`Using HLS stream URL: ${streamUrl}`);

      // Check if HLS.js is available
      if (typeof window !== 'undefined' && (window as any).Hls) {
        addLog('HLS.js is available, using HLS.js');
        
        const hls = new (window as any).Hls();
        
        hls.loadSource(streamUrl);
        hls.attachMedia(videoRef.current);
        
        hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
          addLog('HLS manifest parsed successfully');
          setStatus('HLS stream loaded');
        });
        
        hls.on((window as any).Hls.Events.ERROR, (event: any, data: any) => {
          addLog(`HLS error: ${data.type} - ${data.details}`);
          setStatus(`HLS error: ${data.details}`);
        });
        
      } else {
        addLog('HLS.js not available, trying native HLS support');
        
        if (videoRef.current) {
          videoRef.current.src = streamUrl;
          videoRef.current.load();
          
          videoRef.current.addEventListener('loadedmetadata', () => {
            addLog('HLS stream metadata loaded');
            setStatus('HLS stream loaded');
          });
          
          videoRef.current.addEventListener('error', (e) => {
            addLog(`HLS error: ${e}`);
            setStatus('HLS error');
          });
        }
      }

    } catch (error) {
      addLog(`Error: ${error}`);
      setStatus(`Error: ${error}`);
    }
  };

  const checkStreamStatus = async () => {
    try {
      addLog('Checking stream status...');
      const response = await fetch('http://localhost:1985/api/v1/streams/');
      const data = await response.json();
      
      if (data.code === 0 && data.streams && data.streams.length > 0) {
        const stream = data.streams[0];
        addLog(`Stream found: ${stream.name}`);
        addLog(`Stream URL: ${stream.url}`);
        
        // Update the page to use the actual stream name
        if (stream.name !== 'zmr_qqusv81lv3jew') {
          addLog(`Note: Stream name is ${stream.name}, updating to use correct name`);
        }
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

  useEffect(() => {
    // Load HLS.js
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
    script.onload = () => {
      addLog('HLS.js loaded successfully');
    };
    document.head.appendChild(script);

    // Check stream status on load
    checkStreamStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">HLS Test Page</h1>
      
      <div className="mb-4">
        <p>Status: {status}</p>
        <button 
          onClick={testHLS}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white mr-2"
        >
          Test HLS Connection
        </button>
        <button 
          onClick={checkStreamStatus}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
        >
          Check Stream Status
        </button>
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
        <h3 className="text-lg font-semibold mb-2">Logs:</h3>
        <div className="bg-gray-800 p-4 rounded max-h-60 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-sm text-gray-300 mb-1">{log}</div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">HLS Stream URL:</h3>
        <p className="text-sm text-gray-300 break-all">
          http://localhost:8080/live/zmr_qqusv81lv$3jew.m3u8
        </p>
      </div>
    </div>
  );
}
