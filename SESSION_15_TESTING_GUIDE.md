# SESSION 15: Testing & Optimization Guide

## Overview
SESSION 15 adds performance monitoring, cache warming, and provides a comprehensive testing guide for validating the two-phase city generation system.

## Changes Implemented

### 1. Performance Timing Logs ⏱️
Added detailed timing logs to track Phase 1 and Phase 2 performance:

```javascript
// Phase 1 timing
const phase1Start = Date.now();
// ... generation code ...
const phase1Duration = Date.now() - phase1Start;
console.log(`✅ Phase 1 complete for ${cityName} in ${phase1Duration}ms (${(phase1Duration/1000).toFixed(2)}s)`);

// Phase 2 timing
const phase2Start = Date.now();
// ... generation code ...
const phase2Duration = Date.now() - phase2Start;
const totalDuration = Date.now() - phase1Start;
console.log(`✅ Phase 2 complete for ${cityName} in ${phase2Duration}ms (${(phase2Duration/1000).toFixed(2)}s)`);
console.log(`⏱️  Total generation time for ${cityName}: ${totalDuration}ms (${(totalDuration/1000).toFixed(2)}s)`);
```

### 2. Cache Warming Enabled 🔥
Enabled automatic cache warming for 20 popular European cities on server startup:
- Paris, Barcelona, Rome, Amsterdam, Prague
- Vienna, Lisbon, Budapest, Berlin, Copenhagen
- Dublin, Edinburgh, Bruges, Santorini, Venice
- Florence, Lyon, Porto, Krakow, Seville

