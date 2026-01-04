/**
 * Planning Export Utilities
 *
 * Export trip plans to various formats:
 * - ICS (Calendar events)
 * - JSON (Full data backup)
 * - Google Maps URL (Shareable locations list)
 * - PDF (Printable itinerary) - future
 */

import type { TripPlan, PlannedItem, Slot } from '../types/planning';

// ============================================================================
// Types
// ============================================================================

export type ExportFormat = 'ics' | 'json' | 'google-maps' | 'pdf';

interface ExportOptions {
  includeTravelTime?: boolean;
  setReminders?: boolean;
  reminderMinutes?: number;
}

// ============================================================================
// ICS Calendar Export
// ============================================================================

/**
 * Slot time mappings for calendar events
 */
const SLOT_TIMES: Record<Slot, { start: string; end: string }> = {
  morning: { start: '09:00', end: '12:00' },
  afternoon: { start: '13:00', end: '18:00' },
  evening: { start: '18:30', end: '21:30' },
  night: { start: '22:00', end: '01:00' },
};

/**
 * Generate ICS calendar file content
 */
export function generateICS(
  tripPlan: TripPlan,
  options: ExportOptions = {}
): string {
  const {
    includeTravelTime = true,
    setReminders = true,
    reminderMinutes = 30,
  } = options;

  const events: string[] = [];
  const now = new Date();

  // ICS header
  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Waycraft//Trip Planner//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeICS(`Trip: ${tripPlan.days[0]?.city.name || 'My Trip'}`)}`,
    'X-WR-TIMEZONE:UTC',
  ].join('\r\n');

  for (const day of tripPlan.days) {
    const dateStr = formatDateForICS(day.date);

    const slots: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

    for (const slot of slots) {
      const items = day.slots[slot];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const slotTime = SLOT_TIMES[slot];

        // Calculate start time based on position in slot
        const baseMinutes = parseTimeToMinutes(slotTime.start);
        const durationBefore = items
          .slice(0, i)
          .reduce((sum, it) => sum + it.place.estimated_duration_mins, 0);
        const travelTimeBefore = includeTravelTime ? i * 10 : 0; // Estimate 10 min between activities

        const startMinutes = baseMinutes + durationBefore + travelTimeBefore;
        const endMinutes = startMinutes + item.place.estimated_duration_mins;

        const startTime = minutesToTime(startMinutes);
        const endTime = minutesToTime(endMinutes);

        const event = generateEvent({
          item,
          dateStr,
          startTime,
          endTime,
          city: day.city.name,
          setReminders,
          reminderMinutes,
          now,
        });

        events.push(event);
      }
    }
  }

  ics += '\r\n' + events.join('\r\n');
  ics += '\r\nEND:VCALENDAR';

  return ics;
}

interface EventParams {
  item: PlannedItem;
  dateStr: string;
  startTime: string;
  endTime: string;
  city: string;
  setReminders: boolean;
  reminderMinutes: number;
  now: Date;
}

