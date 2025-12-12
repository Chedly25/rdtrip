/**
 * useIntelligenceSSE Hook
 *
 * A robust hook for handling Server-Sent Events (SSE) connections
 * for the City Intelligence system with:
 * - Automatic reconnection with exponential backoff
 * - Connection state management
 * - Error handling and recovery
 * - Event buffering during reconnection
 * - Cleanup on unmount
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useCityIntelligenceStore } from '../stores/cityIntelligenceStore';
import type { SSEEvent, StartIntelligenceRequest } from '../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface SSEConnectionState {
  status: 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error' | 'closed';
  error: string | null;
  reconnectAttempts: number;
  lastEventTime: Date | null;
}

interface UseIntelligenceSSEOptions {
  /** Base URL for the SSE endpoint */
  baseUrl?: string;
  /** Max reconnection attempts */
  maxReconnectAttempts?: number;
  /** Initial reconnection delay in ms */
  initialReconnectDelay?: number;
  /** Max reconnection delay in ms */
  maxReconnectDelay?: number;
  /** Heartbeat timeout in ms (close connection if no events received) */
  heartbeatTimeout?: number;
  /** Enable debug logging */
  debug?: boolean;
}

interface UseIntelligenceSSEReturn {
  /** Current connection state */
  connectionState: SSEConnectionState;
  /** Start intelligence gathering */
  startIntelligence: (request: StartIntelligenceRequest) => Promise<void>;
  /** Cancel intelligence gathering */
  cancelIntelligence: () => void;
  /** Manually reconnect */
  reconnect: () => void;
  /** Close connection */
  close: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const DEFAULT_OPTIONS: Required<UseIntelligenceSSEOptions> = {
  baseUrl: '/api/city-intelligence',
  maxReconnectAttempts: 5,
  initialReconnectDelay: 1000,
  maxReconnectDelay: 30000,
  heartbeatTimeout: 60000,
  debug: false,
};

// =============================================================================
// Hook
// =============================================================================

export function useIntelligenceSSE(
  options: UseIntelligenceSSEOptions = {}
): UseIntelligenceSSEReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Connection state
  const [connectionState, setConnectionState] = useState<SSEConnectionState>({
    status: 'idle',
    error: null,
    reconnectAttempts: 0,
    lastEventTime: null,
  });

  // Refs for cleanup
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const requestRef = useRef<StartIntelligenceRequest | null>(null);

  // Store actions
  const handleSSEEvent = useCityIntelligenceStore((s) => s.handleSSEEvent);

  // Debug logger
  const log = useCallback(
    (...args: unknown[]) => {
      if (opts.debug) {
        console.log('[SSE]', ...args);
      }
    },
    [opts.debug]
  );

  // Reset heartbeat timeout
  const resetHeartbeat = useCallback(() => {
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    heartbeatTimeoutRef.current = setTimeout(() => {
      log('Heartbeat timeout - connection may be stale');
      setConnectionState((prev) => ({
        ...prev,
        status: 'reconnecting',
        error: 'Connection timeout',
      }));
    }, opts.heartbeatTimeout);
  }, [opts.heartbeatTimeout, log]);

  // Calculate reconnection delay with exponential backoff
  const getReconnectDelay = useCallback(
    (attempt: number) => {
      const delay = Math.min(
        opts.initialReconnectDelay * Math.pow(2, attempt),
        opts.maxReconnectDelay
      );
      // Add jitter (±20%)
      return delay * (0.8 + Math.random() * 0.4);
    },
    [opts.initialReconnectDelay, opts.maxReconnectDelay]
  );

  // Process SSE event
  const processEvent = useCallback(
    (event: SSEEvent) => {
      log('Event received:', event.type);

      setConnectionState((prev) => ({
        ...prev,
        lastEventTime: new Date(),
        reconnectAttempts: 0, // Reset on successful event
      }));

      resetHeartbeat();
      handleSSEEvent(event);

      // Handle connection events
      if (event.type === 'connected') {
        setConnectionState((prev) => ({
          ...prev,
          status: 'connected',
          error: null,
        }));
      }

      // Handle completion
      if (event.type === 'all_complete') {
        setConnectionState((prev) => ({
          ...prev,
          status: 'closed',
        }));
      }

      // Handle errors
      if (event.type === 'error' && !event.recoverable) {
        setConnectionState((prev) => ({
          ...prev,
          status: 'error',
          error: event.error,
        }));
      }
    },
    [handleSSEEvent, resetHeartbeat, log]
  );

