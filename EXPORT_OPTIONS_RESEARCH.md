# Trip Export Features - Comprehensive Research
**Date:** October 29, 2025
**Project:** RDTrip - Road Trip Planning Application

---

## Table of Contents
1. [Notion Export](#1-notion-export)
2. [Google Calendar Integration](#2-google-calendar-integration)
3. [Google Maps Export Enhancement](#3-google-maps-export-enhancement)
4. [GPX File Format](#4-gpx-file-format)
5. [PDF Generation](#5-pdf-generation)
6. [Comparison Matrix](#comparison-matrix)
7. [Recommended Implementation Order](#recommended-implementation-order)

---

## 1. Notion Export

### Overview
Create structured travel itineraries in users' Notion workspaces with databases, pages, and rich content blocks.

### API Capabilities

#### Official SDK: `@notionhq/client`
- **npm package:** `@notionhq/client`
- **Documentation:** https://developers.notion.com/reference
- **Installation:** `npm install @notionhq/client`

#### What You Can Create:
- **Databases** - With custom properties (dates, text, select, multi-select, checkboxes, etc.)
- **Pages** - As children of databases or standalone
- **Blocks** - Rich content including:
  - Text blocks (paragraphs, headings, quotes, callouts)
  - Lists (bulleted, numbered, to-do)
  - Tables
  - Images (external URLs only)
  - Code blocks
  - Dividers
  - Embeds

### Authentication Flow

**Public Integration (OAuth 2.0):**
1. Create a public integration at https://www.notion.com/my-integrations
2. Register redirect URI(s) for your application
3. User clicks "Connect to Notion" in your app
4. Redirect user to Notion's OAuth URL:
   ```
   https://api.notion.com/v1/oauth/authorize?
     client_id=YOUR_CLIENT_ID
     &response_type=code
     &owner=user
     &redirect_uri=YOUR_REDIRECT_URI
   ```
5. User authorizes access to specific pages/databases
6. Notion redirects back with authorization code
7. Exchange code for access token:
   ```javascript
   const response = await fetch('https://api.notion.com/v1/oauth/token', {
     method: 'POST',
     headers: {
       'Authorization': 'Basic ' + Buffer.from(`${client_id}:${client_secret}`).toString('base64'),
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       grant_type: 'authorization_code',
       code: authorization_code,
       redirect_uri: YOUR_REDIRECT_URI
     })
   });
   ```
8. Store access token (does NOT expire - one-time auth per user)

### Sample Code Structure

```javascript
const { Client } = require('@notionhq/client');

// Initialize client with user's access token
const notion = new Client({ auth: userAccessToken });

// 1. Create a database for the trip
const database = await notion.databases.create({
  parent: {
    type: 'page_id',
    page_id: userSelectedPageId // User chooses where to create during OAuth
  },
  title: [
    {
      type: 'text',
      text: { content: 'Aix-en-Provence to Berlin Road Trip' }
    }
  ],
  properties: {
    'City': { title: {} },
    'Day': { number: {} },
    'Arrival Date': { date: {} },
    'Duration': { rich_text: {} },
    'Category': {
      select: {
        options: [
          { name: 'Adventure', color: 'green' },
          { name: 'Culture', color: 'blue' },
          { name: 'Food', color: 'orange' },
          { name: 'Hidden Gems', color: 'purple' }
        ]
      }
    },
    'Visited': { checkbox: {} }
  }
});

// 2. Create a page for each city with detailed itinerary
const cityPage = await notion.pages.create({
  parent: { database_id: database.id },
  properties: {
    'City': {
      title: [{ text: { content: 'Lyon' } }]
    },
    'Day': { number: 2 },
    'Arrival Date': {
      date: { start: '2025-07-15' }
    },
    'Duration': {
      rich_text: [{ text: { content: '2 days' } }]
    },
    'Category': { select: { name: 'Food' } }
  },
  children: [
    // Heading
    {
      type: 'heading_1',
      heading_1: {
        rich_text: [{ text: { content: 'Lyon - Gastronomic Capital' } }]
      }
    },
    // Image
    {
      type: 'image',
      image: {
        type: 'external',
        external: { url: 'https://upload.wikimedia.org/wikipedia/commons/...' }
      }
    },
    // Description paragraph
    {
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { text: { content: 'Lyon is renowned for its cuisine...' } }
        ]
      }
    },
    // Callout box for tips
    {
      type: 'callout',
      callout: {
        icon: { emoji: '💡' },
        rich_text: [
          { text: { content: 'Pro tip: Visit a traditional bouchon for authentic Lyonnaise cuisine.' } }
        ],
        color: 'blue_background'
      }
    },
    // Activities checklist
    {
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: 'Activities' } }]
      }
    },
    {
      type: 'to_do',
      to_do: {
        rich_text: [{ text: { content: 'Visit Basilica of Notre-Dame de Fourvière' } }],
        checked: false
      }
    },
    {
      type: 'to_do',
      to_do: {
        rich_text: [{ text: { content: 'Explore Vieux Lyon (Old Town)' } }],
        checked: false
      }
    },
    {
      type: 'to_do',
      to_do: {
        rich_text: [{ text: { content: 'Walk through Parc de la Tête d\'Or' } }],
        checked: false
      }
    }
  ]
});

// 3. Add a map embed
await notion.blocks.children.append({
  block_id: cityPage.id,
  children: [
    {
      type: 'embed',
      embed: {
        url: 'https://www.google.com/maps/embed?pb=...' // Google Maps embed URL
      }
    }
  ]
});
```

### Best Practices for Travel Itineraries

**Database Structure:**
- **Main trip database** - One row per city/stop
- **Properties to include:**
  - City name (title)
  - Day number
  - Dates (arrival/departure)
  - Duration
  - Category/travel style
  - Coordinates (as text property)
  - Visited checkbox
  - Notes

**Page Content Structure:**
```
[City Name - One-line description]
  ├─ Hero Image (Wikipedia or Pexels)
  ├─ Overview paragraph
  ├─ Callout: Why visit this city
  ├─ Heading: Activities
  │   └─ To-do items for each activity
  ├─ Heading: Restaurants & Food
  │   └─ Bulleted list of recommendations
  ├─ Heading: Practical Info
  │   ├─ Duration
  │   ├─ Best time to visit
  │   └─ Transportation notes
  ├─ Divider
  └─ Map embed
```

### Rate Limits & Costs

**Rate Limits:**
- **3 requests per second** (average, bursts allowed)
- Returns HTTP 429 when exceeded
- Includes `Retry-After` header (seconds to wait)
- **No daily limit** specified

**Implementation strategy:**
```javascript
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function createCityPage(cityData, delayMs = 350) {
  try {
    const page = await notion.pages.create({ /* ... */ });
    await delay(delayMs); // Stay under 3 req/sec
    return page;
  } catch (error) {
    if (error.code === 'rate_limited') {
      const retryAfter = error.headers['retry-after'] * 1000;
      await delay(retryAfter);
      return createCityPage(cityData, delayMs); // Retry
    }
    throw error;
  }
}
```

**Costs:**
- **FREE** for all API usage
- No charge for exceeding quotas (just rate limited)
- API available on all Notion plans (Free, Plus, Business, Enterprise)
- No per-request fees

**Workspace Limitations:**
- Free plan: 1,000 block trial for shared teamspaces
- Unlimited pages/blocks for personal use on free plan
- 5MB per-file upload limit on free plan
- For API created content: No strict block limits mentioned

### Alternative: Markdown Export

Instead of using Notion API, generate markdown that users can manually import:

**Pros:**
- No OAuth flow needed
- No rate limits
- Simpler implementation
- Users control where it goes in their workspace

**Cons:**
- Manual import step (not seamless)
- Less fancy formatting
- No database structure
- Requires user to download file first

**Implementation:**
```javascript
function generateMarkdown(routeData) {
  let md = `# ${routeData.origin} to ${routeData.destination}\n\n`;
  md += `**Duration:** ${routeData.totalDays} days\n`;
  md += `**Distance:** ${routeData.totalDistance} km\n\n`;

  routeData.cities.forEach((city, index) => {
    md += `## Day ${index + 1}: ${city.name}\n\n`;
    md += `${city.description}\n\n`;
    md += `### Activities\n`;
    city.activities.forEach(activity => {
      md += `- [ ] ${activity}\n`;
    });
    md += `\n---\n\n`;
  });

  return md;
}

// User downloads markdown file, then imports to Notion manually
```

Notion supports importing .md files through: Settings > Import > Text & Markdown

### Complexity: MEDIUM

**Easy parts:**
- Official SDK is well-documented
- Block creation is straightforward
- No pagination needed for creating content

**Challenging parts:**
- OAuth flow requires backend endpoints
- Storing user access tokens securely
- Handling rate limits gracefully
- Testing with real Notion workspaces

**Estimated implementation time:** 2-3 days
- 1 day: OAuth flow and token storage
- 1 day: Database and page creation logic
- 0.5 day: Rate limiting and error handling
- 0.5 day: Testing and refinement

---

## 2. Google Calendar Integration

### Overview
Add trip events to users' Google Calendar with location data, descriptions, reminders, and proper timezone handling.

### API Setup

**Library:** `googleapis` npm package
- **Installation:** `npm install googleapis`
- **Documentation:** https://developers.google.com/calendar/api

**Required setup:**
1. Create Google Cloud project
2. Enable Google Calendar API
3. Configure OAuth 2.0 consent screen
4. Create OAuth Client ID (Web application)
5. Add authorized redirect URIs

### OAuth 2.0 Flow

```javascript
const { google } = require('googleapis');

// Initialize OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://yourdomain.com/auth/google/callback'
);

// Step 1: Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline', // Get refresh token
  scope: ['https://www.googleapis.com/auth/calendar'],
  prompt: 'consent' // Force consent screen to get refresh token
});

// Redirect user to authUrl

// Step 2: Handle callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);

  // Store tokens.access_token and tokens.refresh_token
  // Access token expires, refresh token doesn't (if access_type: 'offline')

  oauth2Client.setCredentials(tokens);
});
```

**Required scope:** `https://www.googleapis.com/auth/calendar`
- Allows read/write access to user's calendars

### Event Creation

**Single Event:**
```javascript
const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

const event = {
  summary: 'Lyon - Gastronomic Capital',
  location: 'Lyon, France',
  description: 'Explore the culinary capital of France.\n\nActivities:\n- Visit Basilica of Notre-Dame de Fourvière\n- Explore Vieux Lyon\n- Walk through Parc de la Tête d\'Or',
  start: {
    dateTime: '2025-07-15T10:00:00',
    timeZone: 'Europe/Paris'
  },
  end: {
    dateTime: '2025-07-17T18:00:00',
    timeZone: 'Europe/Paris'
  },
  colorId: '5', // Yellow for travel
  reminders: {
    useDefault: false,
    overrides: [
      { method: 'popup', minutes: 24 * 60 }, // 1 day before
      { method: 'popup', minutes: 60 } // 1 hour before
    ]
  },
  extendedProperties: {
    private: {
      rdtripCityId: 'lyon-france',
      agentType: 'food'
    }
  }
};

const result = await calendar.events.insert({
  calendarId: 'primary',
  resource: event
});

console.log('Event created:', result.data.htmlLink);
```

**Batch Event Creation:**

Google Calendar API doesn't support batch requests natively in the Node.js client. Use `node-gbatchrequests` module:

```bash
npm install node-gbatchrequests
```

```javascript
const { RunBatch } = require('node-gbatchrequests');

// Prepare events
const events = cities.map((city, index) => ({
  summary: `${city.name} - ${city.tagline}`,
  location: `${city.name}, ${city.country}`,
  description: formatDescription(city),
  start: {
    dateTime: calculateArrivalDate(startDate, index),
    timeZone: getTimezone(city.coordinates)
  },
  end: {
    dateTime: calculateDepartureDate(startDate, index, city.duration),
    timeZone: getTimezone(city.coordinates)
  },
  colorId: getColorForAgent(city.agentType)
}));

// Batch request
const batchObj = {
  accessToken: oauth2Client.credentials.access_token,
  api: {
    name: 'calendar',
    version: 'v3'
  },
  requests: events.map(event => ({
    method: 'POST',
    endpoint: `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
    requestBody: event
  }))
};

