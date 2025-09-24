'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

export default function TestPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        addLog(`Starting fetch for slug: ${slug}`);
        const apiUrl = `http://localhost:3001/api/branded-urls/slug/${slug}`;
        addLog(`API URL: ${apiUrl}`);
        
        const response = await fetch(apiUrl);
        addLog(`Response status: ${response.status}`);
        
        if (response.ok) {
          const result = await response.json();
          addLog(`Data received: ${JSON.stringify(result).substring(0, 100)}...`);
          setData(result);
        } else {
          const errorText = await response.text();
          addLog(`API error: ${response.status} - ${errorText}`);
          setError(`API error: ${response.status}`);
        }
      } catch (err) {
        addLog(`Fetch error: ${err}`);
        setError(`Fetch error: ${err}`);
      } finally {
        addLog('Fetch completed');
        setLoading(false);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug]);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Test Page for Slug: {slug}</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status:</h2>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
        <p>Data: {data ? 'Loaded' : 'Not loaded'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Logs:</h2>
        <div style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px', maxHeight: '200px', overflowY: 'auto' }}>
          {logs.map((log, index) => (
            <div key={index} style={{ marginBottom: '5px', fontSize: '12px' }}>{log}</div>
          ))}
        </div>
      </div>

      {data && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Branded URL Data:</h2>
          <div style={{ backgroundColor: data.color || '#3B82F6', color: 'white', padding: '20px', borderRadius: '8px' }}>
            <h3>{data.name}</h3>
            <p>Slug: {data.slug}</p>
            <p>Color: {data.color}</p>
            <p>Offline Message: {data.offlineMessage}</p>
            <p>CTA Text: {data.ctaText}</p>
            <p>CTA URL: {data.ctaUrl}</p>
            {data.logoUrl && <img src={data.logoUrl} alt="Logo" style={{ width: '50px', height: '50px' }} />}
          </div>
        </div>
      )}

      {error && (
        <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '5px' }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
