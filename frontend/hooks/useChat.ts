'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface ChatUser {
  id: string;
  firstName: string;
  lastName?: string;
  email?: string;
}

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: ChatUser;
}

interface ChatConfig {
  isEnabled: boolean;
  requireEmail: boolean;
  requireLastName: boolean;
  maxMessageLength: number;
  moderationEnabled: boolean;
}

interface UseChatProps {
  rtmpKey: string;
  onMessage?: (message: ChatMessage) => void;
}

export function useChat({ rtmpKey, onMessage }: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [config, setConfig] = useState<ChatConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionIdRef = useRef<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate session ID if not exists
  useEffect(() => {
    if (!sessionIdRef.current) {
      sessionIdRef.current = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
  }, []);

  // WebSocket integration for real-time messages
  const { isConnected: isWebSocketConnected } = useWebSocket({
    enabled: true,
    onStreamStatusUpdate: useCallback((wsRtmpKey: string, status) => {
      // Handle stream status updates if needed
    }, []),
    onChatMessage: useCallback((wsRtmpKey: string, message: ChatMessage) => {
      if (wsRtmpKey === rtmpKey) {
        console.log('💬 [Chat] Received new message:', message);
        setMessages(prev => [...prev, message]);
        onMessage?.(message);
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }, [rtmpKey, onMessage])
  });

  // Load chat configuration
  const loadConfig = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/config/${rtmpKey}`);
      if (response.ok) {
        const configData = await response.json();
        setConfig(configData);
        return configData.isEnabled;
      }
    } catch (error) {
      console.error('Error loading chat config:', error);
    }
    return false;
  }, [rtmpKey]);

  // Load chat messages
  const loadMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/chat/messages/${rtmpKey}?limit=50`);
      if (response.ok) {
        const messagesData = await response.json();
        setMessages(messagesData);
      }
    } catch (error) {
      console.error('Error loading chat messages:', error);
    }
  }, [rtmpKey]);

  // Initialize chat
  useEffect(() => {
    const initializeChat = async () => {
      setIsLoading(true);
      const isEnabled = await loadConfig();
      if (isEnabled) {
        await loadMessages();
      }
      setIsLoading(false);
    };

    initializeChat();
  }, [rtmpKey, loadConfig, loadMessages]);

  // Send message
  const sendMessage = useCallback(async (content: string, userInfo: { firstName: string; lastName?: string; email?: string }) => {
    if (!config?.isEnabled || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch('/api/chat/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          email: userInfo.email,
          sessionId: sessionIdRef.current,
          rtmpKey
        }),
      });

      if (response.ok) {
        const message = await response.json();
        console.log('💬 [Chat] Message sent:', message);
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
  }, [config, rtmpKey]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return {
    messages,
    config,
    isLoading,
    isSending,
    error,
    isWebSocketConnected,
    sendMessage,
    messagesEndRef,
    clearError: () => setError(null)
  };
}
