/**
 * Suggest Improvements Tool
 * AI-powered day analysis with specific improvement suggestions
 * Analyzes variety, pacing, logistics, and optimization opportunities
 */

const db = require('../../db/connection');

async function suggestImprovements({ itineraryId, dayNumber }) {
  console.log(`💡 [suggestImprovements] Analyzing Day ${dayNumber} for improvements`);

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
    const restaurants = day.restaurants || { breakfast: [], lunch: [], dinner: [] };

    const suggestions = [];

    // 1. Variety check - Activity type distribution
    const categories = activities.map(a => categorize(a));
    const museumCount = categories.filter(c => c === 'museum').length;
    const outdoorCount = categories.filter(c => c === 'outdoor').length;
    const religiousCount = categories.filter(c => c === 'religious').length;

    if (museumCount >= 3) {
      suggestions.push({
        priority: 'medium',
        category: 'variety',
        issue: `Day has ${museumCount} museums - may feel repetitive`,
        suggestion: 'Replace 1-2 museums with outdoor activities or local markets for better variety'
      });
    }

    if (outdoorCount === 0 && activities.length > 2) {
      suggestions.push({
        priority: 'low',
        category: 'variety',
        issue: 'No outdoor activities scheduled',
        suggestion: 'Consider adding a park, garden, or scenic walk for balance'
      });
    }

    if (religiousCount >= 2) {
      suggestions.push({
        priority: 'low',
        category: 'variety',
        issue: `Day has ${religiousCount} religious sites - consider diversifying`,
        suggestion: 'Mix in some different activity types for variety'
      });
    }

    // 2. Pacing check - Activity count analysis
    if (activities.length > 5) {
      suggestions.push({
        priority: 'high',
        category: 'pacing',
        issue: `Day is packed with ${activities.length} activities`,
        suggestion: 'Reduce to 3-4 activities for a more relaxed pace. Use analyzeDayFeasibility to check timing.'
      });
    } else if (activities.length < 2) {
      suggestions.push({
        priority: 'low',
        category: 'pacing',
        issue: 'Day feels light with only 1 activity',
        suggestion: 'Consider adding 1-2 more activities to fill the day'
      });
    }

    // 3. Meal planning check
    if (!restaurants.lunch || restaurants.lunch.length === 0) {
      suggestions.push({
        priority: 'medium',
        category: 'logistics',
        issue: 'No lunch planned',
        suggestion: 'Add a restaurant near your afternoon activities'
      });
    }

    if (!restaurants.dinner || restaurants.dinner.length === 0) {
      suggestions.push({
        priority: 'low',
        category: 'logistics',
        issue: 'No dinner planned',
        suggestion: 'Consider adding a dinner reservation'
      });
    }

    // 4. Geographic clustering - Check for optimization opportunity
    const hasAddresses = activities.filter(a => a.address).length;
    if (hasAddresses >= 3) {
      suggestions.push({
        priority: 'medium',
        category: 'optimization',
        issue: 'Activities may not be optimally ordered',
        suggestion: 'Use optimizeRoute tool to minimize travel time between activities'
      });
    }

    // 5. Activity quality check - Look for low-rated activities
    const lowRatedActivities = activities.filter(a => a.rating && a.rating < 3.5);
    if (lowRatedActivities.length > 0) {
      suggestions.push({
        priority: 'medium',
        category: 'quality',
        issue: `${lowRatedActivities.length} activity with low rating (${lowRatedActivities[0].name}: ${lowRatedActivities[0].rating}/5)`,
        suggestion: 'Consider replacing with higher-rated alternatives'
      });
    }

    // Calculate overall day score
    const overallScore = calculateScore(suggestions);

    console.log(`✅ Analysis complete: ${suggestions.length} suggestions, score ${overallScore}/10`);

    return {
      success: true,
      day: dayNumber,
      city: day.city,
      overallScore,
      suggestionsCount: suggestions.length,
      suggestions: suggestions.sort((a, b) => {
        const priority = { high: 3, medium: 2, low: 1 };
        return priority[b.priority] - priority[a.priority];
      }),
      summary: generateSummary(overallScore, suggestions)
    };
  } catch (error) {
    console.error('❌ [suggestImprovements] Error:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Categorize activity by type
 * @param {Object} activity - Activity object
 * @returns {string} - Category name
 */
function categorize(activity) {
  const name = activity.name?.toLowerCase() || '';

  if (name.includes('museum') || name.includes('gallery') || name.includes('musée')) return 'museum';
  if (name.includes('park') || name.includes('garden') || name.includes('outdoor') || name.includes('jardin')) return 'outdoor';
  if (name.includes('restaurant') || name.includes('cafe') || name.includes('café')) return 'food';
  if (name.includes('church') || name.includes('cathedral') || name.includes('cathédrale') ||
      name.includes('basilica') || name.includes('basilique') || name.includes('temple')) return 'religious';

  return 'other';
}

/**
 * Calculate overall day score based on suggestions
 * @param {Array} suggestions - Array of suggestion objects
 * @returns {number} - Score out of 10
 */
function calculateScore(suggestions) {
  const penalty = suggestions.reduce((sum, s) => {
    const points = { high: 30, medium: 15, low: 5 };
    return sum + points[s.priority];
  }, 0);
  return Math.max(0, 100 - penalty) / 10; // Score out of 10
}

/**
 * Generate summary text based on score and suggestions
 * @param {number} score - Day score (0-10)
 * @param {Array} suggestions - Array of suggestions
 * @returns {string} - Summary text
 */
function generateSummary(score, suggestions) {
  if (score >= 9) {
    return '✅ Excellent! This day is very well planned.';
  }
  if (score >= 7) {
    return '👍 Good planning! Just a few minor suggestions for improvement.';
  }
  if (score >= 5) {
    return '⚠️ Decent plan, but several improvements would help.';
  }
  return '❌ This day needs significant improvements. Check the suggestions below.';
}

module.exports = suggestImprovements;
