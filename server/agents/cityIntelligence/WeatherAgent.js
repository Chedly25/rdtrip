/**
 * WeatherAgent - Weather Context & Recommendations Agent
 *
 * Provides weather-aware travel recommendations including:
 * - Current/forecast weather data
 * - Impact assessment on planned activities
 * - Indoor backup suggestions
 * - Best times for photography (golden hour)
 * - Weather-based activity recommendations
 *
 * Architecture Notes:
 * - Depends on ClusterAgent (to identify outdoor activities)
 * - Uses existing checkWeather tool when API key available
 * - Falls back to seasonal estimates when no API
 * - Does not refine (weather is factual)
 */

const BaseAgent = require('./BaseAgent');

// Try to use existing weather tool
let checkWeather;
try {
  checkWeather = require('../../tools/checkWeather');
} catch (e) {
  checkWeather = null;
}

class WeatherAgent extends BaseAgent {
  constructor() {
    super({
      name: 'WeatherAgent',
      description: 'Weather-aware recommendations for the visit',
      requiredInputs: ['city'],
      optionalInputs: ['prev:ClusterAgent', 'travelDates'],
      outputs: ['forecast', 'temperature', 'conditions', 'recommendations', 'riskAssessment'],
      dependsOn: ['ClusterAgent'],
      canRefine: false // Weather is factual, no refinement needed
    });

    this.model = 'claude-haiku-4-5-20251001';
  }

  /**
   * Main execution logic
   */
  async run(input, context) {
    const { city, previousAgentOutputs } = input;

    // Get clusters to identify outdoor activities
    const clusterData = previousAgentOutputs?.ClusterAgent?.data;
    const clusters = clusterData?.clusters || [];

    this.reportProgress(20, 'Checking weather...');

    // Try to get real weather data
    let weatherData = await this.fetchWeatherData(city, context);

    this.reportProgress(60, 'Analyzing activity impact...');

    // Identify outdoor activities that may be affected
    const outdoorActivities = this.identifyOutdoorActivities(clusters);

    this.reportProgress(80, 'Generating recommendations...');

    // Generate recommendations based on weather
    const recommendations = await this.generateRecommendations(
      city,
      weatherData,
      outdoorActivities
    );

    return {
      data: {
        forecast: weatherData.forecast,
        temperature: weatherData.temperature,
        conditions: weatherData.conditions,
        recommendations: recommendations,
        riskAssessment: weatherData.riskAssessment
      },
      confidence: weatherData.isReal ? 90 : 60, // Lower confidence for estimates
      gaps: weatherData.isReal ? [] : ['Using seasonal estimates - check forecast closer to date']
    };
  }

  /**
   * Fetch weather data using existing tool or generate estimates
   */
  async fetchWeatherData(city, context) {
    const locationString = `${city.name}, ${city.country}`;

    // Try the real weather API first
    if (checkWeather && process.env.OPENWEATHER_API_KEY) {
      try {
        const result = await checkWeather({ location: locationString }, context);

        if (result.success) {
          return {
            isReal: true,
            forecast: this.formatForecastSummary(result),
            temperature: result.current ? {
              high: result.current.temperature + 3,
              low: result.current.temperature - 5
            } : { high: 22, low: 14 },
            conditions: result.current?.condition || 'Unknown',
            riskAssessment: this.assessRisk(result)
          };
        }
      } catch (error) {
        console.warn(`[WeatherAgent] API fetch failed:`, error.message);
      }
    }

    // Fall back to seasonal estimates
    return this.generateSeasonalEstimate(city);
  }

  /**
   * Format forecast summary from API response
   */
  formatForecastSummary(apiResult) {
    if (apiResult.summary) {
      return apiResult.summary.split('\n')[0]; // First line only
    }

    if (apiResult.current) {
      return `${apiResult.current.description}, ${apiResult.current.temperature}°C`;
    }

    return 'Weather data available - check forecast for details';
  }

  /**
   * Assess weather risk level
   */
  assessRisk(apiResult) {
    if (!apiResult.current) return 'Unknown';

    const rainProb = apiResult.current.rainProbability || 0;
    const condition = apiResult.current.condition?.toLowerCase() || '';

    if (condition.includes('thunderstorm') || rainProb > 70) {
      return 'High - Plan indoor alternatives';
    }

    if (condition.includes('rain') || rainProb > 40) {
      return 'Moderate - Bring rain gear';
    }

    if (condition.includes('cloud')) {
      return 'Low - Good for outdoor activities';
    }

    return 'Low - Excellent conditions';
  }

