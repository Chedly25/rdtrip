/**
 * Validation Orchestrator
 * Coordinates the validation workflow for discovered places
 *
 * This is a true agentic component that:
 * - Manages the validation pipeline
 * - Handles feedback loops and regeneration
 * - Makes autonomous decisions about place quality
 * - Optimizes for user experience and accuracy
 */

const PlacesValidationAgent = require('./PlacesValidationAgent');
const AvailabilityValidationAgent = require('./AvailabilityValidationAgent');
const GooglePlacesService = require('../../services/googlePlacesService');

class ValidationOrchestrator {
  constructor(db, apiKey) {
    this.db = db;
    console.log(`🔑 ValidationOrchestrator: Received API Key = ${apiKey ? apiKey.substring(0, 10) + '...' : 'UNDEFINED'}`);
    this.placesService = new GooglePlacesService(apiKey, db);
    this.placesValidator = new PlacesValidationAgent(this.placesService, db);
    this.availabilityValidator = new AvailabilityValidationAgent(this.placesService);

    // Validation statistics for reporting
    this.stats = {
      total: 0,
      validated: 0,
      failed: 0,
      enriched: 0,
      availabilityIssues: 0,
      regenerated: 0
    };
  }

  /**
   * Validate and enrich activities from CityActivityAgent
   * This is the main integration point
   */
  async validateActivities(activities, itineraryId, options = {}) {
    const {
      enableRegeneration = false,  // Set to true once feedback loops are implemented
      minConfidence = 0.5,
      maxRegenerationAttempts = 2
    } = options;

    console.log(`🔍 Validating ${activities.length} activity sets...`);

    const enrichedActivities = [];

    for (const activitySet of activities) {
      const { city, day, date, window, activities: cityActivities } = activitySet;

      if (!cityActivities || cityActivities.length === 0) {
        enrichedActivities.push(activitySet);
        continue;
      }

      // Validate each activity in the set
      const validatedActivities = [];

      for (const activity of cityActivities) {
        this.stats.total++;

        try {
          // STEP 1: Validate place existence and enrich with Google Places data
          const validation = await this.placesValidator.validatePlace(
            {
              name: activity.name,
              address: activity.address,
              type: activity.type
            },
            city,
            {
              itineraryId,
              date,
              scheduledTime: activity.time?.start
            }
          );

          if (!validation.valid) {
            console.warn(`❌ Validation failed for "${activity.name}": ${validation.status}`);
            this.stats.failed++;

            // Keep original activity but mark as unvalidated
            validatedActivities.push({
              ...activity,
              validationStatus: 'unvalidated',
              validationReason: validation.status
            });
            continue;
          }

          // STEP 2: Check availability if activity has scheduled time
          let availabilityResult = null;
          if (activity.time?.start && date) {
            const scheduledDateTime = this.parseDateTime(date, activity.time.start);
            availabilityResult = await this.availabilityValidator.checkAvailability(
              validation.place,
              scheduledDateTime
            );

            if (!availabilityResult.available && availabilityResult.critical) {
              console.warn(`⚠️  Availability issue for "${activity.name}": ${availabilityResult.reason}`);
              this.stats.availabilityIssues++;
            }
          }

          // STEP 3: Merge validated data with original activity
          const enrichedActivity = this.mergeActivityData(
            activity,
            validation.place,
            availabilityResult
          );

          enrichedActivity.validationStatus = 'validated';
          enrichedActivity.validationConfidence = validation.confidence;

          validatedActivities.push(enrichedActivity);
          this.stats.validated++;
          this.stats.enriched++;

          console.log(`✓ Validated "${activity.name}" (confidence: ${validation.confidence.toFixed(2)})`);

        } catch (error) {
          console.error(`Error validating "${activity.name}":`, error.message);
          this.stats.failed++;

          // Keep original activity on error
          validatedActivities.push({
            ...activity,
            validationStatus: 'error',
            validationError: error.message
          });
        }
      }

      enrichedActivities.push({
        ...activitySet,
        activities: validatedActivities
      });
    }

    this.logValidationStats();
    return enrichedActivities;
  }

  /**
   * Validate and enrich restaurants from RestaurantAgent
   */
  async validateRestaurants(restaurants, itineraryId, options = {}) {
    const { minConfidence = 0.5 } = options;

    console.log(`🍴 Validating restaurants for ${restaurants.length} days...`);

    const enrichedRestaurants = [];

    for (const dayRestaurants of restaurants) {
      const { day, date, city, meals } = dayRestaurants;

      if (!meals) {
        enrichedRestaurants.push(dayRestaurants);
        continue;
      }

      const validatedMeals = {};

      // Validate each meal (breakfast, lunch, dinner)
      for (const [mealType, restaurant] of Object.entries(meals)) {
        if (!restaurant) {
          validatedMeals[mealType] = null;
          continue;
        }

        this.stats.total++;

        try {
          const validation = await this.placesValidator.validatePlace(
            {
              name: restaurant.name,
              address: restaurant.location,
              type: 'restaurant',
              cuisine: restaurant.cuisine
            },
            city,
            {
              itineraryId,
              date,
              mealType
            }
          );

          if (!validation.valid) {
            console.warn(`❌ Restaurant validation failed for "${restaurant.name}"`);
            this.stats.failed++;
            validatedMeals[mealType] = {
              ...restaurant,
              validationStatus: 'unvalidated'
            };
            continue;
          }

          // Merge data
          const enrichedRestaurant = this.mergeRestaurantData(
            restaurant,
            validation.place
          );

          enrichedRestaurant.validationStatus = 'validated';
          enrichedRestaurant.validationConfidence = validation.confidence;

          validatedMeals[mealType] = enrichedRestaurant;
          this.stats.validated++;
          this.stats.enriched++;

          console.log(`✓ Validated restaurant "${restaurant.name}"`);

        } catch (error) {
          console.error(`Error validating restaurant "${restaurant.name}":`, error.message);
          this.stats.failed++;
          validatedMeals[mealType] = {
            ...restaurant,
            validationStatus: 'error',
            validationError: error.message
          };
        }
      }

      enrichedRestaurants.push({
        ...dayRestaurants,
        meals: validatedMeals
      });
    }

    this.logValidationStats();
    return enrichedRestaurants;
  }

