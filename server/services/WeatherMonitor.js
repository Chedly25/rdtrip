/**
 * WeatherMonitor - Weather forecast monitoring and change detection
 *
 * STEP 4 Phase 1: Weather Alerts
 *
 * Responsibilities:
 * - Fetch daily weather forecasts for trip locations
 * - Compare new forecasts with stored historical data
 * - Detect significant weather changes (rain → snow, temp drop, etc.)
 * - Create notifications for important weather alerts
 *
 * API: OpenWeatherMap 5-day forecast (free tier)
 * Rate limit: 60 calls/minute, 1,000,000 calls/month
 */

const axios = require('axios');
const pool = require('../db');
const NotificationService = require('./NotificationService');

class WeatherMonitor {
  constructor() {
    this.apiKey = process.env.OPENWEATHER_API_KEY;
    this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    this.notificationService = new NotificationService();

    if (!this.apiKey) {
      console.warn('[WeatherMonitor] ⚠️  OPENWEATHER_API_KEY not set - weather monitoring disabled');
    }
  }

  /**
   * Check weather for an itinerary and create notifications if changes detected
   * Returns number of notifications created
   */
  async checkItinerary(itinerary) {
    if (!this.apiKey) {
      return 0;
    }

    console.log(`[WeatherMonitor] 🌤️  Checking weather for itinerary ${itinerary.id}`);

    let notificationsCreated = 0;

    try {
      // Parse route data to get day-by-day locations
      const routeData = typeof itinerary.route_data === 'string'
        ? JSON.parse(itinerary.route_data)
        : itinerary.route_data;

      if (!routeData || !routeData.dayStructure) {
        console.log(`[WeatherMonitor] ⚠️  No day structure found for itinerary ${itinerary.id}`);
        return 0;
      }

      const days = Array.isArray(routeData.dayStructure)
        ? routeData.dayStructure
        : routeData.dayStructure.days || [];

      // Check weather for each day (only next 5 days due to API limitations)
      const tripStartDate = new Date(itinerary.trip_start_date);
      const today = new Date();

      for (let i = 0; i < Math.min(days.length, 5); i++) {
        const day = days[i];
        const dayDate = new Date(tripStartDate);
        dayDate.setDate(dayDate.getDate() + i);

        // Only check future days
        if (dayDate < today) {
          continue;
        }

        try {
          const notifications = await this.checkDayWeather(
            itinerary.id,
            day.day,
            day.location,
            dayDate
          );
          notificationsCreated += notifications;

        } catch (dayError) {
          console.error(`[WeatherMonitor] ❌ Error checking day ${day.day}:`, dayError.message);
        }
      }

      console.log(`[WeatherMonitor] ✅ Created ${notificationsCreated} weather notifications`);

    } catch (error) {
      console.error('[WeatherMonitor] ❌ Error checking itinerary:', error);
    }

    return notificationsCreated;
  }

  /**
   * Check weather for a specific day and location
   */
  async checkDayWeather(itineraryId, dayNumber, location, date) {
    // Fetch current weather forecast
    const forecast = await this.fetchWeatherForecast(location, date);

    if (!forecast) {
      return 0;
    }

    // Get previous forecast from database
    const previousForecast = await this.getPreviousForecast(itineraryId, dayNumber, date);

    // Store current forecast
    await this.storeForecast(itineraryId, dayNumber, location, date, forecast);

    // Detect significant changes and create notifications
    if (previousForecast) {
      return await this.detectWeatherChanges(
        itineraryId,
        dayNumber,
        location,
        date,
        previousForecast,
        forecast
      );
    }

    return 0;
  }

