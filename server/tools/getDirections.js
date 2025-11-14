/**
 * Tool: Get Directions
 *
 * Get navigation directions between two locations
 * Returns route, distance, duration using Google Directions API
 */

const axios = require('axios');

/**
 * Execute directions request
 * @param {Object} params - Tool parameters
 * @param {string} params.from - Start location
 * @param {string} params.to - Destination location
 * @param {string} [params.mode='driving'] - Transportation mode (driving, walking, cycling)
 * @param {Object} context - Agent context (userId, routeId, etc.)
 * @returns {Promise<Object>} Directions data
 */
async function getDirections(params, context) {
  const { from, to, mode = 'driving' } = params;

  // Validate parameters
  if (!from || !to) {
    throw new Error('Both "from" and "to" locations are required');
  }

  const validModes = ['driving', 'walking', 'bicycling', 'transit'];
  const travelMode = validModes.includes(mode) ? mode : 'driving';

  const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_PLACES_API_KEY; // Same key works for Directions API

  if (!GOOGLE_MAPS_API_KEY) {
    return {
      success: false,
      error: 'Google Maps API key not configured. Please add GOOGLE_PLACES_API_KEY to environment variables.'
    };
  }

  try {
    console.log(`🗺️  Getting directions: ${from} → ${to} (${travelMode})`);

    // Call Google Directions API
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}&mode=${travelMode}&alternatives=true&key=${GOOGLE_MAPS_API_KEY}`;

    const response = await axios.get(directionsUrl, { timeout: 15000 });

    if (response.data.status !== 'OK') {
      console.warn(`Directions API returned status: ${response.data.status}`);

      if (response.data.status === 'ZERO_RESULTS') {
        return {
          success: false,
          error: `No route found between ${from} and ${to} for ${travelMode} mode.`
        };
      }

      return {
        success: false,
        error: `Directions API error: ${response.data.status}`
      };
    }

    const routes = response.data.routes || [];

    if (routes.length === 0) {
      return {
        success: false,
        error: 'No routes found.'
      };
    }

    // Step 1: Parse primary route (first one is usually best)
    const primaryRoute = routes[0];
    const leg = primaryRoute.legs[0]; // For single origin/destination, there's only 1 leg

    const primaryRouteData = {
      distance: {
        text: leg.distance.text,
        meters: leg.distance.value,
        km: Math.round(leg.distance.value / 1000)
      },
      duration: {
        text: leg.duration.text,
        seconds: leg.duration.value,
        hours: Math.round((leg.duration.value / 3600) * 10) / 10
      },
      startAddress: leg.start_address,
      endAddress: leg.end_address,
      steps: leg.steps.map(step => ({
        instruction: step.html_instructions.replace(/<\/?[^>]+(>|$)/g, ''), // Strip HTML
        distance: step.distance.text,
        duration: step.duration.text,
        travelMode: step.travel_mode
      })),
      overview: primaryRoute.summary || 'Main route',
      warnings: primaryRoute.warnings || []
    };

    // Step 2: Parse alternative routes (if available)
    const alternativeRoutes = routes.slice(1, 3).map(route => {
      const altLeg = route.legs[0];
      return {
        distance: {
          text: altLeg.distance.text,
          km: Math.round(altLeg.distance.value / 1000)
        },
        duration: {
          text: altLeg.duration.text,
          hours: Math.round((altLeg.duration.value / 3600) * 10) / 10
        },
        overview: route.summary || 'Alternative route'
      };
    });

    console.log(`✅ Found ${routes.length} route(s): ${primaryRouteData.distance.text}, ${primaryRouteData.duration.text}`);

    return {
      success: true,
      from: from,
      to: to,
      mode: travelMode,
      primaryRoute: primaryRouteData,
      alternatives: alternativeRoutes,
      totalRoutes: routes.length,
      summary: generateDirectionsSummary(from, to, travelMode, primaryRouteData, alternativeRoutes)
    };

  } catch (error) {
    console.error('Google Directions API error:', error.message);

    if (error.response) {
      return {
        success: false,
        error: `Google Directions API error: ${error.response.status} - ${error.response.statusText}`
      };
    }

    return {
      success: false,
      error: `Failed to get directions: ${error.message}`
    };
  }
}

/**
 * Generate natural language summary of directions
 */
function generateDirectionsSummary(from, to, mode, primaryRoute, alternatives) {
  let summary = `Directions from ${from} to ${to} (${mode}):\n\n`;

  // Primary route
  summary += `**Main Route** (${primaryRoute.overview}):\n`;
  summary += `📏 Distance: ${primaryRoute.distance.text}\n`;
  summary += `⏱️  Duration: ${primaryRoute.duration.text}\n`;

  if (primaryRoute.warnings.length > 0) {
    summary += `⚠️  Warnings: ${primaryRoute.warnings.join(', ')}\n`;
  }

  summary += '\n**Turn-by-turn:**\n';
  primaryRoute.steps.slice(0, 5).forEach((step, index) => {
    summary += `${index + 1}. ${step.instruction} (${step.distance})\n`;
  });

  if (primaryRoute.steps.length > 5) {
    summary += `... and ${primaryRoute.steps.length - 5} more steps\n`;
  }

  // Alternative routes
  if (alternatives.length > 0) {
    summary += `\n**Alternative Routes:**\n`;
    alternatives.forEach((alt, index) => {
      summary += `${index + 2}. ${alt.overview}: ${alt.distance.text}, ${alt.duration.text}\n`;
    });
  }

  return summary.trim();
}

module.exports = getDirections;
