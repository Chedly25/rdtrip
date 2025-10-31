/**
 * Calendar Export Generator (.ics format)
 * Creates calendar events for all activities, meals, and accommodations
 */

const { createEvents } = require('ics');

/**
 * Generate .ics calendar file from itinerary
 */
function generateItineraryCalendar(itinerary) {
  const events = [];

  // Add activities
  if (itinerary.activities) {
    itinerary.activities.forEach(activity => {
      const date = parseDate(activity.date || itinerary.day_structure.days.find(d => d.day === activity.day)?.date);

      if (date) {
        const startTime = parseTimeSlot(activity.timeSlot);

        events.push({
          start: [...date, ...startTime.start],
          duration: { hours: activity.duration ? parseDuration(activity.duration) : 2 },
          title: activity.name,
          description: activity.description + (activity.tips ? `\n\nTip: ${activity.tips}` : ''),
          location: activity.location || activity.city,
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
          categories: ['Activity', 'Road Trip']
        });
      }
    });
  }

  // Add restaurants/meals
  if (itinerary.restaurants) {
    itinerary.restaurants.forEach(meal => {
      const date = parseDate(meal.date || itinerary.day_structure.days.find(d => d.day === meal.day)?.date);

      if (date) {
        const mealTime = getMealTime(meal.mealType);

        events.push({
          start: [...date, ...mealTime],
          duration: { hours: 1, minutes: 30 },
          title: `${meal.mealType} at ${meal.name}`,
          description: `${meal.cuisine}\n${meal.description || ''}${meal.signature ? `\n\nMust-try: ${meal.signature}` : ''}${meal.reservationTip ? `\n\nNote: ${meal.reservationTip}` : ''}`,
          location: meal.location || meal.city,
          status: 'CONFIRMED',
          busyStatus: 'BUSY',
          categories: ['Dining', 'Road Trip']
        });
      }
    });
  }

  // Add accommodations (check-in reminders)
  if (itinerary.accommodations) {
    itinerary.accommodations.forEach(hotel => {
      const date = parseDate(hotel.date || itinerary.day_structure.days.find(d => d.day === hotel.night)?.date);

      if (date) {
        events.push({
          start: [...date, 15, 0], // 3 PM check-in
          duration: { hours: 1 },
          title: `Check-in: ${hotel.name}`,
          description: `Accommodation for the night\n${hotel.description || ''}${hotel.location ? `\n\nLocation: ${hotel.location}` : ''}${hotel.bookingTip ? `\n\nNote: ${hotel.bookingTip}` : ''}`,
          location: hotel.location || hotel.city,
          status: 'CONFIRMED',
          busyStatus: 'FREE',
          categories: ['Accommodation', 'Road Trip'],
          alarms: [{ action: 'display', trigger: { hours: 2, before: true } }] // 2 hour reminder
        });
      }
    });
  }

  // Add scenic stops
  if (itinerary.scenic_stops) {
    itinerary.scenic_stops.forEach(segment => {
      const date = parseDate(segment.date || itinerary.day_structure.days.find(d => d.day === segment.day)?.date);

      if (date && segment.stops) {
        segment.stops.forEach((stop, index) => {
          // Space stops throughout the drive
          const hour = 10 + (index * 2); // Start at 10 AM, space 2 hours apart

          events.push({
            start: [...date, hour, 0],
            duration: { minutes: parseDuration(stop.duration) * 60 || 30 },
            title: `Scenic Stop: ${stop.name}`,
            description: `${stop.description || ''}${stop.tip ? `\n\nTip: ${stop.tip}` : ''}`,
            location: stop.coordinates || stop.name,
            status: 'TENTATIVE',
            busyStatus: 'FREE',
            categories: ['Scenic Stop', 'Road Trip']
          });
        });
      }
    });
  }

  // Add local events
  if (itinerary.events) {
    itinerary.events.forEach(event => {
      const date = parseDate(event.date || itinerary.day_structure.days.find(d => d.day === event.day)?.date);

      if (date) {
        events.push({
          start: [...date, 14, 0], // Default 2 PM
          duration: { hours: 2 },
          title: event.name,
          description: event.description,
          location: event.location || '',
          status: 'TENTATIVE',
          busyStatus: 'FREE',
          categories: ['Event', 'Road Trip']
        });
      }
    });
  }

  // Generate .ics file
  const { error, value } = createEvents(events);

  if (error) {
    console.error('ICS generation error:', error);
    return null;
  }

  return value;
}

/**
 * Parse date string to ICS format [year, month, day]
 */
function parseDate(dateStr) {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  return [
    date.getFullYear(),
    date.getMonth() + 1,
    date.getDate()
  ];
}

/**
 * Parse time slot like "9:00 AM - 11:00 AM" to [hour, minute]
 */
function parseTimeSlot(timeSlot) {
  if (!timeSlot) return { start: [9, 0], end: [11, 0] }; // Default 9-11 AM

  const match = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (match) {
    let hour = parseInt(match[1]);
    const minute = parseInt(match[2]);
    const meridiem = match[3];

    if (meridiem && meridiem.toUpperCase() === 'PM' && hour !== 12) {
      hour += 12;
    } else if (meridiem && meridiem.toUpperCase() === 'AM' && hour === 12) {
      hour = 0;
    }

    return { start: [hour, minute], end: [hour + 2, minute] };
  }

  return { start: [9, 0], end: [11, 0] };
}

/**
 * Get default meal times
 */
function getMealTime(mealType) {
  const times = {
    'Breakfast': [8, 0],
    'Lunch': [12, 30],
    'Dinner': [19, 0]
  };

  return times[mealType] || [12, 0];
}

/**
 * Parse duration string like "2 hours" to number
 */
function parseDuration(durationStr) {
  if (typeof durationStr === 'number') return durationStr;
  if (!durationStr) return 2;

  const match = durationStr.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : 2;
}

module.exports = { generateItineraryCalendar };