  // Start SSE connection
  const startConnection = useCallback(
    async (request: StartIntelligenceRequest) => {
      // Abort any existing connection
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Clear any pending reconnect
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Store request for potential reconnection
      requestRef.current = request;

      // Create new abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setConnectionState((prev) => ({
        ...prev,
        status: 'connecting',
        error: null,
      }));

      log('Starting SSE connection...');

      try {
        const response = await fetch(`${opts.baseUrl}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(request),
          signal: abortController.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response body');
        }

        setConnectionState((prev) => ({
          ...prev,
          status: 'connected',
        }));

        resetHeartbeat();

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            log('Stream completed');
            break;
          }

          if (abortController.signal.aborted) {
            log('Connection aborted');
            break;
          }

          buffer += decoder.decode(value, { stream: true });

          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                processEvent(data);
              } catch (e) {
                log('Failed to parse SSE data:', line);
              }
            }
          }
        }

        // Connection closed normally
        setConnectionState((prev) => ({
          ...prev,
          status: 'closed',
        }));

      } catch (error) {
        // Ignore abort errors
        if (error instanceof Error && error.name === 'AbortError') {
          log('Connection aborted by user');
          return;
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        log('Connection error:', errorMessage);

        setConnectionState((prev) => {
          const newAttempts = prev.reconnectAttempts + 1;

          if (newAttempts <= opts.maxReconnectAttempts) {
            // Schedule reconnection
            const delay = getReconnectDelay(newAttempts);
            log(`Scheduling reconnection attempt ${newAttempts} in ${delay}ms`);

            reconnectTimeoutRef.current = setTimeout(() => {
              if (requestRef.current) {
                startConnection(requestRef.current);
              }
            }, delay);

            return {
              ...prev,
              status: 'reconnecting',
              error: errorMessage,
              reconnectAttempts: newAttempts,
            };
          }

          return {
            ...prev,
            status: 'error',
            error: `Connection failed after ${newAttempts} attempts: ${errorMessage}`,
            reconnectAttempts: newAttempts,
          };
        });
      }
    },
    [opts.baseUrl, opts.maxReconnectAttempts, processEvent, resetHeartbeat, getReconnectDelay, log]
  );

  // Public methods
  const startIntelligence = useCallback(
    async (request: StartIntelligenceRequest) => {
      await startConnection(request);
    },
    [startConnection]
  );

  const cancelIntelligence = useCallback(() => {
    log('Cancelling intelligence gathering');

    // Abort connection
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Clear timeouts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    // Send cancel request if we have a session
    const sessionId = useCityIntelligenceStore.getState().sessionId;
    if (sessionId) {
      fetch(`${opts.baseUrl}/cancel/${sessionId}`, { method: 'POST' }).catch((err) =>
        log('Cancel request failed:', err)
      );
    }

    setConnectionState({
      status: 'closed',
      error: null,
      reconnectAttempts: 0,
      lastEventTime: null,
    });

    requestRef.current = null;
  }, [opts.baseUrl, log]);

  const reconnect = useCallback(() => {
    if (requestRef.current) {
      log('Manual reconnection requested');
      setConnectionState((prev) => ({
        ...prev,
        reconnectAttempts: 0, // Reset attempts for manual reconnect
      }));
      startConnection(requestRef.current);
    }
  }, [startConnection, log]);

  const close = useCallback(() => {
    log('Closing connection');

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatTimeoutRef.current) {
      clearTimeout(heartbeatTimeoutRef.current);
    }

    setConnectionState({
      status: 'closed',
      error: null,
      reconnectAttempts: 0,
      lastEventTime: null,
    });

    requestRef.current = null;
  }, [log]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (heartbeatTimeoutRef.current) {
        clearTimeout(heartbeatTimeoutRef.current);
      }
    };
  }, []);

  return {
    connectionState,
    startIntelligence,
    cancelIntelligence,
    reconnect,
    close,
  };
}

// =============================================================================
// Connection Status Hook
// =============================================================================

/**
 * Simple hook to get just the connection status
 */
export function useIntelligenceConnectionStatus() {
  const isConnected = useCityIntelligenceStore((s) => s.isConnected);
  const isProcessing = useCityIntelligenceStore((s) => s.isProcessing);
  const sessionId = useCityIntelligenceStore((s) => s.sessionId);

  return {
    isConnected,
    isProcessing,
    sessionId,
    hasActiveSession: isConnected && sessionId !== null,
  };
}

export default useIntelligenceSSE;
