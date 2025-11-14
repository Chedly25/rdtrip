/**
 * EventMonitor - Discover local events near trip locations
 *
 * STEP 4 Phase 2: Event Discovery
 *
 * Responsibilities:
 * - Search for events near each day's location
 * - Filter events matching trip dates
 * - Store discovered events in database
 * - Create notifications for interesting events
 * - Avoid duplicate notifications
 * - Support multiple event sources (Ticketmaster, local APIs)
 */

const pool = require('../db');
const NotificationService = require('./NotificationService');

class EventMonitor {
  constructor() {
    this.notificationService = new NotificationService();
    this.ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
    this.ticketmasterBaseUrl = 'https://app.ticketmaster.com/discovery/v2';
    this.searchRadiusKm = 25; // Search within 25km of location
  }

  /**
   * Check for events during an itinerary's trip
   * Returns number of notifications created
   */
  async checkItinerary(itinerary) {
    console.log(`[EventMonitor] 🎭 Checking events for itinerary ${itinerary.id}`);

    if (!this.ticketmasterApiKey) {
      console.log('[EventMonitor] ⚠️  TICKETMASTER_API_KEY not configured, skipping event discovery');
      return 0;
    }

    let notificationsCreated = 0;

    try {
      // Parse route data to get daily locations
      const routeData = typeof itinerary.route_data === 'string'
        ? JSON.parse(itinerary.route_data)
        : itinerary.route_data;

      if (!routeData || !routeData.days) {
        console.log(`[EventMonitor] ⚠️  No daily itinerary found for ${itinerary.id}`);
        return 0;
      }

      const tripStartDate = new Date(itinerary.trip_start_date);

      // Check each day of the trip
      for (let dayIndex = 0; dayIndex < routeData.days.length; dayIndex++) {
        const dayData = routeData.days[dayIndex];
        const dayNumber = dayIndex + 1;

        // Calculate the date for this day
        const dayDate = new Date(tripStartDate);
        dayDate.setDate(dayDate.getDate() + dayIndex);

        // Get primary location for this day
        const location = this.extractLocation(dayData);

        if (!location || !location.coordinates) {
          console.log(`[EventMonitor] ⚠️  No coordinates for day ${dayNumber}`);
          continue;
        }

        console.log(`[EventMonitor] 📍 Searching events for Day ${dayNumber}: ${location.name} on ${dayDate.toISOString().split('T')[0]}`);

        // Search for events near this location on this date
        const events = await this.searchEvents(location, dayDate);

        console.log(`[EventMonitor] 🎪 Found ${events.length} events for Day ${dayNumber}`);

        // Store and notify about discovered events
        for (const event of events) {
          const stored = await this.storeEvent(itinerary.id, dayNumber, location.name, dayDate, event);

          if (stored && !stored.notified) {
            // Create notification for this event
            const notification = await this.createEventNotification(
              itinerary.id,
              dayNumber,
              location.name,
              dayDate,
              event,
              stored.id
            );

            if (notification) {
              notificationsCreated++;

              // Mark event as notified
              await pool.query(
                'UPDATE discovered_events SET notified = TRUE WHERE id = $1',
                [stored.id]
              );
            }
          }
        }
      }

      console.log(`[EventMonitor] ✅ Created ${notificationsCreated} event notifications`);

    } catch (error) {
      console.error('[EventMonitor] ❌ Error checking events:', error);
    }

    return notificationsCreated;
  }

  /**
   * Extract location from day data
   */
  extractLocation(dayData) {
    // Try different location sources
    if (dayData.primary_city) {
      return {
        name: dayData.primary_city.name || dayData.primary_city,
        coordinates: dayData.primary_city.coordinates || dayData.coordinates
      };
    }

    if (dayData.city) {
      return {
        name: typeof dayData.city === 'string' ? dayData.city : dayData.city.name,
        coordinates: dayData.city.coordinates || dayData.coordinates
      };
    }

    if (dayData.location) {
      return {
        name: dayData.location,
        coordinates: dayData.coordinates
      };
    }

    return null;
  }

