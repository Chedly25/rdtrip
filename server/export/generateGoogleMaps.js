/**
 * Google Maps URL Generator
 * Creates shareable Google Maps URLs with all waypoints and scenic stops
 */

/**
 * Generate Google Maps URL with route and waypoints
 */
function generateGoogleMapsUrl(itinerary) {
  const waypoints = [];

  if (!itinerary.day_structure?.days) {
    return null;
  }

  // Extract cities from day structure
  const cities = [];
  itinerary.day_structure.days.forEach(day => {
    // Parse location (e.g., "Paris → Lyon" or just "Lyon")
    const parts = day.location.split('→').map(s => s.trim());
    const city = parts[parts.length - 1]; // Take last part

    if (!cities.includes(city)) {
      cities.push(city);
    }
  });

  // Add scenic stops as waypoints (if coordinates available)
  const scenicWaypoints = [];
  if (itinerary.scenic_stops) {
    itinerary.scenic_stops.forEach(segment => {
      if (segment.stops) {
        segment.stops.forEach(stop => {
          if (stop.coordinates) {
            // If coordinates are in format "lat,lng" or object {lat, lng}
            if (typeof stop.coordinates === 'string' && stop.coordinates.includes(',')) {
              scenicWaypoints.push(stop.coordinates);
            } else if (stop.coordinates.lat && stop.coordinates.lng) {
              scenicWaypoints.push(`${stop.coordinates.lat},${stop.coordinates.lng}`);
            } else {
              // Use stop name as fallback
              scenicWaypoints.push(encodeURIComponent(stop.name));
            }
          }
        });
      }
    });
  }

  // Build URL
  if (cities.length < 2) {
    return null; // Need at least origin and destination
  }

  const origin = encodeURIComponent(cities[0]);
  const destination = encodeURIComponent(cities[cities.length - 1]);

  // Combine intermediate cities and scenic stops (Google Maps allows up to 25 waypoints)
  const intermediateCities = cities.slice(1, -1).map(c => encodeURIComponent(c));
  const allWaypoints = [...intermediateCities, ...scenicWaypoints].slice(0, 23); // Leave room for origin/dest

  const waypointsParam = allWaypoints.length > 0 ? `&waypoints=${allWaypoints.join('|')}` : '';

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
}

/**
 * Generate Google Maps URL for a specific day
 */
function generateDayGoogleMapsUrl(itinerary, dayNumber) {
  const day = itinerary.day_structure?.days?.find(d => d.day === dayNumber);

  if (!day || !day.driveSegments || day.driveSegments.length === 0) {
    return null;
  }

  const firstSegment = day.driveSegments[0];
  const lastSegment = day.driveSegments[day.driveSegments.length - 1];

  const origin = encodeURIComponent(firstSegment.from);
  const destination = encodeURIComponent(lastSegment.to);

  // Add scenic stops for this day as waypoints
  const waypoints = [];
  if (itinerary.scenic_stops) {
    const dayStops = itinerary.scenic_stops.filter(ss => ss.day === dayNumber);

    dayStops.forEach(segment => {
      if (segment.stops) {
        segment.stops.forEach(stop => {
          if (stop.coordinates) {
            if (typeof stop.coordinates === 'string' && stop.coordinates.includes(',')) {
              waypoints.push(stop.coordinates);
            } else if (stop.coordinates.lat && stop.coordinates.lng) {
              waypoints.push(`${stop.coordinates.lat},${stop.coordinates.lng}`);
            } else {
              waypoints.push(encodeURIComponent(stop.name));
            }
          }
        });
      }
    });
  }

  // Add intermediate cities from segments
  const intermediateCities = day.driveSegments
    .slice(0, -1)
    .map(seg => encodeURIComponent(seg.to));

  const allWaypoints = [...intermediateCities, ...waypoints];
  const waypointsParam = allWaypoints.length > 0 ? `&waypoints=${allWaypoints.join('|')}` : '';

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
}

/**
 * Generate Google Maps place URL for a specific location
 */
function generatePlaceUrl(placeName, cityName) {
  const query = cityName ? `${placeName}, ${cityName}` : placeName;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

module.exports = {
  generateGoogleMapsUrl,
  generateDayGoogleMapsUrl,
  generatePlaceUrl
};
