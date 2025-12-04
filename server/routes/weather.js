/**
 * Weather API Routes
 * Sprint 2.3: Real-Time Adaptations
 *
 * Endpoints for fetching weather data during a trip
 */

const express = require('express');
const router = express.Router();

// OpenWeatherMap API configuration
const OPENWEATHER_API_KEY = process.env.OPENWEATHERMAP_API_KEY || process.env.OPENWEATHER_API_KEY;
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Simple auth middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.userId = null;
    return next();
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'));
    req.userId = decoded.userId || decoded.id;
    next();
  } catch {
    req.userId = null;
    next();
  }
};

/**
 * GET /api/weather/current
 * Get current weather for a location
 *
 * Query params:
 * - lat: latitude (required)
 * - lng: longitude (required)
 * - units: 'metric' or 'imperial' (optional, default 'metric')
 */
router.get('/current', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, units = 'metric' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    if (!OPENWEATHER_API_KEY) {
      console.warn('[Weather API] No API key - returning mock data');
      return res.json(generateMockCurrentWeather(parseFloat(lat), parseFloat(lng)));
    }

    const url = `${OPENWEATHER_BASE_URL}/weather?lat=${lat}&lon=${lng}&units=${units}&appid=${OPENWEATHER_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== 200) {
      throw new Error(data.message || 'Failed to fetch weather');
    }

    res.json(transformCurrentWeather(data, units));
  } catch (error) {
    console.error('[Weather API] Error:', error);
    res.status(500).json({ error: 'Failed to fetch weather data' });
  }
});

/**
 * GET /api/weather/forecast
 * Get 5-day weather forecast for a location
 *
 * Query params:
 * - lat: latitude (required)
 * - lng: longitude (required)
 * - units: 'metric' or 'imperial' (optional, default 'metric')
 */
router.get('/forecast', authMiddleware, async (req, res) => {
  try {
    const { lat, lng, units = 'metric' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    if (!OPENWEATHER_API_KEY) {
      console.warn('[Weather API] No API key - returning mock data');
      return res.json(generateMockForecast(parseFloat(lat), parseFloat(lng)));
    }

    const url = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lng}&units=${units}&appid=${OPENWEATHER_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.cod !== '200') {
      throw new Error(data.message || 'Failed to fetch forecast');
    }

    res.json(transformForecast(data, units));
  } catch (error) {
    console.error('[Weather API] Forecast error:', error);
    res.status(500).json({ error: 'Failed to fetch forecast data' });
  }
});

/**
 * GET /api/weather/alerts
 * Get weather alerts/warnings for a location
 *
 * Query params:
 * - lat: latitude (required)
 * - lng: longitude (required)
 */
router.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    // Use One Call API for alerts (requires paid plan)
    // For now, derive alerts from forecast data
    if (!OPENWEATHER_API_KEY) {
      return res.json({ alerts: generateMockAlerts() });
    }

    const forecastUrl = `${OPENWEATHER_BASE_URL}/forecast?lat=${lat}&lon=${lng}&units=metric&appid=${OPENWEATHER_API_KEY}`;
    const response = await fetch(forecastUrl);
    const data = await response.json();

    if (data.cod !== '200') {
      throw new Error(data.message || 'Failed to fetch weather data');
    }

    const alerts = deriveAlertsFromForecast(data);
    res.json({ alerts });
  } catch (error) {
    console.error('[Weather API] Alerts error:', error);
    res.status(500).json({ error: 'Failed to fetch weather alerts' });
  }
});

/**
 * Transform OpenWeatherMap current weather response
 */
function transformCurrentWeather(data, units) {
  const tempUnit = units === 'imperial' ? '°F' : '°C';
  const speedUnit = units === 'imperial' ? 'mph' : 'm/s';

  return {
    temperature: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    tempMin: Math.round(data.main.temp_min),
    tempMax: Math.round(data.main.temp_max),
    humidity: data.main.humidity,
    pressure: data.main.pressure,
    condition: data.weather[0].main,
    description: data.weather[0].description,
    icon: mapWeatherIcon(data.weather[0].icon),
    windSpeed: Math.round(data.wind.speed),
    windDirection: data.wind.deg,
    clouds: data.clouds.all,
    visibility: data.visibility,
    sunrise: new Date(data.sys.sunrise * 1000).toISOString(),
    sunset: new Date(data.sys.sunset * 1000).toISOString(),
    location: {
      name: data.name,
      country: data.sys.country,
      lat: data.coord.lat,
      lng: data.coord.lon,
    },
    units: {
      temp: tempUnit,
      speed: speedUnit,
    },
    updatedAt: new Date().toISOString(),
    isGoodForOutdoor: isGoodForOutdoorActivities(data),
    suggestions: getWeatherSuggestions(data),
  };
}

/**
 * Transform OpenWeatherMap forecast response
 */
function transformForecast(data, units) {
  const tempUnit = units === 'imperial' ? '°F' : '°C';

  // Group by day
  const dailyMap = new Map();

  data.list.forEach((item) => {
    const date = new Date(item.dt * 1000).toDateString();

    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        date: new Date(item.dt * 1000).toISOString().split('T')[0],
        tempMin: item.main.temp_min,
        tempMax: item.main.temp_max,
        conditions: [],
        humidity: [],
        windSpeed: [],
        rainProbability: 0,
      });
    }

    const day = dailyMap.get(date);
    day.tempMin = Math.min(day.tempMin, item.main.temp_min);
    day.tempMax = Math.max(day.tempMax, item.main.temp_max);
    day.conditions.push(item.weather[0].main);
    day.humidity.push(item.main.humidity);
    day.windSpeed.push(item.wind.speed);

    if (item.pop) {
      day.rainProbability = Math.max(day.rainProbability, item.pop * 100);
    }
  });

  // Convert to array with aggregated data
  const forecast = Array.from(dailyMap.values()).map((day) => {
    // Find most common condition
    const conditionCounts = day.conditions.reduce((acc, c) => {
      acc[c] = (acc[c] || 0) + 1;
      return acc;
    }, {});
    const mainCondition = Object.entries(conditionCounts).sort((a, b) => b[1] - a[1])[0][0];

    return {
      date: day.date,
      dayName: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
      tempMin: Math.round(day.tempMin),
      tempMax: Math.round(day.tempMax),
      condition: mainCondition,
      icon: mapConditionToIcon(mainCondition),
      humidity: Math.round(day.humidity.reduce((a, b) => a + b, 0) / day.humidity.length),
      windSpeed: Math.round(day.windSpeed.reduce((a, b) => a + b, 0) / day.windSpeed.length),
      rainProbability: Math.round(day.rainProbability),
      isGoodForOutdoor: mainCondition !== 'Rain' && mainCondition !== 'Thunderstorm' && mainCondition !== 'Snow',
    };
  }).slice(0, 5);

  return {
    forecast,
    location: {
      name: data.city.name,
      country: data.city.country,
      lat: data.city.coord.lat,
      lng: data.city.coord.lon,
    },
    units: {
      temp: tempUnit,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Derive weather alerts from forecast data
 */
function deriveAlertsFromForecast(data) {
  const alerts = [];
  const now = Date.now();

  data.list.slice(0, 8).forEach((item) => { // Next 24 hours
    const itemTime = item.dt * 1000;
    const hoursAway = Math.round((itemTime - now) / (1000 * 60 * 60));

    // Heavy rain alert
    if (item.weather[0].main === 'Rain' && item.pop > 0.7) {
      alerts.push({
        id: `rain-${item.dt}`,
        type: 'weather',
        severity: 'warning',
        title: 'Rain Expected',
        message: `Heavy rain likely in ${hoursAway} hours (${Math.round(item.pop * 100)}% chance)`,
        startsAt: new Date(itemTime).toISOString(),
        suggestion: 'Consider indoor alternatives or bring rain gear',
      });
    }

    // Thunderstorm alert
    if (item.weather[0].main === 'Thunderstorm') {
      alerts.push({
        id: `storm-${item.dt}`,
        type: 'weather',
        severity: 'urgent',
        title: 'Thunderstorm Warning',
        message: `Thunderstorm expected in ${hoursAway} hours`,
        startsAt: new Date(itemTime).toISOString(),
        suggestion: 'Avoid outdoor activities and seek shelter',
      });
    }

    // Extreme heat
    if (item.main.feels_like > 35) {
      alerts.push({
        id: `heat-${item.dt}`,
        type: 'weather',
        severity: 'warning',
        title: 'High Temperature',
        message: `Feels like ${Math.round(item.main.feels_like)}°C in ${hoursAway} hours`,
        startsAt: new Date(itemTime).toISOString(),
        suggestion: 'Stay hydrated and seek shade during peak hours',
      });
    }

    // Strong wind
    if (item.wind.speed > 10) {
      alerts.push({
        id: `wind-${item.dt}`,
        type: 'weather',
        severity: 'info',
        title: 'Windy Conditions',
        message: `Strong winds (${Math.round(item.wind.speed)} m/s) expected in ${hoursAway} hours`,
        startsAt: new Date(itemTime).toISOString(),
        suggestion: 'Secure loose items and be cautious outdoors',
      });
    }
  });

  // Remove duplicates by keeping earliest occurrence
  const uniqueAlerts = alerts.reduce((acc, alert) => {
    const existing = acc.find((a) => a.title === alert.title);
    if (!existing) {
      acc.push(alert);
    }
    return acc;
  }, []);

  return uniqueAlerts.slice(0, 5);
}

/**
 * Map OpenWeatherMap icon to our icon system
 */
function mapWeatherIcon(iconCode) {
  const mapping = {
    '01d': 'sun',
    '01n': 'moon',
    '02d': 'cloud-sun',
    '02n': 'cloud-moon',
    '03d': 'cloud',
    '03n': 'cloud',
    '04d': 'clouds',
    '04n': 'clouds',
    '09d': 'cloud-rain',
    '09n': 'cloud-rain',
    '10d': 'cloud-sun-rain',
    '10n': 'cloud-moon-rain',
    '11d': 'cloud-lightning',
    '11n': 'cloud-lightning',
    '13d': 'snowflake',
    '13n': 'snowflake',
    '50d': 'cloud-fog',
    '50n': 'cloud-fog',
  };
  return mapping[iconCode] || 'cloud';
}

/**
 * Map condition to icon
 */
function mapConditionToIcon(condition) {
  const mapping = {
    Clear: 'sun',
    Clouds: 'cloud',
    Rain: 'cloud-rain',
    Drizzle: 'cloud-drizzle',
    Thunderstorm: 'cloud-lightning',
    Snow: 'snowflake',
    Mist: 'cloud-fog',
    Fog: 'cloud-fog',
    Haze: 'cloud-fog',
  };
  return mapping[condition] || 'cloud';
}

/**
 * Determine if weather is good for outdoor activities
 */
function isGoodForOutdoorActivities(data) {
  const condition = data.weather[0].main;
  const temp = data.main.feels_like;
  const windSpeed = data.wind.speed;

  const badConditions = ['Rain', 'Thunderstorm', 'Snow', 'Extreme'];

  if (badConditions.includes(condition)) return false;
  if (temp < 5 || temp > 35) return false;
  if (windSpeed > 15) return false;

  return true;
}

/**
 * Get weather-based suggestions
 */
function getWeatherSuggestions(data) {
  const suggestions = [];
  const condition = data.weather[0].main;
  const temp = data.main.feels_like;

  if (condition === 'Rain' || condition === 'Thunderstorm') {
    suggestions.push('Consider visiting museums or indoor attractions');
    suggestions.push('Bring an umbrella if you go outside');
  }

  if (condition === 'Clear' && temp > 25) {
    suggestions.push('Great day for outdoor sightseeing!');
    suggestions.push('Stay hydrated and wear sunscreen');
  }

  if (temp < 10) {
    suggestions.push('Dress warmly - it\'s quite cold');
  }

  if (data.wind.speed > 8) {
    suggestions.push('Windy conditions - secure loose items');
  }

  return suggestions;
}

/**
 * Generate mock current weather for development
 */
function generateMockCurrentWeather(lat, lng) {
  const conditions = ['Clear', 'Clouds', 'Rain', 'Partly Cloudy'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const temp = Math.floor(Math.random() * 20) + 15;

  return {
    temperature: temp,
    feelsLike: temp - 2,
    tempMin: temp - 3,
    tempMax: temp + 3,
    humidity: Math.floor(Math.random() * 40) + 40,
    pressure: 1013,
    condition,
    description: condition.toLowerCase(),
    icon: mapConditionToIcon(condition),
    windSpeed: Math.floor(Math.random() * 10) + 2,
    windDirection: Math.floor(Math.random() * 360),
    clouds: Math.floor(Math.random() * 100),
    visibility: 10000,
    sunrise: new Date().setHours(6, 30, 0, 0),
    sunset: new Date().setHours(20, 0, 0, 0),
    location: {
      name: 'Current Location',
      country: 'US',
      lat,
      lng,
    },
    units: {
      temp: '°C',
      speed: 'm/s',
    },
    updatedAt: new Date().toISOString(),
    isGoodForOutdoor: condition !== 'Rain',
    suggestions: condition === 'Rain'
      ? ['Consider indoor alternatives', 'Bring an umbrella']
      : ['Great weather for sightseeing!'],
  };
}

/**
 * Generate mock forecast for development
 */
function generateMockForecast(lat, lng) {
  const conditions = ['Clear', 'Clouds', 'Rain', 'Partly Cloudy'];

  const forecast = Array.from({ length: 5 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const tempBase = Math.floor(Math.random() * 15) + 15;

    return {
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      tempMin: tempBase - 3,
      tempMax: tempBase + 5,
      condition,
      icon: mapConditionToIcon(condition),
      humidity: Math.floor(Math.random() * 40) + 40,
      windSpeed: Math.floor(Math.random() * 10) + 2,
      rainProbability: condition === 'Rain' ? Math.floor(Math.random() * 50) + 50 : Math.floor(Math.random() * 30),
      isGoodForOutdoor: condition !== 'Rain',
    };
  });

  return {
    forecast,
    location: {
      name: 'Current Location',
      country: 'US',
      lat,
      lng,
    },
    units: {
      temp: '°C',
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Generate mock alerts for development
 */
function generateMockAlerts() {
  // Randomly return 0-2 mock alerts
  const rand = Math.random();
  if (rand < 0.5) return [];

  const alerts = [];

  if (rand > 0.7) {
    alerts.push({
      id: 'mock-rain-1',
      type: 'weather',
      severity: 'warning',
      title: 'Rain Expected',
      message: 'Light rain likely this afternoon (60% chance)',
      startsAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      suggestion: 'Consider indoor alternatives or bring rain gear',
    });
  }

  if (rand > 0.85) {
    alerts.push({
      id: 'mock-heat-1',
      type: 'weather',
      severity: 'info',
      title: 'Warm Afternoon',
      message: 'Temperature rising to 30°C later today',
      startsAt: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
      suggestion: 'Stay hydrated and seek shade during peak hours',
    });
  }

  return alerts;
}

module.exports = router;
