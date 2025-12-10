/**
 * usePlanningCompanion Hook
 *
 * WI-3.1: React hook for planning companion integration
 *
 * Connects the planning companion service with:
 * - Discovery store (for context building)
 * - Agent provider (for AI communication)
 * - Local state (for conversation management)
 *
 * Architecture Decision:
 * - Composition over inheritance: Uses existing AgentProvider for API calls
 * - Adds planning-specific context and preference extraction
 * - Manages conversation state separately from agent state
 */

import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useDiscoveryStore } from '../stores/discoveryStore';
import { useAgent } from '../contexts/AgentProvider';
import { useContextObserver, type ObservedContext } from './useContextObserver';
import {
  useProactiveSuggestions,
  type ProactiveSuggestion,
} from './useProactiveSuggestions';
import {
  buildPlanningContext,
  serializePlanningContext,
  generatePlanningSystemPrompt,
  generateProactiveSuggestions,
  createPlanningConversation,
  addMessageToConversation,
  extractPreferencesFromAIResponse,
  mergePreferences,
  type PlanningContext,
  type PlanningConversation,
  type PlanningMessage,
  type ConversationPreferences,
  type CompanionSuggestion,
  type ExtractedPreference,
} from '../services/planningCompanion';

// ============================================================================
// Types
// ============================================================================

export interface UsePlanningCompanionReturn {
  // Conversation state
  conversation: PlanningConversation;
  isLoading: boolean;
  error: string | null;

  // Context
  planningContext: PlanningContext;
  contextSummary: string;

  // Observed context (WI-3.4)
  observedContext: import('./useContextObserver').ObservedContext;

  // Preferences
  preferences: ConversationPreferences;

  // Static suggestions (context-based)
  suggestions: CompanionSuggestion[];
  dismissSuggestion: (index: number) => void;

  // Proactive suggestions (WI-3.5 - action-triggered)
  proactiveSuggestion: ProactiveSuggestion | null;
  dismissProactiveSuggestion: () => void;
  actOnProactiveSuggestion: () => void;
  isCompanionEngaged: boolean;

  // Actions
  sendMessage: (message: string) => Promise<void>;
  clearConversation: () => void;

  // Utilities
  getSystemPrompt: () => string;
}

// ============================================================================
// Hook
// ============================================================================

