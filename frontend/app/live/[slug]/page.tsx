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

interface StreamStatus {
  isLive: boolean;
  viewers: number;
  lastChecked: Date;
}

export default function BrandedStreamPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  // Fallback: Get slug from URL if useParams fails
  const [actualSlug, setActualSlug] = useState<string>('');
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const urlSlug = pathParts[pathParts.length - 1];
      console.log('🔍 URL slug:', urlSlug);
      setActualSlug(urlSlug);
    }
  }, []);
  
  const [brandedUrl, setBrandedUrl] = useState<BrandedUrl | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Use event-driven stream status instead of polling
  const streamStatus = useStreamStatus({
    rtmpKey: brandedUrl?.rtmpConfig.rtmpKey || '',
    onStatusChange: (status) => {
      console.log('Stream status changed:', status);
    }
  });

  // Debug: Log current state
  console.log('Current state:', { brandedUrl, streamStatus, loading, error });

  // Temporary: Force a simple state for testing
  const [debugMode, setDebugMode] = useState(false);
  
  useEffect(() => {
    if (brandedUrl) {
      console.log('Branded URL loaded successfully:', brandedUrl);
      setDebugMode(true);
    }
  }, [brandedUrl]);

  // Get the correct API base URL based on domain
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      const protocol = window.location.protocol;
      
      // Always use localhost:3001 for development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001'; // Backend runs on port 3001
      }
      
      // For production domains, use backend container name
      return 'http://backend:3001';
    }
    // Server-side: use backend container name
    return 'http://backend:3001';
  };

  // Get the correct WebSocket URL based on domain
  const getWsBaseUrl = () => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      
      // Always use localhost:3001 for development
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return 'http://localhost:3001'; // Socket.IO uses HTTP/HTTPS
      }
      
      // For production domains, use relative URLs (nginx will proxy)
      return '';
    }
    // Server-side: use relative URLs
    return '';
  };

  // Fetch branded URL configuration
  useEffect(() => {
    const fetchBrandedUrl = async () => {
      const currentSlug = actualSlug || slug;
      if (!currentSlug) {
        console.log('🔍 No slug available yet, waiting...');
        return;
      }
      
      try {
        const apiUrl = `${getApiBaseUrl()}/api/branded-urls/slug/${currentSlug}`;
        console.log('🔍 Fetching branded URL from:', apiUrl);
        console.log('🔍 Slug:', currentSlug);
        
        const response = await fetch(apiUrl);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Branded URL data:', data);
          setBrandedUrl(data);
        } else {
          console.error('API response not ok:', response.status, response.statusText);
          setError('Branded URL not found');
        }
      } catch (err) {
        console.error('Error fetching branded URL:', err);
        setError('Failed to load stream configuration');
      } finally {
        setLoading(false);
      }
    };

    if (actualSlug || slug) {
      fetchBrandedUrl();
    }
  }, [slug, actualSlug]);

  // Stream status is now handled by the useStreamStatus hook
  // No need for manual polling - it's event-driven!

  // Get RTMP configuration for WebRTC streaming
  const getRtmpConfig = () => {
    if (!brandedUrl) return { rtmpUrl: '', rtmpKey: '' };
    return {
      rtmpUrl: brandedUrl.rtmpConfig.rtmpServer.rtmpUrl,
      rtmpKey: brandedUrl.rtmpConfig.rtmpKey
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Loading stream...</p>
          <p className="text-gray-400 text-sm mt-2">Debug: {debugMode ? 'Data loaded' : 'Still loading...'}</p>
        </div>
      </div>
    );
  }

  if (error || !brandedUrl) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Stream Not Found</h1>
          <p className="text-gray-400">{error || 'This stream does not exist'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Enhanced Branded Header */}
      <div 
        className="w-full px-4 py-4 flex items-center justify-between shadow-lg"
        style={{ 
          backgroundColor: brandedUrl.color,
          background: `linear-gradient(135deg, ${brandedUrl.color} 0%, ${brandedUrl.color}dd 100%)`
        }}
      >
        <div className="flex items-center space-x-4">
          {brandedUrl.logoUrl && (
            <div className="flex-shrink-0">
              <img 
                src={brandedUrl.logoUrl} 
                alt={brandedUrl.name}
                className="w-10 h-10 rounded-lg shadow-md"
              />
            </div>
          )}
          <div>
            <h1 className="text-white font-bold text-xl">{brandedUrl.name}</h1>
            <p className="text-white text-opacity-80 text-sm">Live Streaming</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Live Status Badge */}
          <div className="flex items-center space-x-2 bg-black bg-opacity-20 px-3 py-2 rounded-full">
            <div className={`w-3 h-3 rounded-full ${streamStatus.isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-white text-sm font-semibold">
              {streamStatus.isLive ? 'LIVE NOW' : 'OFFLINE'}
            </span>
          </div>
          
          {/* Viewer Count */}
          {streamStatus.isLive && (
            <div className="flex items-center space-x-1 bg-black bg-opacity-20 px-3 py-2 rounded-full">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-white text-sm font-medium">{streamStatus.viewers}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl mx-auto px-4 py-6 w-full">
        <div className="relative">
          {/* Video Player Container */}
          <div className="relative w-full bg-black rounded-lg overflow-hidden shadow-2xl">
            <div className="aspect-video relative">
              {streamStatus.isLive ? (
                <WebRTCVideoPlayer
                  rtmpUrl={getRtmpConfig().rtmpUrl}
                  rtmpKey={getRtmpConfig().rtmpKey}
                  isLive={streamStatus.isLive}
                  onError={(error) => {
                    console.error('Video error:', error);
                  }}
                  onLoadStart={() => {
                    console.log('Video loading started');
                  }}
                  onCanPlay={() => {
                    console.log('Video can play');
                  }}
                />
              ) : (
                /* Offline Content - Placeholder Video Player with Overlay */
                <div className="w-full h-full relative bg-gray-800">
                  {/* Placeholder Video Player Background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center">
                    {/* Video Player Placeholder */}
                    <div className="w-full h-full flex items-center justify-center relative">
                      {/* Play Button Overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                      
                      {/* Signal Strength Indicator */}
                      <div className="absolute top-4 left-4 flex space-x-1">
                        {[1, 2, 3, 4].map((bar) => (
                          <div
                            key={bar}
                            className={`w-1 bg-gray-500 ${
                              bar <= 2 ? 'h-3' : 'h-2'
                            } rounded-sm`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Offline Overlay Content */}
                  <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto px-4">
                      {/* Signal Icon */}
                      <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      
                      <h2 className="text-2xl font-bold text-white mb-2">Stream is offline</h2>
                      
                      {/* Custom Offline Message */}
                      {brandedUrl.offlineContent && brandedUrl.offlineMessage ? (
                        <p className="text-gray-300 mb-6">
                          {brandedUrl.offlineMessage}
                        </p>
                      ) : (
                        <p className="text-gray-300 mb-6">
                          The stream will start soon. Please check back later.
                        </p>
                      )}
                      
                      {/* CTA Button */}
                      {brandedUrl.ctaText && brandedUrl.ctaUrl && (
                        <a
                          href={brandedUrl.ctaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-6 py-3 text-white font-medium rounded-lg transition-colors hover:opacity-90"
                          style={{ backgroundColor: brandedUrl.color }}
                        >
                          {brandedUrl.ctaText}
                          <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Overlay Text */}
            {streamStatus.isLive && brandedUrl.overlayText && (
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
                <p className="text-sm font-medium">{brandedUrl.overlayText}</p>
              </div>
            )}

            {/* Stream Status Indicator */}
            <div className="absolute top-4 right-4">
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                streamStatus.isLive 
                  ? 'bg-red-600 text-white' 
                  : 'bg-gray-600 text-gray-300'
              }`}>
                {streamStatus.isLive ? '● LIVE' : '● OFFLINE'}
              </div>
            </div>
          </div>

          {/* Stream Info */}
          <div className="mt-4 text-center">
            <p className="text-gray-400 text-sm">
              Last updated: {streamStatus.lastChecked.toLocaleTimeString()}
            </p>
            {streamStatus.isLive && (
              <p className="text-gray-300 text-sm mt-1">
                Stream will automatically start when available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Branded Footer */}
      <footer 
        className="mt-auto py-6 px-4"
        style={{ backgroundColor: brandedUrl.color }}
      >
        <div className="max-w-6xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-4 mb-4">
            {brandedUrl.logoUrl && (
              <img 
                src={brandedUrl.logoUrl} 
                alt={brandedUrl.name}
                className="w-8 h-8 rounded"
              />
            )}
            <h3 className="text-white font-semibold text-lg">{brandedUrl.name}</h3>
          </div>
          
          <p className="text-white text-opacity-80 text-sm mb-4">
            Powered by Restreamer Pro - Professional streaming made simple
          </p>
          
          <div className="flex items-center justify-center space-x-6 text-white text-opacity-60 text-xs">
            <span>© 2024 {brandedUrl.name}</span>
            <span>•</span>
            <span>Live Streaming Platform</span>
            <span>•</span>
            <span>Professional Quality</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
