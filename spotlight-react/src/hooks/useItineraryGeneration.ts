import { useState, useCallback } from 'react';
import type { AgentStatus } from '../components/itinerary/GenerationProgress';
import type { AgentNode } from '../components/itinerary/AgentOrchestrationVisualizer';
import type { PartialItinerary } from '../components/itinerary/ProgressiveItineraryPreview';

interface Itinerary {
  id: string;
  dayStructure: any[];
  activities: any[];
  restaurants: any[];
  accommodations: any[];
  scenicStops: any[];
  practicalInfo: any[];
  weather: any[];
  events: any[];
  budget: any;
  // Personalization visibility fields
  tripNarrative?: string;
  tripStyleProfile?: {
    explorerVsRelaxer: number;
    budgetVsLuxury: number;
    mainstreamVsHidden: number;
    packedVsLeisurely: number;
  };
  dayThemes?: Array<{
    day: number;
    theme: string;
    themeEmoji?: string;
  }>;
  personalizedIntro?: {
    headline: string;
    summary: string;
    highlightedFactors: string[];
  };
  preferences?: any;
  personalizationContent?: any;
}

interface GenerationProgress {
  total: number;
  completed: number;
  currentAgent: string | null;
  percentComplete: number;
}

interface UseItineraryGenerationReturn {
  agents: AgentStatus[];
  agentNodes: AgentNode[];
  partialResults: PartialItinerary;
  itinerary: Itinerary | null;
  error: string | null;
  isGenerating: boolean;
  isLoading: boolean;
  progress: GenerationProgress;
  generate: (routeData: any, preferences: any) => Promise<void>;
  loadFromId: (itineraryId: string) => Promise<void>;
  reset: () => void;
}

// Helper to get the stored itinerary ID for the current route
const ITINERARY_STORAGE_KEY = 'spotlight_itinerary_id';

export function getStoredItineraryId(): string | null {
  try {
    const stored = localStorage.getItem(ITINERARY_STORAGE_KEY);
    if (stored) {
      const { itineraryId, timestamp } = JSON.parse(stored);
      // Itinerary IDs are valid for 30 days
      const thirtyDays = 30 * 24 * 60 * 60 * 1000;
      if (Date.now() - timestamp < thirtyDays) {
        return itineraryId;
      } else {
        // Expired, remove it
        localStorage.removeItem(ITINERARY_STORAGE_KEY);
      }
    }
  } catch (e) {
    console.warn('Failed to read stored itinerary ID:', e);
  }
  return null;
}

function storeItineraryId(itineraryId: string): void {
  try {
    localStorage.setItem(ITINERARY_STORAGE_KEY, JSON.stringify({
      itineraryId,
      timestamp: Date.now()
    }));
    console.log(`📌 Stored itinerary ID: ${itineraryId}`);
  } catch (e) {
    console.warn('Failed to store itinerary ID:', e);
  }
}

export function clearStoredItineraryId(): void {
  try {
    localStorage.removeItem(ITINERARY_STORAGE_KEY);
    console.log('🗑️ Cleared stored itinerary ID');
  } catch (e) {
    console.warn('Failed to clear stored itinerary ID:', e);
  }
}

const initialAgents: AgentStatus[] = [
  { name: 'day_planner', status: 'waiting' },
  { name: 'activities', status: 'waiting' },
  { name: 'restaurants', status: 'waiting' },
  { name: 'accommodations', status: 'waiting' },
  { name: 'scenic_stops', status: 'waiting' },
  { name: 'practical_info', status: 'waiting' },
  { name: 'weather', status: 'waiting' },
  { name: 'events', status: 'waiting' },
  { name: 'budget', status: 'waiting' },
];

