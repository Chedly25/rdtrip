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

      const { jobId } = await response.json();

      // Connect to SSE stream
      const eventSource = new EventSource(`/api/itinerary/generate/${jobId}/stream`);

      eventSource.addEventListener('agent_started', (e) => {
        const data = JSON.parse(e.data);
        setAgents(prev => prev.map(a =>
          a.name === data.agent
            ? { ...a, status: 'running' as const }
            : a
        ));
      });

      eventSource.addEventListener('agent_progress', (e) => {
        const data = JSON.parse(e.data);
        setAgents(prev => prev.map(a =>
          a.name === data.agent
            ? { ...a, progress: { current: data.current, total: data.total } }
            : a
        ));
      });

      eventSource.addEventListener('agent_completed', (e) => {
        const data = JSON.parse(e.data);
        setAgents(prev => prev.map(a =>
          a.name === data.agent
            ? { ...a, status: 'completed' as const, duration: data.duration }
            : a
        ));
      });

      eventSource.addEventListener('agent_error', (e) => {
        const data = JSON.parse(e.data);
        setAgents(prev => prev.map(a =>
          a.name === data.agent
            ? { ...a, status: 'error' as const, error: data.message }
            : a
        ));
      });

      eventSource.addEventListener('generation_complete', (e) => {
        const data = JSON.parse(e.data);
        console.log('🎉 GENERATION COMPLETE - Raw SSE data:', e.data);
        console.log('🎉 GENERATION COMPLETE - Parsed data:', data);
        console.log('🎉 GENERATION COMPLETE - Itinerary object:', data.itinerary);
        console.log('🎉 GENERATION COMPLETE - Day Structure:', data.itinerary?.dayStructure);
        console.log('🎉 GENERATION COMPLETE - Activities:', data.itinerary?.activities);
        console.log('🎉 GENERATION COMPLETE - Restaurants:', data.itinerary?.restaurants);
        setItinerary(data.itinerary);
        setIsGenerating(false);
        eventSource.close();
      });

      eventSource.addEventListener('generation_error', (e) => {
        const data = JSON.parse(e.data);
        setError(data.message);
        setIsGenerating(false);
        eventSource.close();
      });

      eventSource.onerror = () => {
        setError('Connection lost to generation stream');
        setIsGenerating(false);
        eventSource.close();
      };

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsGenerating(false);
    }
  }, []);

  return { agents, itinerary, error, isGenerating, generate };
}
