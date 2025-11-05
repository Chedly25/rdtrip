/**
 * Google Places Photo Service
 * Handles photo URLs and attribution for Google Places photos
 *
 * Google Places API photo requirements:
 * - Attribution is REQUIRED (legal requirement from Google)
 * - Photo references expire after a short time, generate URLs on-demand
 * - Max dimensions: 1600px
 */

class GooglePlacesPhotoService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.maxWidth = 1200; // Default max width
    this.maxHeight = 800; // Default max height
  }

  /**
   * Generate photo URL from Google Places photo reference
   * @param {string} photoReference - Photo reference from Places API
   * @param {Object} options - Size options
   * @returns {string} Photo URL
   */
  getPhotoUrl(photoReference, options = {}) {
    const { maxWidth = this.maxWidth, maxHeight = this.maxHeight } = options;

    // Google Places Photo API endpoint
    return `https://maps.googleapis.com/maps/api/place/photo?` +
      `maxwidth=${maxWidth}&` +
      `maxheight=${maxHeight}&` +
      `photoreference=${photoReference}&` +
      `key=${this.apiKey}`;
  }

  /**
   * Get all photos for a place with URLs
   * @param {Object} place - Place object from Google Places API
   * @param {number} limit - Max photos to return
   * @returns {Array} Array of photo objects with URLs
   */
  getAllPhotos(place, limit = 5) {
    if (!place.photos || place.photos.length === 0) {
      return [];
    }

    return place.photos.slice(0, limit).map((photo, index) => ({
      url: this.getPhotoUrl(photo.photo_reference),
      thumbnail: this.getPhotoUrl(photo.photo_reference, { maxWidth: 400, maxHeight: 300 }),
      attribution: photo.html_attributions?.[0] || 'Google Maps',
      width: photo.width,
      height: photo.height,
      isPrimary: index === 0
    }));
  }

  /**
   * Get primary photo for a place
   * @param {Object} place - Place object
   * @returns {Object|null} Primary photo or null
   */
  getPrimaryPhoto(place) {
    const photos = this.getAllPhotos(place, 1);
    return photos.length > 0 ? photos[0] : null;
  }

  /**
   * Get thumbnail URL (smaller size for cards/lists)
   * @param {string} photoReference - Photo reference
   * @returns {string} Thumbnail URL
   */
  getThumbnailUrl(photoReference) {
    return this.getPhotoUrl(photoReference, { maxWidth: 400, maxHeight: 300 });
  }

  /**
   * Get hero image URL (large size for headers)
   * @param {string} photoReference - Photo reference
   * @returns {string} Hero image URL
   */
  getHeroUrl(photoReference) {
    return this.getPhotoUrl(photoReference, { maxWidth: 1600, maxHeight: 900 });
  }

  /**
   * Enrich place object with photo URLs
   * Adds photos array with URLs to place object
   * @param {Object} place - Place object from Google Places
   * @returns {Object} Enriched place with photo URLs
   */
  enrichPlaceWithPhotos(place) {
    if (!place) return null;

    const photos = this.getAllPhotos(place);

    return {
      ...place,
      photos: photos,
      primaryPhoto: photos[0] || null,
      hasPhotos: photos.length > 0
    };
  }

  /**
   * Batch enrich multiple places with photos
   * @param {Array} places - Array of place objects
   * @returns {Array} Enriched places
   */
  enrichPlacesWithPhotos(places) {
    if (!places || !Array.isArray(places)) return [];
    return places.map(place => this.enrichPlaceWithPhotos(place));
  }

  /**
   * Validate photo reference (check if it exists and is valid string)
   * @param {string} photoReference - Photo reference to validate
   * @returns {boolean} True if valid
   */
  isValidPhotoReference(photoReference) {
    return typeof photoReference === 'string' && photoReference.length > 0;
  }
}

module.exports = GooglePlacesPhotoService;