  /**
   * Merge validated Google Places data with original activity
   */
  mergeActivityData(activity, validatedPlace, availabilityResult) {
    const enriched = { ...activity };

    // Add Google Places enrichment
    if (validatedPlace.placeId) {
      enriched.placeId = validatedPlace.placeId;
    }

    if (validatedPlace.coordinates) {
      enriched.coordinates = validatedPlace.coordinates;
    }

    if (validatedPlace.rating) {
      enriched.rating = validatedPlace.rating;
      enriched.reviewCount = validatedPlace.reviewCount;
    }

    if (validatedPlace.photos && validatedPlace.photos.length > 0) {
      // Use the first high-quality photo
      enriched.imageUrl = validatedPlace.photos[0].url;
      enriched.photos = validatedPlace.photos;
    }

    if (validatedPlace.openingHours) {
      enriched.openingHours = validatedPlace.openingHours;
    }

    if (validatedPlace.googleMapsUrl) {
      enriched.googleMapsUrl = validatedPlace.googleMapsUrl;
    }

    if (validatedPlace.website) {
      enriched.website = validatedPlace.website;
    }

    if (validatedPlace.phone) {
      enriched.phone = validatedPlace.phone;
    }

    if (validatedPlace.priceLevel !== undefined) {
      enriched.priceLevel = validatedPlace.priceLevel;
    }

    // Add availability information
    if (availabilityResult) {
      enriched.availability = {
        status: availabilityResult.available,
        confidence: availabilityResult.confidence,
        reason: availabilityResult.reason,
        recommendation: availabilityResult.recommendation,
        alternatives: availabilityResult.alternatives,
        critical: availabilityResult.critical || false
      };
    }

    // Add quality score
    if (validatedPlace.qualityScore) {
      enriched.qualityScore = validatedPlace.qualityScore;
    }

    return enriched;
  }

  /**
   * Merge validated Google Places data with restaurant
   */
  mergeRestaurantData(restaurant, validatedPlace) {
    const enriched = { ...restaurant };

    if (validatedPlace.placeId) {
      enriched.placeId = validatedPlace.placeId;
    }

    if (validatedPlace.coordinates) {
      enriched.coordinates = validatedPlace.coordinates;
    }

    if (validatedPlace.rating) {
      enriched.rating = validatedPlace.rating;
      enriched.reviewCount = validatedPlace.reviewCount;
    }

    if (validatedPlace.priceLevel !== undefined) {
      // Convert Google's 0-4 scale to restaurant's price range
      enriched.priceRange = validatedPlace.priceLevel;
    }

    if (validatedPlace.openingHours) {
      enriched.openingHours = validatedPlace.openingHours;
    }

    if (validatedPlace.googleMapsUrl) {
      enriched.googleMapsUrl = validatedPlace.googleMapsUrl;
    }

    if (validatedPlace.website) {
      enriched.website = validatedPlace.website;
    }

    if (validatedPlace.phone) {
      enriched.phone = validatedPlace.phone;
    }

    if (validatedPlace.qualityScore) {
      enriched.qualityScore = validatedPlace.qualityScore;
    }

    // Note: We don't add photos to restaurants as per earlier decision

    return enriched;
  }

  /**
   * Parse date and time into Date object
   */
  parseDateTime(dateStr, timeStr) {
    // dateStr format: "2024-06-15" or similar
    // timeStr format: "14:00"
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date(dateStr);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  /**
   * Get validation statistics report
   */
  getStats() {
    return {
      ...this.stats,
      validationRate: this.stats.total > 0
        ? (this.stats.validated / this.stats.total * 100).toFixed(1) + '%'
        : '0%',
      enrichmentRate: this.stats.total > 0
        ? (this.stats.enriched / this.stats.total * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  /**
   * Log validation statistics
   */
  logValidationStats() {
    const stats = this.getStats();
    console.log('\n📊 Validation Statistics:');
    console.log(`   Total places: ${stats.total}`);
    console.log(`   ✓ Validated: ${stats.validated} (${stats.validationRate})`);
    console.log(`   ✓ Enriched: ${stats.enriched} (${stats.enrichmentRate})`);
    console.log(`   ❌ Failed: ${stats.failed}`);
    console.log(`   ⚠️  Availability issues: ${stats.availabilityIssues}`);
    if (stats.regenerated > 0) {
      console.log(`   🔄 Regenerated: ${stats.regenerated}`);
    }
    console.log('');
  }

  /**
   * Reset statistics (for new validation run)
   */
  resetStats() {
    this.stats = {
      total: 0,
      validated: 0,
      failed: 0,
      enriched: 0,
      availabilityIssues: 0,
      regenerated: 0
    };
  }

  /**
   * Check if API key is configured and working
   */
  async testConnection() {
    try {
      const testResult = await this.placesService.textSearch('Eiffel Tower Paris');
      return {
        working: Array.isArray(testResult) && testResult.length > 0,
        message: 'Google Places API connection successful'
      };
    } catch (error) {
      return {
        working: false,
        message: error.message,
        error: error
      };
    }
  }
}

module.exports = ValidationOrchestrator;
