'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import WebRTCVideoPlayer from '../../../components/WebRTCVideoPlayer';
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
    return "https://hive.restreamer.website/api";
  };

  // Fetch branded URL configuration
  useEffect(() => {
    const fetchBrandedUrl = async () => {
      if (!slug) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${getApiBaseUrl()}/branded-urls/slug/${slug}`);
        
        if (!response.ok) {
          throw new Error('Branded URL not found');
        }
        
        const data = await response.json();
        setBrandedUrl(data);
      } catch (err) {
        console.error('Error fetching branded URL:', err);
        setError('Failed to load stream configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchBrandedUrl();
  }, [slug]);

  // Get stream status using the correct stream key from branded URL
  const streamStatus = useStreamStatus({ 
    rtmpKey: brandedUrl?.rtmpConfig?.rtmpKey || '' 
  });

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
      <div className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        <div className="relative">
          {/* Video Player Container */}
          <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl">
            <div className="aspect-video relative">
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
                    <div className="text-xl mb-2">Stream is offline</div>
                    <div className="text-gray-400">The stream will appear here when it goes live</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