const results = await RunBatch(batchObj);
console.log(`Created ${results.length} events`);
```

**Without batch library (sequential):**
```javascript
async function createTripEvents(cities, startDate) {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const createdEvents = [];

  for (let i = 0; i < cities.length; i++) {
    const city = cities[i];
    const event = createEventFromCity(city, startDate, i);

    try {
      const result = await calendar.events.insert({
        calendarId: 'primary',
        resource: event
      });
      createdEvents.push(result.data);

      // Small delay to be respectful (not strictly required)
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to create event for ${city.name}:`, error);
    }
  }

  return createdEvents;
}
```

### Timezone Handling

**Get timezone from coordinates:**
```javascript
// Use Mapbox Geocoding API (you already have this)
async function getTimezone(lat, lng) {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
  );
  const data = await response.json();

  // Extract timezone from context
  const timezone = data.features[0]?.context?.find(
    c => c.id.startsWith('timezone')
  )?.text;

  return timezone || 'Europe/Paris'; // Fallback
}

// Or use a dedicated library
const tzlookup = require('tz-lookup');
const timezone = tzlookup(lat, lng); // Returns IANA timezone
```

### Best Practices

**Event Structure for Multi-Day Stays:**
```javascript
// Option 1: One all-day event per city
{
  summary: 'Lyon',
  start: { date: '2025-07-15' }, // All-day event
  end: { date: '2025-07-17' },   // Exclusive end date
  description: '...'
}

// Option 2: Multiple timed events per city (activities)
[
  {
    summary: 'Arrive in Lyon',
    start: { dateTime: '2025-07-15T14:00:00', timeZone: 'Europe/Paris' },
    duration: { hours: 1 }
  },
  {
    summary: 'Visit Basilica of Notre-Dame',
    start: { dateTime: '2025-07-15T16:00:00', timeZone: 'Europe/Paris' },
    duration: { hours: 2 }
  },
  // ...
]
```

**Color Coding:**
Google Calendar event colors (colorId):
- '1': Lavender
- '2': Sage
- '3': Grape
- '4': Flamingo
- '5': Banana (good for travel)
- '6': Tangerine
- '7': Peacock
- '8': Graphite
- '9': Blueberry
- '10': Basil
- '11': Tomato

Map agent types to colors:
```javascript
const AGENT_COLORS = {
  adventure: '9',  // Blueberry
  culture: '3',    // Grape
  food: '6',       // Tangerine
  'hidden-gems': '2' // Sage
};
```

### Rate Limits & Costs

**Quotas (Free Tier):**
- **1,000,000 requests per day** (per project)
- **10,000 requests per minute** (per project)
- Per-user rate limits also apply

**Costs:**
- **COMPLETELY FREE**
- No charges for API usage
- No charges for exceeding quotas (just rate limited)
- Returns HTTP 403 or 429 when rate limited

**Quota Increases:**
- Can request higher quotas if needed (free, but requires billing account)
- For typical travel app: default quotas are more than sufficient

### Alternative: iCalendar (.ics) Files

Instead of Google Calendar API, generate .ics files that work with ALL calendar apps:

**Pros:**
- No OAuth needed
- Works with Google Calendar, Apple Calendar, Outlook, etc.
- User downloads and imports
- No rate limits
- Simpler implementation

**Cons:**
- Manual import step
- Less integrated experience
- No automatic updates if route changes

**Library:** `ics` npm package
```bash
npm install ics
```

**Implementation:**
```javascript
const ics = require('ics');
const fs = require('fs');

function createICSFile(routeData) {
  const events = routeData.cities.map((city, index) => ({
    start: calculateDateArray(routeData.startDate, city.dayNumber),
    duration: { days: city.durationDays },
    title: `${city.name} - ${city.tagline}`,
    description: formatDescription(city),
    location: `${city.name}, ${city.country}`,
    geo: { lat: city.latitude, lon: city.longitude },
    categories: [city.agentType, 'road-trip', 'travel'],
    status: 'CONFIRMED',
    busyStatus: 'BUSY',
    url: `https://rdtrip.com/spotlight?job=${routeData.jobId}`,
    alarms: [
      {
        action: 'display',
        description: `Leaving for ${city.name} soon!`,
        trigger: { hours: 24, before: true }
      },
      {
        action: 'display',
        description: `${city.name} visit today`,
        trigger: { hours: 2, before: true }
      }
    ]
  }));

  ics.createEvents(events, (error, value) => {
    if (error) {
      console.error(error);
      return;
    }

    // Return ICS content for download
    return value;
  });
}