  /**
   * Search for events using Ticketmaster API
   */
  async searchEvents(location, date) {
    try {
      const [lat, lng] = location.coordinates;

      // Format date for API (YYYY-MM-DD)
      const dateStr = date.toISOString().split('T')[0];
      const nextDayStr = new Date(date.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Build API request
      const params = new URLSearchParams({
        apikey: this.ticketmasterApiKey,
        latlong: `${lat},${lng}`,
        radius: this.searchRadiusKm,
        unit: 'km',
        startDateTime: `${dateStr}T00:00:00Z`,
        endDateTime: `${nextDayStr}T00:00:00Z`,
        size: 20, // Max results
        sort: 'relevance,desc'
      });

      const url = `${this.ticketmasterBaseUrl}/events.json?${params}`;

      const response = await fetch(url);

      if (!response.ok) {
        console.error(`[EventMonitor] ❌ Ticketmaster API error: ${response.status}`);
        return [];
      }

      const data = await response.json();

      if (!data._embedded || !data._embedded.events) {
        return [];
      }

      // Transform Ticketmaster events to our format
      return data._embedded.events.map(event => this.transformTicketmasterEvent(event));

    } catch (error) {
      console.error('[EventMonitor] ❌ Error searching events:', error);
      return [];
    }
  }

  /**
   * Transform Ticketmaster event to our format
   */
  transformTicketmasterEvent(tmEvent) {
    const event = {
      external_id: tmEvent.id,
      source: 'ticketmaster',
      event_name: tmEvent.name,
      event_type: tmEvent.classifications?.[0]?.segment?.name || 'Event',
      venue: tmEvent._embedded?.venues?.[0]?.name || 'TBD',
      start_time: tmEvent.dates?.start?.dateTime || null,
      end_time: null, // Ticketmaster doesn't provide end time
      description: tmEvent.info || tmEvent.pleaseNote || null,
      ticket_url: tmEvent.url || null,
      price_range: null,
      event_data: {
        genre: tmEvent.classifications?.[0]?.genre?.name,
        subGenre: tmEvent.classifications?.[0]?.subGenre?.name,
        images: tmEvent.images || [],
        promoter: tmEvent.promoter?.name,
        sales: tmEvent.sales
      }
    };

    // Extract price range if available
    if (tmEvent.priceRanges && tmEvent.priceRanges.length > 0) {
      const price = tmEvent.priceRanges[0];
      event.price_range = `${price.min}-${price.max} ${price.currency}`;
    }

    return event;
  }

  /**
   * Store discovered event in database (avoid duplicates)
   */
  async storeEvent(itineraryId, dayNumber, location, date, event) {
    try {
      // Check if this event already exists for this itinerary
      const existingQuery = `
        SELECT id, notified
        FROM discovered_events
        WHERE itinerary_id = $1
          AND external_id = $2
          AND source = $3
      `;

      const existing = await pool.query(existingQuery, [
        itineraryId,
        event.external_id,
        event.source
      ]);

      if (existing.rows.length > 0) {
        console.log(`[EventMonitor] ℹ️  Event ${event.event_name} already stored`);
        return existing.rows[0];
      }

      // Insert new event
      const insertQuery = `
        INSERT INTO discovered_events (
          itinerary_id,
          day_number,
          location,
          date,
          event_name,
          event_type,
          venue,
          start_time,
          end_time,
          description,
          ticket_url,
          price_range,
          source,
          external_id,
          event_data,
          notified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, FALSE)
        RETURNING id, notified
      `;

      const result = await pool.query(insertQuery, [
        itineraryId,
        dayNumber,
        location,
        date,
        event.event_name,
        event.event_type,
        event.venue,
        event.start_time,
        event.end_time,
        event.description,
        event.ticket_url,
        event.price_range,
        event.source,
        event.external_id,
        JSON.stringify(event.event_data)
      ]);

      console.log(`[EventMonitor] ✅ Stored event: ${event.event_name}`);

      return result.rows[0];

    } catch (error) {
      console.error('[EventMonitor] ❌ Error storing event:', error);
      return null;
    }
  }

  /**
   * Create notification for discovered event
   */
  async createEventNotification(itineraryId, dayNumber, location, date, event, eventId) {
    try {
      // Determine priority based on event type and timing
      let priority = 'low';

      // High priority for major events
      const majorTypes = ['Music', 'Sports', 'Arts & Theatre'];
      if (majorTypes.includes(event.event_type)) {
        priority = 'medium';
      }

      // Higher priority if happening soon
      const daysUntilEvent = Math.floor((date - new Date()) / (1000 * 60 * 60 * 24));
      if (daysUntilEvent <= 3) {
        priority = priority === 'medium' ? 'high' : 'medium';
      }

      // Format date for display
      const dateStr = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      // Format time if available
      let timeStr = '';
      if (event.start_time) {
        const eventTime = new Date(event.start_time);
        timeStr = ` at ${eventTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })}`;
      }

      // Build notification message
      let message = `${event.event_type} event on Day ${dayNumber} in ${location}${timeStr}. `;

      if (event.venue && event.venue !== 'TBD') {
        message += `Venue: ${event.venue}. `;
      }

      if (event.price_range) {
        message += `Tickets: ${event.price_range}. `;
      }

      if (event.description) {
        const shortDesc = event.description.length > 100
          ? event.description.substring(0, 100) + '...'
          : event.description;
        message += shortDesc;
      }

      // Determine emoji based on event type
      const emojiMap = {
        'Music': '🎵',
        'Sports': '⚽',
        'Arts & Theatre': '🎭',
        'Film': '🎬',
        'Family': '👨‍👩‍👧‍👦',
        'Miscellaneous': '🎪'
      };

      const emoji = emojiMap[event.event_type] || '🎉';

      const notification = await this.notificationService.createNotification(itineraryId, {
        type: 'event',
        priority,
        title: `${emoji} ${event.event_name}`,
        message,
        action_url: event.ticket_url,
        action_label: 'View Tickets',
        metadata: {
          day_number: dayNumber,
          location,
          date: date.toISOString(),
          event_id: eventId,
          event_type: event.event_type,
          venue: event.venue
        }
      });

      console.log(`[EventMonitor] 🔔 Created notification for ${event.event_name}`);

      return notification;

    } catch (error) {
      console.error('[EventMonitor] ❌ Error creating event notification:', error);
      return null;
    }
  }

  /**
   * Get all discovered events for an itinerary
   */
  async getDiscoveredEvents(itineraryId) {
    const query = `
      SELECT *
      FROM discovered_events
      WHERE itinerary_id = $1
      ORDER BY date ASC, start_time ASC
    `;

    try {
      const result = await pool.query(query, [itineraryId]);

      return result.rows.map(row => ({
        ...row,
        event_data: typeof row.event_data === 'string'
          ? JSON.parse(row.event_data)
          : row.event_data
      }));

    } catch (error) {
      console.error('[EventMonitor] ❌ Error fetching events:', error);
      return [];
    }
  }

  /**
   * Mark event as interesting (user clicked on it)
   */
  async markEventInterested(eventId, interested = true) {
    const query = `
      UPDATE discovered_events
      SET user_interested = $1
      WHERE id = $2
      RETURNING id
    `;

    try {
      const result = await pool.query(query, [interested, eventId]);
      return result.rows.length > 0;

    } catch (error) {
      console.error('[EventMonitor] ❌ Error marking interest:', error);
      return false;
    }
  }
}

module.exports = EventMonitor;
