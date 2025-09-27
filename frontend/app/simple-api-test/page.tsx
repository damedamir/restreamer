'use client';

import { useState, useEffect } from 'react';

export default function SimpleApiTestPage() {
  const [result, setResult] = useState<string>('Not started');
  const [loading, setLoading] = useState(false);

  const testApi = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      const response = await fetch('http://localhost:3001/api/branded-urls/slug/brokers-playbook');
      const data = await response.json();
      setResult(`Success: ${data.name}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Simple API Test</h1>
      
      <div className="mb-4">
        <p>Result: {result}</p>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <button 
          onClick={testApi}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white"
        >
          {loading ? 'Testing...' : 'Test API'}
        </button>
      </div>
    </div>
  );
}

