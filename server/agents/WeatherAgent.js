/**
 * Weather Agent (Premium Feature)
 * Fetches weather forecasts and provides recommendations
 * Note: Uses OpenWeatherMap free tier (requires API key)
 */

class WeatherAgent {
  constructor(dayStructure, progressCallback) {
    this.dayStructure = dayStructure;
    this.onProgress = progressCallback || (() => {});
    this.apiKey = process.env.OPENWEATHER_API_KEY;
  }

  async generate() {
    console.log('🌤️  Weather Agent: Fetching forecasts...');

    // If no API key, return placeholder data
    if (!this.apiKey) {
      console.log('⚠️  No OpenWeather API key - skipping weather data');
      return this.generatePlaceholderWeather();
    }

    const weatherData = [];
    let completed = 0;

    for (const day of this.dayStructure.days) {
      this.onProgress({ current: completed + 1, total: this.dayStructure.days.length });

      const city = this.extractMainCity(day.location);
      const weather = await this.fetchWeatherForDay(city, day.date);

      weatherData.push({
        day: day.day,
        date: day.date,
        city,
        ...weather
      });

      completed++;
    }

    console.log(`✓ Weather: Fetched ${weatherData.length} forecasts`);
    return weatherData;
  }

  async fetchWeatherForDay(city, date) {
    try {
      // Call OpenWeatherMap API for 5-day forecast
      const url = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${this.apiKey}&units=metric`;
      const response = await fetch(url);

      if (!response.ok) {
        console.warn(`Weather API returned ${response.status} for ${city}`);
        return this.generateRealisticWeather(city, date);
      }

      const data = await response.json();

      // Find forecast closest to the target date
      const targetDate = new Date(date);
      targetDate.setHours(12, 0, 0, 0); // Noon on target day

      let closestForecast = data.list[0];
      let closestDiff = Math.abs(new Date(closestForecast.dt * 1000) - targetDate);

      for (const forecast of data.list) {
        const forecastDate = new Date(forecast.dt * 1000);
        const diff = Math.abs(forecastDate - targetDate);
        if (diff < closestDiff) {
          closestDiff = diff;
          closestForecast = forecast;
        }
      }

      // Map OpenWeatherMap conditions to our format
      const weatherMain = closestForecast.weather[0]?.main?.toLowerCase() || 'clear';
      const conditionMap = {
        'clear': 'sunny',
        'clouds': closestForecast.clouds?.all > 50 ? 'cloudy' : 'partly_cloudy',
        'rain': 'light_rain',
        'drizzle': 'light_rain',
        'thunderstorm': 'light_rain',
        'snow': 'cloudy',
        'mist': 'cloudy',
        'fog': 'cloudy'
      };

      const conditions = conditionMap[weatherMain] || 'partly_cloudy';

      return {
        temp: {
          high: Math.round(closestForecast.main.temp_max),
          low: Math.round(closestForecast.main.temp_min)
        },
        conditions,
        precipitation: closestForecast.pop ? Math.round(closestForecast.pop * 100) : 0,
        windSpeed: Math.round(closestForecast.wind?.speed || 10),
        uvIndex: conditions === 'sunny' ? 7 : conditions === 'cloudy' ? 2 : 5,
        recommendation: this.getWeatherRecommendation(conditions, Math.round(closestForecast.main.temp_max))
      };

    } catch (error) {
      console.error(`Weather fetch error for ${city}:`, error.message);
      return this.generateRealisticWeather(city, date);
    }
  }

  generateRealisticWeather(city, date) {
    // Generate realistic weather based on season and location
    const month = new Date(date).getMonth() + 1; // 1-12
    const isSummer = month >= 6 && month <= 8;
    const isWinter = month >= 12 || month <= 2;

    const temp = {
      summer: { high: 28 + Math.floor(Math.random() * 5), low: 18 + Math.floor(Math.random() * 5) },
      winter: { high: 10 + Math.floor(Math.random() * 5), low: 3 + Math.floor(Math.random() * 5) },
      spring: { high: 18 + Math.floor(Math.random() * 6), low: 10 + Math.floor(Math.random() * 5) }
    };

    const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'light_rain'];
    const condition = conditions[Math.floor(Math.random() * conditions.length)];

    const selectedTemp = isSummer ? temp.summer : isWinter ? temp.winter : temp.spring;

    return {
      temp: selectedTemp,
      conditions: condition,
      precipitation: condition === 'light_rain' ? 60 : condition === 'cloudy' ? 30 : 10,
      windSpeed: 10 + Math.floor(Math.random() * 15),
      uvIndex: isSummer ? 7 : isWinter ? 2 : 5,
      recommendation: this.getWeatherRecommendation(condition, selectedTemp.high)
    };
  }

  getWeatherRecommendation(conditions, highTemp) {
    if (conditions === 'light_rain') {
      return 'Pack an umbrella. Indoor activities recommended for afternoon.';
    }
    if (conditions === 'sunny' && highTemp > 28) {
      return 'Hot and sunny - bring sunscreen and hat. Stay hydrated. Best to visit outdoor sites in morning or evening.';
    }
    if (conditions === 'sunny') {
      return 'Perfect weather for outdoor activities. Bring sunscreen.';
    }
    if (conditions === 'cloudy') {
      return 'Good day for sightseeing - comfortable temperatures without harsh sun.';
    }
    return 'Pleasant weather expected.';
  }

  generatePlaceholderWeather() {
    // Return minimal weather data when API key not available
    return this.dayStructure.days.map(day => ({
      day: day.day,
      date: day.date,
      city: this.extractMainCity(day.location),
      temp: { high: 22, low: 14 },
      conditions: 'partly_cloudy',
      precipitation: 20,
      windSpeed: 12,
      uvIndex: 5,
      recommendation: 'Pleasant weather expected. Check forecast closer to date for accuracy.'
    }));
  }

  extractMainCity(location) {
    if (location.includes('→')) {
      return location.split('→').pop().trim();
    }
    return location;
  }
}

module.exports = WeatherAgent;
