/**
 * useCompanionSSE Hook
 *
 * Manages SSE connection for the planning companion.
 * Handles streaming events, accumulates text, and provides
 * clean interface for component consumption.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  PlanCard,
  CompanionAction,
  CompanionContext,
  CompanionStreamEvent,
} from '../../types/planning';

// ============================================
// Types
// ============================================

export interface UseCompanionSSEResult {
  sendMessage: (message: string, context: CompanionContext) => void;
  isStreaming: boolean;
  currentText: string;
  currentCards: PlanCard[];
  currentActions: CompanionAction[];
  thinkingText: string | null;
  toolCall: { tool: string; args: Record<string, unknown> } | null;
  error: string | null;
  cancel: () => void;
  reset: () => void;
}

interface SSEState {
  isStreaming: boolean;
  currentText: string;
  currentCards: PlanCard[];
  currentActions: CompanionAction[];
  thinkingText: string | null;
  toolCall: { tool: string; args: Record<string, unknown> } | null;
  error: string | null;
}

const initialState: SSEState = {
  isStreaming: false,
  currentText: '',
  currentCards: [],
  currentActions: [],
  thinkingText: null,
  toolCall: null,
  error: null,
};

// ============================================
// Hook Implementation
// ============================================

export function useCompanionSSE(routeId: string): UseCompanionSSEResult {
  const [state, setState] = useState<SSEState>(initialState);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  /**
   * Cancel ongoing streaming
   */
  const cancel = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isStreaming: false,
      thinkingText: null,
      toolCall: null,
    }));
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    cancel();
    setState(initialState);
  }, [cancel]);

  /**
   * Send message and start SSE streaming
   */
  const sendMessage = useCallback(
    (message: string, context: CompanionContext) => {
      // Cancel any existing connection
      cancel();

      // Reset state for new message
      setState({
        isStreaming: true,
        currentText: '',
        currentCards: [],
        currentActions: [],
        thinkingText: null,
        toolCall: null,
        error: null,
      });

      // Build SSE URL with query parameters
      const params = new URLSearchParams({
        message,
        cityId: context.cityId,
        context: encodeURIComponent(JSON.stringify(context)),
      });

      const url = `/api/planning/${routeId}/companion/stream?${params.toString()}`;

      // Create EventSource
      const eventSource = new EventSource(url);
      eventSourceRef.current = eventSource;

      // Handle incoming messages
      eventSource.onmessage = (event) => {
        try {
          const data: CompanionStreamEvent = JSON.parse(event.data);

          switch (data.type) {
            case 'thinking':
              setState((prev) => ({
                ...prev,
                thinkingText: data.content,
              }));
              break;

            case 'message':
              setState((prev) => ({
                ...prev,
                thinkingText: null,
                currentText: prev.currentText + data.content,
              }));
              break;

            case 'cards':
              setState((prev) => ({
                ...prev,
                currentCards: data.cards,
              }));
              break;

            case 'actions':
              setState((prev) => ({
                ...prev,
                currentActions: data.actions,
              }));
              break;

            case 'tool_call':
              setState((prev) => ({
                ...prev,
                thinkingText: null,
                toolCall: { tool: data.tool, args: data.args },
              }));
              break;

            case 'tool_result':
              setState((prev) => ({
                ...prev,
                toolCall: null,
              }));
              break;

            case 'done':
              eventSource.close();
              eventSourceRef.current = null;
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                thinkingText: null,
                toolCall: null,
              }));
              break;

            case 'error':
              eventSource.close();
              eventSourceRef.current = null;
              setState((prev) => ({
                ...prev,
                isStreaming: false,
                thinkingText: null,
                toolCall: null,
                error: data.error,
              }));
              break;
          }
        } catch (parseError) {
          console.error('[useCompanionSSE] Failed to parse event:', parseError);
        }
      };

      // Handle connection errors
      eventSource.onerror = (error) => {
        console.error('[useCompanionSSE] EventSource error:', error);
        eventSource.close();
        eventSourceRef.current = null;
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          thinkingText: null,
          toolCall: null,
          error: 'Connection lost. Please try again.',
        }));
      };
    },
    [routeId, cancel]
  );

  return {
    sendMessage,
    isStreaming: state.isStreaming,
    currentText: state.currentText,
    currentCards: state.currentCards,
    currentActions: state.currentActions,
    thinkingText: state.thinkingText,
    toolCall: state.toolCall,
    error: state.error,
    cancel,
    reset,
  };
}

// ============================================
// Non-streaming fallback hook
// ============================================

export interface UseCompanionFallbackResult {
  sendMessage: (message: string, context: CompanionContext) => Promise<void>;
  isLoading: boolean;
  response: {
    message: string;
    cards: PlanCard[];
    actions: CompanionAction[];
  } | null;
  error: string | null;
  reset: () => void;
}

export function useCompanionFallback(routeId: string): UseCompanionFallbackResult {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{
    message: string;
    cards: PlanCard[];
    actions: CompanionAction[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (message: string, context: CompanionContext) => {
      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      setIsLoading(true);
      setError(null);
      setResponse(null);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        const res = await fetch(`/api/planning/${routeId}/companion`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            cityId: context.cityId,
            message,
            context,
          }),
          signal: abortController.signal,
        });

        if (!res.ok) {
          throw new Error('Failed to send message');
        }

        const data = await res.json();
        setResponse({
          message: data.message || '',
          cards: data.cards || [],
          actions: data.actions || [],
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('[useCompanionFallback] Error:', err);
          setError((err as Error).message || 'Something went wrong');
        }
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [routeId]
  );

  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setResponse(null);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    sendMessage,
    isLoading,
    response,
    error,
    reset,
  };
}

export default useCompanionSSE;
