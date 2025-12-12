# City Intelligence Agent Architecture

## Vision

Transform the discovery phase from static city listings into a **living intelligence system** where multiple AI agents collaborate to build rich, personalized city profiles in real-time.

This is not just parallel API calls - it's a **true agentic architecture** with:
- An Orchestrator that plans, delegates, and reflects
- Specialized worker agents with distinct expertise
- Feedback loops for quality and completeness
- Shared memory for cross-agent collaboration
- Human-in-the-loop via the companion interface

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CITY INTELLIGENCE SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │                        ORCHESTRATOR AGENT                               │ │
│  │                                                                         │ │
│  │   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐            │ │
│  │   │  PLAN   │───▶│ EXECUTE │───▶│ REFLECT │───▶│ REFINE  │───┐       │ │
│  │   └─────────┘    └─────────┘    └─────────┘    └─────────┘   │       │ │
│  │        ▲                                                       │       │ │
│  │        └───────────────────────────────────────────────────────┘       │ │
│  │                                                                         │ │
│  │   Goals:                                                                │ │
│  │   • Build complete city intelligence for user's trip                   │ │
│  │   • Ensure personalization matches user preferences                    │ │
│  │   • Achieve quality threshold before marking complete                  │ │
│  │   • Coordinate worker agents efficiently                               │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                    │                                         │
│                    ┌───────────────┼───────────────┐                        │
│                    ▼               ▼               ▼                        │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         WORKER AGENTS                                 │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │   STORY     │  │   TIME      │  │  CLUSTER    │  │  PREFERENCE │ │  │
│  │  │   AGENT     │  │   AGENT     │  │   AGENT     │  │   AGENT     │ │  │
│  │  │             │  │             │  │             │  │             │ │  │
│  │  │ Narrative   │  │ Time blocks │  │ Geographic  │  │ Match score │ │  │
│  │  │ hooks       │  │ budgeting   │  │ clustering  │  │ & reasoning │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  │                                                                       │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │   GEMS      │  │  LOGISTICS  │  │  WEATHER    │  │   PHOTO     │ │  │
│  │  │   AGENT     │  │   AGENT     │  │   AGENT     │  │   AGENT     │ │  │
│  │  │             │  │             │  │             │  │             │ │  │
│  │  │ Hidden      │  │ Parking,    │  │ Forecast    │  │ Instagram   │ │  │
│  │  │ favorites   │  │ tips        │  │ aware       │  │ spots       │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                      SHARED MEMORY / CONTEXT                          │  │
│  │                                                                       │  │
│  │  • City Intelligence State (per city)                                │  │
│  │  • User Preferences (inferred + explicit)                            │  │
│  │  • Cross-city insights (patterns, themes)                            │  │
│  │  • Quality scores and gaps                                           │  │
│  │  • Agent execution history                                           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                    │                                         │
│                                    ▼                                         │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │                         FRONTEND (SSE)                                │  │
│  │                                                                       │  │
│  │  • Progressive card enrichment                                       │  │
│  │  • Real-time agent status                                            │  │
│  │  • Quality indicators                                                │  │
│  │  • Human feedback loop (companion)                                   │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## The Orchestrator Agent

The Orchestrator is the brain of the system. It doesn't just dispatch tasks - it **plans**, **monitors**, **reflects**, and **adapts**.

