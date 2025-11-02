# 🧠 PHASE 2: AGENTIC COORDINATION - Implementation Plan

## ✅ Completed So Far

### **1. SharedContext** ✅ DONE
**File:** `server/agents/core/SharedContext.js` (500+ lines)

**What it does:**
- Central "memory" for all agents
- Knowledge base (constraints, validated places, invalid places, preferences, state)
- Decision logging (every choice tracked with reasoning)
- Agent communication log
- Statistics tracking (activity types, energy levels, budget)
- Diversification logic
- Budget tracking
- Performance reporting

**Key Methods:**
- `recordDecision(decision)` - Log every choice with reasoning
- `logCommunication(from, to, message)` - Track agent interactions
- `addValidatedPlace(place)` - Cache validated places
- `markPlaceInvalid(placeName, reason)` - Learn from failures
- `needsDiversification()` - Intelligent analysis for variety
- `getScheduleStatistics()` - Context for strategic decisions

### **2. StrategicDiscoveryAgent** ✅ DONE
**File:** `server/agents/discovery/StrategicDiscoveryAgent.js` (450+ lines)

**What it does:**
- REASONS about what to discover (not just blindly queries)
- Builds strategy based on SharedContext
- Discovers 3-5 CANDIDATES (not final choices)
- Context-aware prompts (budget, diversification, time-of-day, failures)
- Tracks reasoning for every discovery

**Key Innovations:**
- **Strategy Building:** Analyzes 9 different factors:
  1. Diversification (avoid over-represented activity types)
  2. Budget awareness (free/cheap when budget low)
  3. Time-of-day (morning vs evening activities)
  4. Day of week (Monday museums often closed)
  5. Energy level balancing (not all high-energy)
  6. Travel style alignment
  7. Learn from failures (avoid previously invalid places)
  8. Location continuity (prefer nearby)
  9. Window duration (quick vs immersive)

- **Candidate Discovery:** Returns 3-5 options for selection (not just 1)
- **Decision Logging:** Every discovery tracked with strategy reasoning

---

## 🚧 Still To Build

### **3. OrchestratorAgent v2** (Next!)
**File:** `server/agents/core/OrchestratorAgent.js`

**Purpose:** Coordinate the complete Discovery → Validation → Selection loop with feedback

**Flow:**
```
discoverAndSelectActivity(request, maxAttempts=3):
  Attempt 1:
    Discovery:  3-5 candidates from StrategicDiscoveryAgent
    Validation: Validate each candidate
    Selection:  Score & rank valid candidates, select best
    Feedback:   If no valid → analyze failures, update strategy

  Attempt 2 (if needed):
    Discovery:  3-5 NEW candidates (learned from failures)
    Validation: Validate each
    Selection:  Select best
    ...

  Return: Best activity OR failure after 3 attempts
```

**Key Methods:**

```javascript
// Main coordination loop
async discoverAndSelectActivity(request, maxAttempts = 3)

// Phase 2: Validate all candidates
async validateCandidates(candidates, request)

// Phase 3: Score and select best
async selectBestCandidate(validCandidates, request)

// Phase 4: Analyze failures for feedback
analyzeValidationFailures(candidates, validationResults)

// Update request based on learnings
updateRequestWithFeedback(request, failureAnalysis)

// Helper: Calculate distance between coordinates
calculateDistance(coord1, coord2)
```

**Scoring Algorithm:**
```javascript
score = 0
+ qualityScore * 40        // Google Places quality (40 points)
+ rating bonus (0-20)       // 4.5+ = 20pts, 4.0+ = 10pts
+ strategic fit (0-20)      // How well matches strategy
+ proximity bonus (0-15)    // Close to previous location
+ availability (0-5)        // High confidence it's open
= Total score (0-100)
```

**Feedback Loop Logic:**
```
Failures detected:
  - Closed places → Emphasize opening hours in next discovery
  - Not found → Require exact addresses, prefer well-known
  - Ambiguous → Avoid similar names

Update request constraints and try again
```

---

### **4. Refactor CityActivityAgent** (Integration)
**File:** `server/agents/CityActivityAgent.js` (modify existing)

**Current Flow:**
```
generate() →
  Perplexity (final activities) →
  Validation (optional) →
  Return
```

**New Flow:**
```
generate(sharedContext) →
  For each activity window:
    OrchestratorAgent.discoverAndSelectActivity() →
      Discovery (3-5 candidates) →
      Validation (all candidates) →
      Selection (best one) →
      Feedback loop if needed
  Return validated & selected activities
```

**Changes Required:**
1. Accept `SharedContext` parameter
2. Replace direct Perplexity calls with `OrchestratorAgent`
3. Iterate through windows with feedback loops
4. Log all decisions to SharedContext
5. Update state after each activity

---

### **5. Update ItineraryAgentOrchestrator** (Integration)
**File:** `server/agents/ItineraryAgentOrchestrator.js` (modify existing)

**Changes:**
1. Create `SharedContext` at start
2. Pass to all agents
3. Log high-level orchestration decisions
4. Persist decisions to database at end
5. Generate summary report

