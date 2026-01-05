/**
 * useDiscoveryAgentSSE
 *
 * Low-level SSE connection management for Voyager Discovery Agent.
 * Handles connection lifecycle, reconnection, and event parsing.
 */

import { useRef, useCallback } from 'react';

// ============================================================================
// Types
// ============================================================================

export type SSEEventType =
  | 'thinking'
  | 'text'
  | 'tool_start'
  | 'tool_complete'
  | 'route_action'
  | 'message'
  | 'complete'
  | 'error';

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
  timestamp: Date;
}

export interface ThinkingEvent {
  text: string;
}

export interface TextEvent {
  text: string;
}

export interface ToolStartEvent {
  tool: string;
  input: Record<string, unknown>;
}

export interface ToolCompleteEvent {
  tool: string;
  result: Record<string, unknown>;
}

export interface RouteActionEvent {
  type: 'add_city' | 'remove_city' | 'replace_city' | 'reorder' | 'adjust_nights';
  city?: {
    name: string;
    nights?: number;
    coordinates?: { lat: number; lng: number };
    country?: string;
    description?: string;
  };
  oldCity?: { name: string };
  newCity?: { name: string; country?: string; description?: string; coordinates?: { lat: number; lng: number } };
  index?: number;
  waypoints?: unknown[];
}

export interface MessageEvent {
  content: string;
  actions?: RouteActionEvent[];
  sessionId: string;
}

export interface CompleteEvent {
  response: string;
  actions: RouteActionEvent[];
  duration: number;
}

export interface ErrorEvent {
  message: string;
}

export type SSEEventHandler = {
  onThinking?: (data: ThinkingEvent) => void;
  onText?: (data: TextEvent) => void;
  onToolStart?: (data: ToolStartEvent) => void;
  onToolComplete?: (data: ToolCompleteEvent) => void;
  onRouteAction?: (data: RouteActionEvent) => void;
  onMessage?: (data: MessageEvent) => void;
  onComplete?: (data: CompleteEvent) => void;
  onError?: (data: ErrorEvent) => void;
  onHeartbeat?: () => void;
};

interface SendMessageOptions {
  message: string;
  sessionId: string;
  routeData?: unknown;
  conversationHistory?: Array<{ role: string; content: string }>;
}

// ============================================================================
// Hook
// ============================================================================

export function useDiscoveryAgentSSE() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  /**
   * Send a message and stream the response
   */
  const sendMessage = useCallback(async (
    options: SendMessageOptions,
    handlers: SSEEventHandler
  ): Promise<void> => {
    const { message, sessionId, routeData, conversationHistory = [] } = options;

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (readerRef.current) {
      readerRef.current.cancel();
    }

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/discovery/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          message,
          sessionId,
          routeData,
          conversationHistory,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        let currentEvent: string | null = null;
        let currentData = '';

        for (const line of lines) {
          if (line.startsWith(':heartbeat')) {
            handlers.onHeartbeat?.();
            continue;
          }

          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
            continue;
          }

          if (line.startsWith('data: ')) {
            currentData = line.slice(6);

            if (currentEvent && currentData) {
              try {
                const parsedData = JSON.parse(currentData);
                dispatchEvent(currentEvent as SSEEventType, parsedData, handlers);
              } catch (e) {
                console.warn('Failed to parse SSE data:', currentData);
              }
              currentEvent = null;
              currentData = '';
            }
          }

          if (line === '') {
            currentEvent = null;
            currentData = '';
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // Request was cancelled, ignore
        return;
      }
      handlers.onError?.({ message: (error as Error).message });
    }
  }, []);

  /**
   * Cancel the current request
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
  }, []);

  return { sendMessage, cancel };
}

/**
 * Dispatch an event to the appropriate handler
 */
function dispatchEvent(
  eventType: SSEEventType,
  data: unknown,
  handlers: SSEEventHandler
): void {
  switch (eventType) {
    case 'thinking':
      handlers.onThinking?.(data as ThinkingEvent);
      break;
    case 'text':
      handlers.onText?.(data as TextEvent);
      break;
    case 'tool_start':
      handlers.onToolStart?.(data as ToolStartEvent);
      break;
    case 'tool_complete':
      handlers.onToolComplete?.(data as ToolCompleteEvent);
      break;
    case 'route_action':
      handlers.onRouteAction?.(data as RouteActionEvent);
      break;
    case 'message':
      handlers.onMessage?.(data as MessageEvent);
      break;
    case 'complete':
      handlers.onComplete?.(data as CompleteEvent);
      break;
    case 'error':
      handlers.onError?.(data as ErrorEvent);
      break;
  }
}
