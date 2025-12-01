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

// Entity highlight - when companion mentions something, highlight it in UI
export interface EntityHighlight {
  id: string;
  type: 'city' | 'activity' | 'hotel' | 'restaurant' | 'day';
  name: string;
  timestamp: Date;
  expiresAt: Date;  // Highlights fade after a few seconds
}

export interface CompanionState {
  isPanelExpanded: boolean;
  showProactiveBubble: boolean;
  currentSuggestion: ProactiveSuggestion | null;
  idleSeconds: number;
  lastInteractionAt: Date;
  hasUnreadMessages: boolean;
  // UI Context - what the user is currently looking at
  selectedCityName: string | null;
  selectedDayNumber: number | null;
  lastUserAction: { type: string; data?: any; timestamp: Date } | null;
  // Entity highlighting - companion mentions → UI highlights
  highlightedEntities: EntityHighlight[];
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

  // UI Context updates - called when user interacts with the main UI
  onCitySelect: (cityName: string | null) => void;
  onDaySelect: (dayNumber: number | null) => void;
  onActivityHover: (activity: { name: string; city?: string } | null) => void;
  onMapInteraction: (type: 'zoom' | 'pan' | 'marker_click', data?: any) => void;

  // Entity highlighting - companion → UI
  highlightEntity: (type: EntityHighlight['type'], name: string, duration?: number) => void;
  clearHighlights: () => void;
  isEntityHighlighted: (type: EntityHighlight['type'], name: string) => boolean;

  // Map animation - companion → UI
  flyToCity: (cityName: string) => void;
}

// ==================== CONTEXT ====================

const CompanionContext = createContext<CompanionContextValue | undefined>(undefined);

// ==================== PROACTIVE SUGGESTIONS ====================

// Time-based suggestions
const timeBasedSuggestions: Omit<ProactiveSuggestion, 'id'>[] = [
  {
    message: "Good morning! Ready to plan today's adventures?",
    prompt: "What should I do today on my trip?",
    priority: 'low',
    triggerType: 'time',
  },
  {
    message: "Evening plans? I can suggest great dinner spots and nightlife!",
    prompt: "Recommend restaurants and evening activities",
    priority: 'low',
    triggerType: 'time',
  },
];

// Context-based suggestions (triggered by specific conditions)
const contextualSuggestions: Omit<ProactiveSuggestion, 'id'>[] = [
  {
    message: "I notice your itinerary is looking empty. Want me to suggest some must-see activities?",
    prompt: "Suggest the top 5 must-see activities in this city",
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
    triggerType: 'weather',
  },
  {
    message: "This city has some hidden gems most tourists miss. Want me to share a few?",
    prompt: "What are the hidden gems and off-the-beaten-path attractions here?",
    priority: 'low',
    triggerType: 'context',
  },
  {
    message: "I can help optimize your daily schedule for less travel time. Interested?",
    prompt: "Help me optimize my daily itinerary to minimize travel time between activities",
    priority: 'low',
    triggerType: 'context',
  },
  {
    message: "Pro tip: booking ahead can save you money. Want me to check prices?",
    prompt: "What activities or attractions should I book in advance?",
    priority: 'low',
    triggerType: 'context',
  },
];