### Orchestrator Loop

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ORCHESTRATOR LOOP                                 │
│                                                                      │
│   1. GOAL INTAKE                                                     │
│      │                                                               │
│      │  Input: City list, user preferences, trip dates, nights      │
│      │  Output: High-level goal definition                          │
│      ▼                                                               │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ GOAL: Build complete city intelligence for 5 cities         │   │
│   │       Personalized for: couple, food-focused, walkable      │   │
│   │       Quality threshold: 85%                                 │   │
│   │       Max iterations: 3                                      │   │
│   └─────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      ▼                                                               │
│   2. PLAN GENERATION                                                 │
│      │                                                               │
│      │  Orchestrator uses Claude to create execution plan:          │
│      │  - Which agents to run                                       │
│      │  - In what order (dependencies)                              │
│      │  - With what inputs                                          │
│      │  - Expected outputs                                          │
│      ▼                                                               │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ PLAN (for each city):                                        │   │
│   │                                                              │   │
│   │ Phase 1 (Parallel - Foundation):                            │   │
│   │   • TimeAgent → time blocks                                  │   │
│   │   • StoryAgent → narrative hook                              │   │
│   │   • PreferenceAgent → match scoring                          │   │
│   │                                                              │   │
│   │ Phase 2 (Parallel - Depends on Phase 1):                    │   │
│   │   • ClusterAgent → needs time blocks                        │   │
│   │   • GemsAgent → needs preference context                    │   │
│   │                                                              │   │
│   │ Phase 3 (Parallel - Enhancement):                           │   │
│   │   • LogisticsAgent                                          │   │
│   │   • WeatherAgent                                            │   │
│   │   • PhotoAgent                                              │   │
│   │                                                              │   │
│   │ Phase 4 (Sequential - Synthesis):                           │   │
│   │   • SynthesisAgent → combines all into coherent card        │   │
│   └─────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      ▼                                                               │
│   3. EXECUTE PLAN                                                    │
│      │                                                               │
│      │  For each phase:                                             │
│      │    - Dispatch agents in parallel                             │
│      │    - Stream results to frontend via SSE                      │
│      │    - Collect outputs to shared memory                        │
│      │    - Track execution time & errors                           │
│      ▼                                                               │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ EXECUTION STATE:                                             │   │
│   │                                                              │   │
│   │ City: Annecy                                                 │   │
│   │ ├─ TimeAgent: ✓ complete (1.2s)                             │   │
│   │ ├─ StoryAgent: ✓ complete (2.8s)                            │   │
│   │ ├─ PreferenceAgent: ✓ complete (1.5s)                       │   │
│   │ ├─ ClusterAgent: ⟳ running...                               │   │
│   │ ├─ GemsAgent: ⟳ running...                                  │   │
│   │ ├─ LogisticsAgent: ○ pending                                │   │
│   │ ├─ WeatherAgent: ○ pending                                  │   │
│   │ └─ PhotoAgent: ○ pending                                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      ▼                                                               │
│   4. REFLECT ON QUALITY                                              │
│      │                                                               │
│      │  After execution, Orchestrator evaluates:                    │
│      │  - Did all agents succeed?                                   │
│      │  - Is the output coherent?                                   │
│      │  - Does it match user preferences well?                      │
│      │  - Are there obvious gaps?                                   │
│      │  - Quality score (0-100)                                     │
│      ▼                                                               │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ REFLECTION:                                                  │   │
│   │                                                              │   │
│   │ Quality Score: 78/100                                        │   │
│   │                                                              │   │
│   │ ✓ Strong: Story hook engaging, clusters well-formed         │   │
│   │ ✗ Gap: No restaurant recommendations despite "food-focused" │   │
│   │ ✗ Gap: Evening cluster lacks dining options                 │   │
│   │ ? Uncertain: Weather data may affect outdoor activities     │   │
│   │                                                              │   │
│   │ Verdict: NEEDS_REFINEMENT                                    │   │
│   └─────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      ▼                                                               │
│   5. REFINE (if needed)                                              │
│      │                                                               │
│      │  If quality < threshold OR gaps identified:                  │
│      │  - Generate refinement plan                                  │
│      │  - Re-run specific agents with new instructions              │
│      │  - Update shared memory                                      │
│      │  - Re-evaluate                                               │
│      ▼                                                               │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ REFINEMENT PLAN:                                             │   │
│   │                                                              │   │
│   │ 1. Re-run GemsAgent with focus: "restaurants"               │   │
│   │ 2. Re-run ClusterAgent: add dining to evening cluster       │   │
│   │ 3. Run WeatherAgent to check outdoor viability              │   │
│   │                                                              │   │
│   │ Iteration: 2 of 3                                           │   │
│   └─────────────────────────────────────────────────────────────┘   │
│      │                                                               │
│      │  Loop back to EXECUTE with refinement plan                   │
│      │                                                               │
│      ▼                                                               │
│   6. FINALIZE                                                        │
│      │                                                               │
│      │  When quality >= threshold OR max iterations reached:        │
│      │  - Mark city intelligence as complete                        │
│      │  - Trigger final SSE event                                   │
│      │  - Update frontend with complete card                        │
│      │  - Move to next city                                         │
│      ▼                                                               │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │ FINAL OUTPUT:                                                │   │
│   │                                                              │   │
│   │ City: Annecy                                                 │   │
│   │ Quality: 91/100                                              │   │
│   │ Iterations: 2                                                │   │
│   │ Status: COMPLETE                                             │   │
│   │                                                              │   │
│   │ Intelligence:                                                │   │
│   │ ├─ story: { hook, narrative, differentiators }              │   │
│   │ ├─ timeBlocks: [ afternoon, evening, morning ]              │   │
│   │ ├─ clusters: [ oldTownLoop, lakefrontDinner, ... ]         │   │
│   │ ├─ matchScore: { score: 94, reasons: [...] }               │   │
│   │ ├─ hiddenGems: [ { name, why, tip }, ... ]                 │   │
│   │ ├─ logistics: { parking, tips, bestTimes }                 │   │
│   │ ├─ weather: { forecast, recommendations }                   │   │
│   │ └─ photoSpots: [ { name, bestTime, tip }, ... ]            │   │
│   └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Worker Agent Specifications

