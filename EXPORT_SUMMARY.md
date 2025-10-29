# Trip Export Options - Quick Reference

**Date:** October 29, 2025

## TL;DR - Recommended Implementation

### Phase 1: MVP (2-3 days) ⭐ START HERE
1. **GPX Export** - 2-4 hours - GPS devices
2. **iCal (.ics) Export** - 4-6 hours - All calendar apps
3. **KML Export** - 4-6 hours - Google Maps/Earth

**Why start here:** No authentication, simple implementation, immediate value

### Phase 2: Premium Features (1 week)
4. **Google Calendar** - 2-3 days - OAuth integration
5. **Notion** - 2-3 days - OAuth integration

### Phase 3: Polish (3 days)
6. **PDF Generation** - 2-3 days - Printable itinerary

---

## Quick Comparison

| Format | Time | Auth? | Cost | Best For |
|--------|------|-------|------|----------|
| GPX | 2-4h | No | Free | GPS devices, fitness apps |
| ICS | 4-6h | No | Free | Any calendar app |
| KML | 4-6h | No | Free | Google Maps/Earth with rich content |
| Google Calendar | 2-3d | Yes | Free | Automatic calendar integration |
| Notion | 2-3d | Yes | Free | Rich planning workspace |
| PDF | 2-3d | No | Free* | Print/offline reference |

*Free but uses server resources

---

## Code Snippets - Quick Start

### GPX Export (Simplest)
```javascript
app.get('/api/export/gpx/:jobId', async (req, res) => {
  const route = await getRouteData(req.params.jobId);

  const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RDTrip">
  <metadata>
    <name>${route.origin} to ${route.destination}</name>
  </metadata>
  ${route.cities.map(city => `
  <wpt lat="${city.latitude}" lon="${city.longitude}">
    <name>${city.name}</name>
    <desc>${city.description}</desc>
  </wpt>`).join('')}
</gpx>`;

  res.setHeader('Content-Type', 'application/gpx+xml');
  res.setHeader('Content-Disposition', `attachment; filename="trip.gpx"`);
  res.send(gpx);
});
```

### ICS Export (Calendar)
```bash
npm install ics
```

```javascript
const ics = require('ics');

