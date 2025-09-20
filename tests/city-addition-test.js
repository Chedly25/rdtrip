// Specific test for adding cities to routes
// This test verifies that adding a city (not landmark) works perfectly

class CityAdditionTest {
    constructor() {
        this.testResults = [];
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

        // Try inserting at each possible position
        for (let i = 0; i <= waypoints.length; i++) {
            const tempRoute = [...waypoints];
            tempRoute.splice(i, 0, newWaypoint);

            let totalDistance = 0;
            for (let j = 0; j < tempRoute.length - 1; j++) {
                totalDistance += this.calculateDistance(
                    tempRoute[j].lat, tempRoute[j].lng,
                    tempRoute[j + 1].lat, tempRoute[j + 1].lng
                );
            }

            if (totalDistance < minTotalDistance) {
                minTotalDistance = totalDistance;
                bestPosition = i;
            }
        }

        return bestPosition;
    }

    async testAddingMultipleCities() {
        console.log('🚀 Testing City Addition to Routes\n');
        console.log('=' .repeat(50));

        // Initial route: Paris → Barcelona → Madrid
        let route = [
            { name: 'Paris', lat: 48.8566, lng: 2.3522, type: 'city' },
            { name: 'Barcelona', lat: 41.3851, lng: 2.1734, type: 'city' },
            { name: 'Madrid', lat: 40.4168, lng: -3.7038, type: 'city' }
        ];

        console.log('\n📍 Initial Route:');
        console.log('  ' + route.map(c => c.name).join(' → '));

        // Cities to add
        const citiesToAdd = [
            { name: 'Lyon', lat: 45.764, lng: 4.8357, type: 'city' },
            { name: 'Marseille', lat: 43.2965, lng: 5.3698, type: 'city' },
            { name: 'Valencia', lat: 39.4699, lng: -0.3763, type: 'city' }
        ];

        console.log('\n➕ Adding cities one by one:');

        for (const city of citiesToAdd) {
            const position = this.findOptimalPosition(route, city);
            route.splice(position, 0, city);

            console.log(`\n  Added ${city.name} at position ${position}:`);
            console.log('  New route: ' + route.map(c => c.name).join(' → '));

            // Calculate total distance
            let totalDistance = 0;
            for (let i = 0; i < route.length - 1; i++) {
                totalDistance += this.calculateDistance(
                    route[i].lat, route[i].lng,
                    route[i + 1].lat, route[i + 1].lng
                );
            }
            console.log(`  Total distance: ${totalDistance.toFixed(2)} km`);
        }

        // Verify all cities are present
        const allCities = ['Paris', 'Barcelona', 'Madrid', 'Lyon', 'Marseille', 'Valencia'];
        const allPresent = allCities.every(cityName =>
            route.some(city => city.name === cityName)
        );

        console.log('\n✅ Verification:');
        console.log(`  All cities present: ${allPresent ? 'YES' : 'NO'}`);
        console.log(`  Final route has ${route.length} cities`);
        console.log(`  Route maintains city type: ${route.every(c => c.type === 'city') ? 'YES' : 'NO'}`);

        // Test mixed addition (city + landmark)
        console.log('\n\n🏛️ Testing Mixed Addition (Cities + Landmarks):');
        console.log('=' .repeat(50));

        let mixedRoute = [
            { name: 'Rome', lat: 41.9028, lng: 12.4964, type: 'city' },
            { name: 'Florence', lat: 43.7696, lng: 11.2558, type: 'city' },
            { name: 'Venice', lat: 45.4408, lng: 12.3155, type: 'city' }
        ];

        console.log('\n📍 Initial Route:');
        console.log('  ' + mixedRoute.map(w => w.name).join(' → '));

        // Add a landmark
        const colosseum = { name: 'Colosseum', lat: 41.8902, lng: 12.4922, type: 'landmark', isLandmark: true };
        let pos = this.findOptimalPosition(mixedRoute, colosseum);
        mixedRoute.splice(pos, 0, colosseum);
        console.log(`\n  Added landmark ${colosseum.name} at position ${pos}`);
        console.log('  Route: ' + mixedRoute.map(w => w.name).join(' → '));

        // Add another city
        const pisa = { name: 'Pisa', lat: 43.7228, lng: 10.4017, type: 'city' };
        pos = this.findOptimalPosition(mixedRoute, pisa);
        mixedRoute.splice(pos, 0, pisa);
        console.log(`\n  Added city ${pisa.name} at position ${pos}`);
        console.log('  Route: ' + mixedRoute.map(w => w.name).join(' → '));

        // Verify cities and landmarks coexist
        const cities = mixedRoute.filter(w => w.type === 'city');
        const landmarks = mixedRoute.filter(w => w.type === 'landmark' || w.isLandmark);

        console.log('\n✅ Final Verification:');
        console.log(`  Cities in route: ${cities.length} (${cities.map(c => c.name).join(', ')})`);
        console.log(`  Landmarks in route: ${landmarks.length} (${landmarks.map(l => l.name).join(', ')})`);
        console.log(`  Total waypoints: ${mixedRoute.length}`);

        // Test real-world scenario
        console.log('\n\n🌍 Real-World Test Case:');
        console.log('=' .repeat(50));
        console.log('Simulating user adding Milan to Aix → Genoa → Rome route\n');

        const realRoute = [
            { name: 'Aix-en-Provence', lat: 43.5297, lng: 5.4474, type: 'city' },
            { name: 'Genoa', lat: 44.4056, lng: 8.9463, type: 'city' },
            { name: 'Rome', lat: 41.9028, lng: 12.4964, type: 'city' }
        ];

        console.log('Before: ' + realRoute.map(c => c.name).join(' → '));

        const milan = { name: 'Milan', lat: 45.4642, lng: 9.19, type: 'city' };
        const milanPos = this.findOptimalPosition(realRoute, milan);
        realRoute.splice(milanPos, 0, milan);

        console.log(`Milan inserted at position: ${milanPos}`);
        console.log('After:  ' + realRoute.map(c => c.name).join(' → '));

        // Check if order makes geographical sense
        const expectedOrder = milanPos === 2; // Should be after Genoa
        console.log(`\n✅ Milan placed after Genoa: ${expectedOrder ? 'YES ✓' : 'NO ✗'}`);
        console.log(`✅ All original cities preserved: ${realRoute.length === 4 ? 'YES ✓' : 'NO ✗'}`);

        console.log('\n' + '=' .repeat(50));
        console.log('🎉 City Addition Tests Complete!');

        return allPresent && expectedOrder;
    }
}

// Run the test
if (require.main === module) {
    const tester = new CityAdditionTest();
    tester.testAddingMultipleCities().then(success => {
        process.exit(success ? 0 : 1);
    });
}

module.exports = CityAdditionTest;