/**
 * useDiscoveryCompanion
 *
 * Main hook for interacting with the Voyager Discovery Agent.
 * Connects to the SSE endpoint and manages conversation state.
 *
 * Features:
 * - Streaming responses with thinking/tool indicators
 * - Automatic route action application
 * - Proactive suggestions
 * - Greeting on mount
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useDiscoveryStore } from '../stores/discoveryStore';
import {
  useDiscoveryAgentSSE,
  type RouteActionEvent,
  type ToolStartEvent,
} from './api/useDiscoveryAgentSSE';

// ============================================================================
// Types
// ============================================================================

export interface CompanionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  /** Actions taken during this message */
  actions?: RouteActionEvent[];
  /** Streaming state */
  isStreaming?: boolean;
}

export interface ActiveTool {
  name: string;
  displayName: string;
  startedAt: Date;
}

export interface ThinkingState {
  isThinking: boolean;
  text?: string;
}

export interface ProactiveSuggestion {
  id: string;
  message: string;
  trigger: string;
  quickActions: Array<{ label: string; action: string; data?: unknown }>;
  priority: 'high' | 'medium' | 'low';
  dismissedAt?: Date;
}

interface UseDiscoveryCompanionOptions {
  /** Auto-fetch greeting on mount */
  autoGreet?: boolean;
  /** Enable proactive suggestions */
  enableProactive?: boolean;
}

interface UseDiscoveryCompanionReturn {
  // Messages
  messages: CompanionMessage[];
  sendMessage: (content: string) => Promise<void>;

  // Loading states
  isLoading: boolean;
  thinking: ThinkingState;
  activeTool: ActiveTool | null;

  // Proactive suggestions
  proactiveSuggestion: ProactiveSuggestion | null;
  dismissProactiveSuggestion: () => void;
  handleQuickAction: (action: string, data?: unknown) => void;

  // Errors
  error: string | null;
  clearError: () => void;
}

// ============================================================================
// Tool Display Names
// ============================================================================

const TOOL_DISPLAY_NAMES: Record<string, string> = {
  search_cities: 'Searching for cities',
  add_city_to_route: 'Adding to route',
  remove_city_from_route: 'Removing from route',
  replace_city: 'Swapping cities',
  reorder_cities: 'Optimizing order',
  adjust_nights: 'Adjusting nights',
  analyze_route: 'Analyzing route',
  get_city_highlights: 'Getting highlights',
  search_places_in_city: 'Finding places',
};

// ============================================================================
// Hook
// ============================================================================