app.get('/api/export/ics/:jobId', async (req, res) => {
  const route = await getRouteData(req.params.jobId);

  const events = route.cities.map(city => ({
    start: [2025, 7, city.dayNumber, 10, 0],
    duration: { days: city.durationDays },
    title: city.name,
    description: city.description,
    location: `${city.name}, ${city.country}`,
    geo: { lat: city.latitude, lon: city.longitude }
  }));

  ics.createEvents(events, (error, value) => {
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="trip.ics"`);
    res.send(value);
  });
});
```

### KML Export (Google Maps)
```bash
npm install tokml
```

```javascript
const tokml = require('tokml');

app.get('/api/export/kml/:jobId', async (req, res) => {
  const route = await getRouteData(req.params.jobId);

  const geojson = {
    type: 'FeatureCollection',
    features: route.cities.map(city => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [city.longitude, city.latitude]
      },
      properties: {
        name: city.name,
        description: city.description
      }
    }))
  };

  const kml = tokml(geojson);

  res.setHeader('Content-Type', 'application/vnd.google-earth.kml+xml');
  res.setHeader('Content-Disposition', `attachment; filename="trip.kml"`);
  res.send(kml);
});
```

---

## Rate Limits & Quotas

### Free Tier Summary

**GPX/KML/ICS/PDF:**
- No limits (server-side generation)
- Costs: Server resources only

**Google Calendar API:**
- 1,000,000 requests/day
- 10,000 requests/minute
- FREE forever

**Notion API:**
- 3 requests/second (average)
- No daily limit
- FREE forever

**Mapbox Static API** (for map images):
- 100,000 requests/month FREE
- $0.60 per 1,000 after that

---

## OAuth Setup Checklist

### Google Calendar
- [ ] Create Google Cloud project
- [ ] Enable Google Calendar API
- [ ] Create OAuth 2.0 client ID
- [ ] Add redirect URIs
- [ ] Request scope: `https://www.googleapis.com/auth/calendar`

### Notion
- [ ] Create integration at https://www.notion.com/my-integrations
- [ ] Register redirect URIs
- [ ] Get client ID and secret
- [ ] Implement OAuth 2.0 flow

---

## Database Schema

```sql
-- OAuth tokens
CREATE TABLE user_integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  provider VARCHAR(50), -- 'notion' or 'google_calendar'
  access_token TEXT NOT NULL,
  refresh_token TEXT, -- Google only
  created_at TIMESTAMP DEFAULT NOW()
);

-- Export tracking
CREATE TABLE export_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  job_id VARCHAR(50),
  export_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## npm Packages Needed

```bash
# Phase 1 (MVP)
npm install ics tokml

# Phase 2 (OAuth)
npm install @notionhq/client googleapis node-gbatchrequests

# Phase 3 (PDF)
npm install puppeteer
# OR
npm install pdfkit  # Lighter alternative

# Utilities
npm install tz-lookup  # Timezone from coordinates
```

---

## Key Decisions

### PDF Generation: Puppeteer vs PDFKit?

**Puppeteer:**
- ✅ Beautiful rendering (it's Chrome)
- ✅ Can screenshot your spotlight page
- ❌ Large (300MB with Chromium)
- ❌ Slow (2-5 seconds)
- **Use if:** You want beautiful PDFs and can accept the overhead

**PDFKit:**
- ✅ Fast (100-500ms)
- ✅ Lightweight (5MB)
- ❌ Manual positioning
- ❌ No HTML/CSS
- **Use if:** You need speed and lower resources

**My recommendation: Puppeteer** (your app is low-volume, users want quality)

### Calendar: Google Calendar API vs .ics file?

**Start with .ics (Phase 1)**
- No OAuth complexity
- Works with all calendar apps
- 4-6 hours to implement

**Add Google Calendar API later (Phase 2)**
- Better UX (automatic sync)
- Requires OAuth
- 2-3 days to implement

Both have their place!

---

## Important Security Notes

1. **Never** store OAuth tokens in localStorage
2. Encrypt tokens in database
3. Use environment variables for secrets
4. Validate OAuth state parameter (CSRF protection)
5. Request minimal OAuth scopes

---

## Testing Checklist

### GPX
- [ ] File downloads correctly
- [ ] Opens in GPS device software
- [ ] Coordinates are correct
- [ ] Waypoint names appear

### ICS
- [ ] Imports to Google Calendar
- [ ] Imports to Apple Calendar
- [ ] Imports to Outlook
- [ ] Events have correct dates/times
- [ ] Location data appears

### KML
- [ ] Opens in Google Earth
- [ ] Imports to Google My Maps
- [ ] Markers show descriptions
- [ ] Images appear (if included)

### Google Calendar Integration
- [ ] OAuth flow works
- [ ] Events created successfully
- [ ] Timezone handling correct
- [ ] Location data with "time to leave"
- [ ] Token refresh works

### Notion Integration
- [ ] OAuth flow works
- [ ] Database created
- [ ] Pages created with content
- [ ] Images embedded
- [ ] To-do items created

### PDF
- [ ] Map image renders
- [ ] Multi-page layout works
- [ ] Page breaks correct
- [ ] Images load
- [ ] Print-friendly styling

---

## User Flow

```
User completes route generation
    ↓
Views spotlight page
    ↓
Clicks "Export Trip" button
    ↓
Sees dropdown menu:
    - Download GPX (instant)
    - Download ICS (instant)
    - Download KML (instant)
    - Download PDF (2-5 seconds)
    - Export to Notion (OAuth if not connected)
    - Add to Google Calendar (OAuth if not connected)
    ↓
For OAuth exports:
    - Redirect to provider
    - User authorizes
    - Redirect back
    - Create content
    - Show success message
    ↓
For file downloads:
    - Generate file
    - Trigger browser download
    - Show success message
```

---

## Marketing Copy Ideas

**Landing page:**
> "Export your trip anywhere: Notion for planning, Google Calendar for scheduling, PDF for printing, or GPX for your GPS device."

**Feature highlights:**
- 📱 Add to Google Calendar with one click
- 📓 Export to Notion for rich planning
- 🗺️ Download GPS files (GPX/KML)
- 📄 Print-ready PDF itineraries
- 📅 Universal calendar format (.ics)

---

## Support Requirements

**Documentation needed:**
- How to import KML to Google My Maps
- How to import ICS to various calendar apps
- How to load GPX to GPS devices
- OAuth connection troubleshooting

**FAQ items:**
- "Why do I need to connect my Notion/Google account?"
- "Can I export to Apple Calendar?" (Yes, via .ics)
- "Will my GPS device work with this?" (Yes, GPX is standard)
- "Can I edit the trip after exporting?" (Depends on format)

---

## Pricing Strategy (Future)

**Free tier:**
- All file exports (GPX, ICS, KML, PDF)
- 5 OAuth exports per month

**Premium tier:**
- Unlimited OAuth exports
- Priority PDF generation
- Auto-sync to calendar (webhooks)

---

## Success Metrics

Track these:
- Export clicks per job
- Most popular export format
- OAuth connection rate
- Export completion rate
- Download abandonment rate

Expected results:
- 40-60% of users will export
- PDF and ICS most popular
- 10-20% will connect OAuth (higher friction)

---

## Next Steps

1. **Read full research:** /Users/chedlyboukhris/rdtrip/EXPORT_OPTIONS_RESEARCH.md
2. **Create export endpoints** in server.js
3. **Install packages:** `npm install ics tokml`
4. **Add export button** to spotlight page
5. **Test with real route data**
6. **Deploy Phase 1** (GPX, ICS, KML)
7. **Gather user feedback**
8. **Implement Phase 2** (OAuth integrations)

---

**Questions? Check the full research document for detailed code examples, best practices, and implementation guides.**
