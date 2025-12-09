/**
 * Companion API Hooks
 *
 * WI-12.2: React Query hooks for AI companion chat operations
 *
 * Provides hooks for sending messages, managing conversation history,
 * and handling streaming responses.
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useState, useCallback, useRef, useEffect } from 'react';
import { getCurrentUser, type Preferences } from '../../lib/supabase';
import { ApiError, API_ERROR_CODES } from '../../services/api/errors';
import { withRateLimit, RATE_LIMITS, getRateLimitInfo } from '../../services/api/rateLimit';

// ============================================================================
// Types
// ============================================================================

export type CompanionPhase = 'planning' | 'active' | 'post-trip' | 'discovery';

export interface CompanionMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    phase?: CompanionPhase;
    tripId?: string;
    context?: Record<string, unknown>;
    suggestions?: CompanionSuggestion[];
    actions?: CompanionAction[];
  };
}

export interface CompanionSuggestion {
  id: string;
  type: 'place' | 'activity' | 'tip' | 'question';
  text: string;
  action?: CompanionAction;
}

export interface CompanionAction {
  type: 'add_place' | 'update_preference' | 'show_map' | 'open_booking' | 'navigate';
  payload: Record<string, unknown>;
}

export interface CompanionContext {
  phase: CompanionPhase;
  tripId?: string;
  currentCity?: string;
  currentDay?: number;
  preferences?: Partial<Preferences>;
  recentPlaces?: string[];
  conversationHistory?: CompanionMessage[];
}

export interface SendMessageParams {
  message: string;
  context: CompanionContext;
  streamCallback?: (chunk: string) => void;
}

export interface CompanionResponse {
  message: CompanionMessage;
  suggestions?: CompanionSuggestion[];
  actions?: CompanionAction[];
  updatedPreferences?: Partial<Preferences>;
}

// ============================================================================
// Query Keys
// ============================================================================

export const companionKeys = {
  all: ['companion'] as const,
  history: (tripId?: string) => [...companionKeys.all, 'history', tripId] as const,
  suggestions: (phase: CompanionPhase, tripId?: string) =>
    [...companionKeys.all, 'suggestions', phase, tripId] as const,
};

// ============================================================================
// Local Storage for Conversation
// ============================================================================

const CONVERSATION_STORAGE_KEY = 'waycraft:companion:conversation';
const MAX_HISTORY_LENGTH = 50;

function getStoredConversation(tripId?: string): CompanionMessage[] {
  try {
    const key = tripId ? `${CONVERSATION_STORAGE_KEY}:${tripId}` : CONVERSATION_STORAGE_KEY;
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function storeConversation(messages: CompanionMessage[], tripId?: string): void {
  try {
    const key = tripId ? `${CONVERSATION_STORAGE_KEY}:${tripId}` : CONVERSATION_STORAGE_KEY;
    // Keep only recent messages
    const trimmed = messages.slice(-MAX_HISTORY_LENGTH);
    localStorage.setItem(key, JSON.stringify(trimmed));
  } catch {
    // Ignore storage errors
  }
}

function clearStoredConversation(tripId?: string): void {
  try {
    const key = tripId ? `${CONVERSATION_STORAGE_KEY}:${tripId}` : CONVERSATION_STORAGE_KEY;
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}

// ============================================================================
// API Functions
// ============================================================================

async function sendCompanionMessage(params: SendMessageParams): Promise<CompanionResponse> {
  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const user = await getCurrentUser();

  const response = await fetch(`${apiUrl}/companion/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(user ? { Authorization: `Bearer ${user.id}` } : {}),
    },
    body: JSON.stringify({
      message: params.message,
      context: params.context,
      userId: user?.id,
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new ApiError(API_ERROR_CODES.RATE_LIMITED, 'Too many messages. Please wait a moment.');
    }
    throw new ApiError(API_ERROR_CODES.INTERNAL_ERROR, 'Failed to send message');
  }

  // Handle streaming if callback provided
  if (params.streamCallback && response.body) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        params.streamCallback(chunk);
      }
    } finally {
      reader.releaseLock();
    }

    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: fullContent,
        timestamp: new Date().toISOString(),
        metadata: { phase: params.context.phase, tripId: params.context.tripId },
      },
    };
  }

  return response.json();
}

// Rate-limited version
const rateLimitedSendMessage = withRateLimit(
  sendCompanionMessage,
  'companion:chat',
  RATE_LIMITS.ai
);

// ============================================================================
// Hooks
// ============================================================================

/**
 * Main companion chat hook
 *
 * @example
 * const {
 *   messages,
 *   sendMessage,
 *   isLoading,
 *   streamingContent,
 *   clearHistory,
 * } = useCompanionChat({ phase: 'planning', tripId: 'xxx' });
 */
