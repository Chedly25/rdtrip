/**
 * Export Service
 * Generate various export formats for trip data (GPX, ICS, KML, PDF)
 */
const BaseService = require('./BaseService');

class ExportService extends BaseService {
  constructor() {
    super('Export');
  }

  /**
   * Generate GPX file for navigation
   */
  generateGPX(trip) {
    this.logAction('Generate GPX', { tripId: trip.id });

    const waypoints = this.extractWaypoints(trip);
    const route = this.extractRoute(trip);

    const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Waycraft" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${this.escapeXml(trip.name || 'Road Trip')}</name>
    <desc>${this.escapeXml(trip.description || '')}</desc>
    <author>
      <name>Waycraft</name>
    </author>
    <time>${new Date().toISOString()}</time>
  </metadata>

  <!-- Waypoints -->
${waypoints.map(wp => `  <wpt lat="${wp.lat}" lon="${wp.lng}">
    <name>${this.escapeXml(wp.name)}</name>
    <desc>${this.escapeXml(wp.description || '')}</desc>
    <type>${wp.type || 'waypoint'}</type>
  </wpt>`).join('\n')}

  <!-- Route -->
  <rte>
    <name>${this.escapeXml(trip.name || 'Road Trip Route')}</name>
${route.map(pt => `    <rtept lat="${pt.lat}" lon="${pt.lng}">
      <name>${this.escapeXml(pt.name)}</name>
    </rtept>`).join('\n')}
  </rte>
</gpx>`;

    this.logger.info(`GPX generated with ${waypoints.length} waypoints and ${route.length} route points`);
    return gpx;
  }

  /**
   * Generate ICS calendar file
   */
  generateICS(trip) {
    this.logAction('Generate ICS', { tripId: trip.id });

    const events = this.extractEvents(trip);
    
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Waycraft//Road Trip Planner//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${trip.name || 'Road Trip'}
X-WR-TIMEZONE:UTC

${events.map(event => this.generateICSEvent(event)).join('\n')}
END:VCALENDAR`;

    this.logger.info(`ICS generated with ${events.length} events`);
    return ics;
  }

  /**
   * Generate single ICS event
   */
  generateICSEvent(event) {
    const now = this.formatICSDate(new Date());
    const start = this.formatICSDate(event.startTime);
    const end = this.formatICSDate(event.endTime);

    return `BEGIN:VEVENT
UID:${event.id}@waycraft.com
DTSTAMP:${now}
DTSTART:${start}
DTEND:${end}
SUMMARY:${this.escapeICS(event.title)}
DESCRIPTION:${this.escapeICS(event.description || '')}
LOCATION:${this.escapeICS(event.location || '')}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT`;
  }