Each worker agent has a clear interface and can be invoked by the Orchestrator.

### Agent Interface Contract

```typescript
interface WorkerAgent {
  name: string;
  description: string;

  // What this agent needs
  requiredInputs: string[];
  optionalInputs: string[];

  // What this agent produces
  outputs: string[];

  // Dependencies (must run after these)
  dependsOn: string[];

  // Execution
  execute(input: AgentInput, context: SharedContext): Promise<AgentOutput>;

  // Can this agent improve its output with feedback?
  canRefine: boolean;
  refine?(feedback: string, previousOutput: AgentOutput): Promise<AgentOutput>;
}

interface AgentInput {
  city: CityData;
  nights: number;
  preferences: UserPreferences;
  previousAgentOutputs: Record<string, any>;
  refinementInstructions?: string;
}

interface AgentOutput {
  success: boolean;
  data: any;
  confidence: number; // 0-100
  gaps?: string[];    // What's missing?
  suggestions?: string[]; // Recommendations for other agents
}
```

### Worker Agent Definitions

#### 1. Story Agent
```yaml
name: StoryAgent
purpose: Create emotional narrative hook for the city
dependsOn: []
requiredInputs: [city, preferences]
outputs: [hook, narrative, differentiators]
canRefine: true

execution:
  - Analyze city characteristics
  - Consider user preferences (couple? foodie? adventure?)
  - Generate 1-line hook (e.g., "Venice of the Alps")
  - Generate 2-3 sentence narrative
  - Identify 3 differentiators

refinement_triggers:
  - Hook too generic
  - Narrative doesn't match preferences
  - Missing emotional connection
```

#### 2. Time Budget Agent
```yaml
name: TimeAgent
purpose: Calculate realistic time blocks for visit
dependsOn: []
requiredInputs: [city, nights, arrivalTime?, departureTime?]
outputs: [timeBlocks, totalUsableHours]
canRefine: false

execution:
  - Parse nights into actual time windows
  - 1 night = arrival afternoon (3-4h) + evening (3h) + next morning (2-3h)
  - 2 nights = add full day in middle
  - Assign mood to each block (explore, dine, activity, depart)

time_block_schema:
  - name: "Arrival Afternoon"
    hours: 4
    mood: explore
    flexiblity: high
```

