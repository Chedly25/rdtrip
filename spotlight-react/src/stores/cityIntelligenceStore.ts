/**
 * City Intelligence Store
 *
 * Zustand store for managing city intelligence state in the frontend.
 * Handles SSE event processing and provides selectors for UI components.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  CityIntelligence,
  AgentName,
  AgentExecutionState,
  SSEEvent,
  CrossCityInsights,
  OrchestratorPhase,
  StartIntelligenceRequest,
} from '../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface CityAgentStates {
  [agentName: string]: AgentExecutionState;
}

interface IntelligenceError {
  cityId?: string;
  agent?: AgentName;
  message: string;
  timestamp: Date;
}

// Deep dive topic type (matches DeepDiveRequest component)
export type DeepDiveTopic =
  | 'restaurants'
  | 'nightlife'
  | 'photography'
  | 'walking'
  | 'shopping'
  | 'nature'
  | 'timing'
  | 'parking'
  | 'hidden_gems'
  | 'weather'
  | 'custom';

// Feedback data type
export interface IntelligenceFeedbackData {
  cityId: string;
  rating: 'positive' | 'negative' | 'love' | 'good' | 'okay' | 'poor';
  categories?: string[];
  comment?: string;
  timestamp: Date;
}

// Deep dive response
export interface DeepDiveResponse {
  topic: DeepDiveTopic;
  customQuery?: string;
  response: string;
  timestamp: Date;
}

// Optimistic update snapshot for rollback
interface OptimisticSnapshot {
  id: string;
  cityId: string;
  previousState: CityIntelligence;
  timestamp: Date;
}

interface CityIntelligenceState {
  // Session
  sessionId: string | null;
  isConnected: boolean;

  // Processing state
  isProcessing: boolean;
  overallProgress: number;
  currentPhase: OrchestratorPhase;
  currentCityId: string | null;

  // City data
  cityIntelligence: Record<string, CityIntelligence>;
  agentStates: Record<string, CityAgentStates>;

  // Orchestrator info
  goal: {
    description: string;
    cities: string[];
    qualityThreshold: number;
    maxIterations: number;
  } | null;

  // Insights
  crossCityInsights: CrossCityInsights | null;

  // Errors
  errors: IntelligenceError[];

  // Deep dive state
  isDeepDiveLoading: boolean;
  deepDiveResponses: Record<string, DeepDiveResponse[]>;

  // Feedback state
  feedbackSubmitted: Record<string, IntelligenceFeedbackData>;

  // Optimistic updates
  optimisticSnapshots: OptimisticSnapshot[];

  // Actions
  startIntelligence: (request: StartIntelligenceRequest) => Promise<void>;
  cancelIntelligence: () => void;
  handleSSEEvent: (event: SSEEvent) => void;
  getCityIntelligence: (cityId: string) => CityIntelligence | null;
  getAgentState: (cityId: string, agent: AgentName) => AgentExecutionState | null;
  reset: () => void;

  // Deep dive actions
  requestDeepDive: (cityId: string, topic: DeepDiveTopic, customQuery?: string) => Promise<void>;

  // Feedback actions
  submitFeedback: (feedback: IntelligenceFeedbackData) => Promise<void>;

  // Optimistic update helpers
  applyOptimisticUpdate: (cityId: string, update: Partial<CityIntelligence>) => string;
  rollbackOptimisticUpdate: (snapshotId: string) => void;
  confirmOptimisticUpdate: (snapshotId: string) => void;
}

// =============================================================================
// Initial State
// =============================================================================

const initialState = {
  sessionId: null as string | null,
  isConnected: false,
  isProcessing: false,
  overallProgress: 0,
  currentPhase: 'planning' as OrchestratorPhase,
  currentCityId: null as string | null,
  cityIntelligence: {} as Record<string, CityIntelligence>,
  agentStates: {} as Record<string, CityAgentStates>,
  goal: null as CityIntelligenceState['goal'],
  crossCityInsights: null as CrossCityInsights | null,
  errors: [] as IntelligenceError[],
  isDeepDiveLoading: false,
  deepDiveResponses: {} as Record<string, DeepDiveResponse[]>,
  feedbackSubmitted: {} as Record<string, IntelligenceFeedbackData>,
  optimisticSnapshots: [] as OptimisticSnapshot[],
};

// =============================================================================
// Store
// =============================================================================

export const useCityIntelligenceStore = create<CityIntelligenceState>()(
  persist(
    (set, get) => ({
      ...initialState,

      // Start intelligence gathering
      startIntelligence: async (request: StartIntelligenceRequest) => {
        const { cities, nights, preferences, trip, sessionId: providedSessionId } = request;

        console.log('🚀 [Store] Starting city intelligence...');

        // Initialize state
        set({
          isProcessing: true,
          overallProgress: 0,
          currentPhase: 'planning',
          errors: [],
          // Initialize empty intelligence for each city
          cityIntelligence: cities.reduce((acc, city) => {
            acc[city.id] = {
              cityId: city.id,
              city,
              quality: 0,
              iterations: 0,
              status: 'pending',
            };
            return acc;
          }, {} as Record<string, CityIntelligence>),
          agentStates: cities.reduce((acc, city) => {
            acc[city.id] = {};
            return acc;
          }, {} as Record<string, CityAgentStates>),
        });

        try {
          // Make SSE request
          const response = await fetch('/api/city-intelligence/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cities,
              nights,
              preferences,
              trip,
              sessionId: providedSessionId,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }

          // Read SSE stream
          const reader = response.body?.getReader();
          if (!reader) {
            throw new Error('No response body');
          }

          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete SSE messages
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  get().handleSSEEvent(data);
                } catch (e) {
                  console.warn('Failed to parse SSE data:', line);
                }
              }
            }
          }

          console.log('✅ [Store] Intelligence gathering complete');

        } catch (error) {
          console.error('❌ [Store] Error:', error);
          set((state) => ({
            isProcessing: false,
            errors: [
              ...state.errors,
              {
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
              },
            ],
          }));
        }
      },

      // Cancel ongoing intelligence gathering
      cancelIntelligence: () => {
        const { sessionId } = get();
        if (!sessionId) return;

        console.log('🛑 [Store] Cancelling intelligence...');

        fetch(`/api/city-intelligence/cancel/${sessionId}`, { method: 'POST' })
          .catch((err) => console.error('Cancel error:', err));

        set({
          isProcessing: false,
          isConnected: false,
        });
      },

      // Handle SSE events
      handleSSEEvent: (event: SSEEvent) => {
        console.log(`📨 [Store] SSE Event: ${event.type}`);

        switch (event.type) {
          case 'connected':
            set({
              sessionId: event.sessionId,
              isConnected: true,
            });
            break;

          case 'orchestrator_goal':
            set({
              goal: event.goal,
              currentPhase: 'planning',
            });
            break;

          case 'orchestrator_plan':
            set((state) => ({
              currentPhase: 'executing',
              currentCityId: event.cityId,
              cityIntelligence: {
                ...state.cityIntelligence,
                [event.cityId]: {
                  ...state.cityIntelligence[event.cityId],
                  status: 'processing',
                },
              },
            }));
            break;

          case 'agent_started':
            set((state) => ({
              agentStates: {
                ...state.agentStates,
                [event.cityId]: {
                  ...state.agentStates[event.cityId],
                  [event.agent]: {
                    agentName: event.agent,
                    status: 'running',
                    progress: 0,
                    startTime: new Date(),
                  },
                },
              },
            }));
            break;

          case 'agent_progress':
            set((state) => ({
              agentStates: {
                ...state.agentStates,
                [event.cityId]: {
                  ...state.agentStates[event.cityId],
                  [event.agent]: {
                    ...state.agentStates[event.cityId]?.[event.agent],
                    progress: event.progress,
                  },
                },
              },
            }));
            break;

          case 'agent_complete':
            set((state) => {
              const currentIntel = state.cityIntelligence[event.cityId] || {};

              // Map agent output to intelligence field
              const fieldMap: Record<string, keyof CityIntelligence> = {
                StoryAgent: 'story',
                TimeAgent: 'timeBlocks',
                ClusterAgent: 'clusters',
                PreferenceAgent: 'matchScore',
                GemsAgent: 'hiddenGems',
                LogisticsAgent: 'logistics',
                WeatherAgent: 'weather',
                PhotoAgent: 'photoSpots',
              };

              const field = fieldMap[event.agent];
              const updatedIntel = field && event.output.success
                ? { ...currentIntel, [field]: event.output.data }
                : currentIntel;

              return {
                agentStates: {
                  ...state.agentStates,
                  [event.cityId]: {
                    ...state.agentStates[event.cityId],
                    [event.agent]: {
                      ...state.agentStates[event.cityId]?.[event.agent],
                      status: 'completed',
                      progress: 100,
                      endTime: new Date(),
                      output: event.output,
                    },
                  },
                },
                cityIntelligence: {
                  ...state.cityIntelligence,
                  [event.cityId]: updatedIntel as CityIntelligence,
                },
              };
            });
            break;

          case 'agent_error':
            set((state) => ({
              agentStates: {
                ...state.agentStates,
                [event.cityId]: {
                  ...state.agentStates[event.cityId],
                  [event.agent]: {
                    ...state.agentStates[event.cityId]?.[event.agent],
                    status: 'failed',
                    error: event.error,
                    endTime: new Date(),
                  },
                },
              },
              errors: [
                ...state.errors,
                {
                  cityId: event.cityId,
                  agent: event.agent,
                  message: event.error,
                  timestamp: new Date(),
                },
              ],
            }));
            break;

          case 'reflection':
            set({
              currentPhase: 'reflecting',
            });
            break;

          case 'refinement_started':
            set({
              currentPhase: 'refining',
            });
            break;

          case 'city_complete':
            set((state) => ({
              cityIntelligence: {
                ...state.cityIntelligence,
                [event.cityId]: {
                  ...event.intelligence,
                  status: 'complete',
                },
              },
              // Update overall progress
              overallProgress: calculateProgress(
                { ...state.cityIntelligence, [event.cityId]: event.intelligence },
                Object.keys(state.cityIntelligence).length
              ),
            }));
            break;

          case 'all_complete':
            set({
              isProcessing: false,
              isConnected: false,
              currentPhase: 'complete',
              overallProgress: 100,
            });
            break;

          case 'error':
            set((state) => ({
              errors: [
                ...state.errors,
                {
                  message: event.error,
                  timestamp: new Date(),
                },
              ],
              isProcessing: !event.recoverable ? false : state.isProcessing,
            }));
            break;

          default:
            // Handle unknown event types gracefully
            console.log(`Unknown SSE event type: ${(event as { type: string }).type}`);
        }
      },

      // Get city intelligence
      getCityIntelligence: (cityId: string) => {
        return get().cityIntelligence[cityId] || null;
      },

      // Get agent state
      getAgentState: (cityId: string, agent: AgentName) => {
        return get().agentStates[cityId]?.[agent] || null;
      },

      // Reset store
      reset: () => {
        set(initialState);
      },

      // =========================================================================
      // Deep Dive
      // =========================================================================

      requestDeepDive: async (cityId: string, topic: DeepDiveTopic, customQuery?: string) => {
        console.log(`🔍 [Store] Requesting deep dive: ${topic} for city ${cityId}`);

        set({ isDeepDiveLoading: true });

        try {
          const response = await fetch('/api/city-intelligence/deep-dive', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cityId,
              topic,
              customQuery,
              sessionId: get().sessionId,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }

          const data = await response.json();

          // Store the response
          set((state) => ({
            isDeepDiveLoading: false,
            deepDiveResponses: {
              ...state.deepDiveResponses,
              [cityId]: [
                ...(state.deepDiveResponses[cityId] || []),
                {
                  topic,
                  customQuery,
                  response: data.response,
                  timestamp: new Date(),
                },
              ],
            },
          }));

          console.log('✅ [Store] Deep dive complete');

        } catch (error) {
          console.error('❌ [Store] Deep dive error:', error);
          set((state) => ({
            isDeepDiveLoading: false,
            errors: [
              ...state.errors,
              {
                cityId,
                message: `Deep dive failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                timestamp: new Date(),
              },
            ],
          }));
        }
      },

      // =========================================================================
      // Feedback
      // =========================================================================

      submitFeedback: async (feedback: IntelligenceFeedbackData) => {
        console.log(`📝 [Store] Submitting feedback for city ${feedback.cityId}`);

        try {
          const response = await fetch('/api/city-intelligence/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...feedback,
              sessionId: get().sessionId,
            }),
          });

          if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`);
          }

          // Store feedback locally
          set((state) => ({
            feedbackSubmitted: {
              ...state.feedbackSubmitted,
              [feedback.cityId]: feedback,
            },
          }));

          console.log('✅ [Store] Feedback submitted');

        } catch (error) {
          console.error('❌ [Store] Feedback error:', error);
          // Don't throw - feedback is not critical
        }
      },

      // =========================================================================
      // Optimistic Updates
      // =========================================================================

      applyOptimisticUpdate: (cityId: string, update: Partial<CityIntelligence>) => {
        const snapshotId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const currentState = get().cityIntelligence[cityId];

        if (!currentState) {
          console.warn(`[Store] Cannot apply optimistic update: city ${cityId} not found`);
          return snapshotId;
        }

        console.log(`🚀 [Store] Applying optimistic update: ${snapshotId}`);

        // Save snapshot for potential rollback
        set((state) => ({
          optimisticSnapshots: [
            ...state.optimisticSnapshots,
            {
              id: snapshotId,
              cityId,
              previousState: { ...currentState },
              timestamp: new Date(),
            },
          ],
          // Apply the update
          cityIntelligence: {
            ...state.cityIntelligence,
            [cityId]: {
              ...currentState,
              ...update,
            },
          },
        }));

        return snapshotId;
      },

      rollbackOptimisticUpdate: (snapshotId: string) => {
        const snapshot = get().optimisticSnapshots.find((s) => s.id === snapshotId);

        if (!snapshot) {
          console.warn(`[Store] Cannot rollback: snapshot ${snapshotId} not found`);
          return;
        }

        console.log(`⏪ [Store] Rolling back optimistic update: ${snapshotId}`);

        set((state) => ({
          cityIntelligence: {
            ...state.cityIntelligence,
            [snapshot.cityId]: snapshot.previousState,
          },
          optimisticSnapshots: state.optimisticSnapshots.filter((s) => s.id !== snapshotId),
        }));
      },

      confirmOptimisticUpdate: (snapshotId: string) => {
        console.log(`✅ [Store] Confirming optimistic update: ${snapshotId}`);

        set((state) => ({
          optimisticSnapshots: state.optimisticSnapshots.filter((s) => s.id !== snapshotId),
        }));
      },
    }),
    {
      name: 'waycraft-city-intelligence',
      version: 2, // Increment this to clear old/corrupted localStorage data
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist completed intelligence, not processing state
        cityIntelligence: Object.fromEntries(
          Object.entries(state.cityIntelligence).filter(
            ([, intel]) => intel.status === 'complete'
          )
        ),
      }),
      // Handle migration from old versions
      migrate: (persistedState, version) => {
        console.log('[CityIntelligenceStore] Migrating from version', version, 'to version 2');
        // If version is old or data is corrupted, reset to initial state
        if (version < 2) {
          console.log('[CityIntelligenceStore] Clearing old data');
          return { ...initialState };
        }
        return persistedState as CityIntelligenceState;
      },
      // Handle Date deserialization and errors
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('[CityIntelligenceStore] Rehydration error:', error);
          // Clear corrupted localStorage
          try {
            localStorage.removeItem('waycraft-city-intelligence');
          } catch (e) {
            console.error('[CityIntelligenceStore] Failed to clear localStorage:', e);
          }
          return;
        }
        if (state) {
          // Reset processing state on rehydration
          state.isProcessing = false;
          state.isConnected = false;
          state.overallProgress = 0;
          state.currentPhase = 'planning';
          state.errors = [];
        }
      },
    }
  )
);

// =============================================================================
// Helpers
// =============================================================================

function calculateProgress(
  intelligence: Record<string, CityIntelligence>,
  totalCities: number
): number {
  if (totalCities === 0) return 0;

  const completedCities = Object.values(intelligence).filter(
    (i) => i.status === 'complete'
  ).length;

  return Math.round((completedCities / totalCities) * 100);
}

// =============================================================================
// Selectors
// =============================================================================

export const selectIsProcessing = (state: CityIntelligenceState) => state.isProcessing;
export const selectOverallProgress = (state: CityIntelligenceState) => state.overallProgress;
export const selectCurrentPhase = (state: CityIntelligenceState) => state.currentPhase;
export const selectGoal = (state: CityIntelligenceState) => state.goal;
export const selectErrors = (state: CityIntelligenceState) => state.errors;

export const selectCityIntelligence = (cityId: string) => (state: CityIntelligenceState) =>
  state.cityIntelligence[cityId] || null;

export const selectAgentStates = (cityId: string) => (state: CityIntelligenceState) =>
  state.agentStates[cityId] || {};

export const selectAllCityIntelligence = (state: CityIntelligenceState) =>
  Object.values(state.cityIntelligence);

export const selectCompletedCities = (state: CityIntelligenceState) =>
  Object.values(state.cityIntelligence).filter((i) => i.status === 'complete');

// Deep dive selectors
export const selectIsDeepDiveLoading = (state: CityIntelligenceState) => state.isDeepDiveLoading;
export const selectDeepDiveResponses = (cityId: string) => (state: CityIntelligenceState) =>
  state.deepDiveResponses[cityId] || [];

// Feedback selectors
export const selectFeedbackForCity = (cityId: string) => (state: CityIntelligenceState) =>
  state.feedbackSubmitted[cityId] || null;
export const selectHasFeedback = (cityId: string) => (state: CityIntelligenceState) =>
  !!state.feedbackSubmitted[cityId];
