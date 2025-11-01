import { useState, useCallback } from 'react';
import type { AgentStatus } from '../components/itinerary/GenerationProgress';

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
}

interface UseItineraryGenerationReturn {
  agents: AgentStatus[];
  itinerary: Itinerary | null;
  error: string | null;
  isGenerating: boolean;
  generate: (routeData: any, preferences: any) => Promise<void>;
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

export function useItineraryGeneration(): UseItineraryGenerationReturn {
  const [agents, setAgents] = useState<AgentStatus[]>(initialAgents);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generate = useCallback(async (routeData: any, preferences: any) => {
    try {
      setIsGenerating(true);
      setError(null);
      setAgents(initialAgents); // Reset agents

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

      // Poll for status updates
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
                dayStructure: fullItinerary.day_structure,
                activities: fullItinerary.activities,
                restaurants: fullItinerary.restaurants,
                accommodations: fullItinerary.accommodations,
                scenicStops: fullItinerary.scenic_stops,
                practicalInfo: fullItinerary.practical_info,
                weather: fullItinerary.weather_data,
                events: fullItinerary.local_events,
                budget: fullItinerary.budget_breakdown
              });
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

      // Safety timeout: stop polling after 3 minutes
      const safetyTimeout = setTimeout(() => {
        clearInterval(pollInterval);
        setError('Generation timed out. The itinerary may still be processing.');
        setIsGenerating(false);
      }, 180000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsGenerating(false);
    }
  }, []);

  return { agents, itinerary, error, isGenerating, generate };
}
