'use client';

import { useState, useEffect, useRef } from 'react';

export default function HLSNativeTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Not started');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`${timestamp}: ${message}`);
  };

  const testNativeHLS = async () => {
    try {
      setStatus('Testing native HLS support...');
      addLog('Starting native HLS test...');

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

      // Try different approaches
      const approaches = [
        {
          name: 'Direct manifest',
          url: `http://localhost:8080/live/${streamName}.m3u8`
        },
        {
          name: 'With context parameter',
          url: `http://localhost:8080/live/${streamName}.m3u8?hls_ctx=test`
        }
      ];

      for (const approach of approaches) {
        try {
          addLog(`Testing ${approach.name}: ${approach.url}`);
          
          // Test if the URL is accessible
          const response = await fetch(approach.url);
          addLog(`${approach.name} response: ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            const text = await response.text();
            addLog(`${approach.name} content: ${text.substring(0, 100)}...`);
            
            // Try to play this URL
            if (videoRef.current) {
              videoRef.current.src = approach.url;
              videoRef.current.load();
              
              // Add event listeners
              videoRef.current.addEventListener('loadstart', () => {
                addLog(`${approach.name}: Video load started`);
              });
              
              videoRef.current.addEventListener('loadedmetadata', () => {
                addLog(`${approach.name}: Video metadata loaded`);
                setStatus(`${approach.name}: Video loaded successfully`);
              });
              
              videoRef.current.addEventListener('canplay', () => {
                addLog(`${approach.name}: Video can start playing`);
                setStatus(`${approach.name}: Video ready to play`);
              });
              
              videoRef.current.addEventListener('playing', () => {
                addLog(`${approach.name}: Video is playing!`);
                setStatus(`${approach.name}: Video is playing!`);
              });
              
              videoRef.current.addEventListener('error', (e) => {
                addLog(`${approach.name}: Video error: ${e}`);
                setStatus(`${approach.name}: Video error`);
              });
              
              videoRef.current.addEventListener('stalled', () => {
                addLog(`${approach.name}: Video stalled`);
              });
              
              videoRef.current.addEventListener('waiting', () => {
                addLog(`${approach.name}: Video waiting`);
              });
              
              // Wait a bit to see if this approach works
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              if (videoRef.current.readyState >= 2) {
                addLog(`${approach.name}: Video is ready, stopping here`);
                break;
              } else {
                addLog(`${approach.name}: Video not ready, trying next approach`);
              }
            }
          }
        } catch (error) {
          addLog(`${approach.name} error: ${error}`);
        }
      }

    } catch (error) {
      addLog(`Error: ${error}`);
      setStatus(`Error: ${error}`);
    }
  };

  const testSegmentDownload = async () => {
    try {
      addLog('Testing segment download...');
      
      // Get current stream name
      const streamsResponse = await fetch('http://localhost:1985/api/v1/streams/');
      const streamsData = await streamsResponse.json();
      
      if (streamsData.code !== 0 || !streamsData.streams || streamsData.streams.length === 0) {
        addLog('No active streams found');
        return;
      }
      
      const streamName = streamsData.streams[0].name;
      
      // Try to download a segment
      const segmentUrl = `http://localhost:8080/live/${streamName}-30.ts`;
      addLog(`Downloading segment: ${segmentUrl}`);
      
      const response = await fetch(segmentUrl);
      addLog(`Segment response: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const blob = await response.blob();
        addLog(`Segment downloaded: ${blob.size} bytes, type: ${blob.type}`);
        
        // Try to create a blob URL and play it
        const blobUrl = URL.createObjectURL(blob);
        addLog(`Created blob URL: ${blobUrl}`);
        
        if (videoRef.current) {
          videoRef.current.src = blobUrl;
          videoRef.current.load();
        }
      } else {
        addLog(`Segment not accessible: ${response.status}`);
      }
      
    } catch (error) {
      addLog(`Error downloading segment: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">HLS Native Test Page</h1>
      
      <div className="mb-4">
        <p>Status: {status}</p>
        <button 
          onClick={testNativeHLS}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white mr-2"
        >
          Test Native HLS
        </button>
        <button 
          onClick={testSegmentDownload}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
        >
          Test Segment Download
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