// Date helper (ICS requires array format: [year, month, day, hour, minute])
function calculateDateArray(startDate, dayNumber) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayNumber);
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate(),
    10, // 10 AM
    0   // 0 minutes
  ];
}

// Express endpoint
app.get('/api/export/calendar/:jobId', async (req, res) => {
  const routeData = await getRouteData(req.params.jobId);
  const icsContent = createICSFile(routeData);

  res.setHeader('Content-Type', 'text/calendar');
  res.setHeader('Content-Disposition', `attachment; filename="rdtrip-${routeData.origin}-to-${routeData.destination}.ics"`);
  res.send(icsContent);
});
```

**Features supported by ics package:**
- ✅ Location (text)
- ✅ Geographic coordinates (lat/lon)
- ✅ Categories/tags
- ✅ Alarms/reminders
- ✅ URLs
- ✅ All-day or timed events
- ✅ Recurring events
- ✅ Multiple attendees

### Complexity: MEDIUM

**Easy parts:**
- Official library is straightforward
- Event creation is simple
- .ics alternative is very easy (EASY complexity)

**Challenging parts:**
- OAuth flow (similar to Notion)
- Token refresh logic
- Timezone calculations
- Batch requests require external library

**Estimated implementation time:**
- Google Calendar API: 2-3 days
- ICS file generation: 4-6 hours

---

## 3. Google Maps Export Enhancement

### Current Limitation
Simple waypoint URLs like: `https://www.google.com/maps/dir/Aix-en-Provence/Lyon/Berlin`

**Problems:**
- No descriptions
- No images
- No categories
- Just basic navigation
- Limited customization

### Google My Maps API - NOT AVAILABLE

**Bad news:** Google deprecated the Maps Data API in 2011. There is NO official programmatic way to create custom "My Maps" with descriptions, images, and categories.

### Alternative Solutions

#### Option 1: KML File Generation

**What is KML?**
- XML format for geographic data
- Stands for Keyhole Markup Language
- Supported by Google Maps, Google Earth, and many GPS devices
- Can include placemarks, descriptions, images, paths, polygons

**Library:** `tokml` (by Mapbox)
```bash
npm install tokml
```

