/**
 * Test script for Budget Calculator API endpoint
 *
 * Usage: node test-budget-calculator.js
 *
 * Make sure server is running on localhost:5000
 */

const testRoute = {
  origin: {
    name: "Aix-en-Provence",
    latitude: 43.5297,
    longitude: 5.4474
  },
  destination: {
    name: "Barcelona",
    latitude: 41.3874,
    longitude: 2.1686
  },
  waypoints: [
    {
      name: "Perpignan",
      latitude: 42.6887,
      longitude: 2.8948
    },
    {
      name: "Figueres",
      latitude: 42.2667,
      longitude: 2.9667
    },
    {
      name: "Girona",
      latitude: 41.9794,
      longitude: 2.8214
    }
  ]
};

const testTripDetails = {
  duration: 5, // 5 days
  travelers: 2, // 2 people
  budgetLevel: "mid", // budget, mid, or luxury
  preferences: {
    agent: "culture"
  }
};

async function testBudgetCalculator() {
  console.log('🧪 Testing Budget Calculator API...\n');

  console.log('📍 Test Route:');
  console.log(`   ${testRoute.origin.name} → ${testRoute.destination.name}`);
  console.log(`   Stops: ${testRoute.waypoints.map(w => w.name).join(', ')}`);
  console.log(`   Duration: ${testTripDetails.duration} days`);
  console.log(`   Travelers: ${testTripDetails.travelers}`);
  console.log(`   Budget: ${testTripDetails.budgetLevel}\n`);

  try {
    console.log('⏳ Calling API endpoint...');
    const startTime = Date.now();

    const response = await fetch('http://localhost:5000/api/calculate-budget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        route: testRoute,
        tripDetails: testTripDetails
      })
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Response received in ${elapsed}s\n`);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ API Error:', errorData);

      if (errorData.fallback) {
        console.log('\n📊 Fallback Budget:');
        console.log(JSON.stringify(errorData.fallback, null, 2));
      }
      return;
    }

    const budgetData = await response.json();

    // Display results
    console.log('='.repeat(60));
    console.log('💰 BUDGET CALCULATION RESULTS');
    console.log('='.repeat(60));
    console.log();

    // Summary
    console.log('📋 SUMMARY:');
    console.log(`   Total Cost: €${budgetData.summary.total.toLocaleString()}`);
    console.log(`   Per Person: €${budgetData.summary.perPerson.toLocaleString()}`);
    console.log(`   Confidence: ${budgetData.summary.confidence}`);
    console.log(`   Currency: ${budgetData.summary.currency}`);
    console.log();

    // Transportation
    console.log('🚗 TRANSPORTATION:');
    if (budgetData.transportation.fuel) {
      console.log(`   Fuel: €${budgetData.transportation.fuel.total}`);
      console.log(`      Price: €${budgetData.transportation.fuel.pricePerLiter}/L`);
      console.log(`      Consumption: ${budgetData.transportation.fuel.consumption}`);
      console.log(`      Liters: ${budgetData.transportation.fuel.litersNeeded}L`);
    }
    if (budgetData.transportation.tolls) {
      console.log(`   Tolls: €${budgetData.transportation.tolls.total}`);
      if (budgetData.transportation.tolls.breakdown) {
        budgetData.transportation.tolls.breakdown.forEach(toll => {
          console.log(`      - ${toll.section}: €${toll.cost}`);
        });
      }
    }
    if (budgetData.transportation.parking) {
      console.log(`   Parking: €${budgetData.transportation.parking.total}`);
      if (budgetData.transportation.parking.perCity) {
        budgetData.transportation.parking.perCity.forEach(p => {
          console.log(`      - ${p.city}: €${p.total} (${p.days} days @ €${p.dailyRate}/day)`);
        });
      }
    }
    console.log();

    // Accommodation
    console.log('🏨 ACCOMMODATION:');
    console.log(`   Total: €${budgetData.accommodation.total}`);
    console.log(`   Nights: ${budgetData.accommodation.nights}`);
    console.log(`   Avg/Night: €${budgetData.accommodation.avgPerNight}`);
    if (budgetData.accommodation.byCity) {
      console.log('   By City:');
      budgetData.accommodation.byCity.forEach(city => {
        console.log(`      - ${city.city}: €${city.avgPrice}/night (€${city.priceRange.min}-${city.priceRange.max})`);
      });
    }
    console.log();

    // Dining
    console.log('🍽️  DINING:');
    console.log(`   Total: €${budgetData.dining.total}`);
    if (budgetData.dining.breakdown) {
      const b = budgetData.dining.breakdown;
      console.log(`   Breakfast: €${b.breakfast.tripTotal} (€${b.breakfast.perPerson}/person/meal)`);
      console.log(`   Lunch: €${b.lunch.tripTotal} (€${b.lunch.perPerson}/person/meal)`);
      console.log(`   Dinner: €${b.dinner.tripTotal} (€${b.dinner.perPerson}/person/meal)`);
      console.log(`   Snacks: €${b.snacks.tripTotal}`);
    }
    console.log();

    // Activities
    console.log('🎭 ACTIVITIES:');
    console.log(`   Total: €${budgetData.activities.total}`);
    console.log(`   Count: ${budgetData.activities.estimatedCount} activities`);
    if (budgetData.activities.items && budgetData.activities.items.length > 0) {
      console.log('   Examples:');
      budgetData.activities.items.slice(0, 5).forEach(activity => {
        console.log(`      - ${activity.name} (${activity.city}): €${activity.cost}/person`);
      });
      if (budgetData.activities.items.length > 5) {
        console.log(`      ... and ${budgetData.activities.items.length - 5} more`);
      }
    }
    console.log();

    // Misc
    if (budgetData.misc) {
      console.log('📦 MISCELLANEOUS:');
      console.log(`   Total: €${budgetData.misc.total}`);
      console.log(`   Note: ${budgetData.misc.note}`);
      console.log();
    }

    // Savings Tips
    if (budgetData.savingsTips && budgetData.savingsTips.length > 0) {
      console.log('💡 SAVINGS TIPS:');
      budgetData.savingsTips.forEach((tip, i) => {
        console.log(`   ${i + 1}. ${tip}`);
      });
      console.log();
    }

    // Price Context
    if (budgetData.priceContext) {
      console.log('📅 PRICE CONTEXT:');
      console.log(`   Best Months: ${budgetData.priceContext.bestMonthsForPrices.join(', ')}`);
      console.log(`   Expensive Periods: ${budgetData.priceContext.expensivePeriods.join(', ')}`);
      console.log(`   Current Context: ${budgetData.priceContext.currentMonthContext}`);
      console.log();
    }

    // Metadata
    if (budgetData.metadata) {
      console.log('ℹ️  METADATA:');
      console.log(`   Calculated: ${new Date(budgetData.metadata.calculatedAt).toLocaleString()}`);
      console.log(`   Distance: ${budgetData.metadata.route.distance}km`);
      console.log(`   Data Source: ${budgetData.metadata.dataSource}`);
      console.log(`   API Version: ${budgetData.metadata.apiVersion}`);
      console.log();
    }

    console.log('='.repeat(60));
    console.log('✅ Test completed successfully!');
    console.log('='.repeat(60));

    // Save to file for inspection
    const fs = require('fs');
    fs.writeFileSync(
      'test-budget-result.json',
      JSON.stringify(budgetData, null, 2)
    );
    console.log('\n💾 Full result saved to: test-budget-result.json');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack:', error.stack);

    if (error.message.includes('fetch')) {
      console.log('\n💡 Make sure the server is running: npm start');
    }
  }
}

// Run the test
testBudgetCalculator();
