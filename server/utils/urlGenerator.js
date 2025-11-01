/**
 * URL Generator Utility
 * Generates actionable links for restaurants, hotels, activities, and scenic stops
 */

/**
 * Generate all relevant URLs for a restaurant
 * @param {Object} restaurant - Restaurant object with name, address, coordinates, city
 * @returns {Object} URLs for booking, reviews, maps, directions
 */
function generateRestaurantUrls(restaurant, city, previousLocation = null) {
  const name = restaurant.name || '';
  const address = restaurant.address || '';
  const coords = restaurant.coordinates;

  const urls = {
    // Google Maps - primary location link
    googleMapsUrl: coords
      ? `https://maps.google.com/?q=${coords.lat},${coords.lng}`
      : `https://maps.google.com/?q=${encodeURIComponent(name + ' ' + (address || city))}`,

    // TripAdvisor - reviews and photos
    tripAdvisorUrl: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(name + ' ' + city)}`,

    // Yelp - reviews and ratings
    yelpUrl: `https://www.yelp.com/search?find_desc=${encodeURIComponent(name)}&find_loc=${encodeURIComponent(city)}`,

    // OpenTable - reservations (if applicable)
    openTableUrl: `https://www.opentable.com/s/?term=${encodeURIComponent(name)}&locality=${encodeURIComponent(city)}`,

    // TheFork - European restaurant bookings
    theForkUrl: `https://www.thefork.com/search?cityId=&term=${encodeURIComponent(name)}`,

    // Google Search - general info
    googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + city + ' restaurant')}`,
  };

  // Add directions if we have previous location
  if (previousLocation && coords) {
    urls.directionsUrl = generateDirectionsUrl(previousLocation, coords);
  }

  // Add street view if we have coordinates
  if (coords) {
    urls.streetViewUrl = generateStreetViewUrl(coords);
  }

  return urls;
}

/**
 * Generate all relevant URLs for a hotel/accommodation
 * @param {Object} hotel - Hotel object with name, address, coordinates, city
 * @returns {Object} URLs for booking sites, maps, street view
 */
function generateAccommodationUrls(hotel, city) {
  const name = hotel.name || '';
  const coords = hotel.coordinates;

  const urls = {
    // Booking.com - primary booking site
    bookingUrl: `https://www.booking.com/search.html?ss=${encodeURIComponent(name + ' ' + city)}`,

    // Hotels.com - alternative booking
    hotelsUrl: `https://www.hotels.com/search.do?q-destination=${encodeURIComponent(name + ' ' + city)}`,

    // Airbnb - for alternative accommodations
    airbnbUrl: `https://www.airbnb.com/s/${encodeURIComponent(city)}/homes`,

    // Expedia
    expediaUrl: `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(city)}`,

    // TripAdvisor - reviews
    tripAdvisorUrl: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(name + ' ' + city)}`,

    // Google Maps
    googleMapsUrl: coords
      ? `https://maps.google.com/?q=${coords.lat},${coords.lng}`
      : `https://maps.google.com/?q=${encodeURIComponent(name + ' ' + city)}`,

    // Google Search
    googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + city + ' hotel')}`,
  };

  // Add street view if we have coordinates
  if (coords) {
    urls.streetViewUrl = generateStreetViewUrl(coords);
  }

  return urls;
}

/**
 * Generate all relevant URLs for an activity/attraction
 * @param {Object} activity - Activity object with name, coordinates, city, type
 * @returns {Object} URLs for maps, tickets, reviews, info
 */
function generateActivityUrls(activity, city) {
  const name = activity.name || '';
  const coords = activity.coordinates;
  const type = activity.type || 'attraction';

  const urls = {
    // Google Maps - location
    googleMapsUrl: coords
      ? `https://maps.google.com/?q=${coords.lat},${coords.lng}`
      : `https://maps.google.com/?q=${encodeURIComponent(name + ' ' + city)}`,

    // Wikipedia - encyclopedia info
    wikipediaUrl: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(name)}`,

    // GetYourGuide - tickets and tours
    getYourGuideUrl: `https://www.getyourguide.com/s/?q=${encodeURIComponent(name + ' ' + city)}`,

    // Viator - alternative tickets
    viatorUrl: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(name + ' ' + city)}`,

    // TripAdvisor - reviews and photos
    tripAdvisorUrl: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(name + ' ' + city)}`,

    // Google Search - general info
    googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + city)}`,

    // Official website search (user can click to find)
    officialSiteSearch: `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + city + ' official website')}`,
  };

  // Add street view if we have coordinates
  if (coords) {
    urls.streetViewUrl = generateStreetViewUrl(coords);
    urls.photosUrl = `https://www.google.com/search?q=${encodeURIComponent(name + ' ' + city)}&tbm=isch`;
  }

  return urls;
}

