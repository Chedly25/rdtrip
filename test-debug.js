// Debug script for Test 2
class TestDebug {
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

        console.log('\n=== Testing insertion of:', newWaypoint.name, '===');
        console.log('Current route:', waypoints.map(w => w.name).join(' → '));

        // Try inserting at each possible position
        for (let i = 0; i <= waypoints.length; i++) {
            // Create a temporary route with the new waypoint inserted
            const tempRoute = [...waypoints];
            tempRoute.splice(i, 0, newWaypoint);

            // Calculate total distance of this route
            let totalDistance = 0;
            for (let j = 0; j < tempRoute.length - 1; j++) {
                const dist = this.calculateDistance(
                    tempRoute[j].lat, tempRoute[j].lng,
                    tempRoute[j + 1].lat, tempRoute[j + 1].lng
                );
                totalDistance += dist;
            }

            const routeStr = tempRoute.map(w => w.name).join(' → ');
            console.log(`Position ${i}: ${routeStr} = ${totalDistance.toFixed(2)} km`);

            // Track the position with minimum total distance
            if (totalDistance < minTotalDistance) {
                minTotalDistance = totalDistance;
                bestPosition = i;
            }
        }

        console.log(`\nBest position: ${bestPosition} with distance ${minTotalDistance.toFixed(2)} km`);
        return bestPosition;
    }

    testFlorence() {
        const waypoints = [
            { name: 'Aix-en-Provence', lat: 43.5297, lng: 5.4474 },
            { name: 'Genoa', lat: 44.4056, lng: 8.9463 },
            { name: 'Rome', lat: 41.9028, lng: 12.4964 }
        ];

        const florence = { name: 'Florence', lat: 43.7696, lng: 11.2558 };

        console.log('Testing Florence insertion into Aix → Genoa → Rome');
        const position = this.findOptimalPosition(waypoints, florence);

        // Let's also test the distances manually
        console.log('\n=== Manual Distance Calculations ===');

        // Original route distance
        const origDist1 = this.calculateDistance(43.5297, 5.4474, 44.4056, 8.9463);
        const origDist2 = this.calculateDistance(44.4056, 8.9463, 41.9028, 12.4964);
        const originalTotal = origDist1 + origDist2;
        console.log(`Original: Aix → Genoa = ${origDist1.toFixed(2)} km`);
        console.log(`         Genoa → Rome = ${origDist2.toFixed(2)} km`);
        console.log(`         Total = ${originalTotal.toFixed(2)} km`);

        // With Florence at position 2 (between Genoa and Rome)
        const withFlor1 = this.calculateDistance(43.5297, 5.4474, 44.4056, 8.9463);
        const withFlor2 = this.calculateDistance(44.4056, 8.9463, 43.7696, 11.2558);
        const withFlor3 = this.calculateDistance(43.7696, 11.2558, 41.9028, 12.4964);
        const withFlorTotal = withFlor1 + withFlor2 + withFlor3;
        console.log(`\nWith Florence at pos 2: Aix → Genoa = ${withFlor1.toFixed(2)} km`);
        console.log(`                        Genoa → Florence = ${withFlor2.toFixed(2)} km`);
        console.log(`                        Florence → Rome = ${withFlor3.toFixed(2)} km`);
        console.log(`                        Total = ${withFlorTotal.toFixed(2)} km`);

        return position;
    }
}

const debug = new TestDebug();
debug.testFlorence();