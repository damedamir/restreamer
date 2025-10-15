'use client';

import { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';

interface ChatProps {
  rtmpKey: string;
  className?: string;
}

export default function Chat({ rtmpKey, className = '' }: ChatProps) {
  const [message, setMessage] = useState('');
  const [userInfo, setUserInfo] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });
  const [showUserForm, setShowUserForm] = useState(true);
  const [isFormValid, setIsFormValid] = useState(false);
  
  const {
    messages,
    config,
    isLoading,
    isSending,
    error,
    isWebSocketConnected,
    sendMessage,
    messagesEndRef,
    clearError
  } = useChat({ rtmpKey });

  // Check if user form is valid
  useEffect(() => {
    const valid = userInfo.firstName.trim() !== '' &&
      (!config?.requireLastName || userInfo.lastName.trim() !== '') &&
      (!config?.requireEmail || userInfo.email.trim() !== '');
    setIsFormValid(valid);
  }, [userInfo, config]);

  // Auto-hide form after first message
  useEffect(() => {
    if (messages.length > 0) {
      setShowUserForm(false);
    }
  }, [messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !isFormValid || isSending) return;

    await sendMessage(message.trim(), {
      firstName: userInfo.firstName.trim(),
      lastName: userInfo.lastName.trim() || undefined,
      email: userInfo.email.trim() || undefined
    });
    
    setMessage('');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserDisplayName = (user: any) => {
    if (user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName;
  };

  if (isLoading) {
    return (
      <div className={`bg-white h-full flex items-center justify-center ${className}`}>
        <div className="text-gray-500">Loading chat...</div>
      </div>
    );
  }

  if (!config?.isEnabled) {
    return (
      <div className={`bg-white h-full flex items-center justify-center ${className}`}>
        <div className="text-gray-500 text-center">
          <div className="text-4xl mb-2">💬</div>
          <div>Chat is disabled for this stream</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white h-full flex flex-col ${className}`}>
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Live Chat</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isWebSocketConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <div>Be the first to post a comment!</div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="flex space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                  {msg.user.firstName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {getUserDisplayName(msg.user)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mt-1 break-words">
                  {msg.content}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* User Info Form */}
      {showUserForm && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={userInfo.firstName}
                onChange={(e) => setUserInfo(prev => ({ ...prev, firstName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your first name"
              />
            </div>
            
            {config?.requireLastName && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={userInfo.lastName}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your last name"
                />
              </div>
            )}
            
            {config?.requireEmail && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={userInfo.email}
                  onChange={(e) => setUserInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            )}
            
            <button
              onClick={() => setShowUserForm(false)}
              disabled={!isFormValid}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Start Chatting
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      {!showUserForm && (
        <div className="p-4 border-t border-gray-200">
          {error && (
            <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">
              {error}
              <button
                onClick={clearError}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          )}
          
          <form onSubmit={handleSendMessage} className="flex space-x-2">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {userInfo.firstName.charAt(0).toUpperCase()}
              </div>
            </div>
            
            <div className="flex-1 relative">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Post a message..."
                maxLength={config?.maxMessageLength || 2000}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
                disabled={isSending}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                <span className="text-xs text-gray-500">
                  {message.length}/{config?.maxMessageLength || 2000}
                </span>
                <button
                  type="submit"
                  disabled={!message.trim() || isSending}
                  className="ml-2 p-1 text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {isSending ? (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