function generateEvent({
  item,
  dateStr,
  startTime,
  endTime,
  city,
  setReminders,
  reminderMinutes,
  now,
}: EventParams): string {
  const uid = `${item.id}@waycraft.app`;
  const dtstamp = formatDateTimeForICS(now);

  let event = [
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dateStr}T${startTime.replace(':', '')}00`,
    `DTEND:${dateStr}T${endTime.replace(':', '')}00`,
    `SUMMARY:${escapeICS(item.place.name)}`,
    `LOCATION:${escapeICS(item.place.formatted_address || city)}`,
  ];

  // Add description
  const description = buildEventDescription(item);
  if (description) {
    event.push(`DESCRIPTION:${escapeICS(description)}`);
  }

  // Add geo location
  if (item.place.geometry?.location) {
    const { lat, lng } = item.place.geometry.location;
    event.push(`GEO:${lat};${lng}`);
  }

  // Add reminder
  if (setReminders) {
    event.push('BEGIN:VALARM');
    event.push('ACTION:DISPLAY');
    event.push(`DESCRIPTION:${escapeICS(item.place.name)} in ${reminderMinutes} minutes`);
    event.push(`TRIGGER:-PT${reminderMinutes}M`);
    event.push('END:VALARM');
  }

  // Add category based on place type
  event.push(`CATEGORIES:${item.place.category.toUpperCase()}`);

  event.push('END:VEVENT');

  return event.join('\r\n');
}

function buildEventDescription(item: PlannedItem): string {
  const parts: string[] = [];

  if (item.place.rating) {
    parts.push(`Rating: ${item.place.rating.toFixed(1)} ⭐`);
  }

  if (item.place.price_level !== undefined) {
    parts.push(`Price: ${'€'.repeat(item.place.price_level + 1)}`);
  }

  parts.push(`Duration: ~${item.place.estimated_duration_mins} min`);

  if (item.place.formatted_phone_number) {
    parts.push(`Phone: ${item.place.formatted_phone_number}`);
  }

  if (item.place.website) {
    parts.push(`Website: ${item.place.website}`);
  }

  if (item.user_notes) {
    parts.push(`Notes: ${item.user_notes}`);
  }

  return parts.join('\\n');
}

// ============================================================================
// JSON Export
// ============================================================================

/**
 * Generate JSON export of the full trip plan
 */
export function generateJSON(tripPlan: TripPlan): string {
  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    tripPlan: {
      id: tripPlan.id,
      route_id: tripPlan.route_id,
      created_at: tripPlan.created_at,
      updated_at: tripPlan.updated_at,
      days: tripPlan.days.map((day) => ({
        day_index: day.day_index,
        date: day.date.toISOString(),
        city: {
          id: day.city.id,
          name: day.city.name,
          country: day.city.country,
          coordinates: day.city.coordinates,
        },
        slots: {
          morning: day.slots.morning.map(serializeItem),
          afternoon: day.slots.afternoon.map(serializeItem),
          evening: day.slots.evening.map(serializeItem),
          night: day.slots.night.map(serializeItem),
        },
      })),
    },
  };

  return JSON.stringify(exportData, null, 2);
}

function serializeItem(item: PlannedItem) {
  return {
    id: item.id,
    place: {
      place_id: item.place.place_id,
      name: item.place.name,
      category: item.place.category,
      formatted_address: item.place.formatted_address,
      geometry: item.place.geometry,
      rating: item.place.rating,
      price_level: item.place.price_level,
      estimated_duration_mins: item.place.estimated_duration_mins,
      vibe_tags: item.place.vibe_tags,
      is_hidden_gem: item.place.is_hidden_gem,
    },
    slot: item.slot,
    order_in_slot: item.order_in_slot,
    user_notes: item.user_notes,
    is_locked: item.is_locked,
    added_at: item.added_at,
    added_by: item.added_by,
  };
}

// ============================================================================
// Google Maps URL Export
// ============================================================================

/**
 * Generate Google Maps URL with all places
 */
export function generateGoogleMapsURL(tripPlan: TripPlan): string {
  const places: Array<{ name: string; lat: number; lng: number }> = [];

  for (const day of tripPlan.days) {
    const slots: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

    for (const slot of slots) {
      for (const item of day.slots[slot]) {
        if (item.place.geometry?.location) {
          places.push({
            name: item.place.name,
            lat: item.place.geometry.location.lat,
            lng: item.place.geometry.location.lng,
          });
        }
      }
    }
  }

  if (places.length === 0) {
    return '';
  }

  // Generate directions URL for route mode
  if (places.length === 1) {
    const p = places[0];
    return `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}&query_place_id=${encodeURIComponent(p.name)}`;
  }

  // For multiple places, create a directions URL
  const origin = places[0];
  const destination = places[places.length - 1];
  const waypoints = places.slice(1, -1);

  let url = 'https://www.google.com/maps/dir/?api=1';
  url += `&origin=${origin.lat},${origin.lng}`;
  url += `&destination=${destination.lat},${destination.lng}`;

  if (waypoints.length > 0) {
    const waypointStr = waypoints
      .map((p) => `${p.lat},${p.lng}`)
      .join('|');
    url += `&waypoints=${encodeURIComponent(waypointStr)}`;
  }

  url += '&travelmode=walking';

  return url;
}

/**
 * Generate Google Maps list URL (for saving places)
 */
export function generateGoogleMapsListData(tripPlan: TripPlan): Array<{
  name: string;
  address: string;
  lat: number;
  lng: number;
  url: string;
}> {
  const places: Array<{
    name: string;
    address: string;
    lat: number;
    lng: number;
    url: string;
  }> = [];

  for (const day of tripPlan.days) {
    const slots: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

    for (const slot of slots) {
      for (const item of day.slots[slot]) {
        if (item.place.geometry?.location) {
          const { lat, lng } = item.place.geometry.location;
          places.push({
            name: item.place.name,
            address: item.place.formatted_address || '',
            lat,
            lng,
            url: `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
          });
        }
      }
    }
  }

  return places;
}

// ============================================================================
// Download Helpers
// ============================================================================

/**
 * Trigger a file download in the browser
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export trip plan to specified format and trigger download
 */
export async function exportTripPlan(
  tripPlan: TripPlan,
  format: ExportFormat,
  options: ExportOptions = {}
): Promise<{ success: boolean; url?: string; error?: string }> {
  const tripName = tripPlan.days[0]?.city.name || 'My Trip';
  const dateStr = new Date().toISOString().split('T')[0];

  try {
    switch (format) {
      case 'ics': {
        const content = generateICS(tripPlan, options);
        const filename = `${tripName.replace(/\s+/g, '_')}_${dateStr}.ics`;
        downloadFile(content, filename, 'text/calendar');
        return { success: true };
      }

      case 'json': {
        const content = generateJSON(tripPlan);
        const filename = `${tripName.replace(/\s+/g, '_')}_${dateStr}.json`;
        downloadFile(content, filename, 'application/json');
        return { success: true };
      }

      case 'google-maps': {
        const url = generateGoogleMapsURL(tripPlan);
        if (url) {
          window.open(url, '_blank');
          return { success: true, url };
        }
        return { success: false, error: 'No places to export' };
      }

      case 'pdf': {
        // PDF generation would require a library like jsPDF or server-side rendering
        return { success: false, error: 'PDF export coming soon' };
      }

      default:
        return { success: false, error: 'Unknown format' };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function formatDateForICS(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function formatDateTimeForICS(date: Date): string {
  const dateStr = formatDateForICS(date);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${dateStr}T${hours}${minutes}${seconds}Z`;
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}