  /**
   * Generate KML file for Google Earth
   */
  generateKML(trip) {
    this.logAction('Generate KML', { tripId: trip.id });

    const waypoints = this.extractWaypoints(trip);
    const route = this.extractRoute(trip);

    const kml = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${this.escapeXml(trip.name || 'Road Trip')}</name>
    <description>${this.escapeXml(trip.description || '')}</description>

    <!-- Styles -->
    <Style id="waypoint">
      <IconStyle>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/paddle/red-circle.png</href>
        </Icon>
      </IconStyle>
    </Style>

    <Style id="route">
      <LineStyle>
        <color>ff0000ff</color>
        <width>4</width>
      </LineStyle>
    </Style>

    <!-- Waypoints -->
${waypoints.map(wp => `    <Placemark>
      <name>${this.escapeXml(wp.name)}</name>
      <description>${this.escapeXml(wp.description || '')}</description>
      <styleUrl>#waypoint</styleUrl>
      <Point>
        <coordinates>${wp.lng},${wp.lat},0</coordinates>
      </Point>
    </Placemark>`).join('\n')}

    <!-- Route -->
    <Placemark>
      <name>Route</name>
      <styleUrl>#route</styleUrl>
      <LineString>
        <coordinates>
${route.map(pt => `          ${pt.lng},${pt.lat},0`).join('\n')}
        </coordinates>
      </LineString>
    </Placemark>
  </Document>
</kml>`;

    this.logger.info(`KML generated with ${waypoints.length} waypoints`);
    return kml;
  }

  /**
   * Generate JSON export
   */
  generateJSON(trip) {
    this.logAction('Generate JSON', { tripId: trip.id });

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        generator: 'Waycraft'
      },
      trip: {
        id: trip.id,
        name: trip.name,
        description: trip.description,
        startDate: trip.startDate,
        endDate: trip.endDate,
        duration: trip.duration,
        distance: trip.distance
      },
      waypoints: this.extractWaypoints(trip),
      route: this.extractRoute(trip),
      schedule: this.extractEvents(trip),
      budget: trip.budget,
      travelers: trip.travelers
    };

    this.logger.info('JSON export generated');
    return JSON.stringify(exportData, null, 2);
  }

  /**
   * Generate CSV for expenses
   */
  generateExpensesCSV(expenses) {
    this.logAction('Generate expenses CSV', { count: expenses.length });

    const headers = ['Date', 'Category', 'Description', 'Amount', 'Currency', 'Paid By', 'Notes'];
    
    const rows = expenses.map(exp => [
      exp.date || '',
      exp.category || '',
      exp.description || '',
      exp.amount || 0,
      exp.currency || 'EUR',
      exp.paidBy || '',
      exp.notes || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => this.escapeCSV(cell)).join(','))
    ].join('\n');

    this.logger.info(`Expenses CSV generated with ${expenses.length} entries`);
    return csv;
  }

  // ===== Helper Methods =====

  /**
   * Extract waypoints from trip
   */
  extractWaypoints(trip) {
    const waypoints = [];

    // Add cities as waypoints
    if (trip.cities) {
      trip.cities.forEach(city => {
        if (city.coordinates) {
          waypoints.push({
            lat: city.coordinates.lat,
            lng: city.coordinates.lng,
            name: city.name,
            description: `Stop in ${city.name}`,
            type: 'city'
          });
        }
      });
    }

    // Add activities as waypoints
    if (trip.activities) {
      trip.activities.forEach(activitySet => {
        if (activitySet.activities) {
          activitySet.activities.forEach(activity => {
            if (activity.location) {
              waypoints.push({
                lat: activity.location.lat,
                lng: activity.location.lng,
                name: activity.name,
                description: activity.description,
                type: 'activity'
              });
            }
          });
        }
      });
    }

    return waypoints;
  }

  /**
   * Extract route points from trip
   */
  extractRoute(trip) {
    const route = [];

    if (trip.route && trip.route.coordinates) {
      trip.route.coordinates.forEach(coord => {
        route.push({
          lat: coord[1],
          lng: coord[0],
          name: ''
        });
      });
    } else if (trip.cities) {
      // Fallback: use cities as route points
      trip.cities.forEach(city => {
        if (city.coordinates) {
          route.push({
            lat: city.coordinates.lat,
            lng: city.coordinates.lng,
            name: city.name
          });
        }
      });
    }

    return route;
  }

  /**
   * Extract calendar events from trip
   */
  extractEvents(trip) {
    const events = [];
    let currentDate = new Date(trip.startDate);

    if (trip.schedule) {
      trip.schedule.forEach(day => {
        if (day.activities) {
          day.activities.forEach(activity => {
            events.push({
              id: activity.id || Math.random().toString(36).substr(2, 9),
              title: activity.name,
              description: activity.description,
              location: activity.address || activity.location?.name,
              startTime: new Date(currentDate.getTime() + (activity.startTime || 0)),
              endTime: new Date(currentDate.getTime() + (activity.endTime || 0) + (activity.duration * 60000 || 3600000))
            });
          });
        }
        currentDate.setDate(currentDate.getDate() + 1);
      });
    }

    return events;
  }

  /**
   * Escape XML special characters
   */
  escapeXml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * Escape ICS special characters
   */
  escapeICS(text) {
    if (!text) return '';
    return String(text)
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Escape CSV special characters
   */
  escapeCSV(cell) {
    const text = String(cell);
    if (text.includes(',') || text.includes('"') || text.includes('\n')) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  }

  /**
   * Format date for ICS
   */
  formatICSDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  }
}

module.exports = ExportService;

