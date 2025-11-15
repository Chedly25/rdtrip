/**
 * Analyze Trip Overview Tool
 * Holistic analysis across all days of the trip
 * Provides trip score, category distribution, variety/pacing analysis
 */

const db = require('../../db/connection');

async function analyzeTripOverview({ itineraryId }) {
  console.log(`📊 [analyzeTripOverview] Analyzing entire trip for itinerary ${itineraryId}`);

  try {
    const result = await db.query('SELECT id, activities, restaurants FROM itineraries WHERE id = $1', [itineraryId]);
    if (result.rows.length === 0) return { success: false, error: 'Itinerary not found' };

    const activitiesData = result.rows[0].activities || [];
    const restaurantsData = result.rows[0].restaurants || [];

    // Build days array
    const days = activitiesData.map((dayData) => ({
      dayNumber: dayData.day,
      city: dayData.city,
      date: dayData.date || null,
      activities: dayData.activities || [],
      restaurants: restaurantsData.find(r => r.day === dayData.day) || {}
    }));

    if (days.length === 0) {
      return { success: false, error: 'No days planned in this trip' };
    }

    console.log(`🗓️ Analyzing ${days.length} days...`);

    // Collect all activities across all days
    let totalActivities = 0;
    const allActivities = [];
    const categoryCount = { museum: 0, outdoor: 0, food: 0, religious: 0, other: 0 };
    const perDayBreakdown = [];

    for (let i = 0; i < days.length; i++) {
      const day = days[i];
      const activities = day.activities || [];
      const restaurants = day.restaurants || { breakfast: [], lunch: [], dinner: [] };

      totalActivities += activities.length;

      // Categorize activities
      const dayCategories = activities.map(a => categorize(a));
      dayCategories.forEach(cat => categoryCount[cat]++);
      allActivities.push(...activities);

      // Calculate day metrics
      const hasMeals = (restaurants.lunch?.length || 0) + (restaurants.dinner?.length || 0);
      const dayScore = calculateDayScore(activities, dayCategories, hasMeals);

      perDayBreakdown.push({
        dayNumber: i + 1,
        city: day.city,
        date: day.date,
        activityCount: activities.length,
        categories: {
          museum: dayCategories.filter(c => c === 'museum').length,
          outdoor: dayCategories.filter(c => c === 'outdoor').length,
          food: dayCategories.filter(c => c === 'food').length,
          religious: dayCategories.filter(c => c === 'religious').length,
          other: dayCategories.filter(c => c === 'other').length
        },
        hasMealsPlan: hasMeals > 0,
        dayScore
      });
    }

    // Calculate category distribution percentages
    const totalCategorized = Object.values(categoryCount).reduce((sum, count) => sum + count, 0);
    const categoryDistribution = {
      museum: Math.round((categoryCount.museum / totalCategorized) * 100),
      outdoor: Math.round((categoryCount.outdoor / totalCategorized) * 100),
      food: Math.round((categoryCount.food / totalCategorized) * 100),
      religious: Math.round((categoryCount.religious / totalCategorized) * 100),
      other: Math.round((categoryCount.other / totalCategorized) * 100)
    };

    // Calculate variety score (0-10)
    const varietyScore = calculateVarietyScore(categoryDistribution);

    // Calculate pacing score (0-10)
    const avgActivitiesPerDay = totalActivities / days.length;
    const pacingScore = calculatePacingScore(avgActivitiesPerDay, perDayBreakdown);

    // Calculate overall trip score (weighted average)
    const overallTripScore = Math.round((varietyScore * 0.4 + pacingScore * 0.4 + calculateAvgDayScore(perDayBreakdown) * 0.2) * 10) / 10;

    // Generate insights
    const insights = generateInsights({
      days: days.length,
      totalActivities,
      avgActivitiesPerDay,
      categoryDistribution,
      varietyScore,
      pacingScore,
      perDayBreakdown
    });

    // Generate recommendations
    const recommendations = generateRecommendations({
      categoryDistribution,
      varietyScore,
      pacingScore,
      perDayBreakdown,
      avgActivitiesPerDay
    });

    console.log(`✅ Trip analysis complete: Score ${overallTripScore}/10`);

    return {
      success: true,
      tripId: itineraryId,
      overview: {
        totalDays: days.length,
        totalActivities,
        avgActivitiesPerDay: Math.round(avgActivitiesPerDay * 10) / 10,
        overallTripScore,
        varietyScore,
        pacingScore
      },
      categoryDistribution,
      perDayBreakdown,
      insights,
      recommendations,
      summary: generateSummary(overallTripScore, varietyScore, pacingScore)
    };
  } catch (error) {
    console.error('❌ [analyzeTripOverview] Error:', error.message);
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
  if (name.includes('park') || name.includes('garden') || name.includes('outdoor') ||
      name.includes('jardin') || name.includes('hike') || name.includes('trail') ||
      name.includes('beach') || name.includes('viewpoint')) return 'outdoor';
  if (name.includes('restaurant') || name.includes('cafe') || name.includes('café') ||
      name.includes('market') || name.includes('marché')) return 'food';
  if (name.includes('church') || name.includes('cathedral') || name.includes('cathédrale') ||
      name.includes('basilica') || name.includes('basilique') || name.includes('temple')) return 'religious';

  return 'other';
}

/**
 * Calculate score for a single day
 * @param {Array} activities - Day's activities
 * @param {Array} categories - Activity categories
 * @param {number} hasMeals - Number of meals planned
 * @returns {number} - Day score (0-10)
 */
function calculateDayScore(activities, categories, hasMeals) {
  let penalty = 0;

  // Too many activities
  if (activities.length > 5) penalty += 30;
  else if (activities.length > 4) penalty += 15;

  // Too few activities
  if (activities.length < 2) penalty += 20;

  // Repetitive categories
  const museumCount = categories.filter(c => c === 'museum').length;
  const religiousCount = categories.filter(c => c === 'religious').length;

  if (museumCount >= 3) penalty += 25;
  else if (museumCount >= 2) penalty += 10;

  if (religiousCount >= 2) penalty += 15;

  // No outdoor activities
  if (activities.length > 2 && !categories.includes('outdoor')) penalty += 10;

  // No meals planned
  if (hasMeals === 0 && activities.length > 2) penalty += 10;

  return Math.max(0, 100 - penalty) / 10;
}

/**
 * Calculate variety score based on category distribution
 * @param {Object} distribution - Category percentages
 * @returns {number} - Variety score (0-10)
 */
function calculateVarietyScore(distribution) {
  const values = Object.values(distribution);

  // Ideal: balanced distribution (no category > 50%, at least 3 categories represented)
  const maxPercentage = Math.max(...values);
  const categoriesWithActivities = values.filter(v => v > 0).length;

  let score = 10;

  // Penalty for dominance
  if (maxPercentage > 60) score -= 4;
  else if (maxPercentage > 50) score -= 2;
  else if (maxPercentage > 40) score -= 1;

  // Penalty for lack of diversity
  if (categoriesWithActivities < 2) score -= 5;
  else if (categoriesWithActivities < 3) score -= 2;

  return Math.max(0, score);
}

/**
 * Calculate pacing score based on activity distribution
 * @param {number} avgActivities - Average activities per day
 * @param {Array} perDayBreakdown - Per-day metrics
 * @returns {number} - Pacing score (0-10)
 */
function calculatePacingScore(avgActivities, perDayBreakdown) {
  let score = 10;

  // Ideal: 3-4 activities per day
  if (avgActivities > 5) score -= 4;
  else if (avgActivities > 4.5) score -= 2;
  else if (avgActivities < 2) score -= 3;

  // Check for consistency (avoid huge swings)
  const activityCounts = perDayBreakdown.map(d => d.activityCount);
  const max = Math.max(...activityCounts);
  const min = Math.min(...activityCounts);
  const variance = max - min;

  if (variance > 4) score -= 2; // e.g., one day with 7 activities, another with 1
  else if (variance > 3) score -= 1;

  return Math.max(0, score);
}

/**
 * Calculate average day score
 * @param {Array} perDayBreakdown - Per-day metrics
 * @returns {number} - Average day score (0-10)
 */
function calculateAvgDayScore(perDayBreakdown) {
  const total = perDayBreakdown.reduce((sum, day) => sum + day.dayScore, 0);
  return total / perDayBreakdown.length;
}

/**
 * Generate insights about the trip
 * @param {Object} params - Analysis parameters
 * @returns {Array<string>} - Array of insight strings
 */
function generateInsights({ days, totalActivities, avgActivitiesPerDay, categoryDistribution, varietyScore, pacingScore, perDayBreakdown }) {
  const insights = [];

  // Duration insight
  if (days <= 3) {
    insights.push(`🗓️ Short ${days}-day trip - perfect for a weekend getaway`);
  } else if (days <= 7) {
    insights.push(`🗓️ Week-long adventure covering ${totalActivities} activities`);
  } else {
    insights.push(`🗓️ Extended ${days}-day journey with ${totalActivities} planned activities`);
  }

  // Pacing insight
  if (avgActivitiesPerDay >= 5) {
    insights.push(`⚡ Fast-paced trip (${avgActivitiesPerDay.toFixed(1)} activities/day) - active travelers will love it`);
  } else if (avgActivitiesPerDay >= 3) {
    insights.push(`👍 Well-paced trip (${avgActivitiesPerDay.toFixed(1)} activities/day) - balanced exploration`);
  } else {
    insights.push(`🧘 Relaxed pace (${avgActivitiesPerDay.toFixed(1)} activities/day) - plenty of downtime`);
  }

  // Category insights
  const dominantCategory = Object.entries(categoryDistribution).reduce((a, b) => a[1] > b[1] ? a : b);
  if (dominantCategory[1] > 40) {
    const categoryNames = { museum: 'cultural/museum', outdoor: 'outdoor', food: 'culinary', religious: 'religious', other: 'general' };
    insights.push(`🎭 ${categoryNames[dominantCategory[0]]}-focused trip (${dominantCategory[1]}% of activities)`);
  }

  // Variety insight
  if (varietyScore >= 8) {
    insights.push(`🌈 Excellent variety - diverse mix of activity types`);
  } else if (varietyScore < 5) {
    insights.push(`⚠️ Limited variety - consider diversifying activity types`);
  }

  // Best/worst days
  const sortedDays = [...perDayBreakdown].sort((a, b) => b.dayScore - a.dayScore);
  if (sortedDays.length > 1) {
    insights.push(`⭐ Best planned day: Day ${sortedDays[0].dayNumber} (${sortedDays[0].city}) - score ${sortedDays[0].dayScore}/10`);
    if (sortedDays[sortedDays.length - 1].dayScore < 6) {
      insights.push(`⚠️ Day ${sortedDays[sortedDays.length - 1].dayNumber} needs improvement - score ${sortedDays[sortedDays.length - 1].dayScore}/10`);
    }
  }

  return insights;
}

/**
 * Generate recommendations
 * @param {Object} params - Analysis parameters
 * @returns {Array<Object>} - Array of recommendation objects
 */
function generateRecommendations({ categoryDistribution, varietyScore, pacingScore, perDayBreakdown, avgActivitiesPerDay }) {
  const recommendations = [];

  // Variety recommendations
  if (varietyScore < 7) {
    if (categoryDistribution.outdoor < 15) {
      recommendations.push({
        priority: 'medium',
        category: 'variety',
        issue: 'Limited outdoor activities',
        action: 'Add parks, gardens, or scenic walks to balance indoor activities'
      });
    }
    if (categoryDistribution.museum > 50) {
      recommendations.push({
        priority: 'medium',
        category: 'variety',
        issue: 'Museum-heavy itinerary',
        action: 'Replace 1-2 museums with markets, local experiences, or outdoor spots'
      });
    }
  }

  // Pacing recommendations
  if (pacingScore < 7) {
    if (avgActivitiesPerDay > 5) {
      recommendations.push({
        priority: 'high',
        category: 'pacing',
        issue: 'Trip may feel rushed',
        action: 'Reduce activities per day to 3-4 for a more relaxed experience'
      });
    }

    // Check for unbalanced days
    const overloadedDays = perDayBreakdown.filter(d => d.activityCount > 5);
    if (overloadedDays.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'pacing',
        issue: `${overloadedDays.length} day(s) are overloaded (${overloadedDays.map(d => `Day ${d.dayNumber}`).join(', ')})`,
        action: 'Use analyzeDayFeasibility tool to check timing, consider spreading activities'
      });
    }
  }

  // Optimization recommendations
  const daysNeedingOptimization = perDayBreakdown.filter(d => d.activityCount >= 3);
  if (daysNeedingOptimization.length > 0) {
    recommendations.push({
      priority: 'low',
      category: 'optimization',
      issue: `${daysNeedingOptimization.length} day(s) could benefit from route optimization`,
      action: `Use optimizeRoute tool on days: ${daysNeedingOptimization.map(d => d.dayNumber).join(', ')}`
    });
  }

  // Meal planning recommendations
  const daysWithoutMeals = perDayBreakdown.filter(d => !d.hasMealsPlan);
  if (daysWithoutMeals.length > 0) {
    recommendations.push({
      priority: 'low',
      category: 'logistics',
      issue: `${daysWithoutMeals.length} day(s) have no meal reservations`,
      action: 'Add lunch/dinner plans for better dining experience'
    });
  }

  // Sort by priority
  return recommendations.sort((a, b) => {
    const priority = { high: 3, medium: 2, low: 1 };
    return priority[b.priority] - priority[a.priority];
  });
}

/**
 * Generate summary text
 * @param {number} tripScore - Overall trip score
 * @param {number} varietyScore - Variety score
 * @param {number} pacingScore - Pacing score
 * @returns {string} - Summary message
 */
function generateSummary(tripScore, varietyScore, pacingScore) {
  if (tripScore >= 8.5) {
    return '🌟 Outstanding trip! Very well planned with great variety and pacing.';
  }
  if (tripScore >= 7.5) {
    return '✅ Solid trip plan with good variety and pacing. Minor improvements suggested.';
  }
  if (tripScore >= 6.5) {
    return '👍 Decent trip structure, but several improvements would enhance the experience.';
  }
  if (tripScore >= 5.5) {
    return '⚠️ Trip needs attention. Check variety and pacing recommendations.';
  }
  return '❌ Trip requires significant improvements. Review all recommendations carefully.';
}

module.exports = analyzeTripOverview;
