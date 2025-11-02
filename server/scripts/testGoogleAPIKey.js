/**
 * Simple test to verify Google API Key permissions
 */

const axios = require('axios');

const API_KEY = 'AIzaSyD_kyLhT7Jp42-PAf2nG5Sck1taaWhVIwU';

async function testAPIKey() {
  console.log('🔑 Testing Google Places API Key...\n');
  console.log(`Key: ${API_KEY.substring(0, 20)}...`);

  // Test 1: Text Search
  console.log('\n1️⃣  Testing Text Search API...');
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
      params: {
        query: 'Eiffel Tower Paris',
        key: API_KEY
      }
    });

    console.log(`   Status: ${response.data.status}`);

    if (response.data.status === 'OK') {
      console.log(`   ✓ Text Search API works!`);
      console.log(`   Found: ${response.data.results[0]?.name}`);
    } else if (response.data.status === 'REQUEST_DENIED') {
      console.log(`   ✗ REQUEST_DENIED: ${response.data.error_message || 'No error message'}`);
      console.log(`   → This API key doesn't have Places API enabled`);
    } else {
      console.log(`   ⚠️  ${response.data.status}: ${response.data.error_message || ''}`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  // Test 2: Place Details
  console.log('\n2️⃣  Testing Place Details API...');
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: 'ChIJLU7jZClu5kcR4PcOOO6p3I0', // Eiffel Tower
        key: API_KEY
      }
    });

    console.log(`   Status: ${response.data.status}`);

    if (response.data.status === 'OK') {
      console.log(`   ✓ Place Details API works!`);
      console.log(`   Found: ${response.data.result?.name}`);
    } else if (response.data.status === 'REQUEST_DENIED') {
      console.log(`   ✗ REQUEST_DENIED: ${response.data.error_message || 'No error message'}`);
    } else {
      console.log(`   ⚠️  ${response.data.status}: ${response.data.error_message || ''}`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  // Test 3: Geocoding (Different API, for comparison)
  console.log('\n3️⃣  Testing Geocoding API (for comparison)...');
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: 'Eiffel Tower, Paris',
        key: API_KEY
      }
    });

    console.log(`   Status: ${response.data.status}`);

    if (response.data.status === 'OK') {
      console.log(`   ✓ Geocoding API works!`);
      console.log(`   Location: ${response.data.results[0]?.formatted_address}`);
    } else if (response.data.status === 'REQUEST_DENIED') {
      console.log(`   ✗ REQUEST_DENIED`);
    } else {
      console.log(`   ⚠️  ${response.data.status}`);
    }
  } catch (error) {
    console.log(`   ✗ Error: ${error.message}`);
  }

  console.log('\n📋 SUMMARY:');
  console.log('='.repeat(60));
  console.log('To enable Places API:');
  console.log('1. Go to: https://console.cloud.google.com/apis/library');
  console.log('2. Search for "Places API"');
  console.log('3. Enable "Places API (New)" and "Places API"');
  console.log('4. Ensure API key has no restrictions or allows Places API');
  console.log('\n');
}

testAPIKey();
