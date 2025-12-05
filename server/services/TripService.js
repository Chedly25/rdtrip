/**
 * TripService - Trip in Progress Mode
 *
 * Phase 2: Real-time trip tracking and management
 *
 * Responsibilities:
 * - Start/pause/complete trips
 * - Track current day and location
 * - Manage check-ins
 * - Update trip statistics
 * - Get today's activities from itinerary
 */

const pool = require('../../db/connection');

class TripService {
  /**
   * Start a new trip (or resume existing)
   */
  async startTrip(routeId, userId, itineraryId = null) {
    // Check for existing active trip
    const existingQuery = `
      SELECT id, status, current_day, started_at, itinerary_id
      FROM active_trips
      WHERE route_id = $1 AND user_id = $2
    `;

    try {
      const existing = await pool.query(existingQuery, [routeId, userId]);

      if (existing.rows.length > 0) {
        const trip = existing.rows[0];

        // If paused, resume it
        if (trip.status === 'paused') {
          const resumeQuery = `
            UPDATE active_trips
            SET status = 'active', paused_at = NULL, updated_at = NOW()
            WHERE id = $1
            RETURNING *
          `;
          const result = await pool.query(resumeQuery, [trip.id]);
          console.log(`[TripService] ▶️ Resumed trip ${trip.id}`);
          return { trip: result.rows[0], isNew: false, resumed: true };
        }

        // If already active, return it
        if (trip.status === 'active') {
          return { trip, isNew: false, resumed: false };
        }

        // If completed/cancelled, create new
      }

      // Auto-discover itinerary by route_id if not provided
      if (!itineraryId) {
        console.log(`[TripService] 🔍 No itinerary ID provided, searching for itinerary by route_id: ${routeId}`);
        const findItineraryQuery = `
          SELECT id FROM itineraries
          WHERE route_id = $1
          ORDER BY created_at DESC
          LIMIT 1
        `;
        const itFindResult = await pool.query(findItineraryQuery, [routeId]);
        if (itFindResult.rows.length > 0) {
          itineraryId = itFindResult.rows[0].id;
          console.log(`[TripService] ✅ Found itinerary: ${itineraryId}`);
        } else {
          console.log(`[TripService] ⚠️ No itinerary found for route ${routeId}`);
        }
      }

      // Get total checkins count from itinerary
      let totalCheckins = 0;
      if (itineraryId) {
        const itineraryQuery = `
          SELECT day_structure, activities, restaurants FROM itineraries WHERE id = $1
        `;
        const itResult = await pool.query(itineraryQuery, [itineraryId]);
        if (itResult.rows.length > 0) {
          const row = itResult.rows[0];
          const dayStructure = row.day_structure;
          const activities = row.activities;
          const restaurants = row.restaurants;

          // Count activities from day_structure (if it contains days array)
          if (dayStructure && dayStructure.days) {
            totalCheckins = dayStructure.days.reduce((sum, day) => {
              return sum + (day.activities?.length || 0) + (day.meals?.length || 0);
            }, 0);
          } else {
            // Count from separate columns
            totalCheckins = (activities?.length || 0) + (restaurants?.length || 0);
          }
        }
      }

      // Create new trip
      const insertQuery = `
        INSERT INTO active_trips (
          route_id,
          user_id,
          itinerary_id,
          status,
          current_day,
          current_city_index,
          stats,
          started_at
        ) VALUES ($1, $2, $3, 'active', 1, 0, $4, NOW())
        ON CONFLICT (route_id, user_id)
        DO UPDATE SET
          status = 'active',
          current_day = 1,
          current_city_index = 0,
          itinerary_id = COALESCE(EXCLUDED.itinerary_id, active_trips.itinerary_id),
          stats = $4,
          started_at = NOW(),
          completed_at = NULL,
          paused_at = NULL,
          updated_at = NOW()
        RETURNING *
      `;

      const stats = JSON.stringify({
        distance_traveled: 0,
        photos_captured: 0,
        checkins_complete: 0,
        total_checkins: totalCheckins
      });

      const result = await pool.query(insertQuery, [routeId, userId, itineraryId, stats]);
      console.log(`[TripService] 🚀 Started new trip for route ${routeId}`);

      return { trip: result.rows[0], isNew: true, resumed: false };

    } catch (error) {
      console.error('[TripService] ❌ Error starting trip:', error);
      throw error;
    }
  }