  /**
   * Generate seasonal weather estimate when no API available
   */
  generateSeasonalEstimate(city) {
    const now = new Date();
    const month = now.getMonth() + 1;

    // Simple seasonal temperature estimates for European cities
    let temp, conditions, forecast;

    if (month >= 6 && month <= 8) {
      // Summer
      temp = { high: 26 + Math.floor(Math.random() * 6), low: 16 + Math.floor(Math.random() * 4) };
      conditions = 'Warm and sunny (seasonal estimate)';
      forecast = `Summer weather expected - ${temp.high}°C highs, generally pleasant`;
    } else if (month >= 12 || month <= 2) {
      // Winter
      temp = { high: 8 + Math.floor(Math.random() * 5), low: 2 + Math.floor(Math.random() * 4) };
      conditions = 'Cool to cold (seasonal estimate)';
      forecast = `Winter conditions - ${temp.high}°C highs, pack warm layers`;
    } else if (month >= 3 && month <= 5) {
      // Spring
      temp = { high: 16 + Math.floor(Math.random() * 6), low: 8 + Math.floor(Math.random() * 4) };
      conditions = 'Mild and variable (seasonal estimate)';
      forecast = `Spring weather - ${temp.high}°C highs, possible showers`;
    } else {
      // Autumn
      temp = { high: 14 + Math.floor(Math.random() * 6), low: 8 + Math.floor(Math.random() * 4) };
      conditions = 'Cool and crisp (seasonal estimate)';
      forecast = `Autumn conditions - ${temp.high}°C highs, bring layers`;
    }

    return {
      isReal: false,
      forecast,
      temperature: temp,
      conditions,
      riskAssessment: 'Unknown - Check forecast closer to visit date'
    };
  }

  /**
   * Identify outdoor activities from clusters
   */
  identifyOutdoorActivities(clusters) {
    const outdoorKeywords = ['park', 'garden', 'lake', 'beach', 'viewpoint', 'walk', 'hike', 'market', 'outdoor'];
    const outdoorThemes = ['nature', 'outdoor', 'scenic'];

    const outdoorActivities = [];

    for (const cluster of clusters) {
      // Check if cluster theme suggests outdoor
      if (outdoorThemes.includes(cluster.theme)) {
        outdoorActivities.push({
          name: cluster.name,
          type: 'cluster',
          bestFor: cluster.bestFor
        });
        continue;
      }

      // Check individual places in cluster
      for (const place of (cluster.places || [])) {
        const placeText = `${place.name} ${place.type} ${place.description || ''}`.toLowerCase();

        if (outdoorKeywords.some(keyword => placeText.includes(keyword))) {
          outdoorActivities.push({
            name: place.name,
            type: place.type,
            cluster: cluster.name
          });
        }
      }
    }

    return outdoorActivities;
  }

  /**
   * Generate weather-based recommendations
   */
  async generateRecommendations(city, weatherData, outdoorActivities) {
    const recommendations = {
      outdoorSafe: [],
      backup: null,
      goldenHour: this.calculateGoldenHour(city)
    };

    const temp = weatherData.temperature?.high || 22;
    const conditions = (weatherData.conditions || '').toLowerCase();

    // Determine safe outdoor times
    if (conditions.includes('rain') || conditions.includes('storm')) {
      recommendations.outdoorSafe = ['Early morning if brief clearing'];
      recommendations.backup = 'Museums, covered markets, or cafes recommended';
    } else if (temp > 30) {
      recommendations.outdoorSafe = ['Early morning (before 10am)', 'Late afternoon (after 5pm)'];
      recommendations.backup = 'Air-conditioned spaces during midday heat';
    } else if (temp < 5) {
      recommendations.outdoorSafe = ['Midday (warmest)', 'Brief outdoor stints'];
      recommendations.backup = 'Warm indoor attractions like museums';
    } else {
      // Good weather
      recommendations.outdoorSafe = ['Morning', 'Afternoon', 'Early evening'];
      recommendations.backup = null; // No backup needed
    }

    // Add activity-specific advice if we have outdoor activities
    if (outdoorActivities.length > 0 && conditions.includes('rain')) {
      const firstOutdoor = outdoorActivities[0];
      recommendations.backup = `Rain expected - consider indoor alternatives to ${firstOutdoor.name}`;
    }

    return recommendations;
  }

  /**
   * Calculate approximate golden hour for photography
   */
  calculateGoldenHour(city) {
    const now = new Date();
    const month = now.getMonth() + 1;

    // Approximate golden hour times for European latitudes
    // Varies by season and latitude, these are estimates for ~45-50°N
    if (month >= 5 && month <= 7) {
      // Summer - late golden hour
      return '8:30 PM - 9:00 PM';
    } else if (month >= 11 || month <= 1) {
      // Winter - early golden hour
      return '4:00 PM - 4:30 PM';
    } else if (month >= 3 && month <= 4) {
      // Spring
      return '6:30 PM - 7:00 PM';
    } else {
      // Autumn
      return '5:30 PM - 6:00 PM';
    }
  }
}

module.exports = WeatherAgent;