export function useCompanionChat(context: Omit<CompanionContext, 'conversationHistory'>) {
  const [messages, setMessages] = useState<CompanionMessage[]>(() =>
    getStoredConversation(context.tripId)
  );
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Persist messages to storage
  useEffect(() => {
    storeConversation(messages, context.tripId);
  }, [messages, context.tripId]);

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      // Add user message immediately
      const userMessage: CompanionMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        metadata: { phase: context.phase, tripId: context.tripId },
      };

      setMessages((prev) => [...prev, userMessage]);
      setStreamingContent('');
      setIsStreaming(true);

      try {
        const response = await rateLimitedSendMessage({
          message,
          context: {
            ...context,
            conversationHistory: messages.slice(-10), // Last 10 messages for context
          },
          streamCallback: (chunk: string) => {
            setStreamingContent((prev) => prev + chunk);
          },
        });

        setIsStreaming(false);
        setStreamingContent('');

        // Add assistant response
        const typedResponse = response as CompanionResponse;
        setMessages((prev) => [...prev, typedResponse.message]);

        return typedResponse;
      } catch (error) {
        setIsStreaming(false);
        setStreamingContent('');
        throw error;
      }
    },
  });

  const sendMessage = useCallback(
    (message: string) => {
      return sendMutation.mutateAsync(message);
    },
    [sendMutation]
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
    clearStoredConversation(context.tripId);
  }, [context.tripId]);

  const cancelStreaming = useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStreamingContent('');
  }, []);

  // Get rate limit info for UI
  const rateLimitInfo = getRateLimitInfo('companion:chat', RATE_LIMITS.ai);

  return {
    messages,
    sendMessage,
    isLoading: sendMutation.isPending,
    isStreaming,
    streamingContent,
    error: sendMutation.error,
    clearHistory,
    cancelStreaming,
    rateLimitInfo,
  };
}

/**
 * Get proactive suggestions from companion
 */
export function useCompanionSuggestions(
  phase: CompanionPhase,
  context?: {
    tripId?: string;
    currentCity?: string;
    currentDay?: number;
    preferences?: Partial<Preferences>;
  }
) {
  return useQuery({
    queryKey: companionKeys.suggestions(phase, context?.tripId),
    queryFn: async () => {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';

      const response = await fetch(`${apiUrl}/companion/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase, ...context }),
      });

      if (!response.ok) {
        return [];
      }

      const data = await response.json();
      return (data.suggestions || []) as CompanionSuggestion[];
    },
    enabled: !!phase,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Quick action hooks for common companion interactions
 */
export function useCompanionQuickActions(tripId?: string) {
  const { sendMessage } = useCompanionChat({ phase: 'planning', tripId });

  return {
    askForRecommendation: useCallback(
      (city: string, category: string) => {
        return sendMessage(`What are some good ${category} in ${city}?`);
      },
      [sendMessage]
    ),

    askAboutPlace: useCallback(
      (placeName: string) => {
        return sendMessage(`Tell me more about ${placeName}`);
      },
      [sendMessage]
    ),

    askForAlternatives: useCallback(
      (placeName: string) => {
        return sendMessage(`Can you suggest alternatives to ${placeName}?`);
      },
      [sendMessage]
    ),

    askForTips: useCallback(
      (topic: string) => {
        return sendMessage(`What tips do you have for ${topic}?`);
      },
      [sendMessage]
    ),
  };
}

/**
 * Hook for companion message reactions/feedback
 */
export function useCompanionFeedback() {
  return useMutation({
    mutationFn: async ({
      messageId,
      feedback,
    }: {
      messageId: string;
      feedback: 'helpful' | 'not_helpful' | 'wrong';
    }) => {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';

      const response = await fetch(`${apiUrl}/companion/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, feedback }),
      });

      if (!response.ok) {
        throw new ApiError(API_ERROR_CODES.INTERNAL_ERROR, 'Failed to submit feedback');
      }

      return response.json();
    },
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format messages for display
 */
export function formatCompanionMessages(
  messages: CompanionMessage[],
  includeSystem = false
): CompanionMessage[] {
  return messages.filter((m) => includeSystem || m.role !== 'system');
}

/**
 * Get the latest assistant message
 */
export function getLatestAssistantMessage(
  messages: CompanionMessage[]
): CompanionMessage | undefined {
  return [...messages].reverse().find((m) => m.role === 'assistant');
}

/**
 * Count messages in conversation
 */
export function getConversationStats(messages: CompanionMessage[]) {
  return {
    total: messages.length,
    userMessages: messages.filter((m) => m.role === 'user').length,
    assistantMessages: messages.filter((m) => m.role === 'assistant').length,
    firstMessageAt: messages[0]?.timestamp,
    lastMessageAt: messages[messages.length - 1]?.timestamp,
  };
}
