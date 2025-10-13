'use client';

import { useState, useEffect } from 'react';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setCurrentTime(new Date().toLocaleString());
    
    // Check for existing valid session
    const checkExistingSession = () => {
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
        return false;
      }

      // Check if token has expired
      const now = Date.now();
      const expiryTime = parseInt(expiresAt);
      
      if (now > expiryTime) {
        // Clear expired session
        localStorage.removeItem('token');
        localStorage.removeItem('rememberMe');
        localStorage.removeItem('userEmail');
        localStorage.removeItem('expiresAt');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('rememberMe');
        sessionStorage.removeItem('userEmail');
        sessionStorage.removeItem('expiresAt');
        return false;
      }

      // Valid session found, redirect to admin
      window.location.href = '/admin';
      return true;
    };

    // Check for existing session
    if (checkExistingSession()) {
      return; // Will redirect to admin
    }
    
    // Check for remembered user (for pre-filling form)
    const rememberedEmail = localStorage.getItem('userEmail');
    const isRemembered = localStorage.getItem('rememberMe') === 'true';
    
    if (rememberedEmail && isRemembered) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Get the correct API base URL based on environment
  const getApiBaseUrl = () => {
    if (typeof window !== 'undefined') {
      // Client-side: check if we're on localhost
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // Always use direct backend connection for localhost development
        return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      }
    }
    // Server-side or production: use relative URLs (will be proxied by nginx)
    return ''; // Nginx will proxy /api to backend
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, rememberMe }),
      });
      
      // Handle different response types
      if (!response.ok) {
        let errorMessage = 'Login failed. Please try again.';
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status-based messages
          switch (response.status) {
            case 401:
              errorMessage = 'Invalid email or password. Please check your credentials.';
              break;
            case 403:
              errorMessage = 'Access denied. Your account may be disabled.';
              break;
            case 404:
              errorMessage = 'Login service not found. Please contact support.';
              break;
            case 429:
              errorMessage = 'Too many login attempts. Please wait a moment and try again.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            case 503:
              errorMessage = 'Service temporarily unavailable. Please try again later.';
              break;
            default:
              errorMessage = `Login failed (${response.status}). Please try again.`;
          }
        }
        
        alert(errorMessage);
        return;
      }
      
      const data = await response.json();
      
      // Calculate expiry time (30 days for remember me, 24 hours for session)
      const expiresAt = rememberMe 
        ? Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
        : Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      
      // Store the token based on remember me preference
      if (rememberMe) {
        // Store in localStorage for persistent sessions
        localStorage.setItem('token', data.token);
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('userEmail', email);
        localStorage.setItem('expiresAt', expiresAt.toString());
      } else {
        // Store in sessionStorage for session-only storage
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('rememberMe', 'false');
        sessionStorage.setItem('userEmail', email);
        sessionStorage.setItem('expiresAt', expiresAt.toString());
      }
      
      // Redirect to admin dashboard on successful login
      window.location.href = '/admin';
      
    } catch (error) {
      // Enhanced error handling with specific error types
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Network error
        errorMessage = 'Unable to connect to the server. Please check your internet connection and try again.';
        console.error('Network error during login:', error);
      } else if (error instanceof SyntaxError) {
        // JSON parsing error
        errorMessage = 'Invalid response from server. Please try again.';
        console.error('JSON parsing error during login:', error);
      } else if (error instanceof Error) {
        // Generic error with message
        errorMessage = `Login error: ${error.message}`;
        console.error('Login error:', error);
      } else {
        // Unknown error
        console.error('Unknown login error:', error);
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Large Icons - Side by Side */}
        <div className="flex justify-center space-x-8">
          {/* Video Camera Icon */}
          <div className="w-24 h-24 border-4 border-black rounded-lg flex items-center justify-center">
            <svg className="w-12 h-12 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>

          {/* @ Symbol Icon */}
          <div className="w-24 h-24 border-4 border-black rounded-full flex items-center justify-center">
            <span className="text-4xl font-bold text-black">@</span>
          </div>

          {/* Padlock Icon */}
          <div className="w-24 h-24 border-4 border-black rounded-lg flex items-center justify-center">
            <svg className="w-12 h-12 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        {/* Content Section */}
        <div className="space-y-8">
          {/* Restreamer Pro Section */}
          <div className="text-left">
            <h1 className="text-3xl font-bold text-black mb-2">Restreamer Pro</h1>
            <p className="text-gray-600">Access your streaming dashboard</p>
          </div>

          {/* Authentication Section */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-black">Authentication</h2>
            
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your email"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your password"
                  required
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me for 30 days
                </label>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center">
                    Sign in
                    <svg className="ml-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                )}
              </button>
            </form>

          </div>
        </div>

        {/* Footer */}
        <div className="text-left">
          <p className="text-gray-500 text-sm">
            © 2024 Restreamer Pro. Professional streaming made simple.
          </p>
          <p className="text-gray-400 text-xs mt-2">
            Last updated: {currentTime || 'Loading...'} | 
            <a href="/test" className="text-blue-500 hover:text-blue-700 ml-2">Test Page</a> |
            <span className="text-green-500 ml-2">✅ NEW DESIGN ACTIVE</span>
          </p>
        </div>
      </div>
    </div>
  );
}