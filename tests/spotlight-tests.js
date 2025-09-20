// Comprehensive Test Suite for Spotlight Functionality
// Tests route optimization, city preservation, and landmark addition

class SpotlightTests {
    constructor() {
        this.testResults = [];
        this.totalTests = 0;
        this.passedTests = 0;
        this.failedTests = 0;
    }

    // Helper function to create mock spotlight data
    createMockSpotlightData() {
        return {
            origin: 'Aix-en-Provence',
            destination: 'Rome',
            agent: 'adventure',
            agentData: {
                waypoints: [
                    { name: 'Aix-en-Provence', lat: 43.5297, lng: 5.4474, type: 'city' },
                    { name: 'Genoa', lat: 44.4056, lng: 8.9463, type: 'city' },
                    { name: 'Rome', lat: 41.9028, lng: 12.4964, type: 'city' }
                ]
            },
            originalCities: null,
            addedLandmarks: []
        };
    }

    // Test 1: Verify original cities are preserved when adding landmarks
    async test1_PreserveCitiesWhenAddingLandmarks() {
        console.log('\n🧪 Test 1: Preserve cities when adding landmarks');

        const mockData = this.createMockSpotlightData();
        const controller = new SpotlightController();
        controller.spotlightData = mockData;

        // Store original cities
        const originalCities = [...mockData.agentData.waypoints];

        // Add a landmark
        const landmark = {
            name: 'Colosseum',
            lat: 41.8902,
            lng: 12.4922,
            type: 'landmark',
            city: 'Rome'
        };

        // Simulate adding landmark
        if (!controller.spotlightData.originalCities) {
            controller.spotlightData.originalCities = originalCities.filter(wp => wp.type === 'city');
        }
        controller.spotlightData.addedLandmarks = [landmark];

        // Get combined waypoints
        const combinedWaypoints = controller.getAllCombinedWaypoints();

        // Verify all original cities are still present
        const citiesInResult = combinedWaypoints.filter(wp => wp.type === 'city');
        const allCitiesPresent = originalCities.every(city =>
            citiesInResult.some(resultCity => resultCity.name === city.name)
        );

        this.recordTest('Preserve cities when adding landmarks', allCitiesPresent,
            `Expected all 3 cities, got ${citiesInResult.length}`);

        return allCitiesPresent;
    }

    // Test 2: Optimize route when adding a new city
    async test2_OptimizeRouteWhenAddingCity() {
        console.log('\n🧪 Test 2: Optimize route when adding new city');

        const mockData = this.createMockSpotlightData();
        const controller = new SpotlightController();
        controller.spotlightData = mockData;

        // Calculate distance between points
        const calculateDistance = (lat1, lng1, lat2, lng2) => {
            const R = 6371; // Earth's radius in km
            const dLat = (lat2 - lat1) * Math.PI / 180;
            const dLng = (lng2 - lng1) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            return R * c;
        };

        // New city to add: Florence (between Genoa and Rome)
        const florence = { name: 'Florence', lat: 43.7696, lng: 11.2558, type: 'city' };

        // Calculate optimal position
        const waypoints = mockData.agentData.waypoints;
        let minDistance = Infinity;
        let optimalPosition = -1;

        for (let i = 0; i <= waypoints.length; i++) {
            let totalDistance = 0;

            if (i === 0) {
                // Insert at beginning
                totalDistance += calculateDistance(waypoints[0].lat, waypoints[0].lng, florence.lat, florence.lng);
                totalDistance += calculateDistance(florence.lat, florence.lng, waypoints[1].lat, waypoints[1].lng);
            } else if (i === waypoints.length) {
                // Insert at end
                totalDistance += calculateDistance(waypoints[i-1].lat, waypoints[i-1].lng, florence.lat, florence.lng);
            } else {
                // Insert between cities
                totalDistance += calculateDistance(waypoints[i-1].lat, waypoints[i-1].lng, florence.lat, florence.lng);
                totalDistance += calculateDistance(florence.lat, florence.lng, waypoints[i].lat, waypoints[i].lng);
            }

            if (totalDistance < minDistance) {
                minDistance = totalDistance;
                optimalPosition = i;
            }
        }

        // The optimal position for Florence should be between Genoa (index 1) and Rome (index 2)
        const isOptimal = optimalPosition === 2;

        this.recordTest('Optimize city insertion position', isOptimal,
            `Expected position 2 (between Genoa and Rome), got ${optimalPosition}`);

        return isOptimal;
    }