**Implementation:**
```javascript
const tokml = require('tokml');

// Create GeoJSON from route data
function createGeoJSON(routeData) {
  return {
    type: 'FeatureCollection',
    features: [
      // Cities as placemarks
      ...routeData.cities.map(city => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [city.longitude, city.latitude]
        },
        properties: {
          name: city.name,
          description: formatDescriptionHTML(city),
          category: city.agentType,
          timestamp: calculateArrivalDate(routeData.startDate, city.dayNumber)
        }
      })),
      // Route line
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: routeData.cities.map(c => [c.longitude, c.latitude])
        },
        properties: {
          name: `${routeData.origin} to ${routeData.destination}`,
          description: `${routeData.totalDistance}km road trip`,
          stroke: '#3B82F6',
          'stroke-width': 3
        }
      }
    ]
  };
}

// Convert to KML
function generateKML(routeData) {
  const geojson = createGeoJSON(routeData);

  const kml = tokml(geojson, {
    documentName: `Road Trip: ${routeData.origin} to ${routeData.destination}`,
    documentDescription: `Generated by RDTrip on ${new Date().toLocaleDateString()}`,
    simplestyle: true, // Convert GeoJSON styling to KML
    timestamp: 'timestamp' // Property name for timestamps
  });

  return kml;
}

// Description with HTML
function formatDescriptionHTML(city) {
  return `
    <![CDATA[
      <h3>${city.name}</h3>
      <p>${city.description}</p>
      <img src="${city.imageUrl}" width="300" />
      <h4>Activities:</h4>
      <ul>
        ${city.activities.map(a => `<li>${a}</li>`).join('')}
      </ul>
      <p><strong>Duration:</strong> ${city.duration}</p>
      <p><strong>Category:</strong> ${city.agentType}</p>
    ]]>
  `;
}

// Express endpoint
app.get('/api/export/kml/:jobId', async (req, res) => {
  const routeData = await getRouteData(req.params.jobId);
  const kml = generateKML(routeData);

  res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
  res.setHeader('Content-Disposition', `attachment; filename="rdtrip-${routeData.origin}-to-${routeData.destination}.kml"`);
  res.send(kml);
});
```

**How users import KML to Google Maps:**
1. Go to https://www.google.com/maps
2. Click menu (☰) → "Your places" → "Maps" → "Create Map"
3. Click "Import" and upload the KML file
4. KML appears as custom map with all placemarks and route

**KML Features:**
- ✅ Placemarks (points)
- ✅ Lines and paths
- ✅ Polygons
- ✅ Rich HTML descriptions
- ✅ Images
- ✅ Custom icons
- ✅ Colors and styling
- ✅ Folders/categories
- ✅ Timestamps

**Limitations:**
- User must manually import (not automatic)
- KML must be hosted publicly for automatic loading
- No API to programmatically create "My Maps"

#### Option 2: Enhanced Google Maps URL with Waypoints

Improve current URL with better formatting:

```javascript
function createEnhancedMapsURL(cities) {
  const origin = encodeURIComponent(cities[0].name);
  const destination = encodeURIComponent(cities[cities.length - 1].name);
  const waypoints = cities.slice(1, -1)
    .map(c => encodeURIComponent(c.name))
    .join('/');

  // Add travelmode and other params
  return `https://www.google.com/maps/dir/${origin}/${waypoints}/${destination}/?travelmode=driving`;
}
```

Still limited, but free and works everywhere.

#### Option 3: Mapbox Custom Map (Interactive)

Use Mapbox to create a shareable interactive map on YOUR platform:

**You already use Mapbox!** Leverage it further:

```javascript
// Generate shareable URL for custom Mapbox map
function createMapboxShareURL(jobId) {
  return `https://rdtrip.com/map/${jobId}`;
}

// Create a dedicated map view page at /map/:jobId
// Shows the route with popups containing descriptions, images, activities
// User can interact, but can't add to their own maps
```

**Pros:**
- Full control over styling and features
- Rich popups with images and descriptions
- Already integrated
- Can add print button for static PDF

**Cons:**
- Not in user's Google Maps
- Requires internet access to view
- User must visit your site

### Rate Limits & Costs

**KML Generation:**
- No API calls needed
- Free and unlimited
- Runs entirely on your server

**Mapbox Static API (for embedding map images in KML):**
- 100,000 free requests per month
- Sufficient for generating thumbnail maps

**Google Maps embed:**
- Free to use
- No quotas for basic embedding

### Complexity: EASY-MEDIUM

**KML Generation: EASY**
- Simple XML conversion
- tokml library handles everything
- 4-6 hours implementation

**Enhanced Mapbox view: MEDIUM**
- Already have most code in spotlight page
- Need shareable URL structure
- Add print functionality
- 1-2 days implementation

---

## 4. GPX File Format

### Overview
GPS Exchange Format - standard XML format for GPS data. Supported by Garmin, Strava, hiking apps, and GPS devices.

### Use Cases
- Import route into GPS devices for navigation
- Share with Strava, Komoot, AllTrails
- Backup geographic data
- Compatible with fitness trackers

### GPX Structure

**Three main elements:**
1. **Waypoints** - Individual points of interest
2. **Routes** - Ordered list of points defining a route
3. **Tracks** - Recorded path with timestamps

**For road trips, use Routes:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RDTrip" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>Aix-en-Provence to Berlin Road Trip</name>
    <desc>7-day adventure through Europe</desc>
    <author>
      <name>RDTrip</name>
      <link href="https://rdtrip.com"/>
    </author>
    <time>2025-07-15T00:00:00Z</time>
  </metadata>

  <!-- Waypoints (cities) -->
  <wpt lat="43.5297" lon="5.4474">
    <name>Aix-en-Provence</name>
    <desc>Starting point - Beautiful Provençal city</desc>
    <type>city</type>
    <sym>City</sym>
  </wpt>

  <wpt lat="45.7640" lon="4.8357">
    <name>Lyon</name>
    <desc>Gastronomic capital of France. Visit bouchons, Old Town, Fourvière.</desc>
    <type>city</type>
    <sym>Restaurant</sym>
  </wpt>

  <!-- Route (ordered waypoints) -->
  <rte>
    <name>Main Route</name>
    <rtept lat="43.5297" lon="5.4474">
      <name>Aix-en-Provence</name>
    </rtept>
    <rtept lat="45.7640" lon="4.8357">
      <name>Lyon</name>
    </rtept>
    <rtept lat="52.5200" lon="13.4050">
      <name>Berlin</name>
    </rtept>
  </rte>
</gpx>
```

