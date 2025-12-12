/**
 * City Intelligence Agent Types
 *
 * Type definitions for the City Intelligence Agent system that provides
 * rich, AI-powered city profiles during the discovery phase.
 */

// =============================================================================
// Core Types
// =============================================================================

export interface CityData {
  id: string;
  name: string;
  country: string;
  coordinates: { lat: number; lng: number };
  imageUrl?: string;
  description?: string;
}

export interface UserPreferences {
  /** Explicit preferences from forms/settings */
  travellerType?: string;
  interests?: string[];
  diningStyle?: string;
  dietary?: string[];
  pace?: 'relaxed' | 'moderate' | 'packed';
  budget?: 'budget' | 'moderate' | 'luxury';
  avoidCrowds?: boolean;
  preferOutdoor?: boolean;
  accessibility?: string[];
}

export interface TripContext {
  origin: CityData;
  destination: CityData;
  startDate?: Date;
  endDate?: Date;
  totalNights: number;
  travellerType: string;
  transportMode: 'car' | 'train' | 'mixed';
}

// =============================================================================
// Agent Types
// =============================================================================

export type AgentName =
  | 'TimeAgent'
  | 'StoryAgent'
  | 'PreferenceAgent'
  | 'ClusterAgent'
  | 'GemsAgent'
  | 'LogisticsAgent'
  | 'WeatherAgent'
  | 'PhotoAgent'
  | 'SynthesisAgent';

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AgentInput {
  city: CityData;
  nights: number;
  preferences: UserPreferences;
  previousAgentOutputs: Record<string, unknown>;
  refinementInstructions?: string;
}

export interface AgentOutput {
  success: boolean;
  data: unknown;
  confidence: number; // 0-100
  gaps?: string[];
  suggestions?: string[];
  executionTimeMs?: number;
}

export interface AgentDefinition {
  name: AgentName;
  description: string;
  requiredInputs: string[];
  optionalInputs: string[];
  outputs: string[];
  dependsOn: AgentName[];
  canRefine: boolean;
}

export interface AgentExecutionState {
  agentName: AgentName;
  status: AgentStatus;
  startTime?: Date;
  endTime?: Date;
  progress?: number; // 0-100
  output?: AgentOutput;
  error?: string;
}

// =============================================================================
// Orchestrator Types
// =============================================================================

export type OrchestratorPhase = 'planning' | 'executing' | 'reflecting' | 'refining' | 'complete';

export interface ExecutionPlan {
  cityId: string;
  phases: PlanPhase[];
  maxIterations: number;
  qualityThreshold: number;
}

export interface PlanPhase {
  phaseNumber: number;
  agents: AgentName[];
  parallel: boolean;
  description: string;
}

export interface Reflection {
  qualityScore: number; // 0-100
  strengths: string[];
  gaps: string[];
  verdict: 'complete' | 'needs_refinement' | 'critical_gaps';
  suggestions: string[];
}

export interface RefinementPlan {
  iteration: number;
  agentsToRerun: AgentName[];
  focusAreas: string[];
  instructions: Record<AgentName, string>;
}

// =============================================================================
// City Intelligence Output Types
// =============================================================================

export interface StoryOutput {
  hook: string;
  narrative: string;
  differentiators: string[];
}

export interface TimeBlock {
  id: string;
  name: string;
  hours: number;
  mood: 'explore' | 'dine' | 'activity' | 'depart' | 'arrive';
  flexibility: 'high' | 'medium' | 'low';
  suggested?: string;
}

export interface TimeBlocksOutput {
  blocks: TimeBlock[];
  totalUsableHours: number;
}

export interface ClusterPlace {
  id: string;
  name: string;
  type: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  priceLevel?: number;
  photoUrl?: string;
  coordinates: { lat: number; lng: number };
  place_id?: string;
}

export interface Cluster {
  id: string;
  name: string;
  theme: string;
  bestFor: string; // time block name
  walkingMinutes: number;
  centerPoint: { lat: number; lng: number };
  places: ClusterPlace[];
}

export interface ClustersOutput {
  clusters: Cluster[];
}

export interface MatchReason {
  preference: string;
  match: string;
  score: number;
}

