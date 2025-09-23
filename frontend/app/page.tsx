export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-purple-400 rounded"></div>
              <span className="text-2xl font-bold text-white">Custom Restreamer</span>
            </div>
            <div className="flex items-center space-x-4">
              <a href="/admin" className="px-4 py-2 border border-white/20 text-white rounded hover:bg-white/10">
                Admin Panel
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Professional Streaming
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              {' '}Made Simple
            </span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Create custom branded streaming URLs with RTMP ingestion and HLS delivery. 
            Perfect for webinars, events, and professional streaming.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/admin" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg">
              Get Started
            </a>
            <a href="/stream/test-stream" className="border border-white/20 text-white hover:bg-white/10 px-8 py-3 rounded-lg text-lg">
              View Demo
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="h-12 w-12 bg-purple-400 rounded mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">RTMP Ingestion</h3>
            <p className="text-gray-300">
              Stream from OBS, Zoom, or any RTMP source with professional quality
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="h-12 w-12 bg-purple-400 rounded mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Real-time Analytics</h3>
            <p className="text-gray-300">
              Live viewer counts and engagement metrics for your streams
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="h-12 w-12 bg-purple-400 rounded mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Low Latency</h3>
            <p className="text-gray-300">
              Optimized HLS delivery with minimal delay for real-time interaction
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
            <div className="h-12 w-12 bg-purple-400 rounded mb-4"></div>
            <h3 className="text-xl font-semibold text-white mb-2">Self-hosted</h3>
            <p className="text-gray-300">
              Complete control over your data and infrastructure
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/20 backdrop-blur-sm rounded-lg max-w-4xl mx-auto p-8">
            <h2 className="text-3xl text-white mb-4">
              Ready to Start Streaming?
            </h2>
            <p className="text-gray-300 text-lg mb-6">
              Create your first custom stream in minutes with our intuitive admin panel
            </p>
            <a href="/admin" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg text-lg">
              Create Your First Stream
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-white/5 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 Custom Restreamer. Built with Next.js and modern web technologies.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