  /**
   * Get active trip for a user
   */
  async getActiveTrip(userId) {
    const query = `
      SELECT
        at.*,
        r.origin as origin_city,
        r.destination as destination_city,
        r.route_data,
        i.day_structure,
        i.activities as itinerary_activities,
        i.restaurants as itinerary_restaurants,
        i.accommodations as itinerary_accommodations
      FROM active_trips at
      LEFT JOIN routes r ON at.route_id = r.id
      LEFT JOIN itineraries i ON at.itinerary_id = i.id
      WHERE at.user_id = $1 AND at.status = 'active'
      ORDER BY at.started_at DESC
      LIMIT 1
    `;

    try {
      const result = await pool.query(query, [userId]);
      return result.rows[0] || null;

    } catch (error) {
      console.error('[TripService] ❌ Error fetching active trip:', error);
      throw error;
    }
  }

  /**
   * Get trip by ID
   */
  async getTripById(tripId, userId = null) {
    let query = `
      SELECT
        at.*,
        r.origin as origin_city,
        r.destination as destination_city,
        r.route_data,
        i.day_structure,
        i.activities as itinerary_activities,
        i.restaurants as itinerary_restaurants,
        i.accommodations as itinerary_accommodations
      FROM active_trips at
      LEFT JOIN routes r ON at.route_id = r.id
      LEFT JOIN itineraries i ON at.itinerary_id = i.id
      WHERE at.id = $1
    `;
    const params = [tripId];

    if (userId) {
      query += ` AND at.user_id = $2`;
      params.push(userId);
    }

    try {
      const result = await pool.query(query, params);
      return result.rows[0] || null;

    } catch (error) {
      console.error('[TripService] ❌ Error fetching trip:', error);
      throw error;
    }
  }

