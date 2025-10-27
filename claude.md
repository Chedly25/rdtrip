# RDTrip - Claude Context Documentation

**Last Updated:** October 27, 2025
**Heroku Version:** v1036
**Project Status:** Production deployment at https://rdtrip-4d4035861576.herokuapp.com/

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Critical Code Sections](#critical-code-sections)
4. [Debugging Best Practices](#debugging-best-practices)
5. [Deployment & Build Process](#deployment--build-process)
6. [Known Issues & Solutions](#known-issues--solutions)
7. [Development Workflow](#development-workflow)

---

## Project Overview

RDTrip is a road trip planning application that uses AI agents to generate personalized multi-day routes from Aix-en-Provence to various European destinations. The application features:

- **AI Agent System**: 4 specialized agents (Adventure, Culture, Food, Hidden Gems) that generate routes based on different travel styles
- **City Optimization**: Backend algorithm that selects optimal intermediate cities based on geographic scoring
- **Interactive Map**: Spotlight view with Mapbox integration showing the route and waypoints
- **Route Alternatives**: Each agent provides main route + alternative cities for flexibility

### Tech Stack
- **Backend**: Node.js/Express (server.js)
- **Frontend**:
  - Landing page: React (landing-react/)
  - Route spotlight: React (spotlight-react/)
  - Served as static files from public/
- **APIs**:
  - Perplexity AI for route generation
  - Mapbox for mapping and geocoding
  - Wikipedia API for city images
- **Deployment**: Heroku
- **Database**: PostgreSQL (for user authentication)

---

## Architecture

### High-Level Data Flow

```
User Request → Express Server → Perplexity AI (route generation)
                     ↓
            City Optimization Algorithm
                     ↓
              Store in Memory (routeJobs)
                     ↓
         Frontend polls /api/route-status
                     ↓
    Spotlight React App (display + Mapbox)
```

### Directory Structure

```
rdtrip/
├── server.js                    # Main Express server
├── utils/
│   ├── cityOptimization.js      # Route optimization algorithm
│   └── password.js              # Auth utilities
├── public/                      # Static files served by Express
│   ├── index.html              # Landing page
│   ├── spotlight.html          # Route spotlight page
│   └── assets/                 # Built JS/CSS files
├── spotlight-react/            # Spotlight React source
│   ├── src/
│   │   ├── App.tsx            # Main app, coordinate extraction
│   │   ├── stores/            # Zustand state management
│   │   └── components/        # React components
│   └── dist/                  # Build output (copied to public/)
├── landing-react/              # Landing page React source
│   └── src/
│       └── components/
│           └── RouteResults.tsx  # Route display component
└── db/                        # Database connection
```

---

## Critical Code Sections

### 1. Route Generation Flow (server.js)

**Location**: Lines 701-950

**Key Points**:
- POST `/api/generate-route` creates a job and returns jobId immediately
- Background processing in `processRouteJob()` runs agents sequentially
- Each agent's response goes through `selectOptimalCities()` for optimization
- Results stored in `routeJobs` Map with job status tracking

**Important**: Always process agents sequentially to avoid Perplexity API timeouts.

```javascript
// Line 828-833: City optimization is applied here
const optimized = selectOptimalCities(
  parsedResult.waypoints,
  parsedResult.origin,
  parsedResult.destination,
  stops
);
```

### 2. City Optimization Algorithm (utils/cityOptimization.js)

**Location**: Lines 140-243

**What It Does**:
1. Filters out origin/destination from candidates
2. Validates all cities have numeric latitude/longitude coordinates
3. **Detects and fixes swapped coordinates** (Europe-specific heuristic)
4. Scores each city based on:
   - Distance from straight line (lower is better)
   - Position along route (0-1 normalized)
   - Whether city is between origin and destination
5. Selects top N cities, sorts by route position

**Critical Function - Coordinate Swap Detection**:

```javascript
// Lines 129-153
function detectAndFixSwappedCoordinates(obj) {
  const lat = obj.latitude;
  const lon = obj.longitude;

  // For Europe: latitude is typically larger than longitude
  // Latitude: 35-70, Longitude: -10 to 50
  // If lat < lon, they're likely swapped
  const isEurope = (Math.abs(lat) >= 35 && Math.abs(lat) <= 70) ||
                   (Math.abs(lon) >= 35 && Math.abs(lon) <= 70);

  if (isEurope && lat < lon) {
    console.warn(`⚠️  Detected swapped coordinates for ${obj.name}: lat=${lat}, lon=${lon} -> swapping`);
    return {
      ...obj,
      latitude: lon,
      longitude: lat
    };
  }

  // Also check if latitude is obviously out of range
  if (Math.abs(lat) > 90) {
    console.warn(`⚠️  Invalid latitude for ${obj.name}: swapping`);
    return {
      ...obj,
      latitude: lon,
      longitude: lat
    };
  }

  return obj;
}
```

**Why This Exists**: Perplexity API sometimes returns coordinates in (longitude, latitude) order instead of (latitude, longitude), causing cities to appear in wrong locations.

### 3. Frontend Coordinate Extraction (spotlight-react/src/App.tsx)

**Location**: Lines 43-128

**Critical Section**: `extractWaypoints()` function

**The Problem We Solved**:
The frontend was NOT using backend coordinates for intermediate waypoints - it was generating random fallback coordinates because it couldn't find the `latitude`/`longitude` fields.

**The Fix**: Added proper field checking with detailed logging

```javascript
// Lines 87-112: Check multiple coordinate formats
if (waypoint.latitude && waypoint.longitude) {
  coords = { lat: waypoint.latitude, lng: waypoint.longitude };
  console.log(`    ✅ Using lat/lng fields → lat=${coords.lat}, lng=${coords.lng}`);
} else if (waypoint.coordinates && Array.isArray(waypoint.coordinates)) {
  coords = { lat: waypoint.coordinates[1], lng: waypoint.coordinates[0] };
  console.log(`    ⚠️ Using array format → lat=${coords.lat}, lng=${coords.lng}`);
} else if (waypoint.coordinates && waypoint.coordinates.lat && waypoint.coordinates.lng) {
  coords = waypoint.coordinates;
  console.log(`    ✅ Using object format → lat=${coords.lat}, lng=${coords.lng}`);
} else {
  // Random fallback - should NEVER hit this with correct backend data
  coords = { lat: 44.0 + Math.random() * 6.0, lng: 2.0 + Math.random() * 8.0 };
  console.log(`    ❌ NO COORDINATES! Using random → lat=${coords.lat}, lng=${coords.lng}`);
}
```

**Why Origin/Destination Are Different**:
Lines 192-280 handle origin and destination separately. They:
1. First try to extract coordinates from `agentResults[0].recommendations`
2. Fall back to geocoding via Mapbox if backend coords not found
3. This ensures origin/destination use accurate backend coordinates when available

---

## Debugging Best Practices

### Lesson 1: Always Understand the Data Flow First

**What We Did Wrong Initially**:
- Jumped to adding coordinate swap detection in the backend
- Didn't verify if frontend was actually using backend coordinates
- Made multiple "fixes" without confirming the root cause

**What We Should Do**:
1. **Trace the data end-to-end**: Backend → Network → Frontend → Rendered
2. **Check what's actually stored**: Use `localStorage.getItem('spotlightData')` to see the exact structure
3. **Add logging at each step**: Backend logs + Frontend console logs to trace data transformations
4. **Verify your fixes are loading**: Check browser console for which JS file is loaded (e.g., `index-BuJyxXto.js`)

### Lesson 2: Frontend Cache Hell

**The Problem**:
Even after deploying fixes to Heroku, the browser was loading OLD JavaScript builds from cache.

**Symptoms**:
- Console logs show old file names (e.g., `index-Bmo5ba8t.js` instead of `index-BuJyxXto.js`)
- New logging statements don't appear in console
- Fixes that should work don't seem to have any effect

**Solutions**:
1. **Hard refresh**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
2. **Add version parameters**: `<script src="/assets/index-BuJyxXto.js?v=1035">`
3. **Clear localStorage**: `localStorage.clear()` in console
4. **Check actual loaded file**: Look at Network tab in DevTools to confirm which file loaded

### Lesson 3: Debugging Coordinate Issues Specifically

**Coordinate Systems to Remember**:
- **Latitude**: -90 to +90 (North-South)
  - Europe: typically 35° to 70°
  - France: ~42° to 51°
  - Spain: ~36° to 43°
- **Longitude**: -180 to +180 (East-West)
  - Europe: typically -10° to 50°
  - France: ~-5° to 8°
  - Spain: ~-9° to 3°

**How to Spot Swapped Coordinates**:
- In Europe, latitude is USUALLY larger than longitude
- Example: Perpignan at (42.69°N, 2.89°E) → lat > lon ✅
- If you see (2.89, 42.69) → lon < lat → SWAPPED ❌

**Debugging Checklist**:
1. ✅ Check backend Heroku logs for coordinate values
2. ✅ Check frontend console logs for extracted coordinates
3. ✅ Check Mapbox API coordinates string
4. ✅ Verify coordinates make geographic sense (use Google Maps to spot-check)
5. ✅ Check if coordinates are random (high precision decimals like `46.89188104497204` suggest random)

### Lesson 4: Backend vs Frontend Issues

**How to Distinguish**:
1. **Check backend logs first**: `heroku logs --num 200 | grep -A 5 "City Optimization"`
2. **Check localStorage**: `localStorage.getItem('spotlightData')` shows what backend sent
3. **Compare**: Backend logs vs localStorage vs Console logs vs Rendered map

**Example from Today's Bug**:
- Backend logs showed: `Girona: lat=41.9794, lon=2.8214` ✅ CORRECT
- localStorage showed: Same correct coordinates in `agentResults[0].recommendations` ✅
- Frontend console showed: `{lat: 46.89188104497204, lng: 3.361171214990839}` ❌ RANDOM
- **Conclusion**: Frontend extraction was broken, not backend

---

## Deployment & Build Process

### Build & Deploy Workflow

```bash
# 1. Build spotlight React app
cd spotlight-react
npm run build

# 2. Copy built files to public/
cp -r dist/* ../public/

# 3. Update spotlight.html to reference new build
# IMPORTANT: Vite generates new filenames like index-BuJyxXto.js
# You must update public/spotlight.html manually or script it

# 4. Commit and push to Heroku
cd ..
git add .
git commit -m "Your commit message"
git push origin main
git push heroku main
```

### Heroku Deployment Notes

- **Buildpack**: heroku/nodejs
- **Procfile**: `web: node server.js`
- **Port**: Uses `process.env.PORT || 5000`
- **Static files**: Served from `public/` via `express.static`
- **Environment variables**:
  - `PERPLEXITY_API_KEY`
  - `DATABASE_URL`
  - `JWT_SECRET`

### Versioning Strategy

We add `?v=XXXX` to script/style tags to force cache refresh:

```html
<script src="/assets/index-BuJyxXto.js?v=1035"></script>
```

Increment version number with each deployment.

---

## Known Issues & Solutions

### Issue 1: Perplexity Returns Swapped Coordinates

**Symptoms**: Cities appear in wrong countries (e.g., Perpignan in Luxembourg instead of France)

**Root Cause**: Perplexity API occasionally returns coordinates as (longitude, latitude) instead of (latitude, longitude)

**Solution**: `detectAndFixSwappedCoordinates()` in `utils/cityOptimization.js` (lines 129-153)

**Status**: ✅ FIXED (deployed in v1032)

### Issue 2: Frontend Uses Random Coordinates Instead of Backend Data

**Symptoms**: Even when backend has correct coordinates, map shows cities in random locations

**Root Cause**: Frontend `extractWaypoints()` wasn't finding the `latitude`/`longitude` fields on waypoint objects and fell back to random coordinates

**Solution**:
1. Updated coordinate extraction to check for field-based coordinates first (v1034)
2. Added detailed logging to trace coordinate sources (v1035)
3. Updated HTML to load correct JS build with cache-busting (v1036)

**Status**: ✅ FIXED (deployed in v1036)

### Issue 3: Origin/Destination Geocoding Overriding Backend Coords

**Symptoms**: Intermediate cities correct, but origin/destination in slightly wrong locations

**Root Cause**: Frontend was always geocoding origin/destination names via Mapbox instead of using backend coordinates

**Solution**: Check for backend coordinates first, only geocode if not available (lines 196-280 in App.tsx)

**Status**: ✅ FIXED (deployed in v1034)

---

## Development Workflow

### Making Changes to Spotlight Frontend

```bash
# 1. Make changes in spotlight-react/src/

# 2. Test locally (optional)
cd spotlight-react
npm run dev

# 3. Build for production
npm run build

# 4. Copy to public/
cp -r dist/* ../public/

# 5. Update spotlight.html
# Check dist/index.html for new asset filenames
# Update ../public/spotlight.html to reference new files

# 6. Deploy
cd ..
git add spotlight-react/src public/
git commit -m "Your changes"
git push heroku main
```

### Adding Logging for Debugging

**Backend (server.js or utils/)**:
```javascript
console.log(`Origin: ${city.name} (${city.latitude}, ${city.longitude})`);
```

**Frontend (App.tsx or components/)**:
```javascript
console.log('📍 Extracted coordinates:', coords);
```

**Tips**:
- Use emojis (📍 🔍 ✅ ❌ ⚠️) to make logs easier to scan
- Always log the data structure AND the specific values
- Log at each transformation step to trace data flow

### Testing Changes

1. **Clear localStorage**: `localStorage.clear()` in browser console
2. **Hard refresh**: Ctrl+Shift+R
3. **Generate new route**: Don't reuse cached routes
4. **Check console logs**: Verify new build loaded and logs appear
5. **Check map**: Visually verify cities are in correct locations
6. **Check coordinates**: Compare console logs to expected values

---

## Important Conventions

### Coordinate Formats

The app uses THREE different coordinate representations:

1. **Backend storage**: `{ latitude: 42.69, longitude: 2.89 }`
2. **Frontend internal**: `{ lat: 42.69, lng: 2.89 }`
3. **Mapbox API**: `"2.89,42.69"` (lng,lat string)

**Always convert correctly when passing between systems!**

### Agent Result Structure

```javascript
{
  agent: "adventure",
  agentConfig: { name: "Adventure Agent", color: "#34C759", icon: "⛰️" },
  recommendations: "{\"origin\":{...},\"destination\":{...},\"waypoints\":[...],\"alternatives\":[...]}",
  metrics: { physicalDifficulty: 3, ... }
}
```

**Key Point**: `recommendations` is a **JSON STRING**, must be parsed with `JSON.parse()`

### City Object After Optimization

```javascript
{
  name: "Perpignan",
  latitude: 42.6887,
  longitude: 2.8948,
  description: "...",
  activities: ["...", "..."],
  currentEvents: "...",
  duration: "1-2 days",
  score: 145.04,           // Added by optimization
  distFromLine: 72.52,     // Added by optimization
  position: 0.63,          // Added by optimization
  isBetween: true          // Added by optimization
}
```

---

## Best Practices Checklist

### Before Making Changes

- [ ] Read the relevant code section completely
- [ ] Understand the data flow (where does data come from and go to?)
- [ ] Check if there are related sections that might be affected
- [ ] Look for existing logging or debugging utilities
- [ ] Check git history for previous bugs in this area (`git log -p <file>`)

### While Debugging

- [ ] Add logging at EVERY step of data transformation
- [ ] Log both the structure AND the actual values
- [ ] Check backend logs (`heroku logs`)
- [ ] Check frontend console logs
- [ ] Verify localStorage data structure
- [ ] Hard refresh browser to clear cache
- [ ] Generate new test data (don't reuse old cached routes)

### After Making Changes

- [ ] Test the specific bug you fixed
- [ ] Test related functionality that might be affected
- [ ] Check that logging is helpful but not excessive
- [ ] Clear localStorage and test with fresh data
- [ ] Verify deployment loaded correctly (check asset filenames)
- [ ] Update this claude.md file with any new learnings

### Deploying to Production

- [ ] Build React apps (`npm run build`)
- [ ] Copy built files to `public/`
- [ ] Update HTML files to reference new asset filenames
- [ ] Add cache-busting version parameter (`?v=XXXX`)
- [ ] Commit with descriptive message
- [ ] Push to Heroku (`git push heroku main`)
- [ ] Check Heroku logs for errors (`heroku logs --tail`)
- [ ] Test on production URL with hard refresh

---

## Updating This File

**IMPORTANT**: Always update this `claude.md` file when:

1. ✅ You fix a significant bug (add to "Known Issues & Solutions")
2. ✅ You add a new feature or major code section (add to "Critical Code Sections")
3. ✅ You discover a new debugging technique (add to "Debugging Best Practices")
4. ✅ You learn something that would have saved time (add to "Lessons Learned")
5. ✅ You change the deployment process (update "Deployment & Build Process")
6. ✅ You modify the architecture or data flow (update "Architecture")

**Update Format**:
```bash
# After making changes
git add claude.md
git commit -m "Update claude.md: [what you learned/changed]"

# Include in your regular commits or as separate documentation update
```

**Keep This File**:
- Concise but complete
- Focused on "why" not just "what"
- Updated with actual code snippets
- Referenced with line numbers
- Timestamped at the top

---

## Quick Reference

### Common Commands

```bash
# View Heroku logs
heroku logs --tail
heroku logs --num 500 | grep "error"

# Build and deploy spotlight
cd spotlight-react && npm run build && cd .. && cp -r spotlight-react/dist/* public/ && git add . && git commit -m "Update spotlight" && git push heroku main

# Clear localStorage in browser console
localStorage.clear()
location.reload()

# Check what's in localStorage
localStorage.getItem('spotlightData')

# Check backend city coordinates
heroku logs --num 200 | grep -E "(before swap|after swap)"
```

### File Locations Quick Index

- **Backend route generation**: `server.js:701-950`
- **City optimization**: `utils/cityOptimization.js:140-243`
- **Coordinate swap detection**: `utils/cityOptimization.js:129-153`
- **Frontend coordinate extraction**: `spotlight-react/src/App.tsx:43-128`
- **Origin/destination handling**: `spotlight-react/src/App.tsx:192-280`
- **Mapbox coordinate formatting**: `spotlight-react/src/components/spotlight/MapView.tsx:42`

---

**Last Deployment**: v1036 (Oct 27, 2025)
**Next Claude Session**: Start by reading this file to understand the current state!