#### 3. Cluster Generator Agent
```yaml
name: ClusterAgent
purpose: Group activities by geographic proximity into walkable experiences
dependsOn: [TimeAgent]
requiredInputs: [city, timeBlocks, preferences]
outputs: [clusters]
canRefine: true

execution:
  - Fetch places for city (Google Places API)
  - Filter by user preferences
  - Geographic clustering (k-means or DBSCAN on coordinates)
  - Calculate walking distances within cluster
  - Assign clusters to time blocks
  - Name clusters thematically

cluster_schema:
  - name: "Old Town Loop"
    theme: historic
    places: [Place, Place, Place]
    walkingMinutes: 45
    bestFor: afternoon
    centerPoint: { lat, lng }

refinement_triggers:
  - Cluster too spread out (> 60min walking)
  - Missing key preference matches
  - Empty time blocks
```

#### 4. Preference Matcher Agent
```yaml
name: PreferenceAgent
purpose: Score how well city matches user preferences
dependsOn: []
requiredInputs: [city, preferences]
outputs: [matchScore, reasons, warnings]
canRefine: true

execution:
  - Extract city characteristics
  - Compare against user preferences
  - Score each dimension (0-100)
  - Generate reasons for high scores
  - Generate warnings for mismatches
  - Calculate weighted overall score

output_schema:
  matchScore: 94
  reasons:
    - { preference: "Local cuisine", match: "Savoyard capital", score: 98 }
    - { preference: "Walkable", match: "Pedestrian old town", score: 95 }
  warnings:
    - { preference: "Nightlife", gap: "Limited options", score: 45 }
```

#### 5. Hidden Gems Agent
```yaml
name: GemsAgent
purpose: Find non-touristy local favorites
dependsOn: [PreferenceAgent]
requiredInputs: [city, preferences, matchReasons]
outputs: [hiddenGems]
canRefine: true

execution:
  - Search for places with high ratings but low review counts
  - Filter out famous landmarks
  - Prioritize based on user preferences
  - Generate "instead of" alternatives
  - Add insider tips

output_schema:
  hiddenGems:
    - name: "Le Freti"
      type: restaurant
      why: "Where locals go for authentic reblochon dishes"
      insteadOf: "Tourist lakefront restaurants"
      insiderTip: "Get the tartiflette, not the fondue"

refinement_triggers:
  - No gems found for key preference category
  - All gems are actually touristy
```

#### 6. Logistics Agent
```yaml
name: LogisticsAgent
purpose: Practical tips for visiting
dependsOn: []
requiredInputs: [city, transportMode]
outputs: [parking, tips, bestTimes, warnings]
canRefine: false

execution:
  - Research parking options (if driving)
  - Identify pedestrian zones
  - Find market days, festivals
  - Note closures, restrictions
  - Generate practical tips
```

#### 7. Weather Context Agent
```yaml
name: WeatherAgent
purpose: Weather-aware recommendations
dependsOn: [ClusterAgent]
requiredInputs: [city, travelDates, clusters]
outputs: [forecast, recommendations, riskAssessment]
canRefine: false

execution:
  - Fetch weather forecast
  - Identify outdoor activities in clusters
  - Flag weather risks
  - Suggest indoor alternatives
  - Note best times for photography
```

#### 8. Photo Spots Agent
```yaml
name: PhotoAgent
purpose: Instagram-worthy locations
dependsOn: []
requiredInputs: [city]
outputs: [photoSpots]
canRefine: false

execution:
  - Identify scenic viewpoints
  - Research best photography times
  - Note positioning tips
  - Flag crowded times
```

#### 9. Synthesis Agent (Special)
```yaml
name: SynthesisAgent
purpose: Combine all agent outputs into coherent city intelligence
dependsOn: [ALL_AGENTS]
requiredInputs: [allAgentOutputs]
outputs: [cityIntelligence]
canRefine: true

execution:
  - Validate all required data present
  - Check for contradictions
  - Ensure narrative consistency
  - Order clusters by time blocks
  - Generate final card data structure

refinement_triggers:
  - Missing required sections
  - Contradictory information
  - Narrative doesn't flow
```

---

## Shared Memory Architecture

All agents read from and write to a shared context that persists for the session.

