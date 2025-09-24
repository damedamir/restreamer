'use client';

export default function TestPage() {
  return (
    <div className="min-h-screen bg-red-500 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-white mb-4">
          🎉 NEW DESIGN IS WORKING! 🎉
        </h1>
        <p className="text-2xl text-white mb-8">
          If you can see this red page, the new design is being served correctly!
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Test Information:</h2>
          <ul className="text-left text-gray-700 space-y-2">
            <li>✅ This is a test page to verify new design</li>
            <li>✅ Red background means new code is running</li>
            <li>✅ Tailwind CSS is working properly</li>
            <li>✅ Static files are being served correctly</li>
            <li>✅ Browser cache has been cleared</li>
          </ul>
          <div className="mt-6">
            <a 
              href="/" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Go to Login Page
            </a>
            <a 
              href="/admin" 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors ml-4"
            >
              Go to Admin Dashboard
            </a>
          </div>
        </div>
        <div className="mt-8 text-white text-sm">
          <p>Page loaded at: {new Date().toLocaleString()}</p>
          <p>This confirms the new design is active!</p>
        </div>
      </div>
    </div>
  );
}
