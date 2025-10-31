import { useState, useCallback } from 'react';
import { AgentStatus } from '../components/itinerary/GenerationProgress';

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
  generate: (routeId: string, preferences: any) => Promise<void>;
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

  const generate = useCallback(async (routeId: string, preferences: any) => {
    try {
      setIsGenerating(true);
      setError(null);
      setAgents(initialAgents); // Reset agents

      // Start generation
      const response = await fetch('/api/itinerary/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ routeId, preferences })
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