  /**
   * Get today's activities from itinerary
   *
   * Data structure:
   * - day_structure: { days: [{ day, date, location, overnight, blocks, ... }] }
   * - itinerary_activities: [{ day, date, city, activities: [...] }]
   * - itinerary_restaurants: [{ day, city, restaurants: [...] }]
   */
  async getTodayActivities(tripId) {
    try {
      const trip = await this.getTripById(tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      console.log(`[TripService] 🔍 getTodayActivities called for trip ${tripId}`);
      console.log(`[TripService] 📊 Trip has itinerary_id: ${trip.itinerary_id || 'NULL'}`);

      const currentDay = trip.current_day;
      const activities = [];

      // Parse day_structure for day metadata (city, date, etc.)
      let dayStructure = trip.day_structure;
      if (typeof dayStructure === 'string') {
        dayStructure = JSON.parse(dayStructure);
      }
      console.log(`[TripService] 📋 day_structure has ${dayStructure?.days?.length || 0} days`);

      // Get current day metadata from day_structure
      const dayMeta = dayStructure?.days?.[currentDay - 1] || {};
      const currentCity = dayMeta.location || dayMeta.overnight || trip.origin_city;
      const currentDate = dayMeta.date || null;
      const totalDays = dayStructure?.totalDays || dayStructure?.days?.length || 1;

      // Parse activities - format is [{ day, city, activities: [...] }]
      let itineraryActivities = trip.itinerary_activities;
      if (typeof itineraryActivities === 'string') {
        itineraryActivities = JSON.parse(itineraryActivities);
      }
      console.log(`[TripService] 🎯 itinerary_activities type: ${typeof itineraryActivities}, isArray: ${Array.isArray(itineraryActivities)}, length: ${itineraryActivities?.length || 0}`);

      // Find the day's activities from the array
      if (itineraryActivities && Array.isArray(itineraryActivities)) {
        // Log available days for debugging
        const availableDays = itineraryActivities.map(d => d.day);
        console.log(`[TripService] 🗓️ Available days in activities: [${availableDays.join(', ')}], looking for day ${currentDay}`);

        // Find day entry matching currentDay
        const dayActivities = itineraryActivities.find(d => d.day === currentDay || d.day === String(currentDay));

        if (dayActivities && dayActivities.activities && Array.isArray(dayActivities.activities)) {
          dayActivities.activities.forEach((activity, index) => {
            // Extract time from timeWindow or use fallback
            let time = '09:00';
            if (activity.timeWindow?.start) {
              time = activity.timeWindow.start;
            } else if (activity.time) {
              time = activity.time;
            }

            activities.push({
              id: `activity-${currentDay}-${index}`,
              time: time,
              endTime: activity.timeWindow?.end || activity.endTime,
              title: activity.name || activity.title,
              description: activity.description || activity.why || activity.reason,
              type: 'activity',
              location: activity.location?.name || activity.address || activity.location,
              coordinates: activity.location?.coordinates || activity.coordinates,
              photo: activity.image || activity.imageUrl,
              rating: activity.rating,
              phone: activity.phone,
              duration: activity.duration || activity.estimatedDuration,
              category: activity.type || 'activity',
              status: 'upcoming'
            });
          });
        }
      }

      // Parse restaurants - format is [{ day, city, restaurants: [...] }]
      let itineraryRestaurants = trip.itinerary_restaurants;
      if (typeof itineraryRestaurants === 'string') {
        itineraryRestaurants = JSON.parse(itineraryRestaurants);
      }

      if (itineraryRestaurants && Array.isArray(itineraryRestaurants)) {
        // Find day entry matching currentDay
        const dayRestaurants = itineraryRestaurants.find(d => d.day === currentDay);

        if (dayRestaurants && dayRestaurants.restaurants && Array.isArray(dayRestaurants.restaurants)) {
          const mealTimes = { breakfast: '08:00', lunch: '12:30', dinner: '19:30' };

          dayRestaurants.restaurants.forEach((restaurant, index) => {
            const mealType = restaurant.mealType || restaurant.type || ['breakfast', 'lunch', 'dinner'][index % 3];

            activities.push({
              id: `restaurant-${currentDay}-${index}`,
              time: restaurant.time || mealTimes[mealType] || '12:30',
              title: restaurant.name || restaurant.restaurant,
              description: restaurant.description || restaurant.cuisine || restaurant.why,
              type: 'restaurant',
              mealType: mealType,
              location: restaurant.location?.name || restaurant.address || restaurant.location,
              coordinates: restaurant.location?.coordinates || restaurant.coordinates,
              photo: restaurant.image || restaurant.imageUrl,
              rating: restaurant.rating,
              priceLevel: restaurant.priceLevel || restaurant.price,
              phone: restaurant.phone,
              status: 'upcoming'
            });
          });
        }
      }

      // Sort by time
      if (activities.length > 0) {
        activities.sort((a, b) => {
          const parseTime = (t) => {
            if (!t) return 0;
            const parts = t.split(':').map(Number);
            return (parts[0] || 0) * 60 + (parts[1] || 0);
          };
          return parseTime(a.time) - parseTime(b.time);
        });
      }

      console.log(`[TripService] 📅 Day ${currentDay}/${totalDays} in ${currentCity}: ${activities.length} activities`);

      return {
        activities,
        day: currentDay,
        totalDays,
        city: currentCity,
        date: currentDate
      };

    } catch (error) {
      console.error('[TripService] ❌ Error fetching today activities:', error);
      throw error;
    }
  }

  /**
   * Update trip location
   */
  async updateLocation(tripId, userId, locationData) {
    const { latitude, longitude, accuracy, altitude, speed, heading, city, country, address } = locationData;

    // Update last_location on trip
    const updateQuery = `
      UPDATE active_trips
      SET
        last_location = $2,
        last_location_update = NOW(),
        updated_at = NOW()
      WHERE id = $1 AND user_id = $3
      RETURNING id
    `;

    const locationJson = JSON.stringify({
      lat: latitude,
      lng: longitude,
      accuracy,
      timestamp: new Date().toISOString(),
      city,
      country,
      address
    });

    // Also insert into location history
    const historyQuery = `
      INSERT INTO trip_location_updates (
        trip_id, user_id, latitude, longitude, accuracy,
        altitude, speed, heading, city, country, address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id
    `;

    try {
      await Promise.all([
        pool.query(updateQuery, [tripId, locationJson, userId]),
        pool.query(historyQuery, [
          tripId, userId, latitude, longitude, accuracy,
          altitude, speed, heading, city, country, address
        ])
      ]);

      console.log(`[TripService] 📍 Updated location for trip ${tripId}`);
      return true;

    } catch (error) {
      console.error('[TripService] ❌ Error updating location:', error);
      throw error;
    }
  }

  /**
   * Create a check-in
   */
  async createCheckin(tripId, userId, checkinData) {
    const {
      activityId,
      activityName,
      activityType,
      dayNumber,
      locationName,
      coordinates,
      photoUrls,
      note,
      rating,
      mood,
      weather,
      status = 'completed'
    } = checkinData;

    const query = `
      INSERT INTO trip_checkins (
        trip_id, user_id, activity_id, activity_name, activity_type,
        day_number, location_name, coordinates, photo_urls, note,
        rating, mood, weather, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [
        tripId, userId, activityId, activityName, activityType,
        dayNumber, locationName,
        coordinates ? JSON.stringify(coordinates) : null,
        photoUrls || [],
        note, rating, mood, weather, status
      ]);

      console.log(`[TripService] ✅ Created check-in for ${activityName}`);
      return result.rows[0];

    } catch (error) {
      console.error('[TripService] ❌ Error creating check-in:', error);
      throw error;
    }
  }

  /**
   * Get check-ins for a trip
   */
  async getCheckins(tripId, options = {}) {
    const { dayNumber = null, limit = 50 } = options;

    let query = `
      SELECT *
      FROM trip_checkins
      WHERE trip_id = $1
    `;
    const params = [tripId];
    let paramCounter = 2;

    if (dayNumber) {
      query += ` AND day_number = $${paramCounter}`;
      params.push(dayNumber);
      paramCounter++;
    }

    query += ` ORDER BY checked_in_at DESC LIMIT $${paramCounter}`;
    params.push(limit);

    try {
      const result = await pool.query(query, params);

      // Parse coordinates JSON
      return result.rows.map(row => ({
        ...row,
        coordinates: row.coordinates ? JSON.parse(row.coordinates) : null
      }));

    } catch (error) {
      console.error('[TripService] ❌ Error fetching check-ins:', error);
      throw error;
    }
  }

  /**
   * Advance to next day
   */
  async advanceDay(tripId, userId) {
    const query = `
      UPDATE active_trips
      SET current_day = current_day + 1, updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND status = 'active'
      RETURNING current_day
    `;

    try {
      const result = await pool.query(query, [tripId, userId]);
      if (result.rows.length > 0) {
        console.log(`[TripService] ➡️ Advanced to day ${result.rows[0].current_day}`);
        return result.rows[0].current_day;
      }
      return null;

    } catch (error) {
      console.error('[TripService] ❌ Error advancing day:', error);
      throw error;
    }
  }

  /**
   * Update trip stats (distance traveled)
   */
  async updateStats(tripId, statsUpdate) {
    const query = `
      UPDATE active_trips
      SET stats = stats || $2, updated_at = NOW()
      WHERE id = $1
      RETURNING stats
    `;

    try {
      const result = await pool.query(query, [tripId, JSON.stringify(statsUpdate)]);
      return result.rows[0]?.stats;

    } catch (error) {
      console.error('[TripService] ❌ Error updating stats:', error);
      throw error;
    }
  }

  /**
   * Pause trip
   */
  async pauseTrip(tripId, userId) {
    const query = `
      UPDATE active_trips
      SET status = 'paused', paused_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND user_id = $2 AND status = 'active'
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [tripId, userId]);
      if (result.rows.length > 0) {
        console.log(`[TripService] ⏸️ Paused trip ${tripId}`);
        return result.rows[0];
      }
      return null;

    } catch (error) {
      console.error('[TripService] ❌ Error pausing trip:', error);
      throw error;
    }
  }

  /**
   * Complete trip
   */
  async completeTrip(tripId, userId) {
    const query = `
      UPDATE active_trips
      SET status = 'completed', completed_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    try {
      const result = await pool.query(query, [tripId, userId]);
      if (result.rows.length > 0) {
        console.log(`[TripService] 🏁 Completed trip ${tripId}`);
        return result.rows[0];
      }
      return null;

    } catch (error) {
      console.error('[TripService] ❌ Error completing trip:', error);
      throw error;
    }
  }

  /**
   * Get trip progress data for dashboard
   */
  async getTripProgress(tripId) {
    try {
      const trip = await this.getTripById(tripId);
      if (!trip) {
        throw new Error('Trip not found');
      }

      // Get check-ins
      const checkins = await this.getCheckins(tripId);

      // Parse itinerary for cities
      let itineraryContent = trip.itinerary_content;
      if (typeof itineraryContent === 'string') {
        itineraryContent = JSON.parse(itineraryContent);
      }

      const totalDays = itineraryContent?.days?.length || 1;
      const cities = itineraryContent?.days?.map(d => ({
        name: d.city,
        country: d.country,
        dates: d.date
      })).filter((c, i, arr) => arr.findIndex(x => x.name === c.name) === i) || [];

      // Parse stats
      const stats = typeof trip.stats === 'string' ? JSON.parse(trip.stats) : trip.stats;

      // Get photos from check-ins
      const photos = checkins
        .filter(c => c.photo_urls && c.photo_urls.length > 0)
        .flatMap(c => c.photo_urls.map(url => ({
          url,
          city: c.location_name,
          caption: c.note
        })));

      return {
        tripId: trip.id,
        currentDay: trip.current_day,
        totalDays,
        currentCityIndex: trip.current_city_index,
        cities,
        stats: {
          distanceTraveled: stats.distance_traveled || 0,
          photosCaptures: stats.photos_captured || 0,
          checkinsComplete: stats.checkins_complete || 0,
          totalCheckins: stats.total_checkins || 0
        },
        photos
      };

    } catch (error) {
      console.error('[TripService] ❌ Error fetching trip progress:', error);
      throw error;
    }
  }

  /**
   * Calculate distance between two coordinates (Haversine formula)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRad(deg) {
    return deg * (Math.PI / 180);
  }
}

module.exports = TripService;