```typescript
interface SharedMemory {
  // Session-level
  session: {
    id: string;
    startedAt: Date;
    userId?: string;
  };

  // Trip-level context
  trip: {
    origin: City;
    destination: City;
    startDate: Date;
    endDate: Date;
    totalNights: number;
    travellerType: string;
    transportMode: 'car' | 'train' | 'mixed';
  };

  // User preferences (inferred + explicit)
  preferences: {
    explicit: UserPreferences;      // From form/conversation
    inferred: InferredPreferences;  // From behavior
    combined: MergedPreferences;    // Weighted combination
  };

  // Per-city intelligence (the main output)
  cityIntelligence: Map<string, {
    city: CityData;
    status: 'pending' | 'processing' | 'complete' | 'failed';
    quality: number;
    iterations: number;

    // Agent outputs
    story?: StoryOutput;
    timeBlocks?: TimeBlocksOutput;
    clusters?: ClustersOutput;
    matchScore?: MatchScoreOutput;
    hiddenGems?: GemsOutput;
    logistics?: LogisticsOutput;
    weather?: WeatherOutput;
    photoSpots?: PhotoSpotsOutput;

    // Synthesis
    synthesized?: CityIntelligenceCard;
  }>;

  // Cross-city insights
  crossCityInsights: {
    themes: string[];           // Common themes across route
    varietyScore: number;       // Are cities diverse enough?
    paceScore: number;          // Is the trip well-paced?
    recommendations: string[];  // Trip-level suggestions
  };

  // Orchestrator state
  orchestrator: {
    currentGoal: Goal;
    currentPlan: Plan;
    executionLog: ExecutionEvent[];
    reflections: Reflection[];
  };

  // Agent communication (for cross-agent suggestions)
  agentMessages: {
    from: string;
    to: string;
    type: 'suggestion' | 'request' | 'warning';
    content: string;
    timestamp: Date;
  }[];
}
```

---

## SSE Event Protocol

The frontend receives real-time updates via Server-Sent Events.

```typescript
// Event types streamed to frontend
type SSEEvent =
  | { type: 'orchestrator_goal', goal: Goal }
  | { type: 'orchestrator_plan', plan: Plan, cityId: string }
  | { type: 'agent_started', agent: string, cityId: string }
  | { type: 'agent_progress', agent: string, cityId: string, progress: number }
  | { type: 'agent_complete', agent: string, cityId: string, output: any }
  | { type: 'agent_error', agent: string, cityId: string, error: string }
  | { type: 'reflection', cityId: string, quality: number, gaps: string[] }
  | { type: 'refinement_started', cityId: string, plan: RefinementPlan }
  | { type: 'city_complete', cityId: string, intelligence: CityIntelligence }
  | { type: 'all_complete', summary: TripIntelligenceSummary };

// Example event stream for one city:
data: {"type":"orchestrator_plan","plan":{...},"cityId":"annecy"}
data: {"type":"agent_started","agent":"TimeAgent","cityId":"annecy"}
data: {"type":"agent_started","agent":"StoryAgent","cityId":"annecy"}
data: {"type":"agent_started","agent":"PreferenceAgent","cityId":"annecy"}
data: {"type":"agent_complete","agent":"TimeAgent","cityId":"annecy","output":{...}}
data: {"type":"agent_complete","agent":"StoryAgent","cityId":"annecy","output":{...}}
data: {"type":"agent_complete","agent":"PreferenceAgent","cityId":"annecy","output":{...}}
data: {"type":"agent_started","agent":"ClusterAgent","cityId":"annecy"}
data: {"type":"agent_started","agent":"GemsAgent","cityId":"annecy"}
data: {"type":"agent_progress","agent":"ClusterAgent","cityId":"annecy","progress":50}
data: {"type":"agent_complete","agent":"ClusterAgent","cityId":"annecy","output":{...}}
data: {"type":"agent_complete","agent":"GemsAgent","cityId":"annecy","output":{...}}
data: {"type":"reflection","cityId":"annecy","quality":78,"gaps":["No restaurants"]}
data: {"type":"refinement_started","cityId":"annecy","plan":{...}}
data: {"type":"agent_started","agent":"GemsAgent","cityId":"annecy"}
data: {"type":"agent_complete","agent":"GemsAgent","cityId":"annecy","output":{...}}
data: {"type":"reflection","cityId":"annecy","quality":91,"gaps":[]}
data: {"type":"city_complete","cityId":"annecy","intelligence":{...}}
```