const initialAgentNodes: AgentNode[] = [
  // Phase 1: Day Planning
  { id: 'dayPlanner', name: 'dayPlanner', label: 'Day Planner', status: 'waiting', progress: 0, dependencies: [], phase: 1 },

  // Phase 2: Content Discovery (parallel)
  { id: 'activities', name: 'googleActivities', label: 'Activities', status: 'waiting', progress: 0, dependencies: ['dayPlanner'], phase: 2 },
  { id: 'restaurants', name: 'googleRestaurants', label: 'Restaurants', status: 'waiting', progress: 0, dependencies: ['dayPlanner'], phase: 2 },
  { id: 'accommodations', name: 'googleAccommodations', label: 'Hotels', status: 'waiting', progress: 0, dependencies: ['dayPlanner'], phase: 2 },
  { id: 'scenicStops', name: 'scenicStops', label: 'Scenic Stops', status: 'waiting', progress: 0, dependencies: ['dayPlanner'], phase: 2 },

  // Phase 3: Context & Info (parallel)
  { id: 'weather', name: 'weather', label: 'Weather', status: 'waiting', progress: 0, dependencies: ['dayPlanner'], phase: 3 },
  { id: 'events', name: 'events', label: 'Events', status: 'waiting', progress: 0, dependencies: ['dayPlanner'], phase: 3 },
  { id: 'practicalInfo', name: 'practicalInfo', label: 'Practical Info', status: 'waiting', progress: 0, dependencies: ['dayPlanner'], phase: 3 },

  // Phase 4: Budget
  { id: 'budget', name: 'budget', label: 'Budget', status: 'waiting', progress: 0, dependencies: ['activities', 'restaurants', 'accommodations'], phase: 4 },
];

const initialProgress: GenerationProgress = {
  total: 9,
  completed: 0,
  currentAgent: null,
  percentComplete: 0
};

