/**
 * AgentProvider - Global Context for AI Agent
 *
 * Provides agent state and functions throughout the app
 * Handles streaming messages, conversation history, and agent interactions
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
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

export interface ActiveTool {
  name: string;
  status: 'running' | 'complete' | 'error';
  input?: any;
}

export interface RouteContext {
  routeId: string | null;
  origin: string | null;
  destination: string | null;
  cities: string[];
  duration: number | null;
  startDate: string | null;
}

// Personalization context for AI-enhanced responses
export interface PersonalizationContext {
  tripStory?: string;
  diningStyle?: string;
  dietary?: string[];
  accessibility?: string[];
  occasion?: string;
  avoidCrowds?: boolean;
  preferOutdoor?: boolean;
}

export interface PageContext {
  path: string;
  name: 'landing' | 'spotlight' | 'itinerary' | 'unknown';
  route: RouteContext | null;
  personalization?: PersonalizationContext | null;
}

// ==================== ARTIFACT SYSTEM ====================

/**
 * Artifact types - structured data that can be richly rendered
 * Each type corresponds to a specific tool's output format
 */
export type ArtifactType =
  | 'activity_grid'      // searchActivities results
  | 'hotel_list'         // searchHotels results
  | 'weather_display'    // checkWeather results
  | 'directions_map'     // getDirections results
  | 'city_info'          // getCityInfo results
  | 'restaurant_list'    // searchRestaurants results (future)
  | 'route_comparison'   // What-if route comparison (companion)
  | 'day_comparison'     // Day schedule optimization (companion)
  | 'none';              // No artifact, just chat

/**
 * Artifact - A structured data object that can be rendered as an interactive card/grid
 */
export interface Artifact {
  id: string;                // Unique ID for tracking (UUID)
  type: ArtifactType;         // What kind of artifact this is
  title: string;              // Display title ("Amsterdam Museums", "Hotels in Paris")
  subtitle?: string;          // Optional subtitle ("5 results found")
  data: any;                  // The actual tool result data (typed based on tool)
  metadata?: {
    city?: string;            // City name if relevant
    category?: string;        // Category (museums, parks, etc)
    toolName?: string;        // Which tool generated this
    timestamp?: Date;         // When it was created
    [key: string]: any;       // Allow additional metadata
  };
}

// Discovery context type for planning phase
export interface DiscoveryContext {
  sessionId: string;
  phase: 'loading' | 'exploring' | 'confirming' | 'generating';
  trip: {
    origin: { name: string; country: string };
    destination: { name: string; country: string };
    dates: { totalNights: number };
    travellerType: string | null;
    totalDistanceKm: number | null;
  };
  cities: {
    selected: Array<{ id: string; name: string; country: string; nights: number }>;
    available: Array<{ id: string; name: string; country: string; placeCount: number }>;
  };
  favourites: Array<{ name: string; type: string; cityName: string }>;
  behaviour: {
    favouritePlaceTypes: string[];
    prefersHiddenGems: boolean;
  };
}

export interface AgentContextValue {
  // State
  isOpen: boolean;
  messages: AgentMessage[];
  isLoading: boolean;
  sessionId: string;
  pageContext: PageContext;
  activeTools: ActiveTool[];
  itineraryId: string | null;           // Current itinerary ID (from URL params)

  // Artifact State
  currentArtifact: Artifact | null;     // Currently displayed artifact
  artifactHistory: Artifact[];          // All artifacts from this session
  isMinimized: boolean;                 // Whether modal is minimized to button

  // Actions
  openAgent: () => void;
  closeAgent: () => void;
  toggleAgent: () => void;
  sendMessage: (message: string, discoveryContext?: DiscoveryContext) => Promise<void>;
  clearHistory: () => void;

  // Artifact Actions
  setCurrentArtifact: (artifact: Artifact | null) => void;
  clearArtifacts: () => void;
  toggleMinimize: () => void;

  // Itinerary Actions
  addActivityToDay: (activity: any, dayNumber: number, block?: 'morning' | 'afternoon' | 'evening') => Promise<{ success: boolean; error?: string }>;
}

// ==================== CONTEXT ====================

const AgentContext = createContext<AgentContextValue | undefined>(undefined);

// ==================== PROVIDER ====================

interface AgentProviderProps {
  children: React.ReactNode;
}

