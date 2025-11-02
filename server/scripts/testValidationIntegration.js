/**
 * Test Validation Integration
 * Tests the complete flow: Perplexity discovery → Google Places validation → enrichment
 *
 * This script simulates the full itinerary generation with validation enabled.
 */

const { Pool } = require('pg');
const CityActivityAgent = require('../agents/CityActivityAgent');
const RestaurantAgent = require('../agents/RestaurantAgent');

// Mock route data and day structure for testing
const mockRouteData = {
  id: 'test-route-' + Date.now(),
  user_id: 'test-user',
  agent: 'best-overall',
  waypoints: [
    { city: 'Aix-en-Provence', country: 'France' }
  ]
};

const mockDayStructure = {
  days: [
    {
      day: 1,
      date: '2025-06-15',
      location: 'Aix-en-Provence',
      theme: 'Provence Discovery',
      activityWindows: [
        {
          start: '14:00',
          end: '18:00',
          purpose: 'Afternoon cultural exploration',
          energyLevel: 'moderate'
        }
      ]
    }
  ]
};

const mockPreferences = {
  budget: 'mid'
};

async function main() {
  // Database connection
  const db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🧪 Testing Validation Integration\n');
    console.log('=' .repeat(60));

    // Check API keys
    console.log('\n1️⃣  Checking API Keys...\n');

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    const googleKey = process.env.GOOGLE_PLACES_API_KEY;

    console.log(`   Perplexity API: ${perplexityKey ? '✓ Configured' : '✗ Missing'}`);
    console.log(`   Google Places API: ${googleKey ? '✓ Configured' : '✗ Missing'}`);

    if (!perplexityKey) {
      throw new Error('PERPLEXITY_API_KEY not set');
    }

    if (!googleKey) {
      console.warn('\n   ⚠️  Google Places API key not configured');
      console.warn('   Validation will be skipped (agents will work in legacy mode)\n');
    }

    // Create test itinerary record
    console.log('\n2️⃣  Creating Test Itinerary...\n');

    const itineraryResult = await db.query(
      `INSERT INTO itineraries (route_id, user_id, agent_type, preferences, status)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING id`,
      [
        mockRouteData.id,
        mockRouteData.user_id,
        mockRouteData.agent,
        JSON.stringify(mockPreferences)
      ]
    );

    const itineraryId = itineraryResult.rows[0].id;
    console.log(`   ✓ Itinerary created: ${itineraryId}`);

    // Test Activity Agent with Validation
    console.log('\n3️⃣  Testing CityActivityAgent with Validation...\n');

    const activityAgent = new CityActivityAgent(
      mockRouteData,
      mockDayStructure,
      null,  // no progress callback
      db,
      itineraryId
    );

    console.log('   Generating activities (Perplexity + Google Places validation)...');
    const activities = await activityAgent.generate();

    console.log(`\n   ✓ Generated ${activities.length} activity sets`);

    // Analyze validation results
    let totalActivities = 0;
    let validatedActivities = 0;
    let enrichedWithPhotos = 0;
    let enrichedWithRatings = 0;
    let availabilityChecked = 0;

    for (const activitySet of activities) {
      for (const activity of activitySet.activities || []) {
        totalActivities++;

        if (activity.validationStatus === 'validated') {
          validatedActivities++;
        }

        if (activity.photos && activity.photos.length > 0) {
          enrichedWithPhotos++;
        }

        if (activity.rating) {
          enrichedWithRatings++;
        }

        if (activity.availability) {
          availabilityChecked++;
        }
      }
    }

    console.log('\n   📊 Activity Validation Statistics:');
    console.log(`      Total activities: ${totalActivities}`);
    console.log(`      Validated: ${validatedActivities} (${(validatedActivities/totalActivities*100).toFixed(1)}%)`);
    console.log(`      With photos: ${enrichedWithPhotos}`);
    console.log(`      With ratings: ${enrichedWithRatings}`);
    console.log(`      Availability checked: ${availabilityChecked}`);

    // Show sample enriched activity
    if (validatedActivities > 0) {
      const sample = activities[0].activities.find(a => a.validationStatus === 'validated');
      if (sample) {
        console.log('\n   📋 Sample Enriched Activity:');
        console.log(`      Name: ${sample.name}`);
        console.log(`      Validation: ${sample.validationStatus} (${sample.validationConfidence?.toFixed(2)})`);
        console.log(`      Rating: ${sample.rating || 'N/A'}${sample.reviewCount ? ` (${sample.reviewCount} reviews)` : ''}`);
        console.log(`      Photos: ${sample.photos?.length || 0}`);
        console.log(`      Google Maps: ${sample.googleMapsUrl ? '✓' : '✗'}`);
        console.log(`      Coordinates: ${sample.coordinates ? '✓' : '✗'}`);
        if (sample.availability) {
          console.log(`      Availability: ${sample.availability.status ? '✓ Open' : '✗ Closed'} (${sample.availability.reason})`);
        }
      }
    }

    // Test Restaurant Agent with Validation
    console.log('\n4️⃣  Testing RestaurantAgent with Validation...\n');

    const restaurantAgent = new RestaurantAgent(
      mockRouteData,
      mockDayStructure,
      mockPreferences.budget,
      null,  // no progress callback
      db,
      itineraryId
    );

    console.log('   Generating restaurants (Perplexity + Google Places validation)...');
    const restaurants = await restaurantAgent.generate();

    console.log(`\n   ✓ Generated ${restaurants.length} days of dining recommendations`);

    // Analyze restaurant validation results
    let totalRestaurants = 0;
    let validatedRestaurants = 0;
    let enrichedRestaurantsWithRatings = 0;

    for (const dayRestaurants of restaurants) {
      const meals = dayRestaurants.meals || {};
      for (const restaurant of Object.values(meals)) {
        if (restaurant) {
          totalRestaurants++;

          if (restaurant.validationStatus === 'validated') {
            validatedRestaurants++;
          }

          if (restaurant.rating) {
            enrichedRestaurantsWithRatings++;
          }
        }
      }
    }

    console.log('\n   📊 Restaurant Validation Statistics:');
    console.log(`      Total restaurants: ${totalRestaurants}`);
    console.log(`      Validated: ${validatedRestaurants} (${(validatedRestaurants/totalRestaurants*100).toFixed(1)}%)`);
    console.log(`      With ratings: ${enrichedRestaurantsWithRatings}`);

    // Show sample enriched restaurant
    if (validatedRestaurants > 0) {
      const dayMeals = restaurants[0].meals;
      const sample = Object.values(dayMeals).find(r => r && r.validationStatus === 'validated');
      if (sample) {
        console.log('\n   📋 Sample Enriched Restaurant:');
        console.log(`      Name: ${sample.name}`);
        console.log(`      Validation: ${sample.validationStatus} (${sample.validationConfidence?.toFixed(2)})`);
        console.log(`      Cuisine: ${sample.cuisine}`);
        console.log(`      Rating: ${sample.rating || 'N/A'}${sample.reviewCount ? ` (${sample.reviewCount} reviews)` : ''}`);
        console.log(`      Price level: ${sample.priceLevel !== undefined ? '€'.repeat(sample.priceLevel || 1) : 'N/A'}`);
        console.log(`      Google Maps: ${sample.googleMapsUrl ? '✓' : '✗'}`);
        console.log(`      Coordinates: ${sample.coordinates ? '✓' : '✗'}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('\n✅ Validation Integration Test Complete!\n');

    if (googleKey) {
      const overallValidationRate = (validatedActivities + validatedRestaurants) /
                                    (totalActivities + totalRestaurants) * 100;

      console.log(`Overall Validation Rate: ${overallValidationRate.toFixed(1)}%`);
      console.log(`Total Places Enriched: ${validatedActivities + validatedRestaurants}`);

      if (overallValidationRate >= 80) {
        console.log('\n🎉 EXCELLENT! Validation is working as expected.\n');
      } else if (overallValidationRate >= 50) {
        console.log('\n⚠️  Good, but validation rate could be higher.\n');
      } else {
        console.log('\n❌ Low validation rate. Check API key and configuration.\n');
      }
    } else {
      console.log('ℹ️  Test ran successfully without Google Places validation');
      console.log('   Set GOOGLE_PLACES_API_KEY to enable validation features\n');
    }

    // Cleanup
    console.log('🧹 Cleaning up test data...');
    await db.query('DELETE FROM itineraries WHERE id = $1', [itineraryId]);
    console.log('✓ Cleanup complete\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nStack trace:', error.stack);
    process.exit(1);

  } finally {
    await db.end();
  }
}

// Run the test
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
