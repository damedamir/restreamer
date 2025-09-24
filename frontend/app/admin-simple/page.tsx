'use client';

import { useState } from 'react';

export default function AdminSimplePage() {
  const [activeTab, setActiveTab] = useState('Configs');

  const handleTabClick = (tab: string) => {
    console.log('Tab clicked:', tab);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard - Simple Test</h1>
      
      {/* Tab Navigation */}
      <div className="flex space-x-4 mb-6">
        {['Configs', 'Customize', 'URLs', 'Embed', 'RTMP'].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Active Tab: {activeTab}</h2>
        
        {activeTab === 'Configs' && (
          <div>
            <p className="text-gray-300 mb-4">This is the Configs tab content.</p>
            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded">
              Create Configuration
            </button>
          </div>
        )}
        
        {activeTab === 'Customize' && (
          <div>
            <p className="text-gray-300 mb-4">This is the Customize tab content.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Company Logo</label>
                <input type="file" className="text-gray-300" />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Brand Colors</label>
                <input type="color" className="w-8 h-8 rounded" defaultValue="#3B82F6" />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'URLs' && (
          <div>
            <p className="text-gray-300 mb-4">This is the URLs tab content.</p>
            <div className="space-y-2">
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm">Branded URL 1</p>
                <code className="text-xs text-blue-300">https://hive.restreamer.website/live/url1</code>
              </div>
              <div className="bg-gray-700 p-3 rounded">
                <p className="text-sm">Branded URL 2</p>
                <code className="text-xs text-blue-300">https://hive.restreamer.website/live/url2</code>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'Embed' && (
          <div>
            <p className="text-gray-300 mb-4">This is the Embed tab content.</p>
            <textarea 
              readOnly
              className="w-full h-32 bg-gray-700 text-white p-3 rounded font-mono text-sm"
              value='<iframe src="https://hive.restreamer.website/embed/stream" width="800" height="450" frameborder="0" allowfullscreen></iframe>'
            />
          </div>
        )}
        
        {activeTab === 'RTMP' && (
          <div>
            <p className="text-gray-300 mb-4">This is the RTMP tab content.</p>
            <div className="bg-gray-700 p-4 rounded">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Stream URL:</span>
                  <code className="text-sm text-white bg-gray-600 px-2 py-1 rounded">rtmp://173.212.253.79:1935/live</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-300">Stream Key:</span>
                  <code className="text-sm text-white bg-gray-600 px-2 py-1 rounded">zmr_934fe5$48-CE9</code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-green-900 rounded">
        <p className="text-green-300">✅ If you can see this and the tabs work, JavaScript is working!</p>
      </div>
    </div>
  );
}