export function usePlanningCompanion(): UsePlanningCompanionReturn {
  // ==================== Store & Context ====================
  const {
    route,
    tripSummary,
    phase,
    inferredPreferences,
    favouritedPlaceIds,
    removedCityIds,
    recentActions,
    selectedCityId,
    isCompanionExpanded,
    sessionId,
    getRecentActions,
  } = useDiscoveryStore();

  const agent = useAgent();

  // ==================== Context Observer (WI-3.4) ====================
  const observedContext = useContextObserver();

  // ==================== Proactive Suggestions (WI-3.5) ====================
  const {
    activeSuggestion: proactiveSuggestion,
    dismissSuggestion: dismissProactiveSuggestion,
    actOnSuggestion,
    isCompanionEngaged,
  } = useProactiveSuggestions();

  // ==================== Local State ====================
  const [conversation, setConversation] = useState<PlanningConversation>(() =>
    createPlanningConversation(sessionId)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

  // Track last sync time for actions
  const lastActionSyncRef = useRef<Date>(new Date());
  // Track synced agent message IDs to prevent duplicates
  const syncedAgentMessageIdsRef = useRef<Set<string>>(new Set());

  // ==================== Build Planning Context ====================
  const planningContext = useMemo((): PlanningContext => {
    return buildPlanningContext(
      route,
      tripSummary,
      phase,
      inferredPreferences,
      favouritedPlaceIds,
      removedCityIds,
      getRecentActions(),
      selectedCityId,
      isCompanionExpanded,
      sessionId
    );
  }, [
    route,
    tripSummary,
    phase,
    inferredPreferences,
    favouritedPlaceIds,
    removedCityIds,
    selectedCityId,
    isCompanionExpanded,
    sessionId,
    getRecentActions,
  ]);

  // ==================== Context Summary ====================
  const contextSummary = useMemo(
    () => serializePlanningContext(planningContext),
    [planningContext]
  );

  // ==================== System Prompt ====================
  const getSystemPrompt = useCallback(
    () => generatePlanningSystemPrompt(planningContext),
    [planningContext]
  );

  // ==================== Proactive Suggestions ====================
  const suggestions = useMemo(() => {
    const allSuggestions = generateProactiveSuggestions(planningContext);
    // Filter out dismissed suggestions
    return allSuggestions.filter(
      (s) => !dismissedSuggestions.has(`${s.type}-${s.message}`)
    );
  }, [planningContext, dismissedSuggestions]);

  const dismissSuggestion = useCallback((index: number) => {
    const suggestion = suggestions[index];
    if (suggestion) {
      setDismissedSuggestions((prev) =>
        new Set(prev).add(`${suggestion.type}-${suggestion.message}`)
      );
    }
  }, [suggestions]);

  // ==================== Reset on Session Change ====================
  useEffect(() => {
    if (conversation.sessionId !== sessionId) {
      setConversation(createPlanningConversation(sessionId));
      setDismissedSuggestions(new Set());
      setError(null);
      syncedAgentMessageIdsRef.current.clear();
    }
  }, [sessionId, conversation.sessionId]);

  // ==================== Sync Actions to Context ====================
  useEffect(() => {
    // Check for new actions since last sync
    const newActions = getRecentActions(lastActionSyncRef.current);
    if (newActions.length > 0) {
      lastActionSyncRef.current = new Date();
      // Actions are automatically included in context via planningContext
    }
  }, [recentActions, getRecentActions]);

  // ==================== Send Message ====================
  const sendMessage = useCallback(
    async (message: string) => {
      if (!message.trim()) return;

      setIsLoading(true);
      setError(null);

      try {
        // Add user message to conversation
        const userMessage: Omit<PlanningMessage, 'id' | 'timestamp' | 'extractedPreferences'> = {
          role: 'user',
          content: message.trim(),
        };

        setConversation((prev) => addMessageToConversation(prev, userMessage));

        // Extract preferences from user message (stored in conversation state)
        // These preferences are merged when the message is added above
        // and can be accessed via conversation.preferences

        // Use the existing agent to send the message
        // The agent handles SSE streaming and response processing
        // Planning context is available via usePlanningContext() for backend integration
        await agent.sendMessage(message);

        // After agent responds, extract preferences from response
        // We need to wait for the agent's response to be in messages
        // This is handled in the effect below

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        setError(errorMessage);
        console.error('Planning companion error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [agent]
  );

  // ==================== Sync Agent Messages ====================
  // Watch agent messages and sync to planning conversation
  useEffect(() => {
    const agentMessages = agent.messages;
    if (agentMessages.length === 0) return;

    // Get the latest assistant message
    const latestMessage = agentMessages[agentMessages.length - 1];
    if (latestMessage.role !== 'assistant' || latestMessage.isStreaming) return;

    // Check if we already synced this agent message using ref
    // This prevents duplicates since conversation generates its own IDs
    if (syncedAgentMessageIdsRef.current.has(latestMessage.id)) return;

    // Mark this agent message as synced BEFORE updating state
    syncedAgentMessageIdsRef.current.add(latestMessage.id);

    // Add assistant message to planning conversation
    const assistantMessage: Omit<PlanningMessage, 'id' | 'timestamp' | 'extractedPreferences'> = {
      role: 'assistant',
      content: latestMessage.content,
    };

    setConversation((prev) => {
      // Extract AI preferences
      const aiPreferences = extractPreferencesFromAIResponse(
        latestMessage.content,
        latestMessage.id
      );

      // Create updated conversation with message
      let updated = addMessageToConversation(prev, assistantMessage);

      // Merge AI-extracted preferences
      if (aiPreferences.length > 0) {
        updated = {
          ...updated,
          preferences: mergePreferences(updated.preferences, aiPreferences),
        };
      }

      return updated;
    });
  }, [agent.messages]);

  // ==================== Clear Conversation ====================
  const clearConversation = useCallback(() => {
    setConversation(createPlanningConversation(sessionId));
    setDismissedSuggestions(new Set());
    setError(null);
    syncedAgentMessageIdsRef.current.clear();
    agent.clearHistory();
  }, [sessionId, agent]);

  // ==================== Act on Proactive Suggestion ====================
  const actOnProactiveSuggestion = useCallback(() => {
    const message = actOnSuggestion();
    if (message) {
      // Send the proactive suggestion message to the companion
      sendMessage(message);
    }
  }, [actOnSuggestion, sendMessage]);

  // ==================== Return ====================
  return {
    // Conversation
    conversation,
    isLoading: isLoading || agent.isLoading,
    error,

    // Context
    planningContext,
    contextSummary,

    // Observed context (WI-3.4)
    observedContext,

    // Preferences
    preferences: conversation.preferences,

    // Static suggestions (context-based)
    suggestions,
    dismissSuggestion,

    // Proactive suggestions (WI-3.5)
    proactiveSuggestion,
    dismissProactiveSuggestion,
    actOnProactiveSuggestion,
    isCompanionEngaged,

    // Actions
    sendMessage,
    clearConversation,

    // Utilities
    getSystemPrompt,
  };
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to get just the planning context (for components that don't need full companion)
 */
export function usePlanningContext(): PlanningContext {
  const {
    route,
    tripSummary,
    phase,
    inferredPreferences,
    favouritedPlaceIds,
    removedCityIds,
    selectedCityId,
    isCompanionExpanded,
    sessionId,
    getRecentActions,
  } = useDiscoveryStore();

  return useMemo(
    () =>
      buildPlanningContext(
        route,
        tripSummary,
        phase,
        inferredPreferences,
        favouritedPlaceIds,
        removedCityIds,
        getRecentActions(),
        selectedCityId,
        isCompanionExpanded,
        sessionId
      ),
    [
      route,
      tripSummary,
      phase,
      inferredPreferences,
      favouritedPlaceIds,
      removedCityIds,
      selectedCityId,
      isCompanionExpanded,
      sessionId,
      getRecentActions,
    ]
  );
}

/**
 * Hook to get proactive suggestions
 */
export function usePlanningCompanionSuggestions(): {
  suggestions: CompanionSuggestion[];
  dismiss: (index: number) => void;
} {
  const context = usePlanningContext();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const suggestions = useMemo(() => {
    const all = generateProactiveSuggestions(context);
    return all.filter((s) => !dismissed.has(`${s.type}-${s.message}`));
  }, [context, dismissed]);

  const dismiss = useCallback(
    (index: number) => {
      const suggestion = suggestions[index];
      if (suggestion) {
        setDismissed((prev) => new Set(prev).add(`${suggestion.type}-${suggestion.message}`));
      }
    },
    [suggestions]
  );

  return { suggestions, dismiss };
}

/**
 * Hook to track extracted preferences
 */
export function usePlanningPreferences(): ConversationPreferences {
  const { conversation } = usePlanningCompanion();
  return conversation.preferences;
}

// ============================================================================
// Exports
// ============================================================================

export type {
  PlanningContext,
  PlanningConversation,
  PlanningMessage,
  ConversationPreferences,
  CompanionSuggestion,
  ExtractedPreference,
  ObservedContext,
  ProactiveSuggestion,
};
