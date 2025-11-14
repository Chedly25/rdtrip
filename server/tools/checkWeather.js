/**
 * Tool: Check Weather
 *
 * Gets weather forecast for a location using OpenWeatherMap API
 * Returns current weather and 5-day forecast with temperature, conditions, rain probability
 */

const axios = require('axios');

/**
 * Execute weather check
 * @param {Object} params - Tool parameters
 * @param {string} params.location - City name (e.g., "Paris, France")
 * @param {string} [params.date] - Date to check (YYYY-MM-DD), defaults to today
 * @param {Object} context - Agent context (userId, routeId, etc.)
 * @returns {Promise<Object>} Weather data
 */
async function checkWeather(params, context) {
  const { location, date } = params;

  // Validate parameters
  if (!location) {
    throw new Error('Location is required');
  }

  const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

  if (!OPENWEATHER_API_KEY) {
    return {
      success: false,
      error: 'Weather API key not configured. Please add OPENWEATHER_API_KEY to environment variables.'
    };
  }

  try {
    // Step 1: Geocode location to get coordinates
    const geocodeUrl = `http://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${OPENWEATHER_API_KEY}`;

    const geocodeResponse = await axios.get(geocodeUrl, { timeout: 10000 });

    if (!geocodeResponse.data || geocodeResponse.data.length === 0) {
      return {
        success: false,
        error: `Could not find location: ${location}`
      };
    }

    const { lat, lon, name, country } = geocodeResponse.data[0];

    // Step 2: Get weather data (current + forecast)
    const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;

    const weatherResponse = await axios.get(weatherUrl, { timeout: 10000 });
    const data = weatherResponse.data;

    // Step 3: Parse current weather (first forecast entry)
    const current = data.list[0];
    const currentWeather = {
      temperature: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      condition: current.weather[0].main,
      description: current.weather[0].description,
      humidity: current.main.humidity,
      windSpeed: Math.round(current.wind.speed * 3.6), // m/s to km/h
      rainProbability: current.pop ? Math.round(current.pop * 100) : 0,
      icon: current.weather[0].icon,
      timestamp: current.dt_txt
    };

    // Step 4: Parse forecast for specific date (if provided)
    let targetDateForecast = null;
    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(12, 0, 0, 0); // Noon

      // Find forecast entry closest to noon on target date
      const targetForecast = data.list.find(entry => {
        const entryDate = new Date(entry.dt_txt);
        return (
          entryDate.getDate() === targetDate.getDate() &&
          entryDate.getMonth() === targetDate.getMonth() &&
          entryDate.getYear() === targetDate.getYear()
        );
      });

      if (targetForecast) {
        targetDateForecast = {
          date: date,
          temperature: Math.round(targetForecast.main.temp),
          feelsLike: Math.round(targetForecast.main.feels_like),
          condition: targetForecast.weather[0].main,
          description: targetForecast.weather[0].description,
          rainProbability: targetForecast.pop ? Math.round(targetForecast.pop * 100) : 0,
          windSpeed: Math.round(targetForecast.wind.speed * 3.6),
          icon: targetForecast.weather[0].icon
        };
      }
    }

    // Step 5: Parse 5-day forecast (one entry per day at noon)
    const dailyForecasts = [];
    const seenDates = new Set();

    for (const entry of data.list) {
      const entryDate = new Date(entry.dt_txt);
      const dateKey = entryDate.toISOString().split('T')[0];

      // Only include noon forecasts (12:00) and unique dates
      if (entryDate.getHours() === 12 && !seenDates.has(dateKey)) {
        seenDates.add(dateKey);
        dailyForecasts.push({
          date: dateKey,
          dayOfWeek: entryDate.toLocaleDateString('en-US', { weekday: 'long' }),
          temperature: Math.round(entry.main.temp),
          condition: entry.weather[0].main,
          description: entry.weather[0].description,
          rainProbability: entry.pop ? Math.round(entry.pop * 100) : 0,
          icon: entry.weather[0].icon
        });

        if (dailyForecasts.length >= 5) break;
      }
    }

    // Step 6: Return formatted response
    return {
      success: true,
      location: {
        name: name,
        country: country,
        coordinates: { lat, lon }
      },
      current: currentWeather,
      targetDate: targetDateForecast,
      forecast: dailyForecasts,
      summary: generateWeatherSummary(currentWeather, dailyForecasts, targetDateForecast, location)
    };

  } catch (error) {
    console.error('Weather API error:', error.message);

    if (error.response) {
      return {
        success: false,
        error: `Weather API error: ${error.response.status} - ${error.response.statusText}`
      };
    }

    return {
      success: false,
      error: `Failed to fetch weather: ${error.message}`
    };
  }
}

/**
 * Generate natural language summary of weather
 */
function generateWeatherSummary(current, forecast, targetDate, location) {
  let summary = `Current weather in ${location}: ${current.description}, ${current.temperature}°C (feels like ${current.feelsLike}°C)`;

  if (current.rainProbability > 30) {
    summary += `. ${current.rainProbability}% chance of rain`;
  }

  if (targetDate) {
    summary += `\n\nOn ${targetDate.date}: ${targetDate.description}, ${targetDate.temperature}°C`;
    if (targetDate.rainProbability > 30) {
      summary += `. ${targetDate.rainProbability}% chance of rain`;
    }
  }

  if (forecast && forecast.length > 0) {
    summary += '\n\nUpcoming forecast:';
    forecast.slice(0, 3).forEach(day => {
      summary += `\n- ${day.dayOfWeek}: ${day.condition}, ${day.temperature}°C`;
    });
  }

  return summary;
}

module.exports = checkWeather;
