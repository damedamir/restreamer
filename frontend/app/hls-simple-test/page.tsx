'use client';

import { useState, useEffect, useRef } from 'react';

export default function HLSSimpleTestPage() {
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

      // Try to access HLS files directly through the container
      const baseUrl = 'http://localhost:8080/live';
      const streamName = 'zmr_qqusv81lv%243jew'; // URL encode the $ character
      
      addLog(`Testing direct access to: ${baseUrl}/${streamName}.m3u8`);
      
      // First, try to get the manifest
      const manifestUrl = `${baseUrl}/${streamName}.m3u8`;
      addLog(`Fetching manifest: ${manifestUrl}`);
      
      const manifestResponse = await fetch(manifestUrl);
      addLog(`Manifest response status: ${manifestResponse.status}`);
      
      if (!manifestResponse.ok) {
        addLog(`Manifest fetch failed: ${manifestResponse.status} ${manifestResponse.statusText}`);
        setStatus('Manifest fetch failed');
        return;
      }
      
      const manifestText = await manifestResponse.text();
      addLog(`Manifest content: ${manifestText.substring(0, 200)}...`);
      
      // Try to access a video segment
      const segmentUrl = `${baseUrl}/${streamName}-278.ts`;
      addLog(`Testing segment access: ${segmentUrl}`);
      
      const segmentResponse = await fetch(segmentUrl);
      addLog(`Segment response status: ${segmentResponse.status}`);
      
      if (segmentResponse.ok) {
        addLog('Segment is accessible!');
        setStatus('HLS files are accessible');
        
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
        addLog(`Segment not accessible: ${segmentResponse.status} ${segmentResponse.statusText}`);
        setStatus('HLS segments not accessible');
      }

    } catch (error) {
      addLog(`Error: ${error}`);
      setStatus(`Error: ${error}`);
    }
  };

  const testAlternativeURLs = async () => {
    addLog('Testing alternative HLS URLs...');
    
    const urls = [
      'http://localhost:8080/live/zmr_qqusv81lv$3jew.m3u8',
      'http://localhost:8080/live/zmr_qqusv81lv%243jew.m3u8',
      'http://192.168.1.24:8080/live/zmr_qqusv81lv$3jew.m3u8',
      'http://127.0.0.1:8080/live/zmr_qqusv81lv$3jew.m3u8'
    ];
    
    for (const url of urls) {
      try {
        addLog(`Testing: ${url}`);
        const response = await fetch(url);
        addLog(`${url} -> ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const text = await response.text();
          addLog(`Content: ${text.substring(0, 100)}...`);
        }
      } catch (error) {
        addLog(`${url} -> Error: ${error}`);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">HLS Simple Test Page</h1>
      
      <div className="mb-4">
        <p>Status: {status}</p>
        <button 
          onClick={testDirectHLS}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white mr-2"
        >
          Test Direct HLS
        </button>
        <button 
          onClick={testAlternativeURLs}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white"
        >
          Test Alternative URLs
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
