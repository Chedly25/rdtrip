// ZTL (Zona a Traffico Limitato) Service
// Handles real-time traffic restriction zones for Italian cities

const axios = require('axios');

class ZTLService {
    constructor() {
        // Cache ZTL data for performance
        this.ztlCache = new Map();
        this.cacheExpiry = 3600000; // 1 hour cache

        // Major Italian cities with ZTL zones
        this.ztlCities = {
            milan: {
                name: 'Milano',
                zones: [
                    {
                        name: 'Area C',
                        type: 'congestion',
                        coordinates: [[45.4642, 9.1900]], // Simplified center point
                        schedule: {
                            monday: { start: '07:30', end: '19:30' },
                            tuesday: { start: '07:30', end: '19:30' },
                            wednesday: { start: '07:30', end: '19:30' },
                            thursday: { start: '07:30', end: '19:30' },
                            friday: { start: '07:30', end: '19:30' },
                            saturday: 'closed',
                            sunday: 'closed'
                        },
                        fee: 5,
                        exemptions: ['electric', 'residents']
                    }
                ]
            },
            rome: {
                name: 'Roma',
                zones: [
                    {
                        name: 'ZTL Centro Storico',
                        type: 'historic',
                        coordinates: [[41.9028, 12.4964]],
                        schedule: {
                            monday: { start: '06:30', end: '18:00' },
                            tuesday: { start: '06:30', end: '18:00' },
                            wednesday: { start: '06:30', end: '18:00' },
                            thursday: { start: '06:30', end: '18:00' },
                            friday: { start: '06:30', end: '20:00' },
                            saturday: { start: '14:00', end: '20:00' },
                            sunday: 'closed'
                        },
                        fee: 0,
                        exemptions: ['residents', 'permits']
                    },
                    {
                        name: 'ZTL Trastevere',
                        type: 'historic',
                        coordinates: [[41.8892, 12.4707]],
                        schedule: {
                            friday: { start: '21:30', end: '03:00' },
                            saturday: { start: '21:30', end: '03:00' },
                            sunday: 'closed'
                        },
                        fee: 0,
                        exemptions: ['residents', 'permits']
                    }
                ]
            },
            florence: {
                name: 'Firenze',
                zones: [
                    {
                        name: 'ZTL Centro',
                        type: 'historic',
                        coordinates: [[43.7696, 11.2558]],
                        schedule: {
                            monday: { start: '07:30', end: '19:30' },
                            tuesday: { start: '07:30', end: '19:30' },
                            wednesday: { start: '07:30', end: '19:30' },
                            thursday: { start: '07:30', end: '19:30' },
                            friday: { start: '07:30', end: '23:30' },
                            saturday: { start: '07:30', end: '16:00' },
                            sunday: 'closed'
                        },
                        fee: 0,
                        exemptions: ['residents', 'hotels', 'electric']
                    }
                ]
            },
            bologna: {
                name: 'Bologna',
                zones: [
                    {
                        name: 'ZTL Università',
                        type: 'historic',
                        coordinates: [[44.4949, 11.3426]],
                        schedule: {
                            monday: { start: '07:00', end: '20:00' },
                            tuesday: { start: '07:00', end: '20:00' },
                            wednesday: { start: '07:00', end: '20:00' },
                            thursday: { start: '07:00', end: '20:00' },
                            friday: { start: '07:00', end: '20:00' },
                            saturday: { start: '07:00', end: '20:00' },
                            sunday: { start: '07:00', end: '20:00' }
                        },
                        fee: 0,
                        exemptions: ['residents', 'permits', 'disabled']
                    }
                ]
            }
        };
    }

    // Check if a route passes through ZTL zones
    async checkRouteZTL(route, travelDate) {
        const ztlWarnings = [];

        for (const city of route) {
            const cityKey = this.normalizeCityName(city);
            console.log('Checking city:', city, '-> normalized:', cityKey);

            if (this.ztlCities[cityKey]) {
                const cityZTL = this.ztlCities[cityKey];
                console.log('Found ZTL zones for:', cityZTL.name);

                for (const zone of cityZTL.zones) {
                    // Always show ZTL zones, even if not currently active
                    // This is more useful for trip planning
                    const restriction = this.checkZoneRestriction(zone, travelDate);
                    const hasSchedule = zone.schedule && Object.keys(zone.schedule).length > 0;

                    if (hasSchedule) {
                        // Get general schedule info
                        const activedays = Object.entries(zone.schedule)
                            .filter(([day, sched]) => sched !== 'closed')
                            .map(([day, sched]) => `${day}: ${sched.start}-${sched.end}`)
                            .join(', ');

                        ztlWarnings.push({
                            city: cityZTL.name,
                            zone: zone.name,
                            type: zone.type,
                            active: restriction ? restriction.active : false,
                            schedule: restriction ? restriction.schedule : null,
                            message: activedays || 'Schedule varies',
                            coordinates: zone.coordinates[0],
                            fee: zone.fee,
                            exemptions: zone.exemptions
                        });
                    }
                }
            }
        }

        console.log('ZTL warnings found:', ztlWarnings.length);
        return ztlWarnings;
    }

