'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import WebRTCVideoPlayer from '../../../components/WebRTCVideoPlayer';
import Chat from '../../../components/Chat';
import { useStreamStatus } from '../../../hooks/useStreamStatus';

interface BrandedUrl {
  id: string;
  name: string;
  slug: string;
  url: string;
  color: string;
  logoUrl?: string;
  overlayText?: string;
  offlineContent: boolean;
  offlineMessage?: string;
  ctaText?: string;
  ctaUrl?: string;
  rtmpConfig: {
    name: string;
    rtmpKey: string;
    rtmpServer: {
      name: string;
      rtmpUrl: string;
    };
  };
}

export default function BrandedStreamPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [brandedUrl, setBrandedUrl] = useState<BrandedUrl | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get the correct API base URL
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      console.log('🔍 Client-side API URL detection:', {
        hostname: window.location.hostname,
        isLocalhost: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
        envVar: process.env.NEXT_PUBLIC_API_URL
      });
      // Client-side: check if we're on localhost
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:3001';
      }
    }
    // Server-side or production: use relative URLs (will be proxied by nginx)
    return '';
  };

  // Fetch branded URL configuration
  useEffect(() => {
    const fetchBrandedUrl = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        const apiUrl = `${getApiBaseUrl()}/api/branded-urls/slug/${slug}`;
        console.log('Fetching branded URL from:', apiUrl);
        const response = await fetch(apiUrl);
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          throw new Error('Branded URL not found');
        }
        
        const data = await response.json();
        console.log('Branded URL data:', data);
        setBrandedUrl(data);
      } catch (err) {
        console.error('Error fetching branded URL:', err);
        setError('Failed to load stream configuration');
      } finally {
        setLoading(false);
      }
    };

    // Only fetch on client side
    if (typeof window !== 'undefined') {
      fetchBrandedUrl();
    }
  }, [slug]);

  // Get stream status using the correct stream key from branded URL
  const streamStatus = useStreamStatus({ 
    rtmpKey: brandedUrl?.rtmpConfig?.rtmpKey || '' 
  });

  // Debug logging
  useEffect(() => {
    console.log('🔍 Stream Status Debug:', {
      rtmpKey: brandedUrl?.rtmpConfig?.rtmpKey,
      streamStatus: {
        isLive: streamStatus.isLive,
        viewers: streamStatus.viewers,
        lastChecked: streamStatus.lastChecked
      },
      hasRtmpConfig: !!brandedUrl?.rtmpConfig
    });
  }, [streamStatus, brandedUrl]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <div>Loading stream...</div>
        </div>
      </div>
    );
  }

  if (error || !brandedUrl) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <div className="text-xl mb-2">Stream Not Found</div>
          <div className="text-gray-400">{error || 'Branded URL not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{brandedUrl.name}</h1>
              <p className="text-gray-400">Live Streaming</p>
            </div>
            <div className="flex items-center space-x-4">
              {streamStatus.isLive && (
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-white font-semibold">LIVE NOW</span>
                </div>
              )}
              <div className="flex items-center space-x-1 text-gray-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                <span>{streamStatus.viewers}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <div className="flex gap-6 h-[600px]">
          {/* Video Player Container - Left 2/3 */}
          <div className="flex-1 relative">
            <div className="relative w-full h-full bg-black rounded-lg overflow-hidden shadow-2xl">
              {streamStatus.isLive && brandedUrl.rtmpConfig ? (
                <WebRTCVideoPlayer
                  rtmpUrl={brandedUrl.rtmpConfig.rtmpServer.rtmpUrl}
                  rtmpKey={brandedUrl.rtmpConfig.rtmpKey}
                  isLive={streamStatus.isLive}
                  onError={(error) => {
                    console.error('Video error:', error);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-800">
                  <div className="text-center text-white">
                    <div className="text-6xl mb-4">📺</div>
                    <div className="text-xl mb-2">
                      {streamStatus.isLive ? 'Stream is starting...' : 'Stream is offline'}
                    </div>
                    <div className="text-gray-400">
                      {streamStatus.isLive 
                        ? 'The stream will appear here shortly' 
                        : 'The stream will appear here when it goes live'
                      }
                    </div>
                    {streamStatus.isLive && (
                      <div className="text-sm text-gray-500 mt-2">
                        Status: {streamStatus.isLive ? 'Live' : 'Offline'} | 
                        Viewers: {streamStatus.viewers} | 
                        Last checked: {streamStatus.lastChecked.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Sidebar - Right 1/3 */}
          <div className="w-80 flex-shrink-0">
            <Chat rtmpKey={brandedUrl.rtmpConfig?.rtmpKey || ''} />
          </div>
        </div>
      </div>
    </div>
  );
}