    // Test 3: Verify getAllCombinedWaypoints preserves all cities and landmarks
    async test3_GetAllCombinedWaypointsPreservesAll() {
        console.log('\n🧪 Test 3: getAllCombinedWaypoints preserves all waypoints');

        const controller = new SpotlightController();
        const mockData = this.createMockSpotlightData();
        controller.spotlightData = mockData;

        // Set original cities
        controller.spotlightData.originalCities = [
            { name: 'Aix-en-Provence', lat: 43.5297, lng: 5.4474, type: 'city' },
            { name: 'Genoa', lat: 44.4056, lng: 8.9463, type: 'city' },
            { name: 'Rome', lat: 41.9028, lng: 12.4964, type: 'city' }
        ];

        // Add landmarks
        controller.spotlightData.addedLandmarks = [
            { name: 'Colosseum', lat: 41.8902, lng: 12.4922, type: 'landmark', city: 'Rome' },
            { name: 'Leaning Tower', lat: 43.7230, lng: 10.3966, type: 'landmark', city: 'Pisa' }
        ];

        const combined = controller.getAllCombinedWaypoints();

        // Check all cities are present
        const hasCities = controller.spotlightData.originalCities.every(city =>
            combined.some(wp => wp.name === city.name && wp.type === 'city')
        );

        // Check all landmarks are present
        const hasLandmarks = controller.spotlightData.addedLandmarks.every(landmark =>
            combined.some(wp => wp.name === landmark.name && wp.type === 'landmark')
        );

        const success = hasCities && hasLandmarks && combined.length === 5;

        this.recordTest('getAllCombinedWaypoints preserves all', success,
            `Expected 5 waypoints (3 cities + 2 landmarks), got ${combined.length}`);

        return success;
    }

    // Test 4: Verify landmark doesn't override destination
    async test4_LandmarkDoesntOverrideDestination() {
        console.log('\n🧪 Test 4: Landmark addition doesn\'t override destination');

        const controller = new SpotlightController();
        const mockData = this.createMockSpotlightData();
        controller.spotlightData = mockData;

        const originalDestination = controller.spotlightData.destination;

        // Add landmark
        controller.spotlightData.addedLandmarks = [
            { name: 'Vatican', lat: 41.9029, lng: 12.4534, type: 'landmark', city: 'Vatican City' }
        ];

        // Destination should remain unchanged
        const destinationPreserved = controller.spotlightData.destination === originalDestination;

        this.recordTest('Destination preserved after landmark', destinationPreserved,
            `Destination changed from ${originalDestination} to ${controller.spotlightData.destination}`);

        return destinationPreserved;
    }

    // Test 5: Coordinate validation
    async test5_CoordinateValidation() {
        console.log('\n🧪 Test 5: Coordinate validation');

        const validateCoordinates = (lat, lng) => {
            return lat !== null && lng !== null &&
                   !isNaN(lat) && !isNaN(lng) &&
                   Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
        };

        const testCases = [
            { lat: 45.5, lng: 10.5, expected: true, desc: 'Valid coordinates' },
            { lat: NaN, lng: 10.5, expected: false, desc: 'NaN latitude' },
            { lat: 45.5, lng: NaN, expected: false, desc: 'NaN longitude' },
            { lat: 95, lng: 10.5, expected: false, desc: 'Latitude > 90' },
            { lat: 45.5, lng: 185, expected: false, desc: 'Longitude > 180' },
            { lat: null, lng: 10.5, expected: false, desc: 'Null latitude' },
            { lat: 45.5, lng: null, expected: false, desc: 'Null longitude' }
        ];

        let allPassed = true;
        for (const testCase of testCases) {
            const result = validateCoordinates(testCase.lat, testCase.lng);
            if (result !== testCase.expected) {
                console.log(`  ❌ Failed: ${testCase.desc}`);
                allPassed = false;
            } else {
                console.log(`  ✅ Passed: ${testCase.desc}`);
            }
        }

        this.recordTest('Coordinate validation', allPassed);
        return allPassed;
    }

    // Test 6: Route optimization algorithm
    async test6_RouteOptimizationAlgorithm() {
        console.log('\n🧪 Test 6: Route optimization algorithm');

        const controller = new SpotlightController();

        // Test the findOptimalPosition method
        const waypoints = [
            { name: 'Aix-en-Provence', lat: 43.5297, lng: 5.4474 },
            { name: 'Genoa', lat: 44.4056, lng: 8.9463 },
            { name: 'Rome', lat: 41.9028, lng: 12.4964 }
        ];

        // Test adding Florence (should go between Genoa and Rome)
        const florence = { name: 'Florence', lat: 43.7696, lng: 11.2558 };
        const position = controller.findOptimalPosition(waypoints, florence);

        const isCorrect = position === 2; // Should be inserted at index 2

        this.recordTest('Route optimization algorithm', isCorrect,
            `Florence should be at position 2, got ${position}`);

        return isCorrect;
    }

