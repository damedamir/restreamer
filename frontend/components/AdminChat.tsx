'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';

interface ChatUser {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
  role: string;
}

interface ChatMessage {
  id: string;
  content: string;
  chatType: 'PUBLIC' | 'PRIVATE';
  isPinned: boolean;
  createdAt: string;
  user: ChatUser;
  replyTo?: {
    id: string;
    content: string;
    user: {
      firstName: string;
      lastName?: string;
    };
  };
}

interface AdminChatProps {
  rtmpKey: string;
  className?: string;
}

export default function AdminChat({ rtmpKey, className = '' }: AdminChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatType, setChatType] = useState<'PUBLIC' | 'PRIVATE'>('PUBLIC');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOnline, setChatOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // WebSocket integration for real-time messages
  const { isConnected: isWebSocketConnected } = useWebSocket({
    enabled: true,
    onChatMessage: useCallback((wsRtmpKey: string, message: ChatMessage) => {
      if (wsRtmpKey === rtmpKey) {
        console.log('💬 [AdminChat] Received new message:', message);
        setMessages(prev => [...prev, message]);
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }, [rtmpKey])
  });

  // Load chat messages
  const loadMessages = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/admin/messages/${rtmpKey}?limit=100`);
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error loading admin chat messages:', error);
      setError('Failed to load chat messages');
    } finally {
      setIsLoading(false);
    }
  }, [rtmpKey]);

  // Load chat status
  const loadChatStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/config/${rtmpKey}`);
      if (response.ok) {
        const config = await response.json();
        setChatOnline(config.chatOnline || false);
      }
    } catch (error) {
      console.error('Error loading chat status:', error);
    }
  }, [rtmpKey]);

  // Initialize
  useEffect(() => {
    loadMessages();
    loadChatStatus();
  }, [loadMessages, loadChatStatus]);

  // Send message
  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/admin/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          rtmpKey,
          chatType
        }),
      });

      if (response.ok) {
        setNewMessage('');
        // Message will be added via WebSocket
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setIsSending(false);
    }
  }, [newMessage, rtmpKey, chatType]);

  // Toggle chat online status
  const toggleChatOnline = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/admin/status/${rtmpKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatOnline: !chatOnline
        }),
      });

      if (response.ok) {
        setChatOnline(!chatOnline);
      }
    } catch (error) {
      console.error('Error toggling chat status:', error);
    }
  }, [rtmpKey, chatOnline]);

  // Pin/unpin message
  const togglePinMessage = useCallback(async (messageId: string, isPinned: boolean) => {
    try {
      const response = await fetch(`/api/chat/admin/pin/${messageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPinned: !isPinned
        }),
      });

      if (response.ok) {
        setMessages(prev => prev.map(msg => 
          msg.id === messageId ? { ...msg, isPinned: !isPinned } : msg
        ));
      }
    } catch (error) {
      console.error('Error pinning message:', error);
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getUserDisplayName = (user: ChatUser) => {
    if (user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.firstName;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-500';
      case 'MODERATOR': return 'bg-orange-500';
      case 'HOST': return 'bg-blue-500';
      case 'CO_HOST': return 'bg-purple-500';
      case 'PANELIST': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className={`bg-white h-full flex items-center justify-center ${className}`}>
        <div className="text-gray-500">Loading admin chat...</div>
      </div>
    );
  }

  return (
    <div className={`bg-white h-full flex flex-col ${className}`}>
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">Admin Chat</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isWebSocketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500">
              {isWebSocketConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        
        {/* Chat Controls */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleChatOnline}
            className={`px-3 py-1 rounded text-sm font-medium ${
              chatOnline 
                ? 'bg-green-100 text-green-800 border border-green-300' 
                : 'bg-gray-100 text-gray-800 border border-gray-300'
            }`}
          >
            {chatOnline ? 'Chat Online' : 'Chat Offline'}
          </button>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Chat Type:</label>
            <select
              value={chatType}
              onChange={(e) => setChatType(e.target.value as 'PUBLIC' | 'PRIVATE')}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="PUBLIC">Public</option>
              <option value="PRIVATE">Private</option>
            </select>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">💬</div>
            <div>No messages yet</div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex space-x-3 ${msg.isPinned ? 'bg-yellow-50 border-l-4 border-yellow-400 pl-3' : ''}`}>
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 ${getRoleColor(msg.user.role)} rounded-full flex items-center justify-center text-white text-sm font-medium`}>
                  {msg.user.firstName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">
                    {getUserDisplayName(msg.user)}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${getRoleColor(msg.user.role)} text-white`}>
                    {msg.user.role}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    msg.chatType === 'PRIVATE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {msg.chatType}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTime(msg.createdAt)}
                  </span>
                  {msg.isPinned && (
                    <span className="text-xs text-yellow-600">📌 Pinned</span>
                  )}
                </div>
                <p className="text-sm text-gray-700 mt-1 break-words">
                  {msg.content}
                </p>
                {msg.replyTo && (
                  <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                    <span className="font-medium">Replying to {msg.replyTo.user.firstName} {msg.replyTo.user.lastName || ''}:</span> {msg.replyTo.content}
                  </div>
                )}
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => togglePinMessage(msg.id, msg.isPinned)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    {msg.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button className="text-xs text-gray-500 hover:text-gray-700">
                    Reply
                  </button>
                  <button className="text-xs text-red-500 hover:text-red-700">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        {error && (
          <div className="mb-3 p-2 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm">
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-2 text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}
        
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Send a ${chatType.toLowerCase()} message...`}
              maxLength={2000}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 pr-20"
              disabled={isSending}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <span className="text-xs text-gray-500">
                {newMessage.length}/2000
              </span>
              <button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isSending}
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
        </div>
      </div>
    </div>
  );
}