export interface MatchWarning {
  preference: string;
  gap: string;
  score: number;
}

export interface MatchScoreOutput {
  score: number;
  reasons: MatchReason[];
  warnings: MatchWarning[];
}

export interface HiddenGem {
  name: string;
  type: string;
  why: string;
  insteadOf?: string;
  insiderTip?: string;
  coordinates?: { lat: number; lng: number };
  photoUrl?: string;
}

export interface GemsOutput {
  hiddenGems: HiddenGem[];
}

export interface LogisticsOutput {
  parking?: string;
  tips: string[];
  warnings: string[];
  bestTimes?: string[];
  marketDays?: string[];
}

export interface WeatherRecommendation {
  outdoorSafe: string[];
  backup?: string;
  goldenHour?: string;
}

export interface WeatherOutput {
  forecast: string;
  temperature?: { high: number; low: number };
  conditions?: string;
  recommendations: WeatherRecommendation;
  riskAssessment?: string;
}

export interface PhotoSpot {
  name: string;
  bestTime: string;
  tip: string;
  coordinates?: { lat: number; lng: number };
}

export interface PhotoSpotsOutput {
  spots: PhotoSpot[];
}

// =============================================================================
// Complete City Intelligence
// =============================================================================

export interface CityIntelligence {
  cityId: string;
  city: CityData;
  quality: number;
  iterations: number;
  status: 'pending' | 'processing' | 'complete' | 'failed';

  // Agent outputs
  story?: StoryOutput;
  timeBlocks?: TimeBlocksOutput;
  clusters?: ClustersOutput;
  matchScore?: MatchScoreOutput;
  hiddenGems?: GemsOutput;
  logistics?: LogisticsOutput;
  weather?: WeatherOutput;
  photoSpots?: PhotoSpotsOutput;

  // Metadata
  generatedAt?: Date;
  lastUpdatedAt?: Date;
}

// =============================================================================
// SSE Event Types
// =============================================================================

export type SSEEventType =
  | 'connected'
  | 'orchestrator_goal'
  | 'orchestrator_plan'
  | 'agent_started'
  | 'agent_progress'
  | 'agent_complete'
  | 'agent_error'
  | 'reflection'
  | 'refinement_started'
  | 'city_complete'
  | 'all_complete'
  | 'error'
  | 'heartbeat';

export interface SSEEventBase {
  type: SSEEventType;
  timestamp: string;
}

export interface SSEConnectedEvent extends SSEEventBase {
  type: 'connected';
  sessionId: string;
}

export interface SSEOrchestratorGoalEvent extends SSEEventBase {
  type: 'orchestrator_goal';
  goal: {
    description: string;
    cities: string[];
    qualityThreshold: number;
    maxIterations: number;
  };
}

export interface SSEOrchestratorPlanEvent extends SSEEventBase {
  type: 'orchestrator_plan';
  cityId: string;
  plan: ExecutionPlan;
}

export interface SSEAgentStartedEvent extends SSEEventBase {
  type: 'agent_started';
  cityId: string;
  agent: AgentName;
}

export interface SSEAgentProgressEvent extends SSEEventBase {
  type: 'agent_progress';
  cityId: string;
  agent: AgentName;
  progress: number;
}

export interface SSEAgentCompleteEvent extends SSEEventBase {
  type: 'agent_complete';
  cityId: string;
  agent: AgentName;
  output: AgentOutput;
}

export interface SSEAgentErrorEvent extends SSEEventBase {
  type: 'agent_error';
  cityId: string;
  agent: AgentName;
  error: string;
}

export interface SSEReflectionEvent extends SSEEventBase {
  type: 'reflection';
  cityId: string;
  reflection: Reflection;
}

export interface SSERefinementStartedEvent extends SSEEventBase {
  type: 'refinement_started';
  cityId: string;
  plan: RefinementPlan;
}

export interface SSECityCompleteEvent extends SSEEventBase {
  type: 'city_complete';
  cityId: string;
  intelligence: CityIntelligence;
}

export interface SSEAllCompleteEvent extends SSEEventBase {
  type: 'all_complete';
  summary: {
    totalCities: number;
    averageQuality: number;
    totalIterations: number;
    processingTimeMs: number;
  };
}