**New Flow:**
```javascript
async generateCompleteAsync() {
  // Create shared context
  const sharedContext = new SharedContext(
    this.itineraryId,
    this.routeData,
    this.preferences,
    this.db
  );

  // Day Planning (no change)
  this.results.dayStructure = await this.runDayPlannerAgent();

  // Activities (NEW: with agentic coordination)
  const activityAgent = new CityActivityAgent(
    this.routeData,
    this.results.dayStructure,
    this.onProgress,
    this.db,
    this.itineraryId,
    sharedContext  // NEW: Pass shared context
  );
  this.results.activities = await activityAgent.generate();

  // Restaurants (can add later)
  // ...

  // Save decisions to database
  await sharedContext.persistDecisions();

  // Generate summary
  const summary = sharedContext.generateSummary();
  console.log('📊 Agentic System Summary:', summary);

  return this.results;
}
```

---

### **6. Database Schema for Decision Logs** (New table)
**File:** `server/migrations/010_decision_logs.sql`

```sql
CREATE TABLE IF NOT EXISTS decision_logs (
  id SERIAL PRIMARY KEY,
  itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
  phase VARCHAR(50) NOT NULL,
  agent_name VARCHAR(100),
  decision_data JSONB NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_decision_logs_itinerary ON decision_logs(itinerary_id);
CREATE INDEX idx_decision_logs_phase ON decision_logs(phase);
CREATE INDEX idx_decision_logs_timestamp ON decision_logs(timestamp);
```

**Purpose:** Store all agent decisions for:
- Debugging
- Learning
- Explainability
- User transparency ("Why did you choose this?")

---

### **7. Testing Script**
**File:** `server/scripts/testAgenticPipeline.js`

**What it tests:**
- SharedContext creation and state management
- StrategicDiscoveryAgent strategy building
- Discovery of 3-5 candidates
- OrchestratorAgent coordination
- Validation of candidates
- Selection logic
- Feedback loops when validation fails
- Decision logging throughout

**Test Scenarios:**
1. **Happy Path:** All candidates validate, select best
2. **Partial Validation:** Some candidates valid, some not
3. **All Invalid:** Trigger feedback loop, regenerate
4. **Budget Constraint:** Test budget-aware discovery
5. **Diversification:** Test activity type balancing
6. **Monday Test:** Test closed-on-Monday logic

---

## 🎯 Implementation Order

### **Phase 2.1** (Now):
1. ✅ SharedContext
2. ✅ StrategicDiscoveryAgent
3. 🚧 OrchestratorAgent v2
4. 🚧 Database migration for decision logs

### **Phase 2.2** (Next):
5. Refactor CityActivityAgent to use OrchestratorAgent
6. Update ItineraryAgentOrchestrator
7. Create testing script
8. Test end-to-end

### **Phase 2.3** (Polish):
9. Add RestaurantAgent integration (same pattern)
10. Add decision explainability endpoint
11. Add performance monitoring
12. Deploy to production

---

## 💡 Key Design Principles

### **1. Candidate-Based Selection**
- Discovery returns 3-5 options
- Validation checks all
- Selection picks best from valid ones
- NOT: Discover 1 → Validate → Done

### **2. Feedback Loops**
- When validation fails, analyze WHY
- Update discovery strategy
- Try again with learned constraints
- NOT: Give up after first failure

### **3. Decision Transparency**
- Every choice logged with reasoning
- "Why X? Because high rating, close to hotel, fits budget"
- "Why not Y? Because closed on Monday"
- User can see reasoning chain

### **4. Shared Memory**
- All agents read/write to SharedContext
- Learn from each other's discoveries
- Don't retry known failures
- Build cumulative knowledge

### **5. Strategic Thinking**
- NOT: "Find a museum"
- YES: "Find a museum that's open Monday, under €10, near previous location, and we need relaxed activity for balance"

---

## 📊 Expected Outcomes

### **Before (Phase 1+2):**
```
40 activities discovered by Perplexity
→ 27 validated (68%)
→ 13 kept anyway (unvalidated)
→ No feedback, no alternatives
```

### **After (Phase 2 Complete):**
```
40 activities needed
→ Discover 3-5 candidates each (160-200 candidates total)
→ Validate all candidates
→ Select best valid candidate
→ If none valid: Feedback loop → Discover new candidates → Validate
→ Expected: 90-95% validation rate
→ All activities have decision log with reasoning
→ User sees "Why this place?" for every recommendation
```

### **User Experience:**
```
Before:
"Musée Granet" ⭐ 4.4
[Selected because... ¯\_(ツ)_/¯]

After:
"Musée Granet" ⭐ 4.4 (Selected from 5 candidates)
✅ Confidence: 92%
📋 Why selected:
  • Highest quality score (0.89)
  • Open during scheduled time (10:00-18:00)
  • 5-minute walk from previous location
  • Matches culture travel style
  • Balances energy level (3 high-energy activities scheduled)

❌ Alternatives considered:
  • Atelier Cézanne - Closed on Monday
  • Pavillon Vendôme - 20-minute walk (too far)
  • Fondation Vasarely - Lower rating (3.9 vs 4.4)
```

---

## 🚀 Next Steps

**Immediate:**
1. Build OrchestratorAgent v2 with full coordination logic
2. Create decision_logs database table
3. Test coordination loop in isolation

**Then:**
4. Integrate into CityActivityAgent
5. Update ItineraryAgentOrchestrator
6. Test end-to-end on real itinerary
7. Deploy

**Status:** 40% complete (2/5 core components done)
**ETA:** Phase 2 can be complete in this session!

---

*This is where the system becomes truly agentic - not just validation, but intelligent reasoning, feedback loops, and transparent decision-making.*