**Benefits:**
- Popular cities load instantly (< 50ms from database)
- No waiting for first-time users
- Reduced API costs (cached cities don't hit Perplexity)

### 3. Updated Cache Warming to Use Two-Phase System
Cache warming now uses `generateCityDetailsFull()` to generate complete city data:
- Saves directly to database with `generation_phase='complete'`
- Runs in background during server startup
- Adds 2-second delay between cities to avoid rate limiting

## Testing Guide for Users

### Test 1: Phase 1 Speed (Target: < 10 seconds)
**Test an uncached city and measure time to Phase 1 completion:**

1. Open Results or Spotlight page
2. Click on a city NOT in the cache warming list (e.g., "Nantes", "Toulouse", "Strasbourg")
3. Start timer when modal opens
4. Note when basic content appears (hero image, tagline, 3-4 highlights)
5. **Expected**: Basic content appears within **5-10 seconds**

**Check Heroku logs:**
```bash
heroku logs --tail | grep "Phase 1 complete"
```
Look for: `✅ Phase 1 complete for Nantes in 8234ms (8.23s)`

### Test 2: Phase 2 Reliability (Target: No timeouts)
**Verify Phase 2 completes within 60 seconds:**

1. Continue watching the same modal from Test 1
2. Note when loading placeholders appear for restaurants, hotels, events
3. Note when full details fill in (restaurants section, hotels section, events)
4. **Expected**: Full details appear within **30-45 seconds after Phase 1**

**Check Heroku logs:**
```bash
heroku logs --tail | grep "Phase 2 complete"
```
Look for: `✅ Phase 2 complete for Nantes in 42156ms (42.16s)`
And: `⏱️  Total generation time for Nantes: 50390ms (50.39s)`

### Test 3: Cache Behavior (Target: Instant load)
**Verify cached cities load instantly:**

1. Click on a popular city from the cache warming list (e.g., "Paris", "Barcelona", "Rome")
2. **Expected**: Full city details appear **instantly (< 1 second)** with NO loading placeholders
3. Modal should show complete data immediately (no progressive loading)

**Check Heroku logs:**
```bash
heroku logs --tail | grep "Cache HIT"
```
Look for: `✅ Cache HIT! Loading instantly`

### Test 4: UX Transitions (Target: Smooth & Clear)
**Evaluate the progressive loading experience:**

1. Click an uncached city
2. Observe:
   - **Spinner appears** → "Getting basic city info..."
   - **Phase 1 appears** → Hero, tagline, highlights visible
   - **Loading placeholders** → "Finding the best restaurants...", "Searching for accommodations...", etc.
   - **Phase 2 fills in** → Restaurants, hotels, events smoothly replace placeholders
3. **Expected behaviors:**
   - No jarring jumps or layout shifts
   - Loading placeholders clearly communicate what's loading
   - Framer Motion animations are smooth
   - No flickering or content disappearing

### Test 5: Error Handling (Target: Graceful failures)
**Test timeout scenarios:**

1. If a city times out during Phase 1:
   - User sees error message: "⏱️ Generation took too long..."
   - Retry button is available
2. If Phase 2 times out (rare):
   - User still has Phase 1 data (better than nothing)
   - Error message appears but doesn't lose existing content

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Phase 1 Speed** | < 10 seconds | Check logs: "Phase 1 complete for X in Xms" |
| **Phase 2 Speed** | < 60 seconds | Check logs: "Phase 2 complete for X in Xms" |
| **Total Time** | < 70 seconds | Check logs: "Total generation time for X: Xms" |
| **Cached Load** | < 1 second | User experience + logs: "Cache HIT!" |
| **Timeout Rate** | < 5% | Monitor failed jobs vs successful jobs |

## Monitoring Commands

### View Phase Timing
```bash
heroku logs --tail | grep -E "Phase 1 complete|Phase 2 complete|Total generation"
```

### View Cache Warming Status
```bash
heroku logs | grep -E "Cache warming|Cache warmed"
```

### View Cache Hits
```bash
heroku logs --tail | grep "Cache HIT"
```

### View Timeout Errors
```bash
heroku logs --tail | grep -E "timeout|took too long"
```

### View All Phase Activity
```bash
heroku logs --tail | grep -E "🚀 Phase|✅ Phase|⏱️  Total"
```

## Expected Log Output Example

**Successful Two-Phase Generation:**
```
2025-10-28T16:00:10Z 🚀 Phase 1: Quick generation for Nantes - Starting at 2025-10-28T16:00:10.123Z
2025-10-28T16:00:18Z ✅ Phase 1 complete for Nantes in 8234ms (8.23s)
2025-10-28T16:00:18Z ✅ Phase 1 complete for Nantes, starting Phase 2...
2025-10-28T16:00:18Z 🚀 Phase 2: Full generation for Nantes - Starting at 2025-10-28T16:00:18.357Z
2025-10-28T16:01:00Z ✅ Phase 2 complete for Nantes in 42156ms (42.16s)
2025-10-28T16:01:00Z ⏱️  Total generation time for Nantes: 50390ms (50.39s)
2025-10-28T16:01:00Z ✅ Job job-abc123 completed successfully for Nantes (2-phase generation)
```

**Cached City Load:**
```
2025-10-28T16:02:00Z ✅ Cache HIT! Loading instantly. Timing: { query: 45ms }
```

**Cache Warming on Startup:**
```
2025-10-28T15:40:38Z 🔥 Starting cache warming for 20 popular cities...
2025-10-28T15:40:38Z 🔥 Cache warming status: 6 already cached, 14 generating...
2025-10-28T15:41:25Z ✅ Cache warmed: Amsterdam
2025-10-28T15:42:10Z ✅ Cache warmed: Copenhagen
... (continues for all 20 cities)
```

## Troubleshooting

### Phase 1 Taking > 10 Seconds
**Possible causes:**
- Perplexity API slow response
- High API load
- Network latency

**Solutions:**
- Check Perplexity API status
- Reduce Phase 1 prompt further (fewer highlights)
- Lower max_tokens to 1000 (currently 1500)

### Phase 2 Timing Out
**Possible causes:**
- City has limited online data
- Perplexity API overloaded
- Complex city requiring more processing

**Solutions:**
- User still gets Phase 1 data (better than nothing)
- Retry button available
- Logs show which attempt failed

### Cache Warming Failing
**Possible causes:**
- API rate limits
- Server memory constraints
- Network issues during startup

**Solutions:**
- Check logs: `heroku logs | grep "Failed to warm cache"`
- Cities will be generated on first user request (not critical)
- Increase delay between cities (currently 2 seconds)

## Success Criteria

✅ **Phase 1:** Consistently completes in < 10 seconds
✅ **Phase 2:** Consistently completes in < 60 seconds
✅ **Cache:** Instant loads (< 1s) for popular cities
✅ **UX:** Smooth transitions, clear loading states
✅ **Errors:** Graceful handling with retry options
✅ **Monitoring:** Clear timing logs for performance tracking

## Next Steps (Optional Improvements)

1. **Reduce Phase 1 prompt further** if still > 10s
2. **Add Phase 1 caching** (quick data expires faster)
3. **Implement smart cache warming** (user behavior analysis)
4. **Add Sentry monitoring** for real-time error tracking
5. **Implement Phase 2 retries** (if Phase 1 succeeded)