export interface SSEErrorEvent extends SSEEventBase {
  type: 'error';
  error: string;
  recoverable: boolean;
}

export type SSEEvent =
  | SSEConnectedEvent
  | SSEOrchestratorGoalEvent
  | SSEOrchestratorPlanEvent
  | SSEAgentStartedEvent
  | SSEAgentProgressEvent
  | SSEAgentCompleteEvent
  | SSEAgentErrorEvent
  | SSEReflectionEvent
  | SSERefinementStartedEvent
  | SSECityCompleteEvent
  | SSEAllCompleteEvent
  | SSEErrorEvent;

// =============================================================================
// Shared Memory Types
// =============================================================================

export interface SharedMemorySession {
  id: string;
  startedAt: Date;
  userId?: string;
}

export interface SharedMemoryTrip {
  origin: CityData;
  destination: CityData;
  startDate?: Date;
  endDate?: Date;
  totalNights: number;
  travellerType: string;
  transportMode: 'car' | 'train' | 'mixed';
}

export interface InferredPreferences {
  favouritePlaceTypes: Record<string, number>;
  averageNightsPerCity: number;
  prefersHiddenGems: boolean;
  interestedCityIds: string[];
}

export interface MergedPreferences extends UserPreferences {
  inferred?: InferredPreferences;
}

export interface SharedMemoryPreferences {
  explicit: UserPreferences;
  inferred: InferredPreferences;
  combined: MergedPreferences;
}

export interface CrossCityInsights {
  themes: string[];
  varietyScore: number;
  paceScore: number;
  recommendations: string[];
}

export interface OrchestratorState {
  currentPhase: OrchestratorPhase;
  currentCityId?: string;
  currentPlan?: ExecutionPlan;
  executionLog: Array<{
    timestamp: Date;
    event: string;
    details?: unknown;
  }>;
  reflections: Reflection[];
}

export interface AgentMessage {
  from: AgentName;
  to: AgentName | 'orchestrator';
  messageType: 'suggestion' | 'request' | 'warning';
  content: string;
  timestamp: Date;
}

export interface SharedMemory {
  session: SharedMemorySession;
  trip: SharedMemoryTrip;
  preferences: SharedMemoryPreferences;
  cityIntelligence: Map<string, CityIntelligence>;
  crossCityInsights: CrossCityInsights;
  orchestrator: OrchestratorState;
  agentMessages: AgentMessage[];
}

// =============================================================================
// Request/Response Types
// =============================================================================

export interface StartIntelligenceRequest {
  cities: CityData[];
  nights: Record<string, number>; // cityId -> nights
  preferences: UserPreferences;
  trip: {
    origin: CityData;
    destination: CityData;
    totalNights: number;
    travellerType: string;
    transportMode: 'car' | 'train' | 'mixed';
    startDate?: string;
    endDate?: string;
  };
  sessionId?: string;
}

export interface IntelligenceStatusResponse {
  sessionId: string;
  status: 'idle' | 'processing' | 'complete' | 'failed';
  cities: Array<{
    cityId: string;
    status: CityIntelligence['status'];
    quality?: number;
    agentStates: AgentExecutionState[];
  }>;
  overallProgress: number; // 0-100
}

// =============================================================================
// Store Types
// =============================================================================

export interface CityIntelligenceStoreState {
  // Session
  sessionId: string | null;
  isConnected: boolean;

  // Processing state
  isProcessing: boolean;
  overallProgress: number;
  currentPhase: OrchestratorPhase;

  // City data
  cityIntelligence: Record<string, CityIntelligence>;
  agentStates: Record<string, Record<AgentName, AgentExecutionState>>;

  // Insights
  crossCityInsights: CrossCityInsights | null;

  // Errors
  errors: Array<{ cityId?: string; agent?: AgentName; message: string; timestamp: Date }>;

  // Actions
  startIntelligence: (request: StartIntelligenceRequest) => Promise<void>;
  cancelIntelligence: () => void;
  handleSSEEvent: (event: SSEEvent) => void;
  getCityIntelligence: (cityId: string) => CityIntelligence | null;
  getAgentState: (cityId: string, agent: AgentName) => AgentExecutionState | null;
  reset: () => void;
}
