/**
 * CompanionProvider - Enhanced Context for Ambient Travel Companion
 *
 * Extends the AgentProvider with companion-specific features:
 * - Proactive suggestions system
 * - Panel visibility state
 * - Idle detection for proactive triggers
 * - Context-aware suggestions
 *
 * This is a wrapper around AgentProvider that adds companion behaviors
 * without duplicating the core agent functionality.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useSpotlightStoreV2 } from '../stores/spotlightStoreV2';

// ==================== TYPES ====================

export interface ProactiveSuggestion {
  id: string;
  message: string;
  prompt: string; // What to send to agent if accepted
  priority: 'low' | 'high';
  triggerType: 'idle' | 'context' | 'weather' | 'time';
  dismissedAt?: Date;
}

export interface CompanionState {
  isPanelExpanded: boolean;
  showProactiveBubble: boolean;
  currentSuggestion: ProactiveSuggestion | null;
  idleSeconds: number;
  lastInteractionAt: Date;
  hasUnreadMessages: boolean;
}

export interface CompanionContextValue extends CompanionState {
  // Panel Actions
  expandPanel: () => void;
  collapsePanel: () => void;
  togglePanel: () => void;

  // Proactive System
  triggerSuggestion: (suggestion: ProactiveSuggestion) => void;
  dismissSuggestion: () => void;
  acceptSuggestion: () => void;

  // Interaction tracking
  recordInteraction: () => void;
  markMessagesAsRead: () => void;
}

// ==================== CONTEXT ====================

const CompanionContext = createContext<CompanionContextValue | undefined>(undefined);

// ==================== PROACTIVE SUGGESTIONS ====================

const contextualSuggestions: Omit<ProactiveSuggestion, 'id'>[] = [
  {
    message: "I notice your itinerary in Barcelona is looking empty. Want me to suggest some must-see activities?",
    prompt: "Suggest the top 5 must-see activities in Barcelona",
    priority: 'low',
    triggerType: 'context',
  },
  {
    message: "You've been planning for a while! Want me to review your route and suggest optimizations?",
    prompt: "Review my current route and suggest any optimizations or improvements",
    priority: 'low',
    triggerType: 'idle',
  },
  {
    message: "Looking for restaurant recommendations? I know some amazing local spots!",
    prompt: "What are the best local restaurants in this city?",
    priority: 'low',
    triggerType: 'idle',
  },
  {
    message: "Want me to check the weather forecast for your trip dates?",
    prompt: "Check the weather forecast for my trip",
    priority: 'low',
    triggerType: 'context',
  },
];

// ==================== PROVIDER ====================

interface CompanionProviderProps {
  children: React.ReactNode;
}

export function CompanionProvider({ children }: CompanionProviderProps) {
  // Panel state
  const [isPanelExpanded, setIsPanelExpanded] = useState(true);
  const [showProactiveBubble, setShowProactiveBubble] = useState(false);
  const [currentSuggestion, setCurrentSuggestion] = useState<ProactiveSuggestion | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);

  // Idle tracking
  const [idleSeconds, setIdleSeconds] = useState(0);
  const [lastInteractionAt, setLastInteractionAt] = useState(new Date());
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionCooldownRef = useRef<Date | null>(null);

  // Get route context for smart suggestions
  const { route, selectedCityIndex } = useSpotlightStoreV2();

  // ==================== IDLE DETECTION ====================

  useEffect(() => {
    // Reset idle timer on any interaction
    const resetIdle = () => {
      setIdleSeconds(0);
      setLastInteractionAt(new Date());
    };

    // Track user interactions
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    window.addEventListener('click', resetIdle);
    window.addEventListener('scroll', resetIdle);
    window.addEventListener('touchstart', resetIdle);

    // Increment idle counter
    idleTimerRef.current = setInterval(() => {
      setIdleSeconds((prev) => prev + 1);
    }, 1000);

    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
      window.removeEventListener('click', resetIdle);
      window.removeEventListener('scroll', resetIdle);
      window.removeEventListener('touchstart', resetIdle);
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, []);

  // ==================== PROACTIVE TRIGGER LOGIC ====================

  useEffect(() => {
    // Don't trigger if panel is expanded (user is already engaged)
    if (isPanelExpanded) return;

    // Don't trigger if a suggestion is already showing
    if (showProactiveBubble) return;

    // Check cooldown (don't suggest too frequently)
    if (suggestionCooldownRef.current) {
      const cooldownMs = 120000; // 2 minutes between suggestions
      const timeSince = Date.now() - suggestionCooldownRef.current.getTime();
      if (timeSince < cooldownMs) return;
    }

    // Trigger after 45 seconds of idle
    if (idleSeconds >= 45) {
      // Pick a contextual suggestion based on current state
      let suggestion: ProactiveSuggestion | null = null;

      // Check for empty cities
      if (route?.cities) {
        const selectedCity = selectedCityIndex !== null ? route.cities[selectedCityIndex] : null;
        const cityWithNoActivities = route.cities.find(
          (city) => !city.activities || city.activities.length === 0
        );

        if (selectedCity && (!selectedCity.activities || selectedCity.activities.length === 0)) {
          // Current city is empty - suggest activities
          suggestion = {
            id: `suggestion-${Date.now()}`,
            message: `Your time in ${typeof selectedCity.city === 'object' ? selectedCity.city.name : selectedCity.city} is looking empty. Want me to suggest some activities?`,
            prompt: `Suggest activities for ${typeof selectedCity.city === 'object' ? selectedCity.city.name : selectedCity.city}`,
            priority: 'low',
            triggerType: 'context',
          };
        } else if (cityWithNoActivities) {
          // Some city is empty
          const cityName = typeof cityWithNoActivities.city === 'object'
            ? cityWithNoActivities.city.name
            : cityWithNoActivities.city;
          suggestion = {
            id: `suggestion-${Date.now()}`,
            message: `I notice ${cityName} doesn't have any activities yet. Want me to suggest some?`,
            prompt: `Suggest activities for ${cityName}`,
            priority: 'low',
            triggerType: 'context',
          };
        }
      }

      // Fallback to random suggestion
      if (!suggestion) {
        const randomIdx = Math.floor(Math.random() * contextualSuggestions.length);
        suggestion = {
          id: `suggestion-${Date.now()}`,
          ...contextualSuggestions[randomIdx],
        };
      }

      triggerSuggestion(suggestion);
    }
  }, [idleSeconds, isPanelExpanded, showProactiveBubble, route, selectedCityIndex]);

  // ==================== ACTIONS ====================

  const expandPanel = useCallback(() => {
    setIsPanelExpanded(true);
    setShowProactiveBubble(false);
    setHasUnreadMessages(false);
  }, []);

  const collapsePanel = useCallback(() => {
    setIsPanelExpanded(false);
  }, []);

  const togglePanel = useCallback(() => {
    setIsPanelExpanded((prev) => {
      if (!prev) {
        // Expanding - clear unread and bubble
        setShowProactiveBubble(false);
        setHasUnreadMessages(false);
      }
      return !prev;
    });
  }, []);

  const triggerSuggestion = useCallback((suggestion: ProactiveSuggestion) => {
    setCurrentSuggestion(suggestion);
    setShowProactiveBubble(true);
  }, []);

  const dismissSuggestion = useCallback(() => {
    setShowProactiveBubble(false);
    setCurrentSuggestion((prev) =>
      prev ? { ...prev, dismissedAt: new Date() } : null
    );
    suggestionCooldownRef.current = new Date();
    // Reset idle so we don't immediately suggest again
    setIdleSeconds(0);
  }, []);

  const acceptSuggestion = useCallback(() => {
    // When accepted, expand panel (the caller should send the message)
    expandPanel();
    suggestionCooldownRef.current = new Date();
    setIdleSeconds(0);
  }, [expandPanel]);

  const recordInteraction = useCallback(() => {
    setIdleSeconds(0);
    setLastInteractionAt(new Date());
  }, []);

  const markMessagesAsRead = useCallback(() => {
    setHasUnreadMessages(false);
  }, []);

  // ==================== CONTEXT VALUE ====================

  const value: CompanionContextValue = {
    // State
    isPanelExpanded,
    showProactiveBubble,
    currentSuggestion,
    idleSeconds,
    lastInteractionAt,
    hasUnreadMessages,

    // Actions
    expandPanel,
    collapsePanel,
    togglePanel,
    triggerSuggestion,
    dismissSuggestion,
    acceptSuggestion,
    recordInteraction,
    markMessagesAsRead,
  };

  return (
    <CompanionContext.Provider value={value}>
      {children}
    </CompanionContext.Provider>
  );
}

// ==================== HOOK ====================

export function useCompanion() {
  const context = useContext(CompanionContext);

  if (context === undefined) {
    throw new Error('useCompanion must be used within a CompanionProvider');
  }

  return context;
}
