# Agentic Architecture Upgrade Plan

> **Document Version:** 1.0
> **Created:** December 2024
> **Status:** Planning Phase

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [The Upgrade Plan](#the-upgrade-plan)
   - [Phase 1: Enhanced Agent Loop](#phase-1-enhanced-agent-loop-week-1)
   - [Phase 2: Long-Term Memory](#phase-2-long-term-memory-week-2)
   - [Phase 3: Specialized Agent Routing](#phase-3-specialized-agent-routing-week-3)
   - [Phase 4: Goal Tracking & Progress](#phase-4-goal-tracking--progress-week-4)
   - [Phase 5: Proactive Agent Behavior](#phase-5-proactive-agent-behavior-week-5)
3. [Architecture Summary](#architecture-summary)
4. [Implementation Roadmap](#implementation-roadmap)
5. [Quick Wins](#quick-wins-can-do-this-week)

---

## Current State Assessment

### What We Already Have ✅

| Component | Status | Location |
|-----------|--------|----------|
| **Tool Loop** | ✅ Exists | `AgentOrchestrator.runAgentLoop()` - max 10 iterations |
| **Feedback Loops** | ✅ Exists | `CityActivityAgentV2` - discovery→validation→selection with retries |
| **Multi-Phase Orchestration** | ✅ Exists | `ItineraryAgentOrchestrator` - 6 phases |
| **Parallel Tool Execution** | ✅ Exists | `Promise.all` in executeTools |
| **Streaming** | ✅ Exists | SSE with heartbeat |
| **Context Awareness** | ✅ Exists | Page context, itinerary data, preferences |
| **Session Memory** | ✅ Exists | Database-backed conversations |

### What's Missing for State-of-the-Art ❌

| Gap | Impact | Priority |
|-----|--------|----------|
| **Explicit Planning Phase** | Agent doesn't decompose complex goals | 🔴 High |
| **Self-Reflection/Critique** | No quality check before responding | 🔴 High |
| **Long-Term Memory** | Forgets user across sessions | 🟡 Medium |
| **Proactive Behavior** | Only reacts, never initiates | 🟡 Medium |
| **Error Recovery Strategies** | Basic retry, no alternative approaches | 🟡 Medium |
| **Goal Tracking** | Doesn't track progress toward goals | 🟠 Medium |
| **Agent Handoffs** | Single agent does everything | 🟢 Low |

### Current Agent Classification

```
Level 1: Basic Chatbot          → Just conversation
Level 2: Tool-Augmented LLM     → Can call tools in a single turn  ← WE ARE HERE
Level 3: ReAct Agent            → Observe-Think-Act loop, multi-step
Level 4: Planning Agent         → Creates/executes plans, handles failures
Level 5: Multi-Agent System     → Specialized agents collaborating
Level 6: Autonomous Agent       → Self-directed, long-running, goal-seeking
```

**Target:** Move from Level 2 to Level 4-5

---

## The Upgrade Plan

### Phase 1: Enhanced Agent Loop (Week 1)

**Goal:** Make the existing loop smarter with planning and reflection

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    ENHANCED AGENT LOOP                          │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐ │
│  │  PLAN    │───▶│   ACT    │───▶│ OBSERVE  │───▶│ REFLECT  │ │
│  │          │    │          │    │          │    │          │ │
│  │ Decompose│    │ Execute  │    │ Parse    │    │ Critique │ │
│  │ goal into│    │ tools    │    │ results  │    │ quality  │ │
│  │ subtasks │    │          │    │          │    │          │ │
│  └──────────┘    └──────────┘    └──────────┘    └────┬─────┘ │
│       ▲                                               │        │
│       │                                               │        │
│       │          ┌──────────────┐                     │        │
│       └──────────│   REPLAN?    │◀────────────────────┘        │
│                  │              │                              │
│                  │ If quality   │                              │
│                  │ insufficient │                              │
│                  └──────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation

**File: `/server/services/AgentOrchestrator.js`**

```javascript
// New method: runAgenticLoop (replaces runAgentLoop)
async runAgenticLoop(userMessage, context, streamCallback, maxIterations = 10) {
  const conversationHistory = [];
  let iteration = 0;
  let goalAchieved = false;

  // STEP 1: PLANNING PHASE
  const plan = await this.createPlan(userMessage, context);
  streamCallback({ type: 'plan', plan: plan.steps });

  // STEP 2: EXECUTION LOOP
  while (!goalAchieved && iteration < maxIterations) {
    iteration++;

    // 2a. Determine next action based on plan progress
    const nextStep = this.getNextPlanStep(plan, conversationHistory);

    // 2b. ACT - Call Claude with current context
    const response = await this.callClaudeWithTools(
      nextStep.prompt,
      conversationHistory,
      context
    );

    // 2c. OBSERVE - Execute tools if called
    if (response.toolCalls.length > 0) {
      const toolResults = await this.executeTools(response.toolCalls, context, streamCallback);
      conversationHistory.push({ role: 'assistant', content: response.content });
      conversationHistory.push({ role: 'user', content: toolResults });
    }

    // 2d. REFLECT - Quality check
    const reflection = await this.reflectOnProgress(
      userMessage,
      plan,
      conversationHistory,
      response
    );

    if (reflection.needsImprovement) {
      // REPLAN - Adjust strategy
      plan.steps = await this.adjustPlan(plan, reflection.feedback);
      streamCallback({ type: 'replan', reason: reflection.feedback });
    } else if (reflection.goalAchieved) {
      goalAchieved = true;
    }
  }

  // STEP 3: FINAL RESPONSE
  return this.generateFinalResponse(conversationHistory, plan);
}

// Planning function
async createPlan(userMessage, context) {
  const planningPrompt = `
You are a planning agent. Analyze this user request and create a step-by-step plan.

User Request: "${userMessage}"

Context:
- Page: ${context.pageContext?.name}
- Has Itinerary: ${!!context.itineraryId}
- Has Route: ${!!context.routeData}

Create a plan with 1-5 steps. For each step:
1. What information is needed?
2. Which tool(s) to use?
3. What's the expected outcome?

Return JSON:
{
  "goal": "...",
  "complexity": "simple|medium|complex",
  "steps": [
    { "id": 1, "action": "...", "tools": ["..."], "expected": "..." }
  ]
}`;

  const response = await this.claudeClient.messages.create({
    model: 'claude-haiku-4-5-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: planningPrompt }]
  });

  return JSON.parse(response.content[0].text);
}

// Reflection function
async reflectOnProgress(originalGoal, plan, history, lastResponse) {
  const reflectionPrompt = `
You are a quality assurance agent. Evaluate if the response adequately addresses the user's goal.

Original Goal: "${originalGoal}"
Plan: ${JSON.stringify(plan)}
Last Response: "${lastResponse.text}"

Evaluate:
1. Does this fully answer the user's question?
2. Is the information accurate and complete?
3. Are there any gaps or missing details?
4. Should we gather more information?

Return JSON:
{
  "goalAchieved": boolean,
  "needsImprovement": boolean,
  "qualityScore": 1-10,
  "feedback": "..." // What to improve if needed
}`;

  const response = await this.claudeClient.messages.create({
    model: 'claude-haiku-4-5-20250514',
    max_tokens: 512,
    messages: [{ role: 'user', content: reflectionPrompt }]
  });

  return JSON.parse(response.content[0].text);
}
```

#### Key Features
- **Planning Phase**: Decomposes complex requests into steps
- **Reflection Loop**: Quality checks before responding
- **Replanning**: Adjusts strategy if initial approach fails
- **Progress Tracking**: Knows which steps are complete

#### Success Criteria
- [ ] Agent creates plans for complex requests
- [ ] Agent reflects on response quality
- [ ] Agent can replan when needed
- [ ] Streaming shows plan progress to user

---

### Phase 2: Long-Term Memory (Week 2)

**Goal:** Remember users across sessions

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MEMORY ARCHITECTURE                          │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  SHORT-TERM     │  │   LONG-TERM     │  │   EPISODIC      │ │
│  │  (Session)      │  │   (User Profile)│  │   (Experiences) │ │
│  │                 │  │                 │  │                 │ │
│  │ • Current chat  │  │ • Preferences   │  │ • Past trips    │ │
│  │ • Active tools  │  │ • Travel style  │  │ • Liked places  │ │
│  │ • Temp context  │  │ • Dietary needs │  │ • Saved ideas   │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│           │                   │                    │           │
│           └───────────────────┼────────────────────┘           │
│                               ▼                                │
│                    ┌─────────────────┐                         │
│                    │  MEMORY INDEX   │                         │
│                    │  (Vector DB)    │                         │
│                    └─────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation

**New File: `/server/services/LongTermMemory.js`**

```javascript
class LongTermMemory {
  constructor(supabase) {
    this.supabase = supabase;
  }

  // Store a memory
  async remember(userId, memoryType, content, metadata = {}) {
    const embedding = await this.generateEmbedding(content);

    await this.supabase.from('user_memories').insert({
      user_id: userId,
      memory_type: memoryType, // 'preference', 'experience', 'fact'
      content: content,
      embedding: embedding,
      metadata: metadata,
      importance: this.calculateImportance(content, memoryType),
      created_at: new Date()
    });
  }

  // Recall relevant memories
  async recall(userId, query, limit = 5) {
    const queryEmbedding = await this.generateEmbedding(query);

    const { data: memories } = await this.supabase.rpc('match_memories', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
      user_id: userId
    });

    return memories;
  }

  // Extract and store preferences from conversation
  async extractPreferences(userId, conversation) {
    const extractionPrompt = `
Analyze this conversation and extract user preferences:

${conversation}

Return JSON array of preferences:
[
  { "type": "dietary", "value": "vegetarian", "confidence": 0.9 },
  { "type": "pace", "value": "slow traveler", "confidence": 0.8 },
  ...
]`;

    const response = await claude.messages.create({
      model: 'claude-haiku-4-5-20250514',
      max_tokens: 512,
      messages: [{ role: 'user', content: extractionPrompt }]
    });

    const preferences = JSON.parse(response.content[0].text);

    for (const pref of preferences) {
      if (pref.confidence > 0.7) {
        await this.remember(userId, 'preference',
          `User ${pref.type}: ${pref.value}`,
          { type: pref.type, value: pref.value }
        );
      }
    }
  }
}
```

#### Database Schema

```sql
-- Add to Supabase
CREATE TABLE user_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  memory_type TEXT NOT NULL, -- 'preference', 'experience', 'fact', 'feedback'
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- For semantic search
  metadata JSONB DEFAULT '{}',
  importance FLOAT DEFAULT 0.5,
  last_accessed TIMESTAMP,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Vector similarity search function
CREATE FUNCTION match_memories(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  user_id UUID
) RETURNS TABLE (content TEXT, similarity FLOAT) AS $$
  SELECT content, 1 - (embedding <=> query_embedding) AS similarity
  FROM user_memories
  WHERE user_memories.user_id = match_memories.user_id
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
$$ LANGUAGE sql;
```

#### Key Features
- **Preference Extraction**: Automatically extracts preferences from conversations
- **Semantic Search**: Finds relevant memories using vector similarity
- **Memory Types**: Supports preferences, experiences, facts, feedback
- **Importance Scoring**: Prioritizes important memories

#### Success Criteria
- [ ] Agent remembers user preferences across sessions
- [ ] Agent can recall relevant past experiences
- [ ] Preferences influence recommendations
- [ ] User can view/edit their stored preferences

---

### Phase 3: Specialized Agent Routing (Week 3)

**Goal:** Route requests to specialized sub-agents

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AGENT ROUTER                                 │
│                                                                 │
│                    ┌──────────────┐                             │
│  User Request ───▶ │   ROUTER     │                             │
│                    │   AGENT      │                             │
│                    └──────┬───────┘                             │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                   │
│         ▼                 ▼                 ▼                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  DISCOVERY  │  │  ITINERARY  │  │   BOOKING   │             │
│  │   AGENT     │  │    AGENT    │  │    AGENT    │             │
│  │             │  │             │  │             │             │
│  │ • Add cities│  │ • Modify    │  │ • Hotels    │             │
│  │ • Explore   │  │ • Optimize  │  │ • Transport │             │
│  │ • Compare   │  │ • Schedule  │  │ • Reserve   │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           ▼                                     │
│                    ┌──────────────┐                             │
│                    │  SYNTHESIS   │                             │
│                    │    AGENT     │                             │
│                    └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation

**New File: `/server/services/AgentRouter.js`**

```javascript
class AgentRouter {
  constructor() {
    this.agents = {
      discovery: new DiscoveryAgent(),
      itinerary: new ItineraryAgent(),
      booking: new BookingAgent(),
      general: new GeneralAgent()
    };
  }

  async route(userMessage, context) {
    // Classify the intent
    const classification = await this.classifyIntent(userMessage, context);

    // Route to appropriate agent(s)
    if (classification.requiresMultiple) {
      // Multi-agent collaboration
      return this.runMultiAgentFlow(classification.agents, userMessage, context);
    }

    // Single agent
    const agent = this.agents[classification.primaryAgent];
    return agent.handle(userMessage, context);
  }

  async classifyIntent(userMessage, context) {
    const classificationPrompt = `
Classify this user request into agent categories:

Request: "${userMessage}"
Current Page: ${context.pageContext?.name}
Has Itinerary: ${!!context.itineraryId}

Categories:
- discovery: Adding cities, exploring options, comparing destinations
- itinerary: Modifying schedule, adding/removing activities, optimizing
- booking: Hotels, transport, reservations
- general: Weather, info, general questions

Return JSON:
{
  "primaryAgent": "...",
  "requiresMultiple": boolean,
  "agents": ["..."], // if multiple needed
  "reasoning": "..."
}`;

    const response = await claude.messages.create({
      model: 'claude-haiku-4-5-20250514',
      max_tokens: 256,
      messages: [{ role: 'user', content: classificationPrompt }]
    });

    return JSON.parse(response.content[0].text);
  }

  async runMultiAgentFlow(agentNames, userMessage, context) {
    const results = [];

    // Sequential execution with context passing
    let sharedContext = { ...context };

    for (const agentName of agentNames) {
      const agent = this.agents[agentName];
      const result = await agent.handle(userMessage, sharedContext);
      results.push({ agent: agentName, result });

      // Update shared context with result
      sharedContext = { ...sharedContext, previousResults: results };
    }

    // Synthesize results
    return this.synthesizeResults(results, userMessage);
  }
}
```

#### Key Features
- **Intent Classification**: Determines which agent(s) to use
- **Multi-Agent Collaboration**: Can use multiple agents for complex requests
- **Shared Context**: Agents can pass information to each other
- **Result Synthesis**: Combines outputs from multiple agents

#### Success Criteria
- [ ] Router correctly classifies intents
- [ ] Specialized agents handle their domains better
- [ ] Multi-agent flows work smoothly
- [ ] User experience is seamless (invisible routing)

---

### Phase 4: Goal Tracking & Progress (Week 4)

**Goal:** Track complex multi-step goals

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    GOAL TRACKER                                 │
│                                                                 │
│  User: "Help me plan a romantic anniversary trip to Italy"     │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ GOAL: Plan romantic anniversary trip to Italy               ││
│  │ Status: IN_PROGRESS (60%)                                   ││
│  │                                                             ││
│  │ Subtasks:                                                   ││
│  │ ✅ [DONE] Choose destinations                               ││
│  │ ✅ [DONE] Set dates and duration                            ││
│  │ 🔄 [IN PROGRESS] Find romantic restaurants                  ││
│  │ ⬚ [TODO] Book accommodations                                ││
│  │ ⬚ [TODO] Plan special anniversary dinner                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  Agent can:                                                     │
│  • Proactively ask about next steps                            │
│  • Remember goal across sessions                                │
│  • Track what's been completed                                  │
│  • Suggest next actions                                         │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation

**New File: `/server/services/GoalTracker.js`**

```javascript
class GoalTracker {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async createGoal(userId, goalDescription, context) {
    // Decompose goal into subtasks
    const decomposition = await this.decomposeGoal(goalDescription, context);

    const goal = {
      id: uuidv4(),
      user_id: userId,
      description: goalDescription,
      status: 'in_progress',
      progress: 0,
      subtasks: decomposition.subtasks,
      context: context,
      created_at: new Date()
    };

    await this.supabase.from('user_goals').insert(goal);
    return goal;
  }

  async decomposeGoal(goalDescription, context) {
    const prompt = `
Decompose this travel goal into actionable subtasks:

Goal: "${goalDescription}"
Context: ${JSON.stringify(context)}

Return JSON:
{
  "subtasks": [
    {
      "id": 1,
      "description": "...",
      "status": "todo",
      "dependencies": [], // IDs of subtasks that must complete first
      "tools_needed": ["..."],
      "estimated_turns": 1-3
    }
  ],
  "success_criteria": "How to know the goal is achieved"
}`;

    const response = await claude.messages.create({
      model: 'claude-haiku-4-5-20250514',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    });

    return JSON.parse(response.content[0].text);
  }

  async updateProgress(goalId, subtaskId, status, result) {
    const { data: goal } = await this.supabase
      .from('user_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    // Update subtask
    const subtasks = goal.subtasks.map(st =>
      st.id === subtaskId ? { ...st, status, result } : st
    );

    // Calculate progress
    const completed = subtasks.filter(st => st.status === 'done').length;
    const progress = Math.round((completed / subtasks.length) * 100);

    await this.supabase
      .from('user_goals')
      .update({ subtasks, progress, status: progress === 100 ? 'completed' : 'in_progress' })
      .eq('id', goalId);

    return { subtasks, progress };
  }

  async getNextAction(goalId) {
    const { data: goal } = await this.supabase
      .from('user_goals')
      .select('*')
      .eq('id', goalId)
      .single();

    // Find next actionable subtask (dependencies met)
    const completedIds = goal.subtasks
      .filter(st => st.status === 'done')
      .map(st => st.id);

    const nextSubtask = goal.subtasks.find(st =>
      st.status === 'todo' &&
      st.dependencies.every(dep => completedIds.includes(dep))
    );

    return nextSubtask;
  }
}
```

#### Database Schema

```sql
CREATE TABLE user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  description TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'abandoned'
  progress INTEGER DEFAULT 0,
  subtasks JSONB NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

#### Key Features
- **Goal Decomposition**: Breaks complex goals into subtasks
- **Progress Tracking**: Tracks completion percentage
- **Dependency Management**: Respects subtask dependencies
- **Persistence**: Goals survive across sessions

#### Success Criteria
- [ ] Complex goals are decomposed automatically
- [ ] Progress is tracked and displayed
- [ ] Agent suggests next actions proactively
- [ ] User can see goal status in UI

---

### Phase 5: Proactive Agent Behavior (Week 5)

**Goal:** Agent initiates helpful actions

#### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROACTIVE TRIGGERS                           │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   TIME      │  │   EVENT     │  │   CONTEXT   │             │
│  │  TRIGGERS   │  │  TRIGGERS   │  │  TRIGGERS   │             │
│  │             │  │             │  │             │             │
│  │ • Trip in   │  │ • Weather   │  │ • User idle │             │
│  │   3 days    │  │   changed   │  │   on page   │             │
│  │ • Morning   │  │ • Price     │  │ • Incomplete│             │
│  │   of trip   │  │   dropped   │  │   booking   │             │
│  │ • Check-out │  │ • Event     │  │ • Missing   │             │
│  │   reminder  │  │   nearby    │  │   info      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           ▼                                     │
│                    ┌──────────────┐                             │
│                    │  PROACTIVE   │                             │
│                    │   MESSAGE    │──────▶ Push Notification    │
│                    │  GENERATOR   │──────▶ In-App Alert         │
│                    └──────────────┘──────▶ Email                │
└─────────────────────────────────────────────────────────────────┘
```

#### Implementation

**New File: `/server/services/ProactiveAgent.js`**

```javascript
class ProactiveAgent {
  constructor(supabase, notificationService) {
    this.supabase = supabase;
    this.notifications = notificationService;
  }

  // Run periodically (cron job)
  async checkTriggers() {
    const triggers = await Promise.all([
      this.checkUpcomingTrips(),
      this.checkWeatherChanges(),
      this.checkIncompleteGoals(),
      this.checkPriceAlerts()
    ]);

    const allTriggers = triggers.flat();

    for (const trigger of allTriggers) {
      await this.handleTrigger(trigger);
    }
  }

  async checkUpcomingTrips() {
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: upcomingTrips } = await this.supabase
      .from('itineraries')
      .select('*, users(*)')
      .gte('start_date', new Date())
      .lte('start_date', threeDaysFromNow)
      .eq('reminder_sent', false);

    return upcomingTrips.map(trip => ({
      type: 'upcoming_trip',
      userId: trip.user_id,
      data: trip,
      message: `Your trip to ${trip.destination} is in 3 days! Want me to check the weather and confirm your reservations?`
    }));
  }

  async checkWeatherChanges() {
    // Find active trips
    const { data: activeTrips } = await this.supabase
      .from('itineraries')
      .select('*')
      .lte('start_date', new Date())
      .gte('end_date', new Date());

    const triggers = [];

    for (const trip of activeTrips) {
      const weather = await this.weatherService.getForecast(trip.current_city);

      if (weather.hasSignificantChange) {
        triggers.push({
          type: 'weather_change',
          userId: trip.user_id,
          data: { trip, weather },
          message: `Weather alert for ${trip.current_city}: ${weather.change}. Want me to suggest indoor alternatives?`
        });
      }
    }

    return triggers;
  }

  async handleTrigger(trigger) {
    // Generate proactive message
    const message = await this.generateProactiveMessage(trigger);

    // Send notification
    await this.notifications.send(trigger.userId, {
      type: trigger.type,
      message: message,
      actions: trigger.suggestedActions
    });

    // Log for analytics
    await this.supabase.from('proactive_interactions').insert({
      user_id: trigger.userId,
      trigger_type: trigger.type,
      message: message,
      created_at: new Date()
    });
  }
}
```

#### Key Features
- **Time-Based Triggers**: Trip reminders, check-out alerts
- **Event-Based Triggers**: Weather changes, price drops
- **Context-Based Triggers**: Incomplete bookings, idle users
- **Multi-Channel Notifications**: Push, in-app, email

#### Success Criteria
- [ ] Proactive reminders work for upcoming trips
- [ ] Weather changes trigger suggestions
- [ ] Users can configure notification preferences
- [ ] Analytics track proactive interaction success

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STATE-OF-THE-ART AGENTIC ARCHITECTURE                │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                         USER INTERFACE                             │ │
│  │  AgentProvider + Chat UI + Notifications + Proactive Alerts       │ │
│  └───────────────────────────────────┬───────────────────────────────┘ │
│                                      │                                  │
│  ┌───────────────────────────────────▼───────────────────────────────┐ │
│  │                         AGENT ROUTER                               │ │
│  │  Intent Classification → Agent Selection → Multi-Agent Routing    │ │
│  └─────────┬─────────────────┬─────────────────┬─────────────────────┘ │
│            │                 │                 │                        │
│  ┌─────────▼─────┐ ┌─────────▼─────┐ ┌─────────▼─────┐                 │
│  │  DISCOVERY    │ │  ITINERARY    │ │   BOOKING     │                 │
│  │    AGENT      │ │    AGENT      │ │    AGENT      │                 │
│  └───────────────┘ └───────────────┘ └───────────────┘                 │
│            │                 │                 │                        │
│  ┌─────────▼─────────────────▼─────────────────▼─────────────────────┐ │
│  │                    ENHANCED AGENT LOOP                             │ │
│  │                                                                    │ │
│  │   PLAN ───▶ ACT ───▶ OBSERVE ───▶ REFLECT ───▶ REPLAN?           │ │
│  │                                                                    │ │
│  └───────────────────────────┬───────────────────────────────────────┘ │
│                              │                                          │
│  ┌───────────────────────────▼───────────────────────────────────────┐ │
│  │                       TOOL LAYER                                   │ │
│  │  25+ Tools: Search, Weather, Modify, Book, Navigate, etc.         │ │
│  └───────────────────────────┬───────────────────────────────────────┘ │
│                              │                                          │
│  ┌───────────────────────────▼───────────────────────────────────────┐ │
│  │                      MEMORY LAYER                                  │ │
│  │                                                                    │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │ │
│  │  │ Session  │  │Long-Term │  │  Goal    │  │ Episodic │          │ │
│  │  │ Memory   │  │ Memory   │  │ Tracker  │  │ Memory   │          │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘          │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │                    PROACTIVE LAYER                                 │ │
│  │  Time Triggers + Event Triggers + Context Triggers                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Roadmap

| Week | Phase | Effort | Impact | Dependencies |
|------|-------|--------|--------|--------------|
| **Week 1** | Enhanced Agent Loop (Plan/Reflect) | 3-4 days | 🔴 High | None |
| **Week 2** | Long-Term Memory | 3-4 days | 🟡 Medium | Supabase pgvector |
| **Week 3** | Agent Router | 2-3 days | 🟡 Medium | Phase 1 |
| **Week 4** | Goal Tracking | 2-3 days | 🟠 Medium | Phase 2 |
| **Week 5** | Proactive Behavior | 3-4 days | 🟢 Nice-to-have | Phases 2, 4 |

### Critical Path
```
Phase 1 (Required) → Phase 3 (Depends on 1)
                  ↘
Phase 2 (Parallel) → Phase 4 (Depends on 2) → Phase 5 (Depends on 2, 4)
```

---

## Quick Wins (Can Do This Week)

These require minimal code changes but provide immediate value:

### 1. Add Planning Step (2 hours)
Before tool execution, have Claude create a 1-3 step plan and show it to user.

### 2. Add Reflection Step (2 hours)
After response, quick quality check. If score < 7, gather more info.

### 3. Persist User Preferences (3 hours)
Store extracted preferences in existing database tables.

### 4. Goal Detection (2 hours)
Detect multi-step goals in user messages and acknowledge the plan.

---

## Files to Create/Modify

### New Files
- `/server/services/LongTermMemory.js`
- `/server/services/AgentRouter.js`
- `/server/services/GoalTracker.js`
- `/server/services/ProactiveAgent.js`
- `/server/jobs/proactiveChecks.js` (cron job)

### Modified Files
- `/server/services/AgentOrchestrator.js` (add planning/reflection)
- `/server/services/ToolRegistry.js` (add memory tools)
- `/spotlight-react/src/contexts/AgentProvider.tsx` (goal UI)
- `/spotlight-react/src/components/agent/GoalProgress.tsx` (new component)

### Database Migrations
- `user_memories` table with vector column
- `user_goals` table
- `proactive_interactions` table

---

## Success Metrics

After implementation, measure:

| Metric | Current | Target |
|--------|---------|--------|
| Multi-turn task completion | ~60% | 90%+ |
| User preference recall | 0% | 80%+ |
| Proactive engagement rate | 0% | 20%+ |
| Complex goal tracking | None | Full |
| Agent classification | Level 2 | Level 4-5 |

---

## Next Steps

1. **Review this plan** and prioritize phases
2. **Start Phase 1** - Enhanced Agent Loop
3. **Set up pgvector** in Supabase for Phase 2
4. **Create database migrations** for new tables
5. **Implement and test** phase by phase

Ready to begin Phase 1 when you are!
