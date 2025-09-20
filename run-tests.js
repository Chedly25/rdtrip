// Mock SpotlightController for testing
class SpotlightController {
    constructor() {
        this.spotlightData = null;
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    findOptimalPosition(waypoints, newWaypoint) {
        if (!waypoints || waypoints.length === 0) {
            return 0;
        }

        let bestPosition = 0;
        let minTotalDistance = Infinity;

        // Try inserting at each possible position and calculate total route distance
        for (let i = 0; i <= waypoints.length; i++) {
            let totalDistance = 0;

            // Create a temporary route with the new waypoint inserted
            const tempRoute = [...waypoints];
            tempRoute.splice(i, 0, newWaypoint);

            // Calculate total distance of this route
            for (let j = 0; j < tempRoute.length - 1; j++) {
                totalDistance += this.calculateDistance(
                    tempRoute[j].lat, tempRoute[j].lng,
                    tempRoute[j + 1].lat, tempRoute[j + 1].lng
                );
            }

            // Track the position with minimum total distance
            if (totalDistance < minTotalDistance) {
                minTotalDistance = totalDistance;
                bestPosition = i;
            }
        }

        return bestPosition;
    }

    optimizeFullRoute(waypoints) {
        if (!waypoints || waypoints.length <= 2) {
            return waypoints;
        }

        // IMPORTANT: Preserve original cities and only optimize landmark placement
        // Separate cities from landmarks
        const cities = waypoints.filter(wp =>
            wp.type === 'city' ||
            (!wp.isLandmark && wp.type !== 'landmark' && wp.type !== 'cultural')
        );
        const landmarks = waypoints.filter(wp =>
            wp.isLandmark ||
            wp.type === 'landmark' ||
            wp.type === 'cultural'
        );

        // Start with cities as the base route (preserve their order)
        let baseRoute = [];
        if (this.spotlightData?.originalCities && this.spotlightData.originalCities.length > 0) {
            // Use stored original cities if available
            baseRoute = [...this.spotlightData.originalCities];
        } else if (cities.length > 0) {
            // Otherwise use the cities from the waypoints
            baseRoute = [...cities];
        } else {
            // If no cities, just return the waypoints as-is
            return waypoints;
        }

        // Now create the optimized route by adding landmarks at optimal positions
        const optimizedRoute = [...baseRoute];

        // Add each landmark at its optimal position
        landmarks.forEach(landmark => {
            const position = this.findOptimalPosition(optimizedRoute, landmark);
            optimizedRoute.splice(position, 0, landmark);
        });

        return optimizedRoute;
    }

    getAllCombinedWaypoints() {
        if (this.spotlightData?.originalCities) {
            const combined = [...this.spotlightData.originalCities];
            if (this.spotlightData.addedLandmarks) {
                this.spotlightData.addedLandmarks.forEach(landmark => {
                    const position = this.findOptimalPosition(combined, landmark);
                    combined.splice(position, 0, landmark);
                });
            }
            return combined;
        }
        return [];
    }

    extractWaypoints() {
        return this.spotlightData?.originalCities || [];
    }
}

// Make SpotlightController available globally
global.SpotlightController = SpotlightController;

// Load and run the tests
const SpotlightTests = require('./tests/spotlight-tests.js');
const tester = new SpotlightTests();
tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
});