### JavaScript Libraries

#### Option 1: Manual XML Generation (Simple)

```javascript
function generateGPX(routeData) {
  const waypoints = routeData.cities.map(city => `
  <wpt lat="${city.latitude}" lon="${city.longitude}">
    <name>${escapeXml(city.name)}</name>
    <desc>${escapeXml(city.description)}</desc>
    <type>${city.agentType}</type>
    <sym>City</sym>
  </wpt>`).join('\n');

  const routePoints = routeData.cities.map(city => `
    <rtept lat="${city.latitude}" lon="${city.longitude}">
      <name>${escapeXml(city.name)}</name>
    </rtept>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RDTrip" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(routeData.origin)} to ${escapeXml(routeData.destination)}</name>
    <desc>Road trip generated by RDTrip</desc>
    <time>${new Date().toISOString()}</time>
  </metadata>
  ${waypoints}
  <rte>
    <name>Main Route</name>
    ${routePoints}
  </rte>
</gpx>`;
}

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}
```

#### Option 2: gpx-builder (Full-featured)

```bash
npm install gpx-builder
```

```javascript
const { BaseBuilder, Point } = require('gpx-builder');

function generateGPX(routeData) {
  // Create waypoints
  const waypoints = routeData.cities.map(city =>
    new Point(city.latitude, city.longitude, {
      name: city.name,
      desc: city.description,
      type: city.agentType,
      sym: 'City'
    })
  );

  // Create builder
  const gpxData = new BaseBuilder();

  gpxData.setMetadata({
    name: `${routeData.origin} to ${routeData.destination}`,
    desc: `${routeData.totalDays}-day road trip`,
    author: {
      name: 'RDTrip',
      link: { href: 'https://rdtrip.com' }
    },
    time: new Date()
  });

  // Add waypoints
  gpxData.setWayPoints(waypoints);

  // Add route
  gpxData.setRoutes([{
    name: 'Main Route',
    points: waypoints
  }]);

  return gpxData.toString();
}
```

#### Option 3: togpx (GeoJSON to GPX)

If you already have GeoJSON (from Mapbox):

```bash
npm install togpx
```

```javascript
const togpx = require('togpx');

// Convert your GeoJSON to GPX
const geojson = {
  type: 'FeatureCollection',
  features: routeData.cities.map(city => ({
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [city.longitude, city.latitude]
    },
    properties: {
      name: city.name,
      desc: city.description
    }
  }))
};

const gpx = togpx(geojson, {
  featureTitle: (props) => props.name,
  featureDescription: (props) => props.desc
});
```

### Required Fields

**Minimum for GPS devices:**
```xml
<wpt lat="45.7640" lon="4.8357">
  <name>Lyon</name>
</wpt>
```

**Recommended:**
- `<name>` - Display name
- `<desc>` - Description
- `<type>` - Category/type
- `<sym>` - Icon symbol
- `<time>` - Timestamp (for tracks)
- `<ele>` - Elevation (meters)

### Best Practices

**Route vs Track:**
- **Route:** Planned path (what you're generating)
- **Track:** Recorded path with timestamps (actual GPS recording)

**For road trips: Use Routes**

**Symbol types** (supported by most GPS devices):
- City
- Restaurant
- Lodging
- Scenic Area
- Park
- Museum
- Church
- Castle
- etc.

**Elevation data:**
You can add elevation using a DEM (Digital Elevation Model) API, but probably overkill for road trips.

### Rate Limits & Costs

**GPX Generation:**
- No external APIs needed
- Free and unlimited
- Runs entirely on your server

### Complexity: EASY

**Implementation:**
- Simple XML generation OR use library
- No authentication needed
- No rate limits
- 2-4 hours implementation

```javascript
// Complete endpoint
app.get('/api/export/gpx/:jobId', async (req, res) => {
  const routeData = await getRouteData(req.params.jobId);
  const gpx = generateGPX(routeData);

  res.setHeader('Content-Type', 'application/gpx+xml');
  res.setHeader('Content-Disposition',
    `attachment; filename="rdtrip-${routeData.origin}-to-${routeData.destination}.gpx"`
  );
  res.send(gpx);
});
```

---

## 5. PDF Generation

### Overview
Generate print-ready travel itinerary PDFs with maps, tables, and rich formatting.

### Library Comparison

#### Puppeteer
**What it is:** Headless Chrome browser automation

**Pros:**
- Perfect HTML/CSS rendering (it's literally Chrome)
- Can screenshot maps, charts, complex layouts
- Handles complex CSS (Flexbox, Grid, etc.)
- Can capture your existing spotlight page as PDF

**Cons:**
- Large dependency (~300MB with Chromium)
- Memory intensive (~150-200MB per instance)
- Slower than alternatives (~2-5 seconds per PDF)
- Not suitable for high-volume generation

**Installation:**
```bash
npm install puppeteer
```

**Implementation:**
```javascript
const puppeteer = require('puppeteer');

async function generatePDF(routeData) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Option 1: Render your spotlight page
  await page.goto(`https://rdtrip.com/spotlight?job=${routeData.jobId}`, {
    waitUntil: 'networkidle0'
  });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });

  await browser.close();
  return pdf;
}

// Or Option 2: Generate HTML template
async function generatePDFFromTemplate(routeData) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  const html = generatePDFTemplate(routeData);
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size:10px; text-align:center; width:100%;">RDTrip Itinerary</div>',
    footerTemplate: '<div style="font-size:10px; text-align:center; width:100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
    margin: { top: '30mm', bottom: '30mm', left: '15mm', right: '15mm' }
  });

  await browser.close();
  return pdf;
}