---

## Human-in-the-Loop Integration

The companion chat can influence the agent system.

### User Can:

1. **Request deeper exploration**
   ```
   User: "Tell me more about restaurants in Annecy"

   → Orchestrator receives signal
   → Creates targeted goal: "Deep dive on Annecy restaurants"
   → Dispatches GemsAgent with focus: "restaurants"
   → Streams results to companion AND updates city card
   ```

2. **Provide preferences**
   ```
   User: "We really love hiking"

   → Preference system updates
   → Orchestrator triggers re-evaluation
   → Affected agents re-run with new context
   → Match scores recalculate
   → Clusters may reorganize
   ```

3. **Challenge recommendations**
   ```
   User: "I heard Lyon is too crowded in summer"

   → Logged as user concern
   → LogisticsAgent re-runs for Lyon
   → Adds crowding warning
   → SynthesisAgent updates narrative
   ```

4. **Request comparison**
   ```
   User: "Compare Annecy vs Grenoble for food"

   → Orchestrator creates comparison goal
   → Runs targeted queries for both cities
   → Generates comparison artifact
   → Displays in companion
   ```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

```
Tasks:
├─ Create Orchestrator service
│   ├─ Goal parsing
│   ├─ Plan generation (Claude-powered)
│   ├─ Execution engine
│   └─ Reflection loop
│
├─ Create SharedMemory service
│   ├─ In-memory store
│   ├─ Session management
│   └─ Cross-agent messaging
│
├─ Create SSE streaming infrastructure
│   ├─ Event emitter
│   ├─ Client connection management
│   └─ Event type definitions
│
└─ Create base WorkerAgent class
    ├─ Common interface
    ├─ Execution wrapper
    └─ Error handling
```

### Phase 2: Core Agents (Week 2)

```
Tasks:
├─ TimeAgent (simplest - pure calculation)
├─ StoryAgent (Claude-powered narrative)
├─ PreferenceAgent (scoring logic)
├─ ClusterAgent (geographic clustering)
│   ├─ Google Places integration
│   ├─ Clustering algorithm
│   └─ Walking time calculation
│
└─ Integration tests
```

### Phase 3: Enhancement Agents (Week 3)

```
Tasks:
├─ GemsAgent (filtered search)
├─ LogisticsAgent (practical tips)
├─ WeatherAgent (forecast integration)
├─ PhotoAgent (viewpoints)
├─ SynthesisAgent (combination)
│
└─ End-to-end testing
```

### Phase 4: Frontend Integration (Week 4)

```
Tasks:
├─ New CityIntelligenceCard component
│   ├─ Progressive loading states
│   ├─ Time block visualization
│   ├─ Cluster cards
│   └─ Agent status indicators
│
├─ SSE client integration
│   ├─ Event handlers
│   ├─ State management
│   └─ Optimistic updates
│
├─ Map cluster visualization
│   ├─ Cluster markers
│   ├─ Walking route overlay
│   └─ Interactive selection
│
└─ Companion integration
    ├─ Agent status in sidebar
    ├─ Deep dive requests
    └─ Feedback mechanism
```

### Phase 5: Refinement & Polish (Week 5)

```
Tasks:
├─ Quality threshold tuning
├─ Refinement loop optimization
├─ Caching strategy
├─ Error recovery
├─ Performance optimization
│   ├─ Parallel execution tuning
│   ├─ Token budget management
│   └─ Response time targets
│
└─ Production deployment
```

---

## File Structure

