/**
 * AgentProvider - Global Context for AI Agent
 *
 * Provides agent state and functions throughout the app
 * Handles streaming messages, conversation history, and agent interactions
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// ==================== TYPES ====================

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  toolCalls?: any[];
  toolResults?: any[];
  isStreaming?: boolean;
}

export interface AgentContextValue {
  // State
  isOpen: boolean;
  messages: AgentMessage[];
  isLoading: boolean;
  sessionId: string;
  currentPage: string;
  routeId: string | null;

  // Actions
  openAgent: () => void;
  closeAgent: () => void;
  toggleAgent: () => void;
  sendMessage: (message: string) => Promise<void>;
  clearHistory: () => void;
  setCurrentPage: (page: string) => void;
  setRouteId: (routeId: string | null) => void;
}

// ==================== CONTEXT ====================

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

// ==================== PROVIDER ====================

interface AgentProviderProps {
  children: React.ReactNode;
}

export function AgentProvider({ children }: AgentProviderProps) {
  // State
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => uuidv4()); // Persistent session ID
  const [currentPage, setCurrentPage] = useState('landing');
  const [routeId, setRouteId] = useState<string | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);

  // Actions
  const openAgent = useCallback(() => setIsOpen(true), []);
  const closeAgent = useCallback(() => setIsOpen(false), []);
  const toggleAgent = useCallback(() => setIsOpen(prev => !prev), []);

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Send message to agent with streaming response
   */
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    // Add user message immediately
    const userMessage: AgentMessage = {
      id: uuidv4(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Create assistant message placeholder for streaming
    const assistantMessageId = uuidv4();
    const assistantMessage: AgentMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      // Get auth token from localStorage
      const token = localStorage.getItem('token');

      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Call agent API with SSE streaming
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/agent/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: messageText.trim(),
          sessionId: sessionId,
          pageContext: currentPage,
          routeId: routeId
        }),
        signal: abortController.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk
        buffer += decoder.decode(value, { stream: true });

        // Split by newlines to get individual SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix

            try {
              const event = JSON.parse(data);

              if (event.type === 'connected') {
                console.log('🤖 Agent connected');
              } else if (event.type === 'text') {
                // Stream text token
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + event.content }
                      : msg
                  )
                );
              } else if (event.type === 'complete') {
                // Final response
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: event.content, isStreaming: false }
                      : msg
                  )
                );
                console.log('✅ Agent response complete');
              } else if (event.type === 'error') {
                // Error occurred
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? {
                          ...msg,
                          content: `⚠️ ${event.error || 'An error occurred'}`,
                          isStreaming: false
                        }
                      : msg
                  )
                );
                console.error('❌ Agent error:', event.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE event:', data);
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Error sending message:', error);

      // Update assistant message with error
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: error.name === 'AbortError'
                  ? '⚠️ Request cancelled'
                  : '⚠️ Failed to connect to agent. Please try again.',
                isStreaming: false
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [sessionId, currentPage, routeId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Context value
  const value: AgentContextValue = {
    isOpen,
    messages,
    isLoading,
    sessionId,
    currentPage,
    routeId,
    openAgent,
    closeAgent,
    toggleAgent,
    sendMessage,
    clearHistory,
    setCurrentPage,
    setRouteId
  };

  return (
    <AgentContext.Provider value={value}>
      {children}
    </AgentContext.Provider>
  );
}

// ==================== HOOK ====================

/**
 * useAgent - Hook to access agent context
 * Must be used within AgentProvider
 */
export function useAgent() {
  const context = useContext(AgentContext);

  if (context === undefined) {
    throw new Error('useAgent must be used within AgentProvider');
  }

  return context;
}