/**
 * Generate all relevant URLs for a scenic stop
 * @param {Object} stop - Scenic stop object with name, coordinates
 * @returns {Object} URLs for maps, photos, street view
 */
function generateScenicStopUrls(stop) {
  const name = stop.name || '';
  const coords = stop.coordinates;

  const urls = {
    // Google Maps - required
    googleMapsUrl: coords
      ? `https://maps.google.com/?q=${coords.lat},${coords.lng}`
      : `https://maps.google.com/?q=${encodeURIComponent(name)}`,

    // Google Image Search - photos
    photosUrl: `https://www.google.com/search?q=${encodeURIComponent(name)}&tbm=isch`,

    // Google Search - info
    googleSearchUrl: `https://www.google.com/search?q=${encodeURIComponent(name)}`,
  };

  // Add street view and drone spots if we have coordinates
  if (coords) {
    urls.streetViewUrl = generateStreetViewUrl(coords);
    urls.dronespotsUrl = `https://www.dronespots.eu/search?q=${encodeURIComponent(name)}`;

    // Add parking nearby search
    urls.parkingNearbyUrl = `https://www.google.com/maps/search/parking/@${coords.lat},${coords.lng},15z`;
  }

  return urls;
}

/**
 * Generate Google Street View URL
 * @param {Object} coords - { lat, lng }
 * @returns {string} Street View URL
 */
function generateStreetViewUrl(coords) {
  if (!coords || !coords.lat || !coords.lng) return null;
  return `https://www.google.com/maps/@${coords.lat},${coords.lng},3a,75y,90t/data=!3m7!1e1!3m5!1s0!2e0!3e5`;
}

/**
 * Generate directions URL from point A to point B
 * @param {Object} from - { lat, lng } or string
 * @param {Object} to - { lat, lng } or string
 * @returns {string} Google Maps directions URL
 */
function generateDirectionsUrl(from, to) {
  let origin, destination;

  // Handle from
  if (typeof from === 'string') {
    origin = encodeURIComponent(from);
  } else if (from && from.lat && from.lng) {
    origin = `${from.lat},${from.lng}`;
  } else {
    return null;
  }

  // Handle to
  if (typeof to === 'string') {
    destination = encodeURIComponent(to);
  } else if (to && to.lat && to.lng) {
    destination = `${to.lat},${to.lng}`;
  } else {
    return null;
  }

  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

/**
 * Generate practical info URLs
 * @param {string} city - City name
 * @returns {Object} URLs for parking, transport, ATMs, etc.
 */
function generatePracticalUrls(city) {
  return {
    parkingMapUrl: `https://www.google.com/maps/search/parking+${encodeURIComponent(city)}`,
    atmLocatorUrl: `https://www.google.com/maps/search/atm+${encodeURIComponent(city)}`,
    pharmacyUrl: `https://www.google.com/maps/search/pharmacy+${encodeURIComponent(city)}`,
    hospitalUrl: `https://www.google.com/maps/search/hospital+${encodeURIComponent(city)}`,
    policeUrl: `https://www.google.com/maps/search/police+${encodeURIComponent(city)}`,
    publicTransportUrl: `https://www.google.com/search?q=${encodeURIComponent(city + ' public transport map')}`,
  };
}

module.exports = {
  generateRestaurantUrls,
  generateAccommodationUrls,
  generateActivityUrls,
  generateScenicStopUrls,
  generateStreetViewUrl,
  generateDirectionsUrl,
  generatePracticalUrls
};