  /**
   * Fetch weather forecast from OpenWeatherMap API
   */
  async fetchWeatherForecast(location, date) {
    try {
      // First, geocode the location to get coordinates
      const geoUrl = `${this.baseUrl}/weather?q=${encodeURIComponent(location)}&appid=${this.apiKey}`;
      const geoResponse = await axios.get(geoUrl);

      const { lat, lon } = geoResponse.data.coord;

      // Fetch 5-day forecast
      const forecastUrl = `${this.baseUrl}/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${this.apiKey}`;
      const forecastResponse = await axios.get(forecastUrl);

      // Find forecast closest to target date
      const targetTimestamp = date.getTime();
      let closestForecast = null;
      let minDiff = Infinity;

      for (const item of forecastResponse.data.list) {
        const forecastTime = new Date(item.dt * 1000).getTime();
        const diff = Math.abs(forecastTime - targetTimestamp);

        if (diff < minDiff) {
          minDiff = diff;
          closestForecast = item;
        }
      }

      if (!closestForecast) {
        return null;
      }

      // Extract relevant data
      return {
        temperature_max: closestForecast.main.temp_max,
        temperature_min: closestForecast.main.temp_min,
        precipitation_probability: (closestForecast.pop || 0) * 100, // Convert 0-1 to 0-100
        weather_condition: closestForecast.weather[0].main,
        weather_description: closestForecast.weather[0].description,
        wind_speed: closestForecast.wind.speed,
        humidity: closestForecast.main.humidity,
        full_data: closestForecast
      };

    } catch (error) {
      console.error(`[WeatherMonitor] ❌ API error for ${location}:`, error.message);
      return null;
    }
  }

