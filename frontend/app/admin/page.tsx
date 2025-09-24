'use client';

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [user, setUser] = useState({ email: 'damir.fatic@hotmail.com', name: 'Dame Company' });
  const [configs, setConfigs] = useState([
    {
      id: 1,
      name: 'My stream',
      status: 'Active',
      selected: true,
      created: '9/22/2025',
      rtmpKey: 'zmr_934fe5$48-CE9',
      rtmpServer: 'rtmp://173.212.253.79:1935/live',
      zoomId: '84680945036'
    }
  ]);
  const [activeTab, setActiveTab] = useState('Configs');

  const handleSignOut = () => {
    // Clear token and redirect to login
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const deleteConfig = (id: number) => {
    setConfigs(configs.filter(config => config.id !== id));
  };

  const addConfiguration = () => {
    const newConfig = {
      id: Date.now(),
      name: `Configuration ${configs.length + 1}`,
      status: 'Inactive',
      selected: false,
      created: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
      rtmpKey: `zmr_${Math.random().toString(36).substr(2, 9)}`,
      rtmpServer: 'rtmp://173.212.253.79:1935/live',
      zoomId: Math.floor(Math.random() * 90000000000 + 10000000000).toString()
    };
    setConfigs([...configs, newConfig]);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Restreamer Pro</h1>
                <p className="text-sm text-gray-400">Multi-configuration RTMP streaming with custom branding</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 bg-gray-600 rounded-full flex items-center justify-center">
                  <svg className="h-5 w-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-300">{user.email}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="px-3 py-1 text-sm text-gray-300 hover:text-white border border-gray-600 rounded hover:bg-gray-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {['Configs', 'Customize', 'URLs', 'Embed', 'RTMP'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Configurations */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Zoom Configurations ({configs.length})
              </h2>
              <button
                onClick={addConfiguration}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Add Configuration
              </button>
            </div>

            <div className="space-y-4">
              {configs.map((config) => (
                <div key={config.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-white">{config.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        config.status === 'Active' 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {config.status}
                      </span>
                      {config.selected && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-900 text-blue-300">
                          Selected
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(config.rtmpKey)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteConfig(config.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-4">Created: {config.created}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">RTMP Stream Key:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-white bg-gray-700 px-2 py-1 rounded">
                          {config.rtmpKey}
                        </code>
                        <button
                          onClick={() => copyToClipboard(config.rtmpKey)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">RTMP Server:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-white bg-gray-700 px-2 py-1 rounded">
                          {config.rtmpServer}
                        </code>
                        <button
                          onClick={() => copyToClipboard(config.rtmpServer)}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Live Preview and Stats */}
          <div className="space-y-6">
            {/* Live Preview */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Live Preview</h3>
              </div>
              
              <div className="bg-gray-700 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-white font-medium">{user.name}</p>
                <p className="text-gray-400 text-sm">ID: {configs[0]?.zoomId || '84680945036'}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="flex items-center space-x-2 mb-4">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-white">Quick Stats</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Configuration:</span>
                  <span className="text-white">{configs[0]?.name || 'My stream'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Zoom ID:</span>
                  <span className="text-white">{configs[0]?.zoomId || '84680945036'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Branded URLs:</span>
                  <span className="text-white">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-900 text-blue-300">
                    Ready
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}