'use client';

import { useState, useEffect, useRef } from 'react';

export default function HLSWorkingTestPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Not started');
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
    console.log(`${timestamp}: ${message}`);
  };

  const testWorkingHLS = async () => {
    try {
      setStatus('Testing with working HLS files...');
      addLog('Starting working HLS test...');

      if (!videoRef.current) {
        addLog('Video element not found');
        return;
      }

      // Use the old working files
      const manifestUrl = 'http://localhost:8080/live/test123.m3u8';
      addLog(`Testing with manifest: ${manifestUrl}`);
      
      // First check if the manifest exists
      const manifestResponse = await fetch(manifestUrl);
      addLog(`Manifest response status: ${manifestResponse.status}`);
      
      if (manifestResponse.ok) {
        const manifestText = await manifestResponse.text();
        addLog(`Manifest content: ${manifestText.substring(0, 200)}...`);
        
        // Try to play the video
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
      } else {
        addLog(`Manifest not accessible: ${manifestResponse.status} ${manifestResponse.statusText}`);
        setStatus('Manifest not accessible');
      }

    } catch (error) {
      addLog(`Error: ${error}`);
      setStatus(`Error: ${error}`);
    }
  };

  const testCurrentStream = async () => {
    try {
      setStatus('Testing current stream...');
      addLog('Testing current stream with different approaches...');

      // Try different URL encodings
      const urls = [
        'http://localhost:8080/live/zmr_qqusv81lv$3jew.m3u8',
        'http://localhost:8080/live/zmr_qqusv81lv%243jew.m3u8',
        'http://localhost:8080/live/zmr_qqusv81lv%24%33jew.m3u8'
      ];

      for (const url of urls) {
        try {
          addLog(`Testing: ${url}`);
          const response = await fetch(url);
          addLog(`${url} -> ${response.status} ${response.statusText}`);
          
          if (response.ok) {
            const text = await response.text();
            addLog(`Content: ${text.substring(0, 100)}...`);
            
            // Try to play this one
            if (videoRef.current) {
              videoRef.current.src = url;
              videoRef.current.load();
              setStatus(`Testing: ${url}`);
              break;
            }
          }
        } catch (error) {
          addLog(`${url} -> Error: ${error}`);
        }
      }

    } catch (error) {
      addLog(`Error: ${error}`);
      setStatus(`Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">HLS Working Test Page</h1>
      
      <div className="mb-4">
        <p>Status: {status}</p>
        <button 
          onClick={testWorkingHLS}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white mr-2"
        >
          Test Working HLS
        </button>
        <button 
          onClick={testCurrentStream}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
        >
          Test Current Stream
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
        <h3 className="text-lg font-semibold mb-2">Available HLS Files:</h3>
        <p className="text-sm text-gray-300">
          test123.m3u8 (working) | zmr_qqusv81lv$3jew.m3u8 (current stream with $ character issue)
        </p>
      </div>
    </div>
  );
}

