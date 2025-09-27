'use client';

import { useState, useEffect, useRef } from 'react';

export default function HLSDirectTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Not started');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`${timestamp}: ${message}`);
  };

  const testDirectHLS = async () => {
    try {
      setStatus('Testing direct HLS access...');
      addLog('Starting direct HLS test...');

      if (!videoRef.current) {
        addLog('Video element not found');
        return;
      }

      // Get current stream name
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

      // Try to access the manifest directly without context
      const manifestUrl = `http://localhost:8080/live/${streamName}.m3u8`;
      addLog(`Testing direct manifest access: ${manifestUrl}`);
      
      const manifestResponse = await fetch(manifestUrl);
      addLog(`Manifest response status: ${manifestResponse.status}`);
      
      if (!manifestResponse.ok) {
        addLog(`Manifest not accessible: ${manifestResponse.status}`);
        setStatus('Manifest not accessible');
        return;
      }
      
      const manifestText = await manifestResponse.text();
      addLog(`Manifest content: ${manifestText.substring(0, 200)}...`);
      
      // Check if it's a redirect
      if (manifestText.includes('EXT-X-STREAM-INF')) {
        addLog('Manifest is a redirect, extracting actual stream URL...');
        
        // Extract the actual stream URL
        const streamUrlMatch = manifestText.match(new RegExp(`/live/${streamName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\.m3u8\\?hls_ctx=([^\\s]+)`));
        if (streamUrlMatch) {
          const actualStreamUrl = `http://localhost:8080${streamUrlMatch[0]}`;
          addLog(`Actual stream URL: ${actualStreamUrl}`);
          
          // Test the actual stream URL
          const actualResponse = await fetch(actualStreamUrl);
          addLog(`Actual stream response status: ${actualResponse.status}`);
          
          if (actualResponse.ok) {
            const actualText = await actualResponse.text();
            addLog(`Actual stream content: ${actualText.substring(0, 200)}...`);
            
            // Try to play this stream
            if (videoRef.current) {
              videoRef.current.src = actualStreamUrl;
              videoRef.current.load();
              
              videoRef.current.addEventListener('loadedmetadata', () => {
                addLog('Video metadata loaded');
                setStatus('Video loaded successfully');
              });
              
              videoRef.current.addEventListener('canplay', () => {
                addLog('Video can start playing');
                setStatus('Video ready to play');
              });
              
              videoRef.current.addEventListener('error', (e) => {
                addLog(`Video error: ${e}`);
                setStatus('Video playback error');
              });
            }
          } else {
            addLog(`Actual stream not accessible: ${actualResponse.status}`);
            setStatus('Actual stream not accessible');
          }
        } else {
          addLog('Could not extract actual stream URL from manifest');
          setStatus('Could not extract stream URL');
        }
      } else {
        addLog('Manifest is not a redirect, trying to play directly...');
        
        // Try to play the manifest directly
        if (videoRef.current) {
          videoRef.current.src = manifestUrl;
          videoRef.current.load();
          
          videoRef.current.addEventListener('loadedmetadata', () => {
            addLog('Video metadata loaded');
            setStatus('Video loaded successfully');
          });
          
          videoRef.current.addEventListener('canplay', () => {
            addLog('Video can start playing');
            setStatus('Video ready to play');
          });
          
          videoRef.current.addEventListener('error', (e) => {
            addLog(`Video error: ${e}`);
            setStatus('Video playback error');
          });
        }
      }

    } catch (error) {
      addLog(`Error: ${error}`);
      setStatus(`Error: ${error}`);
    }
  };

  const testSegmentAccess = async () => {
    try {
      addLog('Testing individual segment access...');
      
      // Get current stream name
      const streamsResponse = await fetch('http://localhost:1985/api/v1/streams/');
      const streamsData = await streamsResponse.json();
      
      if (streamsData.code !== 0 || !streamsData.streams || streamsData.streams.length === 0) {
        addLog('No active streams found');
        return;
      }
      
      const streamName = streamsData.streams[0].name;
      
      // Test accessing a few segments directly
      for (let i = 30; i < 35; i++) {
        const segmentUrl = `http://localhost:8080/live/${streamName}-${i}.ts`;
        try {
          addLog(`Testing segment ${i}...`);
          const response = await fetch(segmentUrl);
          addLog(`Segment ${i}: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            addLog(`Segment ${i} is accessible!`);
            break;
          }
        } catch (error) {
          addLog(`Segment ${i} error: ${error}`);
        }
      }
      
    } catch (error) {
      addLog(`Error testing segments: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">HLS Direct Test Page</h1>
      
      <div className="mb-4">
        <p>Status: {status}</p>
        <button 
          onClick={testDirectHLS}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white mr-2"
        >
          Test Direct HLS
        </button>
        <button 
          onClick={testSegmentAccess}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
        >
          Test Segment Access
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
    </div>
  );
}