export function useDiscoveryCompanion(
  options: UseDiscoveryCompanionOptions = {}
): UseDiscoveryCompanionReturn {
  const { autoGreet = true, enableProactive = true } = options;

  // Store access
  const route = useDiscoveryStore((state) => state.route);
  const sessionId = useDiscoveryStore((state) => state.sessionId);
  const addCity = useDiscoveryStore((state) => state.addCity);
  const removeCityByName = useDiscoveryStore((state) => state.removeCityByName);
  const replaceCity = useDiscoveryStore((state) => state.replaceCity);
  const reorderCities = useDiscoveryStore((state) => state.reorderCities);
  const updateCityNights = useDiscoveryStore((state) => state.updateCityNights);
  const getSelectedCities = useDiscoveryStore((state) => state.getSelectedCities);
  const getRecentActions = useDiscoveryStore((state) => state.getRecentActions);
  const getPreferenceSignals = useDiscoveryStore((state) => state.getPreferenceSignals);

  // SSE hook
  const { sendMessage: sendSSEMessage, cancel: cancelSSE } = useDiscoveryAgentSSE();

  // State
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [thinking, setThinking] = useState<ThinkingState>({ isThinking: false });
  const [activeTool, setActiveTool] = useState<ActiveTool | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proactiveSuggestion, setProactiveSuggestion] = useState<ProactiveSuggestion | null>(null);

  // Refs
  const hasGreetedRef = useRef(false);
  const streamingMessageRef = useRef<string>('');
  const actionsRef = useRef<RouteActionEvent[]>([]);

  // ============================================================================
  // Route Action Application
  // ============================================================================

  const applyRouteAction = useCallback((action: RouteActionEvent) => {
    console.log('🔧 Applying route action:', action);

    switch (action.type) {
      case 'add_city':
        if (action.city) {
          // Only add if we have valid coordinates (non-zero)
          const coords = action.city.coordinates;
          if (coords && (coords.lat !== 0 || coords.lng !== 0)) {
            addCity(
              {
                name: action.city.name,
                country: action.city.country || 'Unknown',
                coordinates: coords,
                isSelected: true,
                nights: action.city.nights || 1,
                description: action.city.description || `Added to your trip`,
              },
              action.index
            );
          } else {
            console.warn(`⚠️ [Discovery] Skipping city ${action.city.name} - invalid coordinates`);
          }
        }
        break;

      case 'remove_city':
        if (action.city?.name) {
          removeCityByName(action.city.name);
        }
        break;

      case 'replace_city':
        if (action.oldCity?.name && action.newCity?.name) {
          const coordinates = action.newCity.coordinates;
          // Only replace if we have valid coordinates
          if (coordinates && (coordinates.lat !== 0 || coordinates.lng !== 0)) {
            replaceCity(action.oldCity.name, {
              name: action.newCity.name,
              country: action.newCity.country || 'Unknown',
              coordinates: coordinates,
              isSelected: true,
              description: action.newCity.description || `Replaced ${action.oldCity.name}`,
            });
          } else {
            console.warn(`⚠️ [Discovery] Skipping city replacement - invalid coordinates for ${action.newCity.name}`);
          }
        }
        break;

      case 'reorder':
        if (action.waypoints) {
          const orderedIds = (action.waypoints as Array<{ id: string }>).map(wp => wp.id);
          reorderCities(orderedIds);
        }
        break;

      case 'adjust_nights':
        if (action.city?.name && action.city?.nights) {
          const cities = getSelectedCities();
          const city = cities.find(c =>
            c.name.toLowerCase().includes(action.city!.name.toLowerCase())
          );
          if (city) {
            updateCityNights(city.id, action.city.nights);
          }
        }
        break;
    }
  }, [addCity, removeCityByName, replaceCity, reorderCities, updateCityNights, getSelectedCities]);

  // ============================================================================
  // Build Route Data for API
  // ============================================================================

  const buildRouteData = useCallback(() => {
    if (!route) return null;

    const selectedCities = getSelectedCities();

    return {
      origin: route.origin.name,
      destination: route.destination.name,
      waypoints: selectedCities.map(city => ({
        city: city.name,
        name: city.name,
        nights: city.nights || city.suggestedNights || 1,
        coordinates: city.coordinates,
        lat: city.coordinates.lat,
        lng: city.coordinates.lng,
      })),
      totalNights: selectedCities.reduce((sum, c) => sum + (c.nights || c.suggestedNights || 1), 0),
    };
  }, [route, getSelectedCities]);

  // ============================================================================
  // Send Message
  // ============================================================================

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    setError(null);
    setIsLoading(true);
    streamingMessageRef.current = '';
    actionsRef.current = [];

    // Add user message
    const userMessage: CompanionMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Prepare conversation history
    const conversationHistory = messages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content,
    }));

    try {
      await sendSSEMessage(
        {
          message: content.trim(),
          sessionId,
          routeData: buildRouteData(),
          conversationHistory,
        },
        {
          onThinking: (data) => {
            setThinking({ isThinking: true, text: data.text });
          },

          onText: (data) => {
            streamingMessageRef.current += data.text;
            // Update streaming message in UI
            setMessages(prev => {
              const last = prev[prev.length - 1];
              if (last?.role === 'assistant' && last.isStreaming) {
                return [
                  ...prev.slice(0, -1),
                  { ...last, content: streamingMessageRef.current },
                ];
              }
              return [
                ...prev,
                {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: streamingMessageRef.current,
                  timestamp: new Date(),
                  isStreaming: true,
                },
              ];
            });
          },

          onToolStart: (data: ToolStartEvent) => {
            setThinking({ isThinking: false });
            setActiveTool({
              name: data.tool,
              displayName: TOOL_DISPLAY_NAMES[data.tool] || data.tool,
              startedAt: new Date(),
            });
          },

          onToolComplete: () => {
            setActiveTool(null);
          },

          onRouteAction: (action) => {
            actionsRef.current.push(action);
            applyRouteAction(action);
          },

          onMessage: (data) => {
            setThinking({ isThinking: false });
            setActiveTool(null);

            // Finalize assistant message
            setMessages(prev => {
              const withoutStreaming = prev.filter(m => !m.isStreaming);
              return [
                ...withoutStreaming,
                {
                  id: `assistant-${Date.now()}`,
                  role: 'assistant',
                  content: data.content,
                  timestamp: new Date(),
                  actions: actionsRef.current,
                  isStreaming: false,
                },
              ];
            });
          },

          onComplete: () => {
            setIsLoading(false);
            setThinking({ isThinking: false });
            setActiveTool(null);
          },

          onError: (data) => {
            setError(data.message);
            setIsLoading(false);
            setThinking({ isThinking: false });
            setActiveTool(null);
          },

          onHeartbeat: () => {
            // Keep-alive, no action needed
          },
        }
      );
    } catch (err) {
      setError((err as Error).message);
      setIsLoading(false);
    }
  }, [isLoading, sessionId, messages, buildRouteData, sendSSEMessage, applyRouteAction]);

  // ============================================================================
  // Greeting
  // ============================================================================

  useEffect(() => {
    if (!autoGreet || hasGreetedRef.current || !route) return;
    hasGreetedRef.current = true;

    const fetchGreeting = async () => {
      try {
        const response = await fetch('/api/discovery/greeting', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            routeData: buildRouteData(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.message) {
            setMessages([{
              id: `greeting-${Date.now()}`,
              role: 'assistant',
              content: data.message,
              timestamp: new Date(),
            }]);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch greeting:', err);
      }
    };

    fetchGreeting();
  }, [autoGreet, route, sessionId, buildRouteData]);

  // ============================================================================
  // Proactive Suggestions
  // ============================================================================

  const dismissProactiveSuggestion = useCallback(() => {
    setProactiveSuggestion(prev =>
      prev ? { ...prev, dismissedAt: new Date() } : null
    );
    setTimeout(() => setProactiveSuggestion(null), 300);
  }, []);

  const handleQuickAction = useCallback((action: string, data?: unknown) => {
    dismissProactiveSuggestion();

    // Convert quick action to a message
    switch (action) {
      case 'search_similar':
        sendMessage('Find me more cities like this one');
        break;
      case 'get_highlights':
        sendMessage('What are the highlights here?');
        break;
      case 'search_alternatives':
        sendMessage('Suggest some alternative cities');
        break;
      case 'analyze_route':
        sendMessage('Is my route balanced?');
        break;
      case 'auto_rebalance':
        sendMessage('Please rebalance my route');
        break;
      case 'generate_itinerary':
        // Trigger itinerary generation (handled by parent)
        break;
      case 'dismiss':
        // Already dismissed
        break;
      default:
        if (typeof data === 'string') {
          sendMessage(data);
        }
    }
  }, [dismissProactiveSuggestion, sendMessage]);

  // Watch for proactive triggers
  useEffect(() => {
    if (!enableProactive || !route) return;

    const checkTriggers = async () => {
      const recentActions = getRecentActions(new Date(Date.now() - 60000)); // Last minute
      const preferenceSignals = getPreferenceSignals();

      // City added trigger
      const addedCity = recentActions.find(a => a.type === 'city_added');
      if (addedCity && !proactiveSuggestion) {
        try {
          const response = await fetch('/api/discovery/proactive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trigger: 'city_added',
              triggerData: addedCity.data,
              sessionId,
              routeData: buildRouteData(),
              preferences: preferenceSignals,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.shouldShow && data.message) {
              setProactiveSuggestion({
                id: `proactive-${Date.now()}`,
                message: data.message,
                trigger: 'city_added',
                quickActions: data.quickActions || [],
                priority: data.priority || 'low',
              });
            }
          }
        } catch (err) {
          console.warn('Failed to fetch proactive suggestion:', err);
        }
      }
    };

    const interval = setInterval(checkTriggers, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [enableProactive, route, sessionId, buildRouteData, getRecentActions, getPreferenceSignals, proactiveSuggestion]);

  // ============================================================================
  // Cleanup
  // ============================================================================

  useEffect(() => {
    return () => {
      cancelSSE();
    };
  }, [cancelSSE]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    messages,
    sendMessage,
    isLoading,
    thinking,
    activeTool,
    proactiveSuggestion,
    dismissProactiveSuggestion,
    handleQuickAction,
    error,
    clearError: () => setError(null),
  };
}