// ==================== STORAGE HELPERS ====================

const CHAT_STORAGE_KEY = 'agent_chat_history';
const SESSION_STORAGE_KEY = 'agent_session_id';

/**
 * Load messages from sessionStorage
 */
function loadStoredMessages(): AgentMessage[] {
  try {
    const stored = sessionStorage.getItem(CHAT_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    return parsed.map((msg: any) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
      isStreaming: false, // Never restore streaming state
    }));
  } catch (error) {
    console.warn('⚠️ [AGENT] Failed to load stored messages:', error);
    return [];
  }
}

/**
 * Save messages to sessionStorage
 */
function saveMessages(messages: AgentMessage[]): void {
  try {
    // Only save non-streaming messages
    const toSave = messages.filter(m => !m.isStreaming);
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.warn('⚠️ [AGENT] Failed to save messages:', error);
  }
}

/**
 * Load or create session ID (persists across refresh)
 */
function getOrCreateSessionId(): string {
  try {
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      console.log('🔄 [AGENT] Restored session ID:', stored.slice(0, 8) + '...');
      return stored;
    }
    const newId = uuidv4();
    sessionStorage.setItem(SESSION_STORAGE_KEY, newId);
    console.log('🆕 [AGENT] Created new session ID:', newId.slice(0, 8) + '...');
    return newId;
  } catch {
    return uuidv4();
  }
}