// Trip stage based suggestions
const getTripStageSuggestion = (totalCities: number, citiesWithActivities: number): ProactiveSuggestion | null => {
  const completionRatio = citiesWithActivities / totalCities;

  if (completionRatio === 0) {
    return {
      id: `stage-empty-${Date.now()}`,
      message: "Your trip is a blank canvas! Let's start with your first destination - what are you most excited about?",
      prompt: "Help me plan activities for my first destination",
      priority: 'high',
      triggerType: 'context',
    };
  }

  if (completionRatio < 0.5) {
    return {
      id: `stage-half-${Date.now()}`,
      message: `You've planned ${citiesWithActivities} of ${totalCities} cities. Want me to suggest activities for the rest?`,
      prompt: "Suggest activities for my remaining empty cities",
      priority: 'low',
      triggerType: 'context',
    };
  }

  if (completionRatio >= 1) {
    return {
      id: `stage-complete-${Date.now()}`,
      message: "Your trip looks well-planned! Want me to review it for any improvements or suggest alternatives?",
      prompt: "Review my complete itinerary and suggest improvements",
      priority: 'low',
      triggerType: 'context',
    };
  }

  return null;
};

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

  // UI Context state - what user is currently looking at
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [lastUserAction, setLastUserAction] = useState<{ type: string; data?: any; timestamp: Date } | null>(null);

  // Entity highlighting state
  const [highlightedEntities, setHighlightedEntities] = useState<EntityHighlight[]>([]);
  const highlightTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Get route context for smart suggestions
  const { route, selectedCityIndex, focusCityByName: storeFocusCityByName } = useSpotlightStoreV2();

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

  // Helper to get smart contextual suggestion
  const getContextualSuggestion = useCallback((): ProactiveSuggestion | null => {
    if (!route?.cities) return null;

    const totalCities = route.cities.length;
    const citiesWithActivities = route.cities.filter(
      city => city.activities && city.activities.length > 0
    ).length;

    // First, check trip stage for appropriate suggestion
    const stageSuggestion = getTripStageSuggestion(totalCities, citiesWithActivities);
    if (stageSuggestion && Math.random() > 0.5) {
      return stageSuggestion;
    }

    // Check selected city specifically
    const selectedCity = selectedCityIndex !== null ? route.cities[selectedCityIndex] : null;
    if (selectedCity) {
      const cityName = typeof selectedCity.city === 'object' ? selectedCity.city.name : selectedCity.city;

      if (!selectedCity.activities || selectedCity.activities.length === 0) {
        return {
          id: `city-empty-${Date.now()}`,
          message: `Your time in ${cityName} is looking empty. Want me to suggest some activities?`,
          prompt: `Suggest activities for ${cityName}`,
          priority: 'low',
          triggerType: 'context',
        };
      }

      // City has some activities - suggest complementary things
      if (selectedCity.activities.length < 3) {
        return {
          id: `city-few-${Date.now()}`,
          message: `${cityName} has ${selectedCity.activities.length} ${selectedCity.activities.length === 1 ? 'activity' : 'activities'}. Want more recommendations?`,
          prompt: `Suggest more activities for ${cityName} to complement my existing plans`,
          priority: 'low',
          triggerType: 'context',
        };
      }
    }

    // Check for any empty cities
    const cityWithNoActivities = route.cities.find(
      city => !city.activities || city.activities.length === 0
    );
    if (cityWithNoActivities) {
      const cityName = typeof cityWithNoActivities.city === 'object'
        ? cityWithNoActivities.city.name
        : cityWithNoActivities.city;
      return {
        id: `empty-city-${Date.now()}`,
        message: `${cityName} doesn't have any activities yet. Want me to suggest some?`,
        prompt: `Suggest activities for ${cityName}`,
        priority: 'low',
        triggerType: 'context',
      };
    }

    // Check time of day for time-based suggestions
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 10) {
      return {
        id: `time-morning-${Date.now()}`,
        ...timeBasedSuggestions[0], // Morning suggestion
      };
    }
    if (hour >= 17 && hour < 21) {
      return {
        id: `time-evening-${Date.now()}`,
        ...timeBasedSuggestions[1], // Evening suggestion
      };
    }

    // Random contextual suggestion as fallback
    const randomIdx = Math.floor(Math.random() * contextualSuggestions.length);
    return {
      id: `random-${Date.now()}`,
      ...contextualSuggestions[randomIdx],
    };
  }, [route, selectedCityIndex]);

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
      const suggestion = getContextualSuggestion();
      if (suggestion) {
        triggerSuggestion(suggestion);
      }
    }
  }, [idleSeconds, isPanelExpanded, showProactiveBubble, getContextualSuggestion]);

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

  // ==================== UI CONTEXT UPDATE HANDLERS ====================

  const onCitySelect = useCallback((cityName: string | null) => {
    setSelectedCityName(cityName);
    setLastUserAction({
      type: 'city_select',
      data: { cityName },
      timestamp: new Date()
    });
    // Reset idle since user is interacting
    setIdleSeconds(0);

    // Trigger contextual suggestion if city is selected and has no activities
    if (cityName && route?.cities) {
      const city = route.cities.find(c => {
        const name = typeof c.city === 'object' ? c.city.name : c.city;
        return name === cityName;
      });
      if (city && (!city.activities || city.activities.length === 0) && !isPanelExpanded) {
        // After a short delay, suggest adding activities
        setTimeout(() => {
          if (!suggestionCooldownRef.current ||
              Date.now() - suggestionCooldownRef.current.getTime() > 60000) {
            triggerSuggestion({
              id: `city-empty-${Date.now()}`,
              message: `${cityName} is looking a bit empty. Want me to find some amazing things to do there?`,
              prompt: `Suggest activities for ${cityName}`,
              priority: 'low',
              triggerType: 'context',
            });
          }
        }, 2000);
      }
    }
  }, [route, isPanelExpanded]);

  const onDaySelect = useCallback((dayNumber: number | null) => {
    setSelectedDayNumber(dayNumber);
    setLastUserAction({
      type: 'day_select',
      data: { dayNumber },
      timestamp: new Date()
    });
    setIdleSeconds(0);
  }, []);

  const onActivityHover = useCallback((activity: { name: string; city?: string } | null) => {
    if (activity) {
      setLastUserAction({
        type: 'activity_hover',
        data: activity,
        timestamp: new Date()
      });
    }
  }, []);

  const onMapInteraction = useCallback((type: 'zoom' | 'pan' | 'marker_click', data?: any) => {
    setLastUserAction({
      type: `map_${type}`,
      data,
      timestamp: new Date()
    });
    setIdleSeconds(0);
  }, []);

  // ==================== ENTITY HIGHLIGHTING ====================

  const highlightEntity = useCallback((
    type: EntityHighlight['type'],
    name: string,
    duration: number = 4000  // Default 4 seconds
  ) => {
    const id = `${type}-${name}-${Date.now()}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + duration);

    const highlight: EntityHighlight = {
      id,
      type,
      name,
      timestamp: now,
      expiresAt,
    };

    setHighlightedEntities(prev => {
      // Remove any existing highlight for same entity
      const filtered = prev.filter(h => !(h.type === type && h.name.toLowerCase() === name.toLowerCase()));
      return [...filtered, highlight];
    });

    // Clear any existing timeout for this entity
    const existingTimeout = highlightTimeoutsRef.current.get(`${type}-${name}`);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set timeout to remove highlight
    const timeout = setTimeout(() => {
      setHighlightedEntities(prev =>
        prev.filter(h => h.id !== id)
      );
      highlightTimeoutsRef.current.delete(`${type}-${name}`);
    }, duration);

    highlightTimeoutsRef.current.set(`${type}-${name}`, timeout);
  }, []);

  const clearHighlights = useCallback(() => {
    // Clear all timeouts
    highlightTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    highlightTimeoutsRef.current.clear();
    setHighlightedEntities([]);
  }, []);

  const isEntityHighlighted = useCallback((type: EntityHighlight['type'], name: string): boolean => {
    const now = new Date();
    return highlightedEntities.some(
      h => h.type === type &&
           h.name.toLowerCase() === name.toLowerCase() &&
           h.expiresAt > now
    );
  }, [highlightedEntities]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      highlightTimeoutsRef.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);

  // ==================== MAP ANIMATION ====================

  const flyToCity = useCallback((cityName: string) => {
    // First highlight the city
    highlightEntity('city', cityName, 5000); // 5 second highlight

    // Then trigger map animation via store
    storeFocusCityByName(cityName);
  }, [highlightEntity, storeFocusCityByName]);

  // ==================== CONTEXT VALUE ====================

  const value: CompanionContextValue = {
    // State
    isPanelExpanded,
    showProactiveBubble,
    currentSuggestion,
    idleSeconds,
    lastInteractionAt,
    hasUnreadMessages,
    selectedCityName,
    selectedDayNumber,
    lastUserAction,
    highlightedEntities,

    // Actions
    expandPanel,
    collapsePanel,
    togglePanel,
    triggerSuggestion,
    dismissSuggestion,
    acceptSuggestion,
    recordInteraction,
    markMessagesAsRead,

    // UI Context updates
    onCitySelect,
    onDaySelect,
    onActivityHover,
    onMapInteraction,

    // Entity highlighting
    highlightEntity,
    clearHighlights,
    isEntityHighlighted,

    // Map animation
    flyToCity,
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
