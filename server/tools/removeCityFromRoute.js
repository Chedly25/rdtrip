/**
 * Tool: Remove City from Route
 *
 * Allows the AI agent to remove a city from the user's trip.
 * This is used when the user asks to remove a stop (e.g., "remove Lyon from my trip").
 */

/**
 * Execute city removal
 * @param {Object} params - Tool parameters
 * @param {string} params.cityName - Name of city to remove (will fuzzy match)
 * @param {string} [params.reason] - Why this city is being removed (for context)
 * @param {Object} context - Agent context
 * @returns {Promise<Object>} Removal confirmation for frontend
 */
async function removeCityFromRoute(params, context) {
  const { cityName, reason } = params;

  if (!cityName) {
    return {
      success: false,
      error: 'City name is required'
    };
  }

  console.log(`🗑️ [removeCityFromRoute] Removing city: ${cityName}`);

  // The actual removal is done by the frontend - we just return confirmation
  // The frontend will match the city name (fuzzy match) and remove it
  return {
    success: true,
    action: 'remove_city_from_route',
    cityName: cityName,
    message: `Removed ${cityName} from your trip`,
    reason: reason
  };
}

module.exports = removeCityFromRoute;
