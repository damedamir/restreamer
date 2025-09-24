'use client';

import { useState, useEffect } from 'react';

interface Config {
  id: number;
  name: string;
  status: 'Active' | 'Inactive';
  selected: boolean;
  created: string;
  rtmpKey: string;
  rtmpServer: string;
  zoomId: string;
  brandedUrls: number;
}

interface BrandedUrl {
  id: number;
  name: string;
  url: string;
  configId: number;
  views: number;
  created: string;
}

export default function AdminPage() {
  const [user, setUser] = useState({ email: 'damir.fatic@hotmail.com', name: 'Dame Company' });
  const [configs, setConfigs] = useState<Config[]>([
    {
      id: 1,
      name: 'My stream',
      status: 'Active',
      selected: true,
      created: '9/22/2025',
      rtmpKey: 'zmr_934fe5$48-CE9',
      rtmpServer: 'rtmp://173.212.253.79:1935/live',
      zoomId: '84680945036',
      brandedUrls: 2
    }
  ]);
  const [brandedUrls, setBrandedUrls] = useState<BrandedUrl[]>([
    {
      id: 1,
      name: 'Company Live Stream',
      url: 'https://hive.restreamer.website/live/company-event',
      configId: 1,
      views: 150,
      created: '9/22/2025'
    },
    {
      id: 2,
      name: 'Product Launch',
      url: 'https://hive.restreamer.website/live/product-launch',
      configId: 1,
      views: 89,
      created: '9/23/2025'
    }
  ]);
  const [activeTab, setActiveTab] = useState('Configs');
  const [showCreateConfig, setShowCreateConfig] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');

  const handleSignOut = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const createConfig = () => {
    if (!newConfigName.trim()) return;
    
    const newConfig: Config = {
      id: Date.now(),
      name: newConfigName,
      status: 'Inactive',
      selected: false,
      created: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
      rtmpKey: `zmr_${Math.random().toString(36).substr(2, 9)}`,
      rtmpServer: 'rtmp://173.212.253.79:1935/live',
      zoomId: Math.floor(Math.random() * 90000000000 + 10000000000).toString(),
      brandedUrls: 0
    };
    
    setConfigs([...configs, newConfig]);
    setNewConfigName('');
    setShowCreateConfig(false);
  };

  const cloneConfig = (config: Config) => {
    const clonedConfig: Config = {
      ...config,
      id: Date.now(),
      name: `${config.name} (Copy)`,
      status: 'Inactive',
      selected: false,
      created: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' }),
      rtmpKey: `zmr_${Math.random().toString(36).substr(2, 9)}`,
      brandedUrls: 0
    };
    setConfigs([...configs, clonedConfig]);
  };

  const deleteConfig = (id: number) => {
    setConfigs(configs.filter(config => config.id !== id));
    setBrandedUrls(brandedUrls.filter(url => url.configId !== id));
  };

  const selectConfig = (id: number) => {
    setConfigs(configs.map(config => ({
      ...config,
      selected: config.id === id
    })));
  };

  const createBrandedUrl = (configId: number) => {
    const config = configs.find(c => c.id === configId);
    if (!config) return;

    const newUrl: BrandedUrl = {
      id: Date.now(),
      name: `${config.name} - Branded URL`,
      url: `https://hive.restreamer.website/live/${config.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      configId,
      views: 0,
      created: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })
    };

    setBrandedUrls([...brandedUrls, newUrl]);
    setConfigs(configs.map(c => 
      c.id === configId ? { ...c, brandedUrls: c.brandedUrls + 1 } : c
    ));
  };

  const deleteBrandedUrl = (id: number) => {
    const url = brandedUrls.find(u => u.id === id);
    if (url) {
      setConfigs(configs.map(c => 
        c.id === url.configId ? { ...c, brandedUrls: c.brandedUrls - 1 } : c
      ));
    }
    setBrandedUrls(brandedUrls.filter(u => u.id !== id));
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
        {activeTab === 'Configs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Streaming Configurations ({configs.length})
              </h2>
              <button
                onClick={() => setShowCreateConfig(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Create Configuration
              </button>
            </div>

            {showCreateConfig && (
              <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center space-x-4">
                  <input
                    type="text"
                    value={newConfigName}
                    onChange={(e) => setNewConfigName(e.target.value)}
                    placeholder="Configuration name"
                    className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={createConfig}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => setShowCreateConfig(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

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
                        onClick={() => selectConfig(config.id)}
                        className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                      >
                        Select
                      </button>
                      <button
                        onClick={() => cloneConfig(config)}
                        className="px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors"
                      >
                        Clone
                      </button>
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

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Branded URLs:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-white">{config.brandedUrls}</span>
                        <button
                          onClick={() => createBrandedUrl(config.id)}
                          className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
                        >
                          + Add URL
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Customize' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Customize Branding</h2>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">Stream Branding</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Company Logo</label>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-4 text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 text-sm mt-2">Upload logo (PNG, JPG)</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Brand Colors</label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <input type="color" className="w-8 h-8 rounded border border-gray-600" defaultValue="#3B82F6" />
                      <span className="text-sm text-gray-300">Primary Color</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input type="color" className="w-8 h-8 rounded border border-gray-600" defaultValue="#1F2937" />
                      <span className="text-sm text-gray-300">Secondary Color</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Overlay Text</label>
                <input
                  type="text"
                  placeholder="Enter overlay text (e.g., 'Live from Company HQ')"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                Save Branding
              </button>
            </div>
          </div>
        )}

        {activeTab === 'URLs' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Branded URLs ({brandedUrls.length})</h2>
            <div className="space-y-4">
              {brandedUrls.map((url) => (
                <div key={url.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">{url.name}</h3>
                      <p className="text-sm text-gray-400">Created: {url.created}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">{url.views} views</span>
                      <button
                        onClick={() => copyToClipboard(url.url)}
                        className="p-1 text-gray-400 hover:text-white transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => deleteBrandedUrl(url.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-sm text-white bg-gray-700 px-3 py-2 rounded">
                      {url.url}
                    </code>
                    <button
                      onClick={() => window.open(url.url, '_blank')}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'Embed' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">Embed Code</h2>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">HTML Embed Code</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Select Configuration</label>
                  <select className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {configs.map(config => (
                      <option key={config.id} value={config.id}>{config.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Embed Code</label>
                  <textarea
                    readOnly
                    value={`<iframe src="https://hive.restreamer.website/embed/stream" width="800" height="450" frameborder="0" allowfullscreen></iframe>`}
                    className="w-full h-32 px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(`<iframe src="https://hive.restreamer.website/embed/stream" width="800" height="450" frameborder="0" allowfullscreen></iframe>`)}
                    className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    Copy Embed Code
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'RTMP' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-white">RTMP Configuration</h2>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">Streaming Setup</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="text-md font-medium text-white mb-2">Zoom Integration</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Use these settings in your Zoom meeting to stream to our platform:
                  </p>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Stream URL:</span>
                        <code className="text-sm text-white bg-gray-600 px-2 py-1 rounded">
                          rtmp://173.212.253.79:1935/live
                        </code>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-300">Stream Key:</span>
                        <code className="text-sm text-white bg-gray-600 px-2 py-1 rounded">
                          {configs.find(c => c.selected)?.rtmpKey || 'Select a configuration'}
                        </code>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-md font-medium text-white mb-2">OBS Studio Setup</h4>
                  <p className="text-sm text-gray-400 mb-3">
                    Configure OBS Studio to stream to our platform:
                  </p>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <ol className="text-sm text-gray-300 space-y-1">
                      <li>1. Open OBS Studio</li>
                      <li>2. Go to Settings → Stream</li>
                      <li>3. Set Service to "Custom"</li>
                      <li>4. Enter Server: <code className="bg-gray-600 px-1 rounded">rtmp://173.212.253.79:1935/live</code></li>
                      <li>5. Enter Stream Key: <code className="bg-gray-600 px-1 rounded">{configs.find(c => c.selected)?.rtmpKey || 'Select a configuration'}</code></li>
                      <li>6. Click "Start Streaming"</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}