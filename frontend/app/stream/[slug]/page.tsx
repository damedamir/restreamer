'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function StreamPage() {
  const params = useParams()
  const slug = params.slug as string
  const [streamData, setStreamData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStreamData = async () => {
      try {
        const response = await fetch(`process.env.NEXT_PUBLIC_API_URL/api/stream/${slug}`)
        
        if (!response.ok) {
          throw new Error('Stream not found')
        }

        const data = await response.json()
        setStreamData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stream')
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchStreamData()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-96 bg-white rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading stream...</p>
        </div>
      </div>
    )
  }

  if (error || !streamData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-96 bg-white rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Stream Not Found</h1>
          <p className="text-gray-600">
            {error || 'The stream you\'re looking for doesn\'t exist or has been removed.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: streamData.brandedUrl.brandColor }}>
      {/* Header */}
      <div className="p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {streamData.brandedUrl.logoUrl && (
              <img 
                src={streamData.brandedUrl.logoUrl} 
                alt="Logo" 
                className="h-12 w-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{streamData.brandedUrl.name}</h1>
              {streamData.brandedUrl.overlayText && (
                <p className="text-white/80">{streamData.brandedUrl.overlayText}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${streamData.streamConfig.isLive ? 'bg-red-500' : 'bg-gray-500'}`} />
              <span className="text-sm font-medium">
                {streamData.streamConfig.isLive ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-6xl bg-white rounded-lg overflow-hidden">
          {streamData.streamConfig.isLive ? (
            <div className="aspect-video bg-gray-900 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Stream is Live!</h3>
                <p className="text-gray-300">Stream URL: {streamData.streamUrl}</p>
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-900 flex items-center justify-center text-white">
              <div className="text-center max-w-md mx-auto px-6">
                <div className="w-16 h-16 bg-gray-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {streamData.brandedUrl.offlineContent.title}
                </h3>
                <p className="text-gray-300">
                  {streamData.brandedUrl.offlineContent.message}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