```
server/
├─ services/
│   ├─ cityIntelligence/
│   │   ├─ Orchestrator.js           # Main orchestration loop
│   │   ├─ SharedMemory.js           # Shared context store
│   │   ├─ PlanGenerator.js          # Claude-powered planning
│   │   ├─ QualityReflector.js       # Output evaluation
│   │   └─ AgentExecutor.js          # Parallel execution engine
│   │
│   └─ agents/
│       ├─ BaseAgent.js              # Abstract base class
│       ├─ TimeAgent.js
│       ├─ StoryAgent.js
│       ├─ PreferenceAgent.js
│       ├─ ClusterAgent.js
│       ├─ GemsAgent.js
│       ├─ LogisticsAgent.js
│       ├─ WeatherAgent.js
│       ├─ PhotoAgent.js
│       └─ SynthesisAgent.js
│
├─ routes/
│   └─ cityIntelligence.js           # API endpoints + SSE
│
└─ utils/
    ├─ clustering.js                  # Geographic clustering algorithms
    └─ walkingTime.js                 # Distance calculations

spotlight-react/
├─ components/
│   └─ discovery/
│       ├─ CityIntelligenceCard.tsx   # Main card component
│       ├─ TimeBlockCard.tsx          # Time block display
│       ├─ ClusterCard.tsx            # Activity cluster
│       ├─ MatchScoreBadge.tsx        # Preference match
│       ├─ HiddenGemCard.tsx          # Insider tips
│       ├─ AgentStatusIndicator.tsx   # Loading states
│       └─ ClusterMapOverlay.tsx      # Map visualization
│
├─ hooks/
│   └─ useCityIntelligence.ts         # SSE subscription + state
│
└─ stores/
    └─ cityIntelligenceStore.ts       # Zustand store for agent state
```

---

## Quality Metrics

### Per-City Quality Score

```
Quality = weighted_average(
  story_quality * 0.15,
  time_coverage * 0.15,
  cluster_quality * 0.25,
  preference_match * 0.20,
  gems_quality * 0.10,
  logistics_completeness * 0.10,
  synthesis_coherence * 0.05
)

Thresholds:
  • >= 85: Complete, ship it
  • 70-84: Needs refinement
  • < 70: Critical gaps, multiple refinements needed
```

### Agent Quality Dimensions

```
story_quality:
  • Has hook? (0/1)
  • Narrative length (target: 2-3 sentences)
  • Mentions user preferences? (0/1)
  • Emotional resonance (Claude evaluation)

cluster_quality:
  • All time blocks covered? (0/1)
  • Walking time < 60min each? (0/1)
  • Places per cluster (target: 3-5)
  • Preference alignment (0-100)

preference_match:
  • Score > 70? (0/1)
  • Reasons provided? (0/1)
  • Warnings for gaps? (0/1)
```

---

## Example: Full City Intelligence Output

