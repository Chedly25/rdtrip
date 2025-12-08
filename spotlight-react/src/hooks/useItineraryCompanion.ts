/**
 * useItineraryCompanion Hook
 *
 * WI-5.8: React hook for itinerary companion integration
 *
 * Enables AI-powered itinerary modifications through conversation:
 * - Explain itinerary choices
 * - Modify itinerary via natural language
 * - Handle weather contingencies
 * - Make proactive suggestions
 *
 * Architecture:
 * - Integrates with useItineraryEditor for modifications
 * - Uses existing agent infrastructure for AI communication
 * - Extracts actions from AI responses
 * - Manages conversation state
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useAgent } from '../contexts/AgentProvider';
import {
  buildItineraryCompanionContext,
  processAssistantResponse,
  createMessage,
  detectItineraryIssues,
  getProactiveMessage,
  generateQuickSuggestions,
  type CompanionMessage,
  type ItineraryAction,
  type ItineraryIssue,
  type QuickSuggestion,
  type WeatherForecast,
  type ItineraryCompanionContext,
} from '../services/itineraryCompanion';
import type { Itinerary } from '../services/itinerary';
import type { UserPreferences } from '../services/preferences';

// ============================================================================
// Types
// ============================================================================

export interface UseItineraryCompanionOptions {
  /** Current itinerary */
  itinerary: Itinerary | null;
  /** User preferences */
  preferences: UserPreferences;
  /** Currently selected day number */
  selectedDay?: number;
  /** Weather forecast (optional) */
  weather?: WeatherForecast[];
  /** Callback when an action is executed */
  onActionExecute?: (action: ItineraryAction) => void;
}

export interface UseItineraryCompanionReturn {
  // Conversation state
  messages: CompanionMessage[];
  isLoading: boolean;
  error: string | null;

  // Quick actions
  quickSuggestions: QuickSuggestion[];

  // Issues detected
  issues: ItineraryIssue[];
  proactiveMessage: string | null;

  // Pending actions
  pendingActions: ItineraryAction[];
  executePendingActions: () => void;
  clearPendingActions: () => void;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => void;

  // Context
  context: ItineraryCompanionContext | null;

  // Panel state
  isExpanded: boolean;
  toggleExpanded: () => void;
  expand: () => void;
  collapse: () => void;
}

// ============================================================================
// Hook
// ============================================================================

export function useItineraryCompanion(
  options: UseItineraryCompanionOptions
): UseItineraryCompanionReturn {
  const { itinerary, preferences, selectedDay, weather, onActionExecute } = options;

  // Agent for AI communication
  const agent = useAgent();

  // ==================== Local State ====================
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<ItineraryAction[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Track processed agent message IDs to avoid duplicate processing
  const processedMessageIds = useRef<Set<string>>(new Set());

  // ==================== Build Context ====================
  const context = useMemo((): ItineraryCompanionContext | null => {
    if (!itinerary) return null;
    return buildItineraryCompanionContext(
      itinerary,
      preferences,
      selectedDay,
      weather
    );
  }, [itinerary, preferences, selectedDay, weather]);

  // ==================== Quick Suggestions ====================
  const quickSuggestions = useMemo((): QuickSuggestion[] => {
    if (!context) return [];
    return generateQuickSuggestions(context);
  }, [context]);

  // ==================== Issue Detection ====================
  const issues = useMemo((): ItineraryIssue[] => {
    if (!itinerary) return [];
    return detectItineraryIssues(itinerary, weather);
  }, [itinerary, weather]);

  const proactiveMessage = useMemo((): string | null => {
    return getProactiveMessage(issues);
  }, [issues]);

  // ==================== Send Message ====================
  const sendMessage = useCallback(async (message: string) => {
    if (!context || !itinerary) {
      setError('No itinerary loaded');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message to our local state
    const userMessage = createMessage('user', message);
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Use the existing agent to send the message
      // The agent handles SSE streaming and response processing
      await agent.sendMessage(message);

      // Response handling is done in the useEffect below that watches agent.messages
    } catch (err) {
      console.error('Companion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to get response');

      // Add error message to chat
      const errorMessage = createMessage(
        'assistant',
        "Sorry, I'm having trouble responding right now. Please try again."
      );
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [context, itinerary, agent]);

  // ==================== Sync Agent Messages ====================
  // Watch agent messages and sync completed responses to our conversation
  useEffect(() => {
    if (!itinerary || agent.messages.length === 0) return;

    // Get the latest assistant message
    const latestMessage = agent.messages[agent.messages.length - 1];
    if (latestMessage.role !== 'assistant' || latestMessage.isStreaming) return;

    // Check if we already processed this message
    if (processedMessageIds.current.has(latestMessage.id)) return;
    processedMessageIds.current.add(latestMessage.id);

    // Process the response to extract actions
    const { message: assistantMessage, executableActions } =
      processAssistantResponse(latestMessage.content, itinerary);

    // Add assistant message to our conversation
    setMessages((prev) => [...prev, assistantMessage]);

    // Queue any actions for confirmation
    if (executableActions.length > 0) {
      setPendingActions(executableActions);
    }
  }, [agent.messages, itinerary]);

  // ==================== Execute Pending Actions ====================
  const executePendingActions = useCallback(() => {
    if (pendingActions.length === 0) return;

    pendingActions.forEach((action) => {
      try {
        if (onActionExecute) {
          onActionExecute(action);
        }
      } catch (err) {
        console.error('Failed to execute action:', err);
      }
    });

    setPendingActions([]);
  }, [pendingActions, onActionExecute]);

  const clearPendingActions = useCallback(() => {
    setPendingActions([]);
  }, []);

  // ==================== Clear Conversation ====================
  const clearConversation = useCallback(() => {
    setMessages([]);
    setPendingActions([]);
    setError(null);
  }, []);

  // ==================== Panel State ====================
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const expand = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const collapse = useCallback(() => {
    setIsExpanded(false);
  }, []);

  // ==================== Initial Welcome Message ====================
  useEffect(() => {
    if (itinerary && messages.length === 0) {
      const welcomeMessage = createMessage(
        'assistant',
        `Your ${itinerary.summary.totalDays}-day trip is looking good! I'm here to help you fine-tune it. Ask me anything about the schedule, or tell me what changes you'd like to make.`
      );
      setMessages([welcomeMessage]);
    }
  }, [itinerary]);

  // ==================== Return ====================
  return {
    // Conversation
    messages,
    isLoading,
    error,

    // Quick actions
    quickSuggestions,

    // Issues
    issues,
    proactiveMessage,

    // Pending actions
    pendingActions,
    executePendingActions,
    clearPendingActions,

    // Actions
    sendMessage,
    clearConversation,

    // Context
    context,

    // Panel state
    isExpanded,
    toggleExpanded,
    expand,
    collapse,
  };
}

// ============================================================================
// Exports
// ============================================================================

export type { ProactiveSuggestion } from './useProactiveSuggestions';
export type {
  CompanionMessage,
  ItineraryAction,
  ItineraryIssue,
  QuickSuggestion,
  WeatherForecast,
} from '../services/itineraryCompanion';