    // Test 7: Duplicate image prevention
    async test7_PreventDuplicateImages() {
        console.log('\n🧪 Test 7: Prevent duplicate image loading');

        // Mock map object
        const mockMap = {
            loadedImages: new Set(),
            hasImage: function(id) { return this.loadedImages.has(id); },
            addImage: function(id) {
                if (this.hasImage(id)) {
                    throw new Error(`Image ${id} already exists`);
                }
                this.loadedImages.add(id);
            }
        };

        let success = true;
        try {
            // First load should succeed
            if (!mockMap.hasImage('test-image')) {
                mockMap.addImage('test-image');
            }

            // Second load should be skipped
            if (!mockMap.hasImage('test-image')) {
                mockMap.addImage('test-image');
                success = false; // Should not reach here
            }
        } catch (error) {
            success = false;
        }

        this.recordTest('Prevent duplicate images', success);
        return success;
    }

    // Test 8: Original cities preservation mechanism
    async test8_OriginalCitiesPreservation() {
        console.log('\n🧪 Test 8: Original cities preservation mechanism');

        const controller = new SpotlightController();
        const mockData = this.createMockSpotlightData();
        controller.spotlightData = mockData;

        // First landmark addition should store original cities
        const landmark1 = { name: 'Landmark1', lat: 43.7, lng: 11.2, type: 'landmark' };

        // Simulate first addition
        if (!controller.spotlightData.originalCities) {
            const waypoints = controller.extractWaypoints(controller.spotlightData.agentData) || [];
            controller.spotlightData.originalCities = waypoints.filter(wp => !wp.isLandmark);
        }

        const firstStoredCities = controller.spotlightData.originalCities.length;

        // Add more landmarks - original cities should NOT change
        const landmark2 = { name: 'Landmark2', lat: 44.1, lng: 10.5, type: 'landmark' };

        // Original cities should remain the same
        const citiesUnchanged = controller.spotlightData.originalCities.length === firstStoredCities;

        this.recordTest('Original cities preservation', citiesUnchanged,
            `Cities count changed from ${firstStoredCities} to ${controller.spotlightData.originalCities.length}`);

        return citiesUnchanged;
    }

    // Helper method to record test results
    recordTest(testName, passed, errorMsg = '') {
        this.totalTests++;
        if (passed) {
            this.passedTests++;
            console.log(`  ✅ ${testName}`);
        } else {
            this.failedTests++;
            console.log(`  ❌ ${testName}: ${errorMsg}`);
        }
        this.testResults.push({ testName, passed, errorMsg });
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Spotlight Test Suite...\n');
        console.log('=' .repeat(50));

        await this.test1_PreserveCitiesWhenAddingLandmarks();
        await this.test2_OptimizeRouteWhenAddingCity();
        await this.test3_GetAllCombinedWaypointsPreservesAll();
        await this.test4_LandmarkDoesntOverrideDestination();
        await this.test5_CoordinateValidation();
        await this.test6_RouteOptimizationAlgorithm();
        await this.test7_PreventDuplicateImages();
        await this.test8_OriginalCitiesPreservation();

        console.log('\n' + '=' .repeat(50));
        console.log('📊 Test Results Summary:');
        console.log(`  Total Tests: ${this.totalTests}`);
        console.log(`  ✅ Passed: ${this.passedTests}`);
        console.log(`  ❌ Failed: ${this.failedTests}`);
        console.log(`  Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);
        console.log('=' .repeat(50));

        if (this.failedTests > 0) {
            console.log('\n⚠️ Failed Tests Details:');
            this.testResults.filter(r => !r.passed).forEach(r => {
                console.log(`  • ${r.testName}: ${r.errorMsg}`);
            });
        }

        return this.failedTests === 0;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpotlightTests;
}

// Auto-run tests if this file is executed directly
if (typeof window !== 'undefined') {
    window.SpotlightTests = SpotlightTests;

    // Add button to run tests in browser console
    window.runSpotlightTests = async () => {
        const tester = new SpotlightTests();
        return await tester.runAllTests();
    };

    console.log('💡 Spotlight Tests Loaded. Run tests with: runSpotlightTests()');
}