export function useItineraryGeneration(): UseItineraryGenerationReturn {
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);
  const [agentNodes, setAgentNodes] = useState<AgentNode[]>(initialAgentNodes);
  const [partialResults, setPartialResults] = useState<PartialItinerary>({});
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<GenerationProgress>(initialProgress);

  // Reset function to clear all state
  const reset = useCallback(() => {
    setAgents(initialAgents);
    setAgentNodes(initialAgentNodes);
    setPartialResults({});
    setItinerary(null);
    setError(null);
    setIsGenerating(false);
    setProgress(initialProgress);
  }, []);

  const generate = useCallback(async (routeData: any, preferences: any) => {
    try {
      setIsGenerating(true);
      setError(null);
      setAgents(initialAgents); // Reset agents
      setAgentNodes(initialAgentNodes); // Reset agent nodes
      setPartialResults({}); // Reset partial results

      // Add agent type to routeData if provided in preferences
      const enrichedRouteData = {
        ...routeData,
        agent: preferences?.agentType || preferences?.travelStyle || 'best-overall'
      };

      console.log('🚀 Sending to /api/itinerary/generate:', {
        routeData: enrichedRouteData,
        preferences: preferences,
        waypoints: enrichedRouteData.waypoints
      });

      // Start generation
      const response = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeData: enrichedRouteData, preferences })
      });

      if (!response.ok) {
        throw new Error('Failed to start itinerary generation');
      }

      const { itineraryId } = await response.json();
      console.log(`✅ Itinerary job started: ${itineraryId}`);

      // Try to use SSE streaming if available, fallback to polling
      const useSSE = false; // TODO: Enable when V3 is stable

      if (useSSE) {
        // Use SSE for real-time updates
        console.log('📡 Connecting to SSE stream...');
        const eventSource = new EventSource(`/api/itinerary/${itineraryId}/stream`);

        eventSource.addEventListener('agent_progress', (event) => {
          const data = JSON.parse(event.data);
          console.log('📊 Agent progress:', data);

          // Update old agents format
          setAgents(prev => prev.map(agent => {
            if (agent.name === data.agent) {
              return { ...agent, status: data.status === 'completed' ? 'completed' : 'running' };
            }
            return agent;
          }));

          // Update agent nodes
          setAgentNodes(prev => prev.map(node => {
            if (node.name === data.agent || node.id === data.agent) {
              return {
                ...node,
                status: data.status === 'completed' ? 'completed' : 'running',
                progress: data.status === 'completed' ? 100 : 50,
                startTime: node.startTime || Date.now(),
                endTime: data.status === 'completed' ? Date.now() : undefined
              };
            }
            return node;
          }));
        });

        eventSource.addEventListener('generation_complete', (event) => {
          const data = JSON.parse(event.data);
          console.log('🎉 Generation complete via SSE:', data);

          eventSource.close();

          // Fetch the full itinerary
          fetch(`/api/itinerary/${itineraryId}`)
            .then(res => res.json())
            .then(fullItinerary => {
              setItinerary({
                id: fullItinerary.id,
                dayStructure: fullItinerary.dayStructure,
                activities: fullItinerary.activities,
                restaurants: fullItinerary.restaurants,
                accommodations: fullItinerary.accommodations,
                scenicStops: fullItinerary.scenicStops,
                practicalInfo: fullItinerary.practicalInfo,
                weather: fullItinerary.weather,
                events: fullItinerary.events,
                budget: fullItinerary.budget
              });

              const newUrl = `${window.location.pathname}?itinerary=${itineraryId}`;
              window.history.pushState({ itineraryId }, '', newUrl);

              setIsGenerating(false);
            });
        });

        eventSource.addEventListener('generation_error', (event) => {
          const data = JSON.parse(event.data);
          console.error('❌ Generation error via SSE:', data.error);
          eventSource.close();
          setError('Generation failed. Please try again.');
          setIsGenerating(false);
        });

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          eventSource.close();
          // Fall back to polling
          setError('Real-time updates failed, but generation may still complete.');
        };

        return; // Skip polling
      }

      // Poll for status updates (fallback method)
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(`/api/itinerary/${itineraryId}/status`);

          if (!statusRes.ok) {
            throw new Error('Failed to fetch status');
          }

          const statusData = await statusRes.json();
          console.log('📊 Status update:', statusData);

          // Update agent statuses based on progress
          if (statusData.progress) {
            const progressMap: Record<string, string> = {
              dayPlanner: 'day_planner',
              activities: 'activities',
              restaurants: 'restaurants',
              accommodations: 'accommodations',
              scenicRoutes: 'scenic_stops',
              practicalInfo: 'practical_info',
              weather: 'weather',
              events: 'events',
              budget: 'budget'
            };

            // Update old agent format
            setAgents(prev => prev.map(agent => {
              const backendKey = Object.keys(progressMap).find(
                key => progressMap[key] === agent.name
              );

              if (backendKey && statusData.progress[backendKey]) {
                const backendStatus = statusData.progress[backendKey];
                return {
                  ...agent,
                  status: backendStatus === 'completed' ? 'completed' :
                         backendStatus === 'running' ? 'running' :
                         backendStatus === 'failed' ? 'error' :
                         'waiting'
                };
              }
              return agent;
            }));

            // Update agent nodes
            setAgentNodes(prev => prev.map(node => {
              const backendStatus = statusData.progress[node.name] || statusData.progress[node.id];

              if (backendStatus) {
                const newStatus = backendStatus === 'completed' ? 'completed' :
                                  backendStatus === 'running' ? 'running' :
                                  backendStatus === 'failed' ? 'error' :
                                  'waiting';

                return {
                  ...node,
                  status: newStatus as any,
                  progress: newStatus === 'completed' ? 100 : newStatus === 'running' ? 50 : 0,
                  startTime: node.startTime || (newStatus === 'running' || newStatus === 'completed' ? Date.now() : undefined),
                  endTime: newStatus === 'completed' ? Date.now() : undefined
                };
              }
              return node;
            }));

            // Update progress state for UI
            const completedCount = Object.values(statusData.progress).filter(s => s === 'completed').length;
            const runningAgent = Object.entries(statusData.progress).find(([_, s]) => s === 'running');
            const totalAgents = Object.keys(statusData.progress).length || 9;

            setProgress({
              total: totalAgents,
              completed: completedCount,
              currentAgent: runningAgent ? runningAgent[0] : null,
              percentComplete: Math.round((completedCount / totalAgents) * 100)
            });
          }

          // Check if generation is complete
          if (statusData.status === 'completed' || statusData.status === 'partial') {
            clearInterval(pollInterval);
            clearTimeout(safetyTimeout);

            // Fetch the full itinerary
            const itineraryRes = await fetch(`/api/itinerary/${itineraryId}`);
            if (itineraryRes.ok) {
              const fullItinerary = await itineraryRes.json();
              console.log('🎉 GENERATION COMPLETE:', fullItinerary);

              setItinerary({
                id: fullItinerary.id,
                dayStructure: fullItinerary.dayStructure,
                activities: fullItinerary.activities,
                restaurants: fullItinerary.restaurants,
                accommodations: fullItinerary.accommodations,
                scenicStops: fullItinerary.scenicStops,
                practicalInfo: fullItinerary.practicalInfo,
                weather: fullItinerary.weather,
                events: fullItinerary.events,
                budget: fullItinerary.budget,
                // Personalization visibility fields
                tripNarrative: fullItinerary.tripNarrative,
                tripStyleProfile: fullItinerary.tripStyleProfile,
                dayThemes: fullItinerary.dayThemes,
                personalizedIntro: fullItinerary.personalizedIntro,
                preferences: fullItinerary.preferences,
                personalizationContent: fullItinerary.personalizationContent
              });

              // Update partial results for preview
              setPartialResults({
                activities: fullItinerary.activities,
                restaurants: fullItinerary.restaurants,
                accommodations: fullItinerary.accommodations,
                scenicStops: fullItinerary.scenicStops,
                weather: fullItinerary.weather,
                events: fullItinerary.events,
                practicalInfo: fullItinerary.practicalInfo
              });

              // Store itinerary ID in localStorage for persistence across refreshes
              storeItineraryId(itineraryId);

              // Keep URL clean - don't add itinerary param since we have localStorage
              console.log(`📌 Itinerary stored for persistence: ${itineraryId}`);
            }

            setIsGenerating(false);
          } else if (statusData.status === 'failed') {
            clearInterval(pollInterval);
            clearTimeout(safetyTimeout);
            setError('Generation failed. Please try again.');
            setIsGenerating(false);
          }

        } catch (pollError) {
          console.error('Poll error:', pollError);
          // Don't stop polling on transient errors
        }
      }, 2000); // Poll every 2 seconds

      // Safety timeout: stop polling after 5 minutes (increased for batch processing)
      const safetyTimeout = setTimeout(() => {
        clearInterval(pollInterval);
        setError('Generation timed out. The itinerary may still be processing.');
        setIsGenerating(false);
      }, 300000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsGenerating(false);
    }
  }, []);

  const loadFromId = useCallback(async (itineraryId: string) => {
    try {
      setError(null);
      setIsLoading(true);
      console.log(`📥 Loading itinerary from ID: ${itineraryId}`);

      const response = await fetch(`/api/itinerary/${itineraryId}`);

      if (!response.ok) {
        throw new Error('Failed to load itinerary');
      }

      const fullItinerary = await response.json();
      console.log('✅ Itinerary loaded from ID:', fullItinerary);

      setItinerary({
        id: fullItinerary.id,
        dayStructure: fullItinerary.dayStructure,
        activities: fullItinerary.activities,
        restaurants: fullItinerary.restaurants,
        accommodations: fullItinerary.accommodations,
        scenicStops: fullItinerary.scenicStops,
        practicalInfo: fullItinerary.practicalInfo,
        weather: fullItinerary.weather,
        events: fullItinerary.events,
        budget: fullItinerary.budget,
        // Personalization visibility fields
        tripNarrative: fullItinerary.tripNarrative,
        tripStyleProfile: fullItinerary.tripStyleProfile,
        dayThemes: fullItinerary.dayThemes,
        personalizedIntro: fullItinerary.personalizedIntro,
        preferences: fullItinerary.preferences,
        personalizationContent: fullItinerary.personalizationContent
      });

      // Mark all agents as completed since itinerary is already generated
      setAgents(prev => prev.map(agent => ({ ...agent, status: 'completed' })));
      setIsLoading(false);

    } catch (err) {
      console.error('Failed to load itinerary:', err);
      setError(err instanceof Error ? err.message : 'Failed to load itinerary');
      setIsLoading(false);
      // Clear the stored ID if it's invalid
      clearStoredItineraryId();
    }
  }, []);

  return { agents, agentNodes, partialResults, itinerary, error, isGenerating, isLoading, progress, generate, loadFromId, reset };
}
