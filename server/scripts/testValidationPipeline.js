/**
 * Test Script for Validation Pipeline
 *
 * Tests the complete flow:
 * 1. Fetch existing itinerary activities
 * 2. Validate each with Google Places API
 * 3. Check availability at scheduled times
 * 4. Generate report
 */

const { Pool } = require('pg');
const PlacesValidationAgent = require('../agents/validation/PlacesValidationAgent');
const AvailabilityValidationAgent = require('../agents/validation/AvailabilityValidationAgent');
const GooglePlacesService = require('../services/googlePlacesService');

const GOOGLE_API_KEY = 'AIzaSyD_kyLhT7Jp42-PAf2nG5Sck1taaWhVIwU';
const TEST_ITINERARY_ID = 'bdeef8b6-888a-4066-b72a-977b0541938c';

async function testValidationPipeline() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🧪 VALIDATION PIPELINE TEST');
    console.log('=' .repeat(60));
    console.log(`Itinerary ID: ${TEST_ITINERARY_ID}`);
    console.log(`Google API Key: ${GOOGLE_API_KEY.substring(0, 20)}...`);
    console.log('');

    // Initialize agents
    const placesService = new GooglePlacesService(GOOGLE_API_KEY, pool);
    const validationAgent = new PlacesValidationAgent(placesService, pool);
    const availabilityAgent = new AvailabilityValidationAgent();

    // Fetch itinerary
    console.log('📥 Fetching itinerary...');
    const result = await pool.query(
      'SELECT * FROM itineraries WHERE id = $1',
      [TEST_ITINERARY_ID]
    );

    if (result.rows.length === 0) {
      console.error('✗ Itinerary not found');
      return;
    }

    const itinerary = result.rows[0];
    console.log(`✓ Found itinerary: ${itinerary.agent_type}`);
    console.log(`  Days: ${itinerary.day_structure?.days?.length || 0}`);
    console.log('');

    // Extract activities
    const allActivities = [];

    if (itinerary.activities && Array.isArray(itinerary.activities)) {
      for (const activitySet of itinerary.activities) {
        const city = activitySet.city;
        const activities = activitySet.activities || [];

        activities.forEach(activity => {
          allActivities.push({
            ...activity,
            city,
            day: activitySet.day,
            date: activitySet.date
          });
        });
      }
    }

    console.log(`📍 Found ${allActivities.length} activities to validate\n`);

    if (allActivities.length === 0) {
      console.log('No activities to validate');
      return;
    }

    // STEP 1: VALIDATE PLACES
    console.log('STEP 1: VALIDATING PLACES WITH GOOGLE PLACES API');
    console.log('-'.repeat(60));

    const validationResults = await validationAgent.batchValidate(
      allActivities,
      allActivities[0]?.city || 'Unknown',
      { itineraryId: TEST_ITINERARY_ID }
    );

    console.log('\n📊 VALIDATION RESULTS:');
    console.log(`  Validated: ${validationResults.validated.length}/${allActivities.length} (${(validationResults.stats.validationRate * 100).toFixed(0)}%)`);
    console.log(`  Not Found: ${validationResults.notFound.length}`);
    console.log(`  Ambiguous: ${validationResults.ambiguous.length}`);
    console.log(`  Errors: ${validationResults.errors.length}`);
    console.log(`  Avg Quality Score: ${validationResults.stats.averageQuality.toFixed(2)}/1.0`);

    // Show sample validated places
    if (validationResults.validated.length > 0) {
      console.log('\n✅ SAMPLE VALIDATED PLACES:');
      validationResults.validated.slice(0, 3).forEach((place, i) => {
        console.log(`\n${i + 1}. ${place.verifiedName}`);
        console.log(`   Original: "${place.discoveredName}"`);
        console.log(`   Address: ${place.formattedAddress}`);
        console.log(`   Rating: ${place.rating || 'N/A'} ⭐ (${place.reviewCount || 0} reviews)`);
        console.log(`   Price Level: ${'$'.repeat(place.priceLevel || 1)}`);
        console.log(`   Quality Score: ${place.qualityScore.toFixed(2)}`);
        console.log(`   Photos: ${place.photos?.length || 0}`);
        console.log(`   Google Maps: ${place.googleMapsUrl ? 'Yes' : 'No'}`);
      });
    }

    // Show not found places
    if (validationResults.notFound.length > 0) {
      console.log(`\n❌ NOT FOUND (${validationResults.notFound.length}):`);
      validationResults.notFound.slice(0, 5).forEach((place, i) => {
        console.log(`  ${i + 1}. "${place.name}" in ${place.city}`);
      });
    }

    // STEP 2: CHECK AVAILABILITY
    console.log('\n\nSTEP 2: CHECKING AVAILABILITY');
    console.log('-'.repeat(60));

    const placesWithSchedule = validationResults.validated
      .filter(place => place.time && place.date)
      .map(place => {
        const datetime = new Date(place.date);
        const [hours, minutes] = (place.time.start || '10:00').split(':');
        datetime.setHours(parseInt(hours), parseInt(minutes), 0);

        return {
          place,
          scheduledTime: datetime
        };
      });

    if (placesWithSchedule.length > 0) {
      const availabilityResults = await availabilityAgent.batchCheckAvailability(placesWithSchedule);

      console.log('\n📊 AVAILABILITY RESULTS:');
      console.log(`  Available: ${availabilityResults.available.length}/${placesWithSchedule.length}`);
      console.log(`  Warnings: ${availabilityResults.warnings.length}`);
      console.log(`  Unavailable: ${availabilityResults.unavailable.length}`);
      console.log(`  Unknown: ${availabilityResults.unknown.length}`);

      // Show availability issues
      if (availabilityResults.unavailable.length > 0) {
        console.log(`\n⚠️  AVAILABILITY ISSUES (${availabilityResults.unavailable.length}):`);
        availabilityResults.unavailable.slice(0, 5).forEach((item, i) => {
          console.log(`\n  ${i + 1}. ${item.place.verifiedName}`);
          console.log(`     Scheduled: ${item.scheduledTime.toLocaleString()}`);
          console.log(`     Issue: ${item.check.reason}`);
          console.log(`     Recommendation: ${item.check.recommendation}`);
        });
      }

      // Generate report
      const report = availabilityAgent.generateAvailabilityReport(availabilityResults);

      console.log('\n\n📋 FINAL REPORT:');
      console.log('='.repeat(60));
      console.log(`Total Places Validated: ${report.totalPlaces}`);
      console.log(`Available: ${report.availableCount} (${((report.availableCount / report.totalPlaces) * 100).toFixed(0)}%)`);
      console.log(`With Warnings: ${report.warningCount}`);
      console.log(`Unavailable: ${report.unavailableCount}`);
      console.log(`Unknown: ${report.unknownCount}`);

      if (report.criticalIssues.length > 0) {
        console.log(`\n🚨 CRITICAL ISSUES (${report.criticalIssues.length}):`);
        report.criticalIssues.forEach((issue, i) => {
          console.log(`\n  ${i + 1}. ${issue.place}`);
          console.log(`     ${issue.reason}`);
          console.log(`     Action: ${issue.recommendation}`);
        });
      }

      if (report.recommendations.length > 0) {
        console.log(`\n💡 RECOMMENDATIONS:`);
        report.recommendations.forEach((rec, i) => {
          console.log(`  ${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
          console.log(`     ${rec.action}`);
        });
      }
    } else {
      console.log('⚠️  No scheduled times found for availability check');
    }

    // FINAL STATS
    const stats = validationAgent.getStats();
    console.log('\n\n📈 VALIDATION AGENT STATS:');
    console.log('='.repeat(60));
    console.log(`Total Attempts: ${stats.attempted}`);
    console.log(`Validated: ${stats.validated} (${(stats.validationRate * 100).toFixed(0)}%)`);
    console.log(`Not Found: ${stats.notFound}`);
    console.log(`Ambiguous: ${stats.ambiguous}`);
    console.log(`Errors: ${stats.errors}`);

    console.log('\n✅ VALIDATION PIPELINE TEST COMPLETE!\n');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// Run test
testValidationPipeline();