  /**
   * Get previous forecast from database
   */
  async getPreviousForecast(itineraryId, dayNumber, date) {
    const query = `
      SELECT
        temperature_max,
        temperature_min,
        precipitation_probability,
        weather_condition,
        wind_speed
      FROM weather_history
      WHERE itinerary_id = $1
        AND day_number = $2
        AND date = $3
      ORDER BY forecast_fetched_at DESC
      LIMIT 1
    `;

    const result = await pool.query(query, [itineraryId, dayNumber, date]);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Store forecast in database
   */
  async storeForecast(itineraryId, dayNumber, location, date, forecast) {
    const query = `
      INSERT INTO weather_history (
        itinerary_id,
        day_number,
        location,
        date,
        weather_data,
        temperature_max,
        temperature_min,
        precipitation_probability,
        weather_condition,
        wind_speed
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (itinerary_id, day_number, date)
      DO UPDATE SET
        weather_data = EXCLUDED.weather_data,
        temperature_max = EXCLUDED.temperature_max,
        temperature_min = EXCLUDED.temperature_min,
        precipitation_probability = EXCLUDED.precipitation_probability,
        weather_condition = EXCLUDED.weather_condition,
        wind_speed = EXCLUDED.wind_speed,
        forecast_fetched_at = CURRENT_TIMESTAMP
    `;

    await pool.query(query, [
      itineraryId,
      dayNumber,
      location,
      date,
      JSON.stringify(forecast.full_data),
      forecast.temperature_max,
      forecast.temperature_min,
      forecast.precipitation_probability,
      forecast.weather_condition,
      forecast.wind_speed
    ]);
  }

  /**
   * Detect significant weather changes and create notifications
   */
  async detectWeatherChanges(itineraryId, dayNumber, location, date, previous, current) {
    const notifications = [];

    // Threshold definitions
    const TEMP_DROP_THRESHOLD = 5; // °C
    const TEMP_RISE_THRESHOLD = 8; // °C
    const RAIN_PROBABILITY_THRESHOLD = 30; // %
    const WIND_THRESHOLD = 15; // m/s (54 km/h)

    // 1. Temperature drop
    const tempDrop = previous.temperature_max - current.temperature_max;
    if (tempDrop >= TEMP_DROP_THRESHOLD) {
      await this.notificationService.createNotification(itineraryId, {
        type: 'weather',
        priority: tempDrop >= 10 ? 'high' : 'medium',
        title: `❄️ Temperature Drop Alert - ${location}`,
        message: `Temperature for Day ${dayNumber} (${this.formatDate(date)}) has dropped from ${Math.round(previous.temperature_max)}°C to ${Math.round(current.temperature_max)}°C. Pack warmer clothes!`,
        action_url: null,
        action_label: null,
        metadata: {
          dayNumber,
          location,
          date: date.toISOString(),
          previous_temp: previous.temperature_max,
          current_temp: current.temperature_max,
          change: -tempDrop
        }
      });
      notifications.push('temp_drop');
    }

    // 2. Temperature rise
    const tempRise = current.temperature_max - previous.temperature_max;
    if (tempRise >= TEMP_RISE_THRESHOLD) {
      await this.notificationService.createNotification(itineraryId, {
        type: 'weather',
        priority: 'low',
        title: `☀️ Temperature Rise - ${location}`,
        message: `It's getting warmer! Day ${dayNumber} (${this.formatDate(date)}) temperature increased from ${Math.round(previous.temperature_max)}°C to ${Math.round(current.temperature_max)}°C.`,
        metadata: {
          dayNumber,
          location,
          date: date.toISOString(),
          previous_temp: previous.temperature_max,
          current_temp: current.temperature_max,
          change: tempRise
        }
      });
      notifications.push('temp_rise');
    }

    // 3. Rain probability increased
    const rainIncrease = current.precipitation_probability - previous.precipitation_probability;
    if (current.precipitation_probability >= RAIN_PROBABILITY_THRESHOLD &&
        rainIncrease >= 20) {
      await this.notificationService.createNotification(itineraryId, {
        type: 'weather',
        priority: 'medium',
        title: `🌧️ Rain Expected - ${location}`,
        message: `Rain probability for Day ${dayNumber} (${this.formatDate(date)}) increased to ${Math.round(current.precipitation_probability)}%. Don't forget your umbrella!`,
        metadata: {
          dayNumber,
          location,
          date: date.toISOString(),
          precipitation_probability: current.precipitation_probability
        }
      });
      notifications.push('rain_alert');
    }

    // 4. Weather condition change (Clear → Rain, Rain → Snow, etc.)
    if (previous.weather_condition !== current.weather_condition) {
      const severityMap = {
        'Clear': 1,
        'Clouds': 2,
        'Rain': 3,
        'Snow': 4,
        'Thunderstorm': 5
      };

      const previousSeverity = severityMap[previous.weather_condition] || 2;
      const currentSeverity = severityMap[current.weather_condition] || 2;

      if (currentSeverity > previousSeverity) {
        const priority = currentSeverity >= 4 ? 'high' : 'medium';
        await this.notificationService.createNotification(itineraryId, {
          type: 'weather',
          priority,
          title: `⚠️ Weather Change - ${location}`,
          message: `Weather for Day ${dayNumber} (${this.formatDate(date)}) changed from ${previous.weather_condition} to ${current.weather_condition}. Plan accordingly!`,
          metadata: {
            dayNumber,
            location,
            date: date.toISOString(),
            previous_condition: previous.weather_condition,
            current_condition: current.weather_condition
          }
        });
        notifications.push('condition_change');
      }
    }

    // 5. High winds
    if (current.wind_speed >= WIND_THRESHOLD && current.wind_speed > previous.wind_speed * 1.5) {
      await this.notificationService.createNotification(itineraryId, {
        type: 'weather',
        priority: 'high',
        title: `💨 High Wind Alert - ${location}`,
        message: `Strong winds expected on Day ${dayNumber} (${this.formatDate(date)}): ${Math.round(current.wind_speed * 3.6)} km/h. Drive carefully!`,
        metadata: {
          dayNumber,
          location,
          date: date.toISOString(),
          wind_speed: current.wind_speed
        }
      });
      notifications.push('wind_alert');
    }

    return notifications.length;
  }

  /**
   * Format date for notifications
   */
  formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }
}

module.exports = WeatherMonitor;