```json
{
  "cityId": "annecy-france",
  "city": {
    "name": "Annecy",
    "country": "France",
    "coordinates": { "lat": 45.899, "lng": 6.129 }
  },
  "quality": 91,
  "iterations": 2,

  "story": {
    "hook": "The Venice of the Alps",
    "narrative": "Crystal-clear canals wind through a medieval old town, all set against a backdrop of snow-capped mountains. It's where French sophistication meets Alpine adventure.",
    "differentiators": ["Alpine + French fusion", "Walkable historic center", "Lake life culture"]
  },

  "timeBlocks": [
    {
      "name": "Arrival Afternoon",
      "hours": 4,
      "mood": "explore",
      "suggested": "Old Town discovery"
    },
    {
      "name": "Evening",
      "hours": 3,
      "mood": "dine",
      "suggested": "Lakefront dinner"
    },
    {
      "name": "Next Morning",
      "hours": 3,
      "mood": "activity",
      "suggested": "Market or lake activity"
    }
  ],

  "clusters": [
    {
      "id": "old-town-loop",
      "name": "Old Town Loop",
      "theme": "historic",
      "bestFor": "afternoon",
      "walkingMinutes": 45,
      "centerPoint": { "lat": 45.899, "lng": 6.128 },
      "places": [
        {
          "name": "Pont des Amours",
          "type": "landmark",
          "description": "Iconic lovers' bridge with mountain views",
          "rating": 4.7
        },
        {
          "name": "Palais de l'Île",
          "type": "landmark",
          "description": "Medieval prison turned museum, sitting mid-canal",
          "rating": 4.5
        },
        {
          "name": "Château d'Annecy",
          "type": "museum",
          "description": "Castle with panoramic old town views",
          "rating": 4.4
        }
      ]
    },
    {
      "id": "lakefront-dinner",
      "name": "Lakefront Evening",
      "theme": "dining",
      "bestFor": "evening",
      "walkingMinutes": 20,
      "places": [
        {
          "name": "Le Freti",
          "type": "restaurant",
          "description": "Authentic Savoyard cuisine",
          "rating": 4.6,
          "priceLevel": 2
        },
        {
          "name": "Jardins de l'Europe",
          "type": "park",
          "description": "Lakeside gardens, perfect for sunset",
          "rating": 4.8
        }
      ]
    }
  ],

  "matchScore": {
    "score": 94,
    "reasons": [
      {
        "preference": "Local cuisine",
        "match": "Capital of Savoyard gastronomy",
        "score": 98
      },
      {
        "preference": "Walkable old towns",
        "match": "Entire center is pedestrian",
        "score": 95
      },
      {
        "preference": "Nature access",
        "match": "Lake + mountains immediate",
        "score": 92
      }
    ],
    "warnings": []
  },

  "hiddenGems": [
    {
      "name": "Le Freti",
      "type": "restaurant",
      "why": "Where locals go for authentic reblochon dishes",
      "insteadOf": "Tourist lakefront restaurants",
      "insiderTip": "Get the tartiflette, not the fondue"
    },
    {
      "name": "Beach 51",
      "type": "activity",
      "why": "Locals' favorite paddleboard spot",
      "insteadOf": "Crowded tourist boat tours",
      "insiderTip": "Arrive before 10am for calm water"
    }
  ],

  "logistics": {
    "parking": "P+R Sud (€5/day), 10min walk to center",
    "tips": [
      "Old town is pedestrian-only",
      "Tuesday & Friday are market days - busy but worth it"
    ],
    "warnings": [
      "Lake beaches free but crowded after 11am in summer"
    ]
  },

  "weather": {
    "forecast": "Partly cloudy, 22°C, possible afternoon showers",
    "recommendations": {
      "outdoorSafe": ["Morning", "Late afternoon"],
      "backup": "Castle museum if rain",
      "goldenHour": "7:45 PM"
    }
  },

  "photoSpots": [
    {
      "name": "Pont des Amours",
      "bestTime": "Golden hour (7:30pm summer)",
      "tip": "Position with mountains behind, lake in front"
    }
  ]
}
```

---

## Success Criteria

1. **User feels informed, not overwhelmed**
   - Clear hierarchy of information
   - Progressive disclosure
   - Actionable clusters, not lists

2. **Personalization is visible**
   - Match scores show relevance
   - Recommendations reflect preferences
   - Hidden gems feel curated

3. **Time-awareness is central**
   - "Your afternoon" not "100 things to do"
   - Clusters fit actual time windows
   - Pacing feels realistic

4. **Quality is self-monitored**
   - Agent system catches gaps
   - Refinement fills holes
   - Final output is coherent

5. **Experience is delightful**
   - Cards "come alive" as intelligence arrives
   - Agent activity creates anticipation
   - Discovery feels like magic, not work

---

## Open Questions

1. **Caching strategy**: How long to cache city intelligence? Per-user or global?
2. **Token budget**: How to balance quality vs. cost with multiple Claude calls?
3. **Fallbacks**: What if an agent fails? Graceful degradation?
4. **Cross-city optimization**: Should agents learn from one city to improve others?
5. **User feedback integration**: How does explicit feedback improve future runs?

---


---

*This document defines the blueprint for transforming RdTrip's discovery phase from static listings into a living, intelligent travel companion.*
