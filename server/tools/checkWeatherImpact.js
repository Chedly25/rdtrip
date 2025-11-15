/**
 * Check Weather Impact Tool
 * Identifies weather-sensitive activities and provides risk assessment
 * Suggests alternatives when bad weather threatens outdoor activities
 */

const db = require('../../db/connection');
const checkWeather = require('./checkWeather');

async function checkWeatherImpact({ itineraryId, dayNumber }) {
  console.log(`🌦️ [checkWeatherImpact] Checking weather impact on Day ${dayNumber}`);

  try {
    const result = await db.query('SELECT id, itinerary_data FROM itineraries WHERE id = $1', [itineraryId]);
    if (result.rows.length === 0) return { success: false, error: 'Itinerary not found' };

    const itineraryData = result.rows[0].itinerary_data;
    const days = itineraryData.days || [];

    if (dayNumber < 1 || dayNumber > days.length) {
      return { success: false, error: `Day ${dayNumber} not found` };
    }

    const day = days[dayNumber - 1];
    const activities = day.activities || [];

    // Get weather for that day
    let weather;
    try {
      weather = await checkWeather({ location: day.city, date: day.date });
    } catch (error) {
      console.warn(`⚠️ Could not fetch weather for ${day.city}:`, error.message);
      return {
        success: false,
        error: `Unable to fetch weather data for ${day.city}. Weather service may be unavailable.`
      };
    }

    // Identify outdoor activities
    const outdoorActivities = activities.filter(a => isOutdoorActivity(a));

    // Extract rain probability from weather response
    // checkWeather returns different formats, need to handle both
    let rainProbability = 0;
    if (weather.forecast?.rainProbability !== undefined) {
      rainProbability = weather.forecast.rainProbability;
    } else if (weather.current?.rainProbability !== undefined) {
      rainProbability = weather.current.rainProbability;
    }

    // Risk assessment
    const riskLevel = rainProbability > 70 ? 'high' : rainProbability > 40 ? 'medium' : 'low';

    const response = {
      success: true,
      day: dayNumber,
      city: day.city,
      date: day.date,
      weather: {
        condition: weather.forecast?.condition || weather.current?.condition || 'Unknown',
        temperature: weather.forecast?.temperature || weather.current?.temperature,
        rainProbability
      },
      riskLevel,
      outdoorActivities: outdoorActivities.map(a => a.name),
      outdoorCount: outdoorActivities.length,
      totalActivities: activities.length,
      recommendation: ''
    };

    // Generate recommendation based on risk level
    if (riskLevel === 'high' && outdoorActivities.length > 0) {
      response.recommendation = `☔ ${rainProbability}% chance of rain on Day ${dayNumber}. ${outdoorActivities.length} outdoor ${outdoorActivities.length === 1 ? 'activity' : 'activities'} at risk: ${outdoorActivities.map(a => a.name).join(', ')}. Consider rescheduling or adding indoor alternatives.`;
    } else if (riskLevel === 'medium' && outdoorActivities.length > 0) {
      response.recommendation = `🌤️ ${rainProbability}% chance of rain on Day ${dayNumber}. Have a backup plan for outdoor activities: ${outdoorActivities.map(a => a.name).join(', ')}.`;
    } else if (riskLevel === 'low' && outdoorActivities.length > 0) {
      response.recommendation = `☀️ Good weather expected on Day ${dayNumber} (${rainProbability}% rain chance). Perfect for outdoor activities!`;
    } else {
      response.recommendation = `Weather looks ${riskLevel === 'high' ? 'challenging' : 'good'} for Day ${dayNumber}, but all planned activities are indoors so no impact.`;
    }

    console.log(`✅ Weather impact analyzed: ${riskLevel} risk, ${outdoorActivities.length} outdoor activities`);

    return response;
  } catch (error) {
    console.error('❌ [checkWeatherImpact] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Determine if an activity is weather-sensitive (outdoor)
 * @param {Object} activity - Activity object
 * @returns {boolean} - True if outdoor activity
 */
function isOutdoorActivity(activity) {
  const name = activity.name?.toLowerCase() || '';
  const description = activity.description?.toLowerCase() || '';

  const outdoorKeywords = [
    'park', 'garden', 'hike', 'trail', 'beach', 'viewpoint', 'mountain',
    'lake', 'lavender', 'vineyard', 'outdoor', 'walk', 'jardin', 'parc',
    'promenade', 'balcon', 'belvedere', 'canyon', 'waterfall', 'forest',
    'nature', 'botanical', 'zoo', 'safari', 'harbor', 'port', 'marina'
  ];

  return outdoorKeywords.some(keyword =>
    name.includes(keyword) || description.includes(keyword)
  );
}

module.exports = checkWeatherImpact;
