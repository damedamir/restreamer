'use client';

import { useState } from 'react';

export default function DebugPage() {
  const [count, setCount] = useState(0);
  const [activeTab, setActiveTab] = useState('Tab1');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page - JavaScript Test</h1>
      
      <div className="mb-6">
        <p className="mb-2">Counter Test: {count}</p>
        <button 
          onClick={() => setCount(count + 1)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
        >
          Increment
        </button>
      </div>

      <div className="mb-6">
        <p className="mb-2">Tab Test: {activeTab}</p>
        <div className="flex space-x-4">
          <button 
            onClick={() => setActiveTab('Tab1')}
            className={`px-4 py-2 rounded ${activeTab === 'Tab1' ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            Tab 1
          </button>
          <button 
            onClick={() => setActiveTab('Tab2')}
            className={`px-4 py-2 rounded ${activeTab === 'Tab2' ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            Tab 2
          </button>
          <button 
            onClick={() => setActiveTab('Tab3')}
            className={`px-4 py-2 rounded ${activeTab === 'Tab3' ? 'bg-blue-600' : 'bg-gray-600'}`}
          >
            Tab 3
          </button>
        </div>
      </div>

      <div className="mb-6">
        <p className="text-green-400">✅ If you can see this and the buttons work, JavaScript is working!</p>
      </div>
    </div>
  );
}