function generatePDFTemplate(routeData) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        @page { size: A4; margin: 0; }
        body {
          font-family: 'Helvetica', sans-serif;
          margin: 0;
          padding: 20mm;
          font-size: 11pt;
        }
        h1 { color: #1E40AF; font-size: 24pt; margin-top: 0; }
        h2 { color: #3B82F6; font-size: 18pt; page-break-after: avoid; }
        .city {
          page-break-inside: avoid;
          margin-bottom: 30px;
          border-left: 4px solid #3B82F6;
          padding-left: 15px;
        }
        .activities { list-style-type: none; padding-left: 0; }
        .activities li:before { content: "✓ "; color: #10B981; font-weight: bold; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #3B82F6; color: white; }
        .map-image { width: 100%; height: auto; margin: 20px 0; }
        .page-break { page-break-before: always; }
      </style>
    </head>
    <body>
      <h1>${routeData.origin} to ${routeData.destination}</h1>
      <p><strong>Duration:</strong> ${routeData.totalDays} days |
         <strong>Distance:</strong> ${routeData.totalDistance} km</p>

      <img class="map-image" src="${generateStaticMapURL(routeData)}" />

      <h2>Itinerary Overview</h2>
      <table>
        <tr>
          <th>Day</th>
          <th>City</th>
          <th>Duration</th>
          <th>Highlights</th>
        </tr>
        ${routeData.cities.map((city, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${city.name}</td>
            <td>${city.duration}</td>
            <td>${city.activities[0]}</td>
          </tr>
        `).join('')}
      </table>

      <div class="page-break"></div>

      ${routeData.cities.map(city => `
        <div class="city">
          <h2>${city.name}</h2>
          <p>${city.description}</p>
          <h3>Activities:</h3>
          <ul class="activities">
            ${city.activities.map(a => `<li>${a}</li>`).join('')}
          </ul>
        </div>
      `).join('')}
    </body>
    </html>
  `;
}

// Generate static map image URL (Mapbox)
function generateStaticMapURL(routeData) {
  const coords = routeData.cities.map(c =>
    `pin-s-${routeData.cities.indexOf(c)+1}+3B82F6(${c.longitude},${c.latitude})`
  ).join(',');

  const path = routeData.cities
    .map(c => `${c.longitude},${c.latitude}`)
    .join(',');

  return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/path-5+3B82F6-0.8(${path})/${coords}/auto/1000x600?access_token=${MAPBOX_TOKEN}`;
}
```

**File size:** 200-500 KB for typical itinerary

**Performance:** 2-5 seconds per PDF

#### PDFKit
**What it is:** Low-level PDF generation library (canvas-style API)

**Pros:**
- Lightweight (~5MB)
- Fast (~100-500ms per PDF)
- Programmatic control (draw primitives)
- Suitable for high-volume generation
- Can embed images, fonts

**Cons:**
- No HTML/CSS support
- Manual positioning required
- More code to achieve complex layouts
- Learning curve

**Installation:**
```bash
npm install pdfkit
```

**Implementation:**
```javascript
const PDFDocument = require('pdfkit');
const fs = require('fs');

async function generatePDF(routeData) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Title
    doc.fontSize(24)
       .fillColor('#1E40AF')
       .text(`${routeData.origin} to ${routeData.destination}`, { align: 'center' });

    doc.moveDown();

    // Metadata
    doc.fontSize(12)
       .fillColor('#000')
       .text(`Duration: ${routeData.totalDays} days | Distance: ${routeData.totalDistance} km`);

    doc.moveDown(2);

    // Embed map image
    const mapImagePath = await downloadStaticMap(routeData);
    doc.image(mapImagePath, { width: 500, align: 'center' });

    doc.addPage();

    // Cities
    routeData.cities.forEach((city, index) => {
      // City header
      doc.fontSize(18)
         .fillColor('#3B82F6')
         .text(`${index + 1}. ${city.name}`, { continued: false });

      doc.moveDown(0.5);

      // Description
      doc.fontSize(11)
         .fillColor('#000')
         .text(city.description, { align: 'justify' });

      doc.moveDown();

      // Activities
      doc.fontSize(13).text('Activities:', { underline: true });
      doc.fontSize(11);
      city.activities.forEach(activity => {
        doc.text(`  ✓ ${activity}`, { indent: 20 });
      });

      doc.moveDown(2);

      // Add page break for next city if needed
      if (index < routeData.cities.length - 1 && doc.y > 650) {
        doc.addPage();
      }
    });

    doc.end();
  });
}
```

**File size:** 100-300 KB (smaller than Puppeteer)

**Performance:** Very fast (~100-500ms)

#### jsPDF
**What it is:** Lightweight PDF library (browser + Node.js)

**Pros:**
- Small bundle size (~150 KB)
- Works in browser and Node.js
- Simple API
- Fast

**Cons:**
- Limited layout features
- Basic text/image positioning
- Less powerful than PDFKit
- Better suited for browser use

**Installation:**
```bash
npm install jspdf
```

**Implementation:**
```javascript
const { jsPDF } = require('jspdf');

function generatePDF(routeData) {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(22);
  doc.setTextColor(30, 64, 175);
  doc.text(`${routeData.origin} to ${routeData.destination}`, 105, 20, { align: 'center' });

  // Metadata
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Duration: ${routeData.totalDays} days`, 20, 35);
  doc.text(`Distance: ${routeData.totalDistance} km`, 20, 42);

  let y = 60;

  routeData.cities.forEach((city, index) => {
    // Check if we need a new page
    if (y > 250) {
      doc.addPage();
      y = 20;
    }

    // City name
    doc.setFontSize(16);
    doc.setTextColor(59, 130, 246);
    doc.text(`${index + 1}. ${city.name}`, 20, y);
    y += 10;

    // Description
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    const descLines = doc.splitTextToSize(city.description, 170);
    doc.text(descLines, 20, y);
    y += descLines.length * 5 + 5;

    // Activities
    city.activities.forEach(activity => {
      doc.text(`  ✓ ${activity}`, 25, y);
      y += 6;
    });

    y += 10;
  });

  return doc.output('arraybuffer');
}
```

**File size:** 50-200 KB (smallest)

**Performance:** Very fast (~50-200ms)

### Recommendations

**For RDTrip, I recommend:**

**Option 1: Puppeteer** (if you want beautiful PDFs with maps)
- Render a dedicated print template with CSS
- Embed Mapbox static map images
- Include tables, formatted text, images
- Accept the 2-5 second generation time
- Good for occasional exports (not thousands per hour)

**Option 2: PDFKit** (if you need speed and lower resource usage)
- Still can embed map images
- More manual layout work
- Faster generation
- Lower memory usage
- Better for high-volume

**Option 3: Server-side HTML + CSS → PDF service**
- Use a dedicated service like DocRaptor, PDF.co, or CloudConvert
- Send HTML template, get PDF back
- Pay per conversion
- No infrastructure management

### Static Map Images

**Mapbox Static Images API** (you already use this):
```javascript
function generateStaticMapURL(cities) {
  // Add markers
  const markers = cities.map((city, i) =>
    `pin-s-${i+1}+3B82F6(${city.longitude},${city.latitude})`
  ).join(',');

  // Add path
  const path = cities.map(c => `${c.longitude},${c.latitude}`).join(',');
  const pathOverlay = `path-5+3B82F6-0.8(${path})`;

  // Combine
  return `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/${pathOverlay}/${markers}/auto/1200x800@2x?access_token=${MAPBOX_TOKEN}`;
}
```

**Features:**
- Up to 1280x1280 pixels
- Retina support (@2x)
- Custom markers with colors
- Path overlays
- Auto-fit bounding box
- 100,000 free requests/month

### Rate Limits & Costs

**Puppeteer:**
- No API costs
- Runs on your server
- High memory usage (~150-200MB per instance)
- Consider queueing for multiple PDFs

**PDFKit:**
- No API costs
- Runs on your server
- Low memory usage
- Can handle concurrent requests

**Mapbox Static API:**
- 100,000 free requests/month
- $0.60 per 1,000 requests after that
- Sufficient for PDF map images

### Complexity: MEDIUM

**Puppeteer:**
- Easy if using existing HTML templates
- Medium if creating custom template
- 1-2 days implementation

**PDFKit:**
- Requires more manual positioning
- Learning curve for complex layouts
- 2-3 days implementation

**jsPDF:**
- Simple API, but limited features
- 1 day implementation

---

## Comparison Matrix

| Feature | Notion | Google Calendar | iCal (.ics) | Google Maps | KML | GPX | PDF |
|---------|--------|-----------------|-------------|-------------|-----|-----|-----|
| **Complexity** | Medium | Medium | Easy | Easy | Easy | Easy | Medium |
| **Implementation Time** | 2-3 days | 2-3 days | 4-6 hours | 1 hour | 4-6 hours | 2-4 hours | 1-3 days |
| **OAuth Required** | Yes | Yes | No | No | No | No | No |
| **Rate Limits** | 3 req/sec | 10k/min | None | None | None | None | None |
| **Costs** | Free | Free | Free | Free | Free | Free | Free* |
| **User Experience** | Excellent | Excellent | Good | Basic | Good | Good | Excellent |
| **Manual Import** | No | No | Yes | No | Yes | Yes | No |
| **Rich Content** | ✅ Excellent | ❌ Limited | ❌ Limited | ❌ Basic | ✅ Good | ❌ Basic | ✅ Excellent |
| **Images** | ✅ Yes | ❌ No | ❌ No | ❌ No | ✅ Yes | ❌ No | ✅ Yes |
| **Interactive** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ❌ No | ❌ No |
| **Mobile Friendly** | ✅ Excellent | ✅ Excellent | ✅ Good | ✅ Excellent | ✅ Good | ✅ GPS only | ✅ Print |
| **Shareability** | ✅ Easy | ✅ Easy | ✅ Email | ✅ Easy | ✅ Easy | ✅ Easy | ✅ Easy |
| **Offline Access** | ✅ App | ✅ App | ✅ Yes | ❌ No | ⚠️ Limited | ✅ Yes | ✅ Yes |
| **Editing** | ✅ Yes | ✅ Yes | ❌ No | ❌ No | ⚠️ Manual | ❌ No | ❌ No |

*PDF generation is free if using Puppeteer/PDFKit on your server, but costs server resources

### Pros & Cons Summary

#### Notion
**Pros:**
- Beautiful, organized workspace
- Users already familiar with Notion
- Rich content with images, tables, to-dos
- Editable by user
- Great for trip planning and tracking

**Cons:**
- OAuth flow complexity
- Rate limits (3 req/sec)
- Requires Notion account
- Token storage and security

**Best for:** Users who want to plan, organize, and track their trip in a workspace

---

#### Google Calendar
**Pros:**
- Universal calendar integration
- Reminders and notifications
- Timezone handling
- Syncs across devices
- Great for scheduling

**Cons:**
- OAuth flow complexity
- Limited rich content
- No images
- Token refresh logic

**Best for:** Users who want trip dates in their calendar with reminders

---

#### iCalendar (.ics)
**Pros:**
- No authentication needed
- Works with ALL calendar apps
- Simple implementation
- No rate limits

**Cons:**
- Manual import required
- No automatic updates
- Less integrated experience

**Best for:** Quick calendar export without OAuth complexity

---

#### Google Maps (URL)
**Pros:**
- Already implemented
- Zero complexity
- Works everywhere
- Immediate navigation

**Cons:**
- No descriptions
- No images
- Basic functionality
- Can't customize

**Best for:** Quick navigation link

---

#### KML
**Pros:**
- Rich descriptions with HTML
- Images supported
- Custom styling
- Google Earth/Maps compatible
- Great visualization

**Cons:**
- Manual import to My Maps
- Requires hosting for auto-load
- Not as widely used as GPX

**Best for:** Users who want rich, visual custom maps

---

#### GPX
**Pros:**
- Industry standard
- GPS device compatible
- Strava, Komoot, etc. support
- Simple implementation
- No authentication

**Cons:**
- Limited metadata
- No images
- Basic styling
- Mainly for navigation

**Best for:** GPS device users and fitness app integration

---

#### PDF
**Pros:**
- Universal format
- Print-ready
- Offline access
- Beautiful formatting
- Professional appearance

**Cons:**
- Not editable
- Large file size (with images)
- Generation time (Puppeteer)
- Server resources

**Best for:** Users who want a printable, offline reference

---

## Recommended Implementation Order

### Phase 1: Quick Wins (1 week)
**Priority: Get exports working fast with minimal complexity**

1. **GPX Export** (2-4 hours)
   - Easiest to implement
   - No authentication
   - Immediate value for GPS users
   - Use manual XML generation

2. **iCalendar (.ics) Export** (4-6 hours)
   - Simple implementation
   - Works for all calendar apps
   - No OAuth hassles
   - Use `ics` npm package

3. **KML Export** (4-6 hours)
   - Still simple, more powerful than GPX
   - Rich descriptions with images
   - Use `tokml` npm package
   - Include Mapbox static map images

**Total time: ~2-3 days**
**Result: 3 export formats working, no authentication needed**

---

### Phase 2: OAuth Integrations (2-3 weeks)
**Priority: Add premium features with OAuth**

4. **Google Calendar Integration** (2-3 days)
   - High user demand
   - Familiar to everyone
   - Better UX than .ics
   - Implement OAuth flow (reusable for Notion)
   - Use `node-gbatchrequests` for batch creation

5. **Notion Integration** (2-3 days)
   - Power users will love this
   - Rich content platform
   - Reuse OAuth patterns from Google
   - Create database + pages structure

**Total time: ~1 week**
**Result: Calendar and Notion integrations working**

---

### Phase 3: PDF Generation (1 week)
**Priority: Professional offline format**

6. **PDF Export** (2-3 days)
   - Start with Puppeteer + HTML template
   - Include Mapbox static map images
   - Print-optimized styling
   - Can reuse spotlight page components

**Total time: ~3 days**
**Result: Beautiful, printable PDFs**

---

### Phase 4: Polish & Marketing (ongoing)

7. **Landing page "Export" section**
   - Showcase all export options
   - "Export to Notion", "Add to Calendar", "Download PDF", etc.
   - Icons for each format

8. **Export UI in spotlight page**
   - Dropdown or modal with export options
   - Authentication flows
   - Progress indicators
   - Download buttons

9. **Analytics & Monitoring**
   - Track which exports are most popular
   - Monitor API quotas
   - Error tracking

---

## Technical Architecture

### Database Schema

```sql
-- Store OAuth tokens for integrations
CREATE TABLE user_integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  provider VARCHAR(50) NOT NULL, -- 'notion', 'google_calendar'
  access_token TEXT NOT NULL,
  refresh_token TEXT, -- For Google (Notion tokens don't expire)
  token_expiry TIMESTAMP, -- For Google
  scope TEXT, -- Permissions granted
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Track export history
CREATE TABLE export_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  job_id VARCHAR(50) NOT NULL,
  export_type VARCHAR(50) NOT NULL, -- 'notion', 'calendar', 'pdf', 'gpx', etc.
  status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed'
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### API Endpoints

```javascript
// File download exports (no auth)
GET /api/export/gpx/:jobId
GET /api/export/kml/:jobId
GET /api/export/ics/:jobId
GET /api/export/pdf/:jobId

// OAuth integrations
GET /api/integrations/notion/connect
GET /api/integrations/notion/callback
POST /api/integrations/notion/export/:jobId

GET /api/integrations/google-calendar/connect
GET /api/integrations/google-calendar/callback
POST /api/integrations/google-calendar/export/:jobId

// Check integration status
GET /api/integrations/status
```

### Export Service Structure

```javascript
// services/exportService.js
class ExportService {
  async exportToGPX(jobId) { /* ... */ }
  async exportToKML(jobId) { /* ... */ }
  async exportToICS(jobId) { /* ... */ }
  async exportToPDF(jobId) { /* ... */ }
  async exportToNotion(jobId, accessToken) { /* ... */ }
  async exportToGoogleCalendar(jobId, accessToken) { /* ... */ }
}

// services/notionService.js
class NotionService {
  constructor(accessToken) { /* ... */ }
  async createTripDatabase(routeData) { /* ... */ }
  async createCityPage(city, databaseId) { /* ... */ }
}

// services/googleCalendarService.js
class GoogleCalendarService {
  constructor(accessToken) { /* ... */ }
  async createTripEvents(routeData) { /* ... */ }
  async refreshToken(refreshToken) { /* ... */ }
}
```

---

## Security Considerations

### Token Storage
- **Never** store tokens in localStorage (client-side)
- Encrypt tokens at rest in database
- Use environment variables for client secrets
- Implement token rotation for Google Calendar

### OAuth Best Practices
- Use HTTPS for all redirects
- Validate state parameter to prevent CSRF
- Store minimal necessary scopes
- Implement token revocation endpoints

### Rate Limiting
- Implement per-user export limits
- Queue export jobs for heavy operations (PDF)
- Monitor API quotas to avoid service disruption
- Cache results when possible

---

## User Experience Flow

### Export Button UI

```jsx
// Component in spotlight page
function ExportMenu({ jobId }) {
  return (
    <DropdownMenu>
      <DropdownTrigger>
        <Button>Export Trip</Button>
      </DropdownTrigger>
      <DropdownContent>
        <DropdownSection title="Quick Downloads">
          <DropdownItem icon={📍} onClick={() => downloadGPX(jobId)}>
            Download GPX (GPS Devices)
          </DropdownItem>
          <DropdownItem icon={🗺️} onClick={() => downloadKML(jobId)}>
            Download KML (Google Earth)
          </DropdownItem>
          <DropdownItem icon={📅} onClick={() => downloadICS(jobId)}>
            Download Calendar File (.ics)
          </DropdownItem>
          <DropdownItem icon={📄} onClick={() => downloadPDF(jobId)}>
            Download PDF
          </DropdownItem>
        </DropdownSection>

        <DropdownSection title="Integrations">
          <DropdownItem icon={<NotionIcon />} onClick={() => exportToNotion(jobId)}>
            {notionConnected ? 'Export to Notion' : 'Connect Notion'}
          </DropdownItem>
          <DropdownItem icon={<GoogleIcon />} onClick={() => exportToCalendar(jobId)}>
            {calendarConnected ? 'Add to Google Calendar' : 'Connect Google Calendar'}
          </DropdownItem>
        </DropdownSection>
      </DropdownContent>
    </DropdownMenu>
  );
}
```

---

## Conclusion

**Recommended MVP (Phase 1):**
1. GPX export
2. ICS export
3. KML export

**These three require minimal implementation time (~2-3 days total), no authentication, and provide immediate value.**

**After MVP success, add:**
4. Google Calendar integration (OAuth)
5. Notion integration (OAuth)
6. PDF generation

**This phased approach lets you ship value quickly and iterate based on user feedback.**

---

## Additional Resources

### Documentation Links
- Notion API: https://developers.notion.com/
- Google Calendar API: https://developers.google.com/calendar
- Mapbox Static API: https://docs.mapbox.com/api/maps/static-images/
- GPX Format: https://www.topografix.com/gpx.asp
- KML Reference: https://developers.google.com/kml/documentation
- iCalendar Spec: https://icalendar.org/

### npm Packages
```bash
# OAuth & APIs
npm install @notionhq/client googleapis

# File generation
npm install ics tokml togpx gpx-builder

# PDF generation
npm install puppeteer pdfkit jspdf

# Utilities
npm install node-gbatchrequests tz-lookup
```

---

**End of Research Document**
