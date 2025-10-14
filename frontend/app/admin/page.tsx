'use client';

import { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
// Session management functions
const getSessionData = () => {
  // Check localStorage first (remember me)
  let token = localStorage.getItem('token');
  let rememberMe = localStorage.getItem('rememberMe') === 'true';
  let userEmail = localStorage.getItem('userEmail');
  let expiresAt = localStorage.getItem('expiresAt');

  // If not found in localStorage, check sessionStorage
  if (!token) {
    token = sessionStorage.getItem('token');
    rememberMe = sessionStorage.getItem('rememberMe') === 'true';
    userEmail = sessionStorage.getItem('userEmail');
    expiresAt = sessionStorage.getItem('expiresAt');
  }

  if (!token || !userEmail || !expiresAt) {
    return null;
  }

  // Check if token has expired
  const now = Date.now();
  const expiryTime = parseInt(expiresAt);
  
  if (now > expiryTime) {
    clearSession();
    return null;
  }

  return {
    token,
    userEmail,
    rememberMe,
    expiresAt: expiryTime
  };
};

const checkAuthentication = () => {
  return getSessionData() !== null;
};

const getToken = () => {
  const session = getSessionData();
  return session?.token || null;
};

const getUserEmail = () => {
  const session = getSessionData();
  return session?.userEmail || null;
};

const isRememberMeEnabled = () => {
  const session = getSessionData();
  return session?.rememberMe || false;
};

const getTimeUntilExpiry = () => {
  const session = getSessionData();
  if (!session) return 0;
  
  return Math.max(0, session.expiresAt - Date.now());
};

const isExpiringSoon = () => {
  const timeUntilExpiry = getTimeUntilExpiry();
  return timeUntilExpiry > 0 && timeUntilExpiry < 60 * 60 * 1000; // 1 hour
};

const refreshSession = () => {
  const session = getSessionData();
  if (!session) return;

  const newExpiresAt = Date.now() + (session.rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000);
  
  if (session.rememberMe) {
    localStorage.setItem('expiresAt', newExpiresAt.toString());
  } else {
    sessionStorage.setItem('expiresAt', newExpiresAt.toString());
  }
};

const getFormattedTimeUntilExpiry = () => {
  const timeUntilExpiry = getTimeUntilExpiry();
  
  if (timeUntilExpiry <= 0) {
    return 'Expired';
  }

  const days = Math.floor(timeUntilExpiry / (24 * 60 * 60 * 1000));
  const hours = Math.floor((timeUntilExpiry % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((timeUntilExpiry % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
};

const clearSession = () => {
  // Clear localStorage
  localStorage.removeItem('token');
  localStorage.removeItem('rememberMe');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('expiresAt');
  
  // Clear sessionStorage
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('rememberMe');
  sessionStorage.removeItem('userEmail');
  sessionStorage.removeItem('expiresAt');
};

const logout = () => {
  clearSession();
  // Redirect to login page
  if (typeof window !== 'undefined') {
    window.location.href = '/';
  }
};
import {
  ChartBarIcon,
  PlayIcon,
  UsersIcon,
  PlusCircleIcon,
  UserGroupIcon,
  EyeIcon,
  CameraIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon, // For clone
  TrashIcon, // For delete
  ClipboardDocumentListIcon, // For copy
  ArrowTopRightOnSquareIcon, // For open URL
} from '@heroicons/react/24/outline';

interface RtmpServer {
  id: string;
  name: string;
  description?: string;
  rtmpUrl: string;
  isActive: boolean;
  createdAt: string;
}

interface Config {
  id: string;
  name: string;
  status: 'Active' | 'Inactive';
  selected: boolean;
  createdAt: string;
  rtmpKey: string;
  rtmpServerId: string;
  rtmpServer: RtmpServer;
  brandedUrls: BrandedUrl[];
}

interface BrandedUrl {
  id: string;
  name: string;
  url: string;
  rtmpConfigId: string;
  views: number;
  createdAt: string;
  color?: string;
  logoUrl?: string;
  overlayText?: string;
  offlineContent?: boolean;
  offlineMessage?: string;
}

export default function AdminPage() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();
  const [user, setUser] = useState({ email: 'damir.fatic@hotmail.com', name: 'Dame Company' });
  const [configs, setConfigs] = useState<Config[]>([]);
  const [brandedUrls, setBrandedUrls] = useState<BrandedUrl[]>([]);
  const [rtmpServers, setRtmpServers] = useState<RtmpServer[]>([]);
  const [activeTab, setActiveTab] = useState('Configs');
  const [showCreateConfig, setShowCreateConfig] = useState(false);
  const [newConfigName, setNewConfigName] = useState('');
  const [newConfigRtmpServerId, setNewConfigRtmpServerId] = useState('');
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [sessionInfo, setSessionInfo] = useState<{ email: string; expiresIn: string; rememberMe: boolean } | null>(null);
  
  // Find the currently selected configuration
  const selectedConfig = configs.find(config => config.selected);
  
  // Branded URL creation modal state
  const [showCreateBrandedUrl, setShowCreateBrandedUrl] = useState(false);
  const [newBrandedUrl, setNewBrandedUrl] = useState({
    name: '',
    slug: '',
    color: '#3B82F6',
    logoUrl: '',
    overlayText: '',
    offlineContent: false,
    offlineMessage: '',
    ctaText: '',
    ctaUrl: '',
    rtmpConfigId: ''
  });

  // Get the correct API base URL based on environment
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      // Client-side: check if we're on localhost
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'process.env.NEXT_PUBLIC_API_URL';
      }
    }
    // Server-side or production: use relative URLs (will be proxied by nginx)
    return '';
  };

  // Check authentication on component mount
  useEffect(() => {
    // Check if user is authenticated using session handler
    if (!checkAuthentication()) {
      // No valid session found, redirect to login
      window.location.href = '/';
      return;
    }
    
    // Get token from session handler
    const token = getToken();
    if (!token) {
      logout();
      return;
    }
    
    // Verify token is valid by making a test API call
    const verifyToken = async () => {
      try {
        const response = await fetch(`${getApiBaseUrl()}/api/configurations`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          setIsAuthenticated(true);
          setIsCheckingAuth(false);
          // Load data after successful authentication
          loadConfigurations();
          loadBrandedUrls();
          loadRtmpServers();
          
          // Refresh session if it's expiring soon
          if (isExpiringSoon()) {
refreshSession();
          }
          
          // Update session info
          setSessionInfo({
            email: getUserEmail() || '',
            expiresIn: getFormattedTimeUntilExpiry(),
            rememberMe: isRememberMeEnabled()
          });
        } else {
          // Token is invalid, logout and redirect
logout();
        }
      } catch (error) {
        console.error('Token verification failed:', error);
logout();
      }
    };
    
    verifyToken();
  }, []);

  const loadConfigurations = async () => {
    try {
      const token = getToken();
      if (!token) {
logout();
        return;
      }
      
      const response = await fetch(`${getApiBaseUrl()}/api/configurations`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
      }
    } catch (error) {
      console.error('Error loading configurations:', error);
    }
  };

  const loadRtmpServers = async () => {
    try {
      const token = getToken();
      if (!token) {
logout();
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/rtmp-servers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRtmpServers(data);
      }
    } catch (error) {
      console.error('Error loading RTMP servers:', error);
    }
  };

  const loadBrandedUrls = async () => {
    try {
      const token = getToken();
      if (!token) {
logout();
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/branded-urls`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBrandedUrls(data);
      }
    } catch (error) {
      console.error('Error loading branded URLs:', error);
    }
  };


  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleLogout = () => {
logout();
  };

  const createConfig = async () => {
    if (!newConfigName.trim() || !newConfigRtmpServerId) {
      showWarning('Missing Information', 'Please fill in all required fields');
      return;
    }

    console.log('Creating configuration with:', {
      name: newConfigName,
      rtmpServerId: newConfigRtmpServerId
    });

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
logout();
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/configurations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newConfigName,
          rtmpServerId: newConfigRtmpServerId
        })
      });

      if (response.ok) {
        const newConfig = await response.json();
        setConfigs([...configs, newConfig]);
        setNewConfigName('');
        setNewConfigRtmpServerId('');
        setShowCreateConfig(false);
        showSuccess('Configuration Created', `"${newConfig.name}" has been created successfully`);
      } else {
        const errorData = await response.json();
        console.error('Failed to create configuration:', errorData);
        showError('Configuration Failed', errorData.error || 'Failed to create configuration. Please try again.');
      }
    } catch (error) {
      console.error('Error creating configuration:', error);
      showError('Network Error', 'Unable to connect to the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultConfig = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
logout();
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/configurations/create-default`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const newConfig = await response.json();
        setConfigs([...configs, newConfig]);
        showSuccess('Default Configuration Created', `"${newConfig.name}" has been created successfully`);
      } else {
        const errorData = await response.json();
        console.error('Failed to create default configuration:', errorData);
        showError('Configuration Failed', errorData.error || 'Failed to create default configuration. Please try again.');
      }
    } catch (error) {
      console.error('Error creating default configuration:', error);
      showError('Network Error', 'Unable to connect to the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const cloneConfig = async (config: Config) => {
    try {
      const token = getToken();
      if (!token) {
logout();
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/configurations/${config.id}/clone`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const clonedConfig = await response.json();
        setConfigs([...configs, clonedConfig]);
      } else {
        console.error('Failed to clone configuration');
      }
    } catch (error) {
      console.error('Error cloning configuration:', error);
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      const token = getToken();
      if (!token) {
logout();
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/configurations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setConfigs(configs.filter(config => config.id !== id));
        setBrandedUrls(brandedUrls.filter(url => url.rtmpConfigId !== id));
      } else {
        console.error('Failed to delete configuration');
      }
    } catch (error) {
      console.error('Error deleting configuration:', error);
    }
  };

  const selectConfig = async (id: string) => {
    try {
      const token = getToken();
      if (!token) {
logout();
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/configurations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ selected: true })
      });
      
      if (response.ok) {
        loadConfigurations(); // Reload to get updated data
      } else {
        console.error('Failed to select configuration');
      }
    } catch (error) {
      console.error('Error selecting configuration:', error);
    }
  };

  const createBrandedUrl = async (configId: string) => {
    const config = configs.find(c => c.id === configId);
    if (!config) return;

    try {
      const token = getToken();
      if (!token) {
logout();
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/branded-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: `${config.name} - Branded URL`,
          rtmpConfigId: configId
        })
      });
      
      if (response.ok) {
        const newUrl = await response.json();
        setBrandedUrls([...brandedUrls, newUrl]);
        loadConfigurations(); // Reload to get updated branded URL count
      } else {
        console.error('Failed to create branded URL');
      }
    } catch (error) {
      console.error('Error creating branded URL:', error);
    }
  };

  const deleteBrandedUrl = async (id: string) => {
    try {
      const token = getToken();
      if (!token) {
logout();
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/branded-urls/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        setBrandedUrls(brandedUrls.filter(u => u.id !== id));
        loadConfigurations(); // Reload to get updated branded URL count
      } else {
        console.error('Failed to delete branded URL');
      }
    } catch (error) {
      console.error('Error deleting branded URL:', error);
    }
  };

  const handleCreateBrandedUrl = async () => {
    if (!newBrandedUrl.name.trim() || !newBrandedUrl.slug.trim() || !newBrandedUrl.rtmpConfigId) {
      showWarning('Missing Information', 'Please fill in all required fields (Brand Name, Slug, and RTMP Configuration)');
      return;
    }

    setLoading(true);
    try {
      const token = getToken();
      if (!token) {
logout();
        return;
      }
      const response = await fetch(`${getApiBaseUrl()}/api/branded-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newBrandedUrl.name,
          slug: newBrandedUrl.slug,
          rtmpConfigId: newBrandedUrl.rtmpConfigId,
          // Add additional fields for customization
          color: newBrandedUrl.color,
          logoUrl: newBrandedUrl.logoUrl,
          overlayText: newBrandedUrl.overlayText,
          offlineContent: newBrandedUrl.offlineContent,
          offlineMessage: newBrandedUrl.offlineMessage,
          ctaText: newBrandedUrl.ctaText,
          ctaUrl: newBrandedUrl.ctaUrl
        })
      });

      if (response.ok) {
        const newUrl = await response.json();
        setBrandedUrls([...brandedUrls, newUrl]);
        setShowCreateBrandedUrl(false);
        setNewBrandedUrl({
          name: '',
          slug: '',
          color: '#3B82F6',
          logoUrl: '',
          overlayText: '',
          offlineContent: false,
          offlineMessage: '',
          ctaText: '',
          ctaUrl: '',
          rtmpConfigId: ''
        });
        showSuccess('Branded URL Created', `"${newUrl.name}" has been created successfully`);
      } else {
        const errorData = await response.json();
        console.error('Failed to create branded URL:', errorData);
        showError('Branded URL Failed', errorData.error || 'Failed to create branded URL. Please try again.');
      }
    } catch (error) {
      console.error('Error creating branded URL:', error);
      showError('Network Error', 'Unable to connect to the server. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-300">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show login redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-gray-300">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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
                <div>
                  <span className="text-sm font-medium text-gray-300">{user.email}</span>
                  {sessionInfo && (
                    <div className="text-xs text-gray-500">
                      {sessionInfo.rememberMe ? 'Remembered' : 'Session'} 
                      {sessionInfo.expiresIn !== 'Expired' && ` (${sessionInfo.expiresIn})`}
                    </div>
                  )}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 text-sm text-gray-300 hover:text-white border border-gray-600 rounded hover:bg-gray-700 transition-colors"
              >
                Logout
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

             {/* Main Content with Sidebar */}
             <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
               <div className="flex gap-8">
                 {/* Main Content Area */}
                 <div className="flex-1">
        {activeTab === 'Configs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Zoom Configurations ({configs.length})
              </h2>
              <button
                onClick={() => setShowCreateConfig(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Add Configuration
              </button>
            </div>


            <div className="space-y-4">
              {configs.length === 0 ? (
                <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
                  <CameraIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No Configurations Yet</h3>
                  <p className="text-gray-400 mb-6">
                    Create your first streaming configuration to get started with live streaming.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowCreateConfig(true)}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                      Create Your First Configuration
                    </button>
                    <div className="text-sm text-gray-500">
                      Or use our quick setup to create a default configuration
                    </div>
                    <button
                      onClick={createDefaultConfig}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded-lg transition-colors"
                    >
                      Quick Setup (Default)
                    </button>
                  </div>
                </div>
              ) : (
                configs.map((config) => (
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
                  
                  <p className="text-sm text-gray-400 mb-4">Created: {new Date(config.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</p>
                  
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
                          {config.rtmpServer?.name || 'Unknown Server'}
                        </code>
                        <button
                          onClick={() => copyToClipboard(config.rtmpServer?.rtmpUrl || '')}
                          className="p-1 text-gray-400 hover:text-white transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">RTMP URL:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-white bg-gray-700 px-2 py-1 rounded">
                          {config.rtmpServer?.rtmpUrl || 'Unknown URL'}
                        </code>
                        <button
                          onClick={() => copyToClipboard(config.rtmpServer?.rtmpUrl || '')}
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
                        <span className="text-sm text-white">{config.brandedUrls.length}</span>
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
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'Customize' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Customize Branding</h2>
              <button
                onClick={() => setShowCreateBrandedUrl(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                + Add Branded URL
              </button>
            </div>


            {/* Branded URLs List */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <h3 className="text-lg font-medium text-white mb-4">Branded URLs ({brandedUrls.length})</h3>
              <div className="space-y-4">
                {brandedUrls.map((url) => (
                  <div key={url.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: url.color || '#3B82F6' }}></div>
                      <div>
                        <p className="text-white font-medium">{url.name}</p>
                        <p className="text-gray-400 text-sm">{url.url}</p>
                        {url.offlineContent && (
                          <p className="text-gray-500 text-xs">Offline Content: {url.offlineMessage || 'Please check FAQ on link below'}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-900 text-green-300">
                        Active
                      </span>
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
                ))}
                {brandedUrls.length === 0 && (
                  <p className="text-gray-400 text-center py-8">No branded URLs created yet</p>
                )}
              </div>
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
                      <p className="text-sm text-gray-400">Created: {new Date(url.createdAt).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</p>
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
                    value={`<iframe src="${process.env.NEXT_PUBLIC_BASE_URL}/embed/stream" width="800" height="450" frameborder="0" allowfullscreen></iframe>`}
                    className="w-full h-32 px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(`<iframe src="${process.env.NEXT_PUBLIC_BASE_URL}/embed/stream" width="800" height="450" frameborder="0" allowfullscreen></iframe>`)}
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
            <h2 className="text-lg font-semibold text-white">RTMP Servers ({rtmpServers.length})</h2>
            <div className="space-y-4">
              {rtmpServers.map((server) => (
                <div key={server.id} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white">{server.name}</h3>
                      <p className="text-sm text-gray-400">{server.description}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        server.isActive 
                          ? 'bg-green-900 text-green-300' 
                          : 'bg-gray-700 text-gray-300'
                      }`}>
                        {server.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">RTMP URL:</span>
                      <div className="flex items-center space-x-2">
                        <code className="text-sm text-white bg-gray-700 px-2 py-1 rounded">
                          {server.rtmpUrl}
                        </code>
                        <button
                          onClick={() => copyToClipboard(server.rtmpUrl)}
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
        )}
                 </div>

                 {/* Live Preview Sidebar */}
                 <div className="w-80 flex-shrink-0">
                   <div className="sticky top-8 space-y-6">
                     {/* Live Preview Section */}
                     <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                       <div className="flex items-center space-x-2 mb-4">
                         <EyeIcon className="h-5 w-5 text-blue-400" />
                         <h3 className="text-lg font-medium text-white">Live Preview</h3>
                       </div>
                       
                       {/* Video Player Placeholder */}
                       <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-4 border border-gray-600">
                         <div className="text-center">
                           <CameraIcon className="h-12 w-12 text-gray-500 mx-auto mb-2" />
                           <p className="text-gray-400 text-sm">Live Stream</p>
                           <p className="text-gray-500 text-xs">Stream will appear here when active</p>
                         </div>
                       </div>

                       {/* Stream Status */}
                       <div className="space-y-2">
                         <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-400">Status:</span>
                           <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-700 text-gray-300">
                             Offline
                           </span>
                         </div>
                         <div className="flex items-center justify-between">
                           <span className="text-sm text-gray-400">Viewers:</span>
                           <span className="text-sm text-white">0</span>
                         </div>
                       </div>
                     </div>

                     {/* Quick Stats Section */}
                     <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                       <div className="flex items-center space-x-2 mb-4">
                         <Cog6ToothIcon className="h-5 w-5 text-blue-400" />
                         <h3 className="text-lg font-medium text-white">Quick Stats</h3>
                       </div>
                       
                       <div className="space-y-4">
                         {/* Active Configuration */}
                         <div>
                           <p className="text-sm text-gray-400 mb-1">Configuration:</p>
                           <p className="text-white font-medium">
                             {selectedConfig ? selectedConfig.name : 'No active config'}
                           </p>
                         </div>

                         {/* Configuration ID */}
                         <div>
                           <p className="text-sm text-gray-400 mb-1">ID:</p>
                           <div className="flex items-center space-x-2">
                             <code className="text-sm text-white bg-gray-700 px-2 py-1 rounded flex-1">
                               {selectedConfig ? selectedConfig.rtmpKey : 'N/A'}
                             </code>
                             {selectedConfig && (
                               <button
                                 onClick={() => copyToClipboard(selectedConfig.rtmpKey)}
                                 className="p-1 text-gray-400 hover:text-white transition-colors"
                               >
                                 <ClipboardDocumentListIcon className="h-4 w-4" />
                               </button>
                             )}
                           </div>
                         </div>

                         {/* Branded URLs Count */}
                         <div>
                           <p className="text-sm text-gray-400 mb-1">Branded URLs:</p>
                           <p className="text-white font-medium">{brandedUrls.length}</p>
                         </div>

                         {/* RTMP Server Info */}
                         {selectedConfig && selectedConfig.rtmpServer && (
                           <div>
                             <p className="text-sm text-gray-400 mb-1">RTMP Server:</p>
                             <p className="text-white text-sm">{selectedConfig.rtmpServer.name}</p>
                           </div>
                         )}

                         {/* Status */}
                         <div className="pt-2 border-t border-gray-700">
                           <div className="flex items-center justify-between">
                             <span className="text-sm text-gray-400">Status:</span>
                             <button className="px-3 py-1 text-xs font-medium rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors">
                               {selectedConfig ? 'Ready' : 'No Config'}
                             </button>
                           </div>
                         </div>
                       </div>
                     </div>
                   </div>
                 </div>
               </div>
             </div>

      {/* Create Configuration Modal */}
      {showCreateConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Create New Zoom Configuration</h3>
              <button
                onClick={() => setShowCreateConfig(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mb-6">
              Set up a new Zoom webinar configuration with unique RTMP settings.
            </p>

            <div className="space-y-4">
              {/* Configuration Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Configuration Name *
                </label>
                <input
                  type="text"
                  value={newConfigName}
                  onChange={(e) => setNewConfigName(e.target.value)}
                  placeholder="e.g., Weekly Sales Demo"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* RTMP Server Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  RTMP Server *
                </label>
                <select
                  value={newConfigRtmpServerId}
                  onChange={(e) => setNewConfigRtmpServerId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select an RTMP server</option>
                  {rtmpServers.map(server => (
                    <option key={server.id} value={server.id}>
                      {server.name} - {server.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateConfig(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createConfig}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Configuration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Branded URL Modal */}
      {showCreateBrandedUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Create New Branded URL</h3>
              <button
                onClick={() => setShowCreateBrandedUrl(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mb-6">
              Set up a new branded streaming URL with custom styling and offline content.
            </p>

            <div className="space-y-4">
                     {/* Brand Name */}
                     <div>
                       <label className="block text-sm font-medium text-gray-300 mb-2">
                         Brand Name *
                       </label>
                       <input
                         type="text"
                         value={newBrandedUrl.name}
                         onChange={(e) => setNewBrandedUrl({...newBrandedUrl, name: e.target.value})}
                         placeholder="e.g., Brokers Playbook"
                         className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                       />
                     </div>

                     {/* Slug */}
                     <div>
                       <label className="block text-sm font-medium text-gray-300 mb-2">
                         Slug *
                       </label>
                       <div className="flex items-center space-x-2">
                         <span className="text-sm text-gray-400">{process.env.NEXT_PUBLIC_BASE_URL}/live/</span>
                         <input
                           type="text"
                           value={newBrandedUrl.slug}
                           onChange={(e) => setNewBrandedUrl({...newBrandedUrl, slug: e.target.value})}
                           placeholder="your-custom-slug"
                           className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                         />
                       </div>
                       <p className="text-xs text-gray-400 mt-1">This will create: {process.env.NEXT_PUBLIC_BASE_URL}/live/{newBrandedUrl.slug || 'your-custom-slug'}</p>
                     </div>

              {/* Brand Color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Brand Color
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={newBrandedUrl.color}
                    onChange={(e) => setNewBrandedUrl({...newBrandedUrl, color: e.target.value})}
                    className="w-8 h-8 rounded border border-gray-600"
                  />
                  <input
                    type="text"
                    value={newBrandedUrl.color}
                    onChange={(e) => setNewBrandedUrl({...newBrandedUrl, color: e.target.value})}
                    className="flex-1 px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={newBrandedUrl.logoUrl}
                  onChange={(e) => setNewBrandedUrl({...newBrandedUrl, logoUrl: e.target.value})}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Stream Overlay Text */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Stream Overlay Text
                </label>
                <input
                  type="text"
                  value={newBrandedUrl.overlayText}
                  onChange={(e) => setNewBrandedUrl({...newBrandedUrl, overlayText: e.target.value})}
                  placeholder="Welcome to our live stream!"
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

                     {/* Offline Content */}
                     <div>
                       <div className="flex items-center justify-between mb-2">
                         <label className="block text-sm font-medium text-gray-300">
                           Offline Content
                         </label>
                         <button
                           onClick={() => setNewBrandedUrl({...newBrandedUrl, offlineContent: !newBrandedUrl.offlineContent})}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                             newBrandedUrl.offlineContent ? 'bg-blue-600' : 'bg-gray-600'
                           }`}
                         >
                           <span
                             className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                               newBrandedUrl.offlineContent ? 'translate-x-6' : 'translate-x-1'
                             }`}
                           />
                         </button>
                       </div>
                       <p className="text-gray-400 text-xs mb-2">Custom message and CTA when stream is offline</p>
                       {newBrandedUrl.offlineContent && (
                         <div className="space-y-3">
                           <input
                             type="text"
                             value={newBrandedUrl.offlineMessage}
                             onChange={(e) => setNewBrandedUrl({...newBrandedUrl, offlineMessage: e.target.value})}
                             placeholder="Stream is currently offline. Please check back later."
                             className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                           />
                           
                           {/* CTA Text */}
                           <div>
                             <label className="block text-sm font-medium text-gray-300 mb-1">
                               CTA Text
                             </label>
                             <input
                               type="text"
                               value={newBrandedUrl.ctaText}
                               onChange={(e) => setNewBrandedUrl({...newBrandedUrl, ctaText: e.target.value})}
                               placeholder="e.g., Check FAQ"
                               className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                             />
                           </div>
                           
                           {/* CTA URL */}
                           <div>
                             <label className="block text-sm font-medium text-gray-300 mb-1">
                               CTA URL
                             </label>
                             <input
                               type="url"
                               value={newBrandedUrl.ctaUrl}
                               onChange={(e) => setNewBrandedUrl({...newBrandedUrl, ctaUrl: e.target.value})}
                               placeholder="https://example.com/faq"
                               className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                             />
                           </div>
                         </div>
                       )}
                     </div>

              {/* RTMP Configuration Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  RTMP Configuration *
                </label>
                <select
                  value={newBrandedUrl.rtmpConfigId}
                  onChange={(e) => setNewBrandedUrl({...newBrandedUrl, rtmpConfigId: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 text-white rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a configuration</option>
                  {configs.map(config => (
                    <option key={config.id} value={config.id}>{config.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateBrandedUrl(false)}
                className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateBrandedUrl}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Branded URL'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}