export function AgentProvider({ children }: AgentProviderProps) {
  // Hooks
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // State - initialize from storage for persistence
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AgentMessage[]>(() => loadStoredMessages());
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => getOrCreateSessionId()); // Persistent session ID
  const [activeTools, setActiveTools] = useState<ActiveTool[]>([]);

  // Persist messages to sessionStorage whenever they change
  useEffect(() => {
    // Only save completed (non-streaming) messages
    const completedMessages = messages.filter(m => !m.isStreaming);
    if (completedMessages.length > 0) {
      saveMessages(completedMessages);
      console.log('💾 [AGENT] Saved', completedMessages.length, 'messages to storage');
    }
  }, [messages]);

  // Artifact State
  const [currentArtifact, setCurrentArtifact] = useState<Artifact | null>(null);
  const [artifactHistory, setArtifactHistory] = useState<Artifact[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);

  // Itinerary Context - get from URL params or fetch from route
  const [itineraryId, setItineraryId] = useState<string | null>(null);

  // Refs
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch or determine itinerary ID
  useEffect(() => {
    const fetchItineraryId = async () => {
      // First priority: itinerary param in URL
      const itineraryParam = searchParams.get('itinerary');
      if (itineraryParam) {
        console.log('📋 Using itinerary from URL:', itineraryParam);
        setItineraryId(itineraryParam);
        return;
      }

      // Second priority: routeId param - fetch associated itinerary
      const routeId = searchParams.get('routeId');
      if (routeId) {
        console.log('🔍 RouteId found, fetching associated itinerary:', routeId);
        try {
          // Fetch itinerary by route ID
          const response = await fetch(`/api/itinerary/by-route/${routeId}`);
          if (response.ok) {
            const data = await response.json();
            console.log('✅ Found itinerary for route:', data.itinerary_id);
            setItineraryId(data.itinerary_id);
          } else if (response.status === 404) {
            console.log('⚠️ No itinerary found for this route yet');
            setItineraryId(null);
          } else {
            console.warn('⚠️ Could not fetch itinerary:', response.status);
            setItineraryId(null);
          }
        } catch (error) {
          console.error('❌ Error fetching itinerary for route:', error);
          setItineraryId(null);
        }
      } else {
        // No itinerary or routeId in URL
        setItineraryId(null);
      }
    };

    fetchItineraryId();
  }, [searchParams]);

  // Detect page context
  const getPageContext = useCallback((): PageContext => {
    const path = location.pathname;

    // Detect page name
    let pageName: PageContext['name'] = 'unknown';
    if (path.includes('/generate')) {
      pageName = 'itinerary';
    } else if (searchParams.get('routeId') || searchParams.get('itinerary')) {
      pageName = 'spotlight';
    } else if (path === '/' || path === '') {
      pageName = 'landing';
    }

    // Extract route context if available
    let routeContext: RouteContext | null = null;

    // Try to get route from URL params
    const routeId = searchParams.get('routeId');

    // Try to get route from localStorage (spotlight data)
    let personalizationContext: any = null;
    try {
      const spotlightDataStr = localStorage.getItem('spotlightData');
      if (spotlightDataStr) {
        const spotlightData = JSON.parse(spotlightDataStr);

        // Helper to extract string from location (handles both string and CityData object)
        const getLocationString = (location: any): string | null => {
          if (!location) return null;
          if (typeof location === 'string') return location;
          return location.displayName || location.name || null;
        };

        // Extract cities from spotlightData.cities array
        // Each city item has a `city` field that can be string or CityObject
        const extractedCities = spotlightData.cities?.map((c: any) => {
          const cityField = c.city;
          if (!cityField) return null;
          if (typeof cityField === 'string') return cityField;
          return cityField.name || cityField.displayName || null;
        }).filter(Boolean) || [];

        routeContext = {
          routeId: routeId,
          origin: getLocationString(spotlightData.origin),
          destination: getLocationString(spotlightData.destination),
          cities: extractedCities,
          duration: spotlightData.duration || spotlightData.cities?.length || null,
          startDate: spotlightData.startDate || null
        };

        // Extract personalization context if present
        if (spotlightData.personalization) {
          personalizationContext = spotlightData.personalization;
          console.log('📝 Loaded personalization context:', personalizationContext);
        }
      }
    } catch (e) {
      console.warn('Failed to parse spotlight data:', e);
    }

    return {
      path,
      name: pageName,
      route: routeContext,
      personalization: personalizationContext
    };
  }, [location, searchParams]);

  const pageContext = getPageContext();

  // Actions
  const openAgent = useCallback(() => setIsOpen(true), []);
  const closeAgent = useCallback(() => setIsOpen(false), []);
  const toggleAgent = useCallback(() => setIsOpen(prev => !prev), []);

  const clearHistory = useCallback(() => {
    setMessages([]);
    // Also clear from storage
    try {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      console.log('🗑️ [AGENT] Cleared chat history and session from storage');
    } catch (error) {
      console.warn('⚠️ [AGENT] Failed to clear storage:', error);
    }
  }, []);

  // Artifact Actions
  const clearArtifacts = useCallback(() => {
    setCurrentArtifact(null);
    setArtifactHistory([]);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized(prev => !prev);
  }, []);

  /**
   * Add activity to a specific day in the itinerary
   */
  const addActivityToDay = useCallback(async (
    activity: any,
    dayNumber: number,
    block: 'morning' | 'afternoon' | 'evening' = 'afternoon'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!itineraryId) {
      console.error('❌ Cannot add activity: No itinerary ID');
      return { success: false, error: 'No itinerary available' };
    }

    try {
      console.log(`➕ Adding "${activity.name}" to day ${dayNumber} (${block}) of itinerary ${itineraryId}`);

      const response = await fetch(`/api/itinerary/${itineraryId}/days/${dayNumber}/activities`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          activity,
          block,
          userId: localStorage.getItem('rdtrip_user_id') || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('❌ Failed to add activity:', data.error);
        return { success: false, error: data.error || 'Failed to add activity' };
      }

      console.log('✅ Activity added successfully');
      return { success: true };

    } catch (error) {
      console.error('❌ Error adding activity:', error);
      return { success: false, error: 'Network error' };
    }
  }, [itineraryId]);

  /**
   * Detect if tool results contain artifact-worthy data
   * Returns an Artifact object if detected, null otherwise
   */
  const detectArtifact = useCallback((toolResults: any[]): Artifact | null => {
    console.log('🔍 [ARTIFACT] Detecting artifacts from', toolResults.length, 'tool results');

    for (const result of toolResults) {
      try {
        // Parse content if it's a string
        const content = typeof result.content === 'string'
          ? JSON.parse(result.content)
          : result.content;

        console.log('🔍 [ARTIFACT] Checking tool:', result.name, 'success:', content.success);

        // ========== searchActivities ==========
        if (result.name === 'searchActivities' && content.success && content.activities && content.activities.length > 0) {
          const artifact: Artifact = {
            id: uuidv4(),
            type: 'activity_grid',
            title: `${content.category || 'Activities'} in ${content.city}`,
            subtitle: `${content.activities.length} result${content.activities.length !== 1 ? 's' : ''} found`,
            data: content.activities,
            metadata: {
              city: content.city,
              category: content.category,
              toolName: 'searchActivities',
              timestamp: new Date()
            }
          };
          console.log('✨ [ARTIFACT] Created activity_grid:', artifact.title);
          return artifact;
        }

        // ========== searchHotels ==========
        if (result.name === 'searchHotels' && content.success && content.hotels && content.hotels.length > 0) {
          const artifact: Artifact = {
            id: uuidv4(),
            type: 'hotel_list',
            title: `Hotels in ${content.city}`,
            subtitle: `${content.hotels.length} option${content.hotels.length !== 1 ? 's' : ''} available`,
            data: content.hotels,
            metadata: {
              city: content.city,
              toolName: 'searchHotels',
              timestamp: new Date()
            }
          };
          console.log('✨ [ARTIFACT] Created hotel_list:', artifact.title);
          return artifact;
        }

        // ========== checkWeather ==========
        if (result.name === 'checkWeather' && content.success && content.current) {
          const artifact: Artifact = {
            id: uuidv4(),
            type: 'weather_display',
            title: `Weather in ${content.city}`,
            subtitle: content.current.condition || 'Current conditions',
            data: content,
            metadata: {
              city: content.city,
              toolName: 'checkWeather',
              timestamp: new Date()
            }
          };
          console.log('✨ [ARTIFACT] Created weather_display:', artifact.title);
          return artifact;
        }

        // ========== getDirections ==========
        if (result.name === 'getDirections' && content.success && content.distance && content.duration) {
          const artifact: Artifact = {
            id: uuidv4(),
            type: 'directions_map',
            title: `${content.from} → ${content.to}`,
            subtitle: `${content.distance} · ${content.duration}`,
            data: content,
            metadata: {
              toolName: 'getDirections',
              timestamp: new Date()
            }
          };
          console.log('✨ [ARTIFACT] Created directions_map:', artifact.title);
          return artifact;
        }

        // ========== getCityInfo ==========
        if (result.name === 'getCityInfo' && content.success && content.name) {
          const artifact: Artifact = {
            id: uuidv4(),
            type: 'city_info',
            title: content.name,
            subtitle: content.country || 'City Information',
            data: content,
            metadata: {
              city: content.name,
              toolName: 'getCityInfo',
              timestamp: new Date()
            }
          };
          console.log('✨ [ARTIFACT] Created city_info:', artifact.title);
          return artifact;
        }

      } catch (error) {
        console.warn('⚠️ [ARTIFACT] Error parsing tool result:', error);
        continue;
      }
    }

    console.log('❌ [ARTIFACT] No artifacts detected');
    return null;
  }, []);

  /**
   * Detect which day number user is currently viewing
   * Uses URL params or scroll position heuristics
   */
  const getCurrentDayNumber = useCallback((): number | null => {
    // Check URL for day parameter
    const dayParam = searchParams.get('day');
    if (dayParam) {
      const dayNum = parseInt(dayParam);
      return !isNaN(dayNum) ? dayNum : null;
    }

    // TODO: Could detect from scroll position in future
    // For now, return null (agent will work without it)
    return null;
  }, [searchParams]);

  /**
   * Send message to agent with streaming response
   * @param messageText - The user's message
   * @param discoveryContext - Optional discovery context for planning phase
   */
  const sendMessage = useCallback(async (messageText: string, discoveryContext?: DiscoveryContext) => {
    if (!messageText.trim()) return;

    console.log('🚀 [AGENT] sendMessage called with:', messageText.trim());
    if (discoveryContext) {
      console.log('📍 [AGENT] Discovery context provided:', {
        phase: discoveryContext.phase,
        selectedCities: discoveryContext.cities.selected.length,
        availableCities: discoveryContext.cities.available.length,
      });
    }

    // Add user message immediately
    const userMessage: AgentMessage = {
      id: uuidv4(),
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setActiveTools([]); // Clear active tools from previous request

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
      // Get auth token from localStorage (using same key as landing-react AuthContext)
      const token = localStorage.getItem('rdtrip_auth_token');

      // Create abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Call agent API with SSE streaming
      // In production, use relative URL (same host). In dev, use env var or localhost
      const apiUrl = import.meta.env.VITE_API_URL ||
                     (import.meta.env.MODE === 'production' ? '' : 'http://localhost:5000');

      // Build rich page context
      const enrichedPageContext = {
        name: pageContext.name,
        path: pageContext.path,
        // Add current day if viewing itinerary
        currentDay: pageContext.name === 'itinerary' ? getCurrentDayNumber() : null,
        // Add route info if available
        route: pageContext.route || null,
        // Add personalization context if available
        personalization: pageContext.personalization || null
      };

      const payload = {
        message: messageText.trim(),
        sessionId: sessionId,
        pageContext: enrichedPageContext,  // ✅ SEND RICH CONTEXT (now includes personalization)
        routeId: pageContext.route?.routeId || null,
        itineraryId: itineraryId || null,  // ✅ ADD ITINERARY ID
        // Also send personalization at top level for easier backend access
        personalization: pageContext.personalization || null,
        // ✅ Discovery context for planning phase - includes selected cities, suggested cities, etc.
        discoveryContext: discoveryContext || null,
      };

      console.log('📤 [AGENT] Sending fetch to:', `${apiUrl}/api/agent/query`);
      console.log('📦 [AGENT] Payload:', payload);
      console.log('🎫 [AGENT] Has token:', !!token);

      const response = await fetch(`${apiUrl}/api/agent/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
        signal: abortController.signal
      });

      console.log('📥 [AGENT] Fetch response received. Status:', response.status, 'OK:', response.ok);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      console.log('🌊 [AGENT] Starting SSE stream reading...');

      let buffer = '';
      let eventCount = 0;
      let chunkCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        chunkCount++;

        console.log(`🔄 [AGENT] Chunk #${chunkCount}: done=${done}, bytes=${value?.length || 0}`);

        if (done) {
          console.log('✅ [AGENT] SSE stream ended. Total chunks:', chunkCount, 'Total events:', eventCount);
          console.log('📦 [AGENT] Final buffer state:', buffer.length > 0 ? `${buffer.length} bytes remaining` : 'empty');
          break;
        }

        // Decode chunk
        const decodedChunk = decoder.decode(value, { stream: true });
        console.log(`📝 [AGENT] Decoded chunk #${chunkCount} (${decodedChunk.length} chars):`, decodedChunk.substring(0, 200));
        buffer += decodedChunk;

        // Split by newlines to get individual SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        console.log(`📋 [AGENT] Found ${lines.length} lines in chunk #${chunkCount}, buffer has ${buffer.length} chars remaining`);

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6); // Remove 'data: ' prefix

            try {
              const event = JSON.parse(data);
              eventCount++;

              console.log(`📨 [AGENT] Event #${eventCount}:`, event.type, event);

              if (event.type === 'connected') {
                console.log('🤖 [AGENT] Connected to agent stream');
              } else if (event.type === 'text') {
                // Stream text token
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: msg.content + event.content }
                      : msg
                  )
                );
              } else if (event.type === 'tool_start') {
                // Tool started executing
                console.log('🔧 Tool started:', event.tool.name);
                setActiveTools(prev => [...prev, {
                  name: event.tool.name,
                  status: 'running',
                  input: event.tool.input
                }]);
              } else if (event.type === 'tool_complete') {
                // Tool completed successfully
                console.log('✅ Tool completed:', event.tool.name);
                setActiveTools(prev =>
                  prev.map(tool =>
                    tool.name === event.tool.name && tool.status === 'running'
                      ? { ...tool, status: 'complete' as const }
                      : tool
                  )
                );
                // Remove completed tool after 1 second
                setTimeout(() => {
                  setActiveTools(prev => prev.filter(t => !(t.name === event.tool.name && t.status === 'complete')));
                }, 1000);
              } else if (event.type === 'tool_error') {
                // Tool failed
                console.error('❌ Tool error:', event.tool.name, event.tool.error);
                setActiveTools(prev =>
                  prev.map(tool =>
                    tool.name === event.tool.name && tool.status === 'running'
                      ? { ...tool, status: 'error' as const }
                      : tool
                  )
                );
                // Remove errored tool after 2 seconds
                setTimeout(() => {
                  setActiveTools(prev => prev.filter(t => !(t.name === event.tool.name && t.status === 'error')));
                }, 2000);
              } else if (event.type === 'tool_execution') {
                // Tool execution results - store them for rich rendering
                console.log('🔧 Tool execution:', event.tools);

                // 📋 Dispatch event for Ideas Board to capture recommendations
                window.dispatchEvent(new CustomEvent('ideas_board_tool_result', {
                  detail: { tools: event.tools }
                }));

                // Check if any tool modifies the itinerary
                const itineraryModifyingTools = ['replaceActivity', 'addActivity', 'moveActivity', 'reorderActivities', 'modifyItinerary'];

                for (const tool of event.tools) {
                  if (itineraryModifyingTools.includes(tool.name)) {
                    try {
                      const content = typeof tool.content === 'string' ? JSON.parse(tool.content) : tool.content;

                      if (content.success) {
                        console.log('🔄 [AGENT] Itinerary was modified, dispatching refresh event');
                        window.dispatchEvent(new CustomEvent('itinerary_updated'));

                        // 🎉 Dispatch visual confirmation for successful actions
                        const confirmationData: any = {
                          type: tool.name === 'replaceActivity' ? 'replace' :
                                tool.name === 'moveActivity' ? 'move' : 'add',
                          activityName: content.message?.match(/Added (.+?) to/)?.[1] ||
                                       content.item?.name ||
                                       content.newActivity?.name ||
                                       'Activity',
                          dayNumber: content.dayNumber || 1,
                          timeSlot: content.item?.timeSlot || content.timeSlot || undefined,
                          city: content.city || undefined,
                          photo: content.item?.photo || content.newActivity?.photo || undefined,
                        };

                        console.log('✨ [AGENT] Dispatching action confirmation:', confirmationData);
                        window.dispatchEvent(new CustomEvent('agent_action_confirmed', {
                          detail: { ...confirmationData, id: `action_${Date.now()}` }
                        }));
                      }
                    } catch (e) {
                      console.warn('⚠️ [AGENT] Failed to parse tool result for confirmation:', e);
                    }
                  }
                }

                // Check if addCityToRoute tools were used successfully (handle MULTIPLE cities)
                const addCityTools = event.tools.filter((tool: any) => tool.name === 'addCityToRoute');
                for (const addCityTool of addCityTools) {
                  try {
                    const content = typeof addCityTool.content === 'string'
                      ? JSON.parse(addCityTool.content)
                      : addCityTool.content;

                    if (content.success && content.city) {
                      console.log('🏙️ [AGENT] City added to route:', content.city.name, 'at index:', content.insertAfterIndex);
                      // Dispatch custom event with city data for discovery store to handle
                      window.dispatchEvent(new CustomEvent('agent_add_city', {
                        detail: {
                          city: content.city,
                          insertAfterIndex: content.insertAfterIndex,
                          reason: content.reason
                        }
                      }));
                    }
                  } catch (e) {
                    console.warn('⚠️ [AGENT] Failed to parse addCityToRoute result:', e);
                  }
                }

                // Detect and set artifact
                const artifact = detectArtifact(event.tools);
                if (artifact) {
                  console.log('✨ [AGENT] Artifact detected and set:', artifact.type, artifact.title);
                  setCurrentArtifact(artifact);
                  setArtifactHistory(prev => [...prev, artifact]);
                } else {
                  console.log('ℹ️ [AGENT] No artifact detected from tool results');
                }

                // Store tool results for backward compatibility with existing renderRichContent
                setMessages(prev =>
                  prev.map(msg =>
                    msg.id === assistantMessageId
                      ? { ...msg, toolResults: event.tools }
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
      console.error('❌ [AGENT] Error in sendMessage:', error);
      console.error('❌ [AGENT] Error name:', error.name);
      console.error('❌ [AGENT] Error message:', error.message);
      console.error('❌ [AGENT] Error stack:', error.stack);

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
      console.log('🏁 [AGENT] sendMessage completed. Loading:', false);
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [sessionId, pageContext, detectArtifact]);

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
    // State
    isOpen,
    messages,
    isLoading,
    sessionId,
    pageContext,
    activeTools,
    itineraryId,

    // Artifact State
    currentArtifact,
    artifactHistory,
    isMinimized,

    // Actions
    openAgent,
    closeAgent,
    toggleAgent,
    sendMessage,
    clearHistory,

    // Artifact Actions
    setCurrentArtifact,
    clearArtifacts,
    toggleMinimize,

    // Itinerary Actions
    addActivityToDay
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