    // Check if a specific zone is restricted at travel time
    checkZoneRestriction(zone, travelDate) {
        const date = new Date(travelDate);
        const dayName = this.getDayName(date.getDay());
        const time = date.getHours() + ':' + date.getMinutes().toString().padStart(2, '0');

        const daySchedule = zone.schedule[dayName];

        if (!daySchedule || daySchedule === 'closed') {
            return null; // No restrictions
        }

        if (this.isTimeInRange(time, daySchedule.start, daySchedule.end)) {
            return {
                active: true,
                schedule: daySchedule,
                message: `Active ${daySchedule.start} - ${daySchedule.end}`
            };
        }

        return null;
    }

    // Get upcoming ZTL restrictions for planning
    getUpcomingRestrictions(city, days = 7) {
        const cityKey = this.normalizeCityName(city);
        if (!this.ztlCities[cityKey]) {
            return [];
        }

        const restrictions = [];
        const cityZTL = this.ztlCities[cityKey];
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() + i);

            for (const zone of cityZTL.zones) {
                const dayName = this.getDayName(checkDate.getDay());
                const daySchedule = zone.schedule[dayName];

                if (daySchedule && daySchedule !== 'closed') {
                    restrictions.push({
                        date: checkDate.toISOString().split('T')[0],
                        dayName: dayName,
                        zone: zone.name,
                        schedule: daySchedule,
                        type: zone.type,
                        fee: zone.fee
                    });
                }
            }
        }

        return restrictions;
    }

    // Check if time is within a range
    isTimeInRange(current, start, end) {
        const [currentHour, currentMin] = current.split(':').map(Number);
        const [startHour, startMin] = start.split(':').map(Number);
        const [endHour, endMin] = end.split(':').map(Number);

        const currentMinutes = currentHour * 60 + currentMin;
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        // Handle overnight ranges
        if (endMinutes < startMinutes) {
            return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
        }

        return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }

    // Helper to get day name
    getDayName(dayIndex) {
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        return days[dayIndex];
    }

    // Normalize city names for lookup
    normalizeCityName(cityName) {
        const normalized = cityName.toLowerCase().trim();
        // Map both English and Italian names to the same key
        const mappings = {
            'milano': 'milan',
            'milan': 'milan',
            'roma': 'rome',
            'rome': 'rome',
            'firenze': 'florence',
            'florence': 'florence',
            'venezia': 'venice',
            'venice': 'venice',
            'napoli': 'naples',
            'naples': 'naples',
            'bologna': 'bologna'
        };
        return mappings[normalized] || normalized;
    }

    // Get all ZTL zones for a city
    getCityZTLZones(city) {
        const cityKey = this.normalizeCityName(city);
        return this.ztlCities[cityKey] || null;
    }

    // Calculate alternative route to avoid ZTL
    suggestAlternativeRoute(originalRoute, ztlWarnings) {
        // Simple implementation - suggest parking outside ZTL
        const alternatives = [];

        for (const warning of ztlWarnings) {
            alternatives.push({
                city: warning.city,
                suggestion: `Park outside ZTL zone and use public transport`,
                parkingOptions: [
                    `P+R (Park & Ride) facilities`,
                    `Parking garages outside restricted zone`,
                    `Street parking in non-ZTL areas`
                ],
                publicTransport: [
                    'Metro/Subway',
                    'Bus services',
                    'Tram lines'
                ]
            });
        }

        return alternatives;
    }

    // Get real-time ZTL status from city APIs (when available)
    async fetchRealTimeStatus(city) {
        // Placeholder for real API integration
        // Milan has Area C API: https://www.comune.milano.it/
        // Rome has mobility API: https://romamobilita.it/

        const cityKey = this.normalizeCityName(city);

        // Check cache first
        if (this.ztlCache.has(cityKey)) {
            const cached = this.ztlCache.get(cityKey);
            if (Date.now() - cached.timestamp < this.cacheExpiry) {
                return cached.data;
            }
        }

        // For now, return static data
        // In production, would call actual city APIs
        const data = this.ztlCities[cityKey];

        // Cache the result
        this.ztlCache.set(cityKey, {
            timestamp: Date.now(),
            data: data
        });

        return data;
    }
}

module.exports = ZTLService;