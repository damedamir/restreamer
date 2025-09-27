'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

function ApiTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [counter, setCounter] = useState(0);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const testApi = async () => {
      try {
        setLoading(true);
        addLog('Starting API test...');
        const apiUrl = 'http://localhost:3001/api/branded-urls/slug/brokers-playbook';
        addLog(`Testing API call to: ${apiUrl}`);
        console.log('Testing API call to:', apiUrl);
        
        const response = await fetch(apiUrl);
        addLog(`Response status: ${response.status}`);
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        addLog(`Response data received: ${JSON.stringify(data).substring(0, 100)}...`);
        console.log('Response data:', data);
        setResult(data);
      } catch (err) {
        addLog(`API call failed: ${err}`);
        console.error('API call failed:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        addLog('API test completed');
        setLoading(false);
      }
    };

    // Only run on client side
    if (typeof window !== 'undefined') {
      addLog('Client side detected, starting API test...');
      testApi();
    } else {
      addLog('Server side detected, skipping API test...');
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">API Test Page</h1>
      
      <div className="mb-4">
        <h2 className="text-lg font-semibold mb-2">Status:</h2>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
        <p>Result: {result ? 'Success' : 'No data'}</p>
        <p>Counter: {counter}</p>
        <button 
          onClick={() => setCounter(counter + 1)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white"
        >
          Increment Counter
        </button>
      </div>

      {error && (
        <div className="bg-red-900 text-red-100 p-4 rounded mb-4">
          <h3 className="font-semibold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="bg-green-900 text-green-100 p-4 rounded">
          <h3 className="font-semibold">Success! Data received:</h3>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Logs:</h3>
        <div className="bg-gray-800 p-4 rounded max-h-60 overflow-y-auto">
          {logs.map((log, index) => (
            <div key={index} className="text-sm text-gray-300 mb-1">{log}</div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-gray-400">
          Check the browser console for detailed logs.
        </p>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(ApiTestPage), {
  ssr: false
});
