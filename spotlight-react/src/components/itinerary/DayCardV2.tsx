import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, MapPin, Cloud, DollarSign, Car } from 'lucide-react';
import { TimelineItemCard } from './TimelineItemCard';
import { getTheme } from '../../config/theme';

interface DayCardProps {
  day: any;
  activities: any[];
  restaurants: any[];
  accommodation: any;
  scenicStops: any[];
  practicalInfo: any;
  weather: any;
  events: any[];
  agentType: string;
}

export function DayCardV2({
  day,
  activities,
  restaurants,
  accommodation,
  scenicStops,
  practicalInfo,
  weather,
  events,
  agentType
}: DayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = getTheme(agentType as any);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Build timeline items with estimated times
  const buildTimelineItems = () => {
    const items: any[] = [];
    let currentTime = '08:00';

    // Helper to add time
    const addHours = (time: string, hours: number) => {
      const [h, m] = time.split(':').map(Number);
      const totalMinutes = h * 60 + m + hours * 60;
      const newH = Math.floor(totalMinutes / 60) % 24;
      const newM = totalMinutes % 60;
      return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
    };

    // Breakfast
    const breakfast = restaurants.find((r: any) => r.meal === 'breakfast');
    if (breakfast) {
      items.push({
        type: 'restaurant',
        time: '08:30',
        item: breakfast,
        color: '#F59E0B'
      });
      currentTime = '09:30';
    }

    // Drive segment (if exists)
    if (day.driveSegments && day.driveSegments.length > 0) {
      const segment = day.driveSegments[0];
      items.push({
        type: 'drive',
        time: currentTime,
        item: {
          name: `${segment.from} → ${segment.to}`,
          duration: segment.estimatedTime,
          distance: `${segment.distance} km`,
          stops: scenicStops.find(
            (ss: any) => ss.segment === `${segment.from} → ${segment.to}`
          )?.stops || []
        },
        color: '#6B7280'
      });
      // Estimate drive duration
      const driveHours = parseFloat(segment.estimatedTime) || 4;
      currentTime = addHours(currentTime, driveHours);
    }

    // Lunch
    const lunch = restaurants.find((r: any) => r.meal === 'lunch');
    if (lunch && !day.driveSegments) {
      items.push({
        type: 'restaurant',
        time: '13:00',
        item: lunch,
        color: '#F59E0B'
      });
      currentTime = '14:30';
    } else if (lunch) {
      items.push({
        type: 'restaurant',
        time: currentTime,
        item: lunch,
        color: '#F59E0B'
      });
      currentTime = addHours(currentTime, 1.5);
    }

    // Activities
    activities.forEach((activity: any, index: number) => {
      items.push({
        type: 'activity',
        time: currentTime,
        item: activity,
        color: '#3B82F6'
      });
      // Estimate activity duration
      const durationHours = activity.estimatedDuration?.includes('2-3') ? 2.5 : 2;
      currentTime = addHours(currentTime, durationHours);
    });

    // Dinner
    const dinner = restaurants.find((r: any) => r.meal === 'dinner');
    if (dinner) {
      items.push({
        type: 'restaurant',
        time: '19:30',
        item: dinner,
        color: '#F59E0B'
      });
    }

    // Accommodation
    if (accommodation) {
      items.push({
        type: 'accommodation',
        time: '21:00',
        item: accommodation,
        color: '#8B5CF6'
      });
    }

    return items;
  };

  const timelineItems = buildTimelineItems();

  return (
    <div id={`day-${day.day}`} className="scroll-mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        {/* Day Header */}
        <div
          className="px-6 py-5"
          style={{
            borderLeft: `4px solid ${theme.primary}`
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Title Row */}
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  Day {day.day}
                </h3>
                <span className="text-sm text-gray-500">{formatDate(day.date)}</span>
              </div>

              {/* Location & Drive Info */}
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span className="font-medium">{day.location}</span>
                </div>
                {day.driveSegments && day.driveSegments.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Car className="h-4 w-4" />
                    <span>
                      {day.driveSegments[0].distance} km • {day.driveSegments[0].estimatedTime}
                    </span>
                  </div>
                )}
                {day.overnight && (
                  <div className="text-gray-500">
                    Overnight in <span className="font-medium">{day.overnight}</span>
                  </div>
                )}
              </div>

              {/* Weather & Budget Summary */}
              <div className="flex items-center gap-4 text-sm">
                {weather && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
                    <Cloud className="h-4 w-4 text-blue-600" />
                    <span className="text-gray-700">
                      {weather.temperature}°C • {weather.condition}
                    </span>
                  </div>
                )}
                {activities.length + restaurants.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-lg">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">
                      Budget: €{Math.round((activities.length * 20) + (restaurants.length * 30))}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Collapse/Expand Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Timeline Content - Always Visible in Collapsed Mode */}
        <div className="border-t border-gray-100">
          {!isExpanded ? (
            /* Collapsed: Show timeline items */
            <div className="p-6 space-y-3">
              {timelineItems.map((item, index) => (
                <TimelineItemCard
                  key={index}
                  type={item.type}
                  time={item.time}
                  item={item.item}
                  color={item.color}
                />
              ))}
            </div>
          ) : (
            /* Expanded: Show additional details like practical tips */
            <div className="p-6 space-y-6">
              {/* Timeline Items */}
              <div className="space-y-3">
                {timelineItems.map((item, index) => (
                  <TimelineItemCard
                    key={index}
                    type={item.type}
                    time={item.time}
                    item={item.item}
                    color={item.color}
                  />
                ))}
              </div>

              {/* Practical Info */}
              {practicalInfo && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="mb-3 font-semibold text-gray-900">Practical Tips</h4>
                  <div className="space-y-3 text-sm">
                    {practicalInfo.parking && (
                      <div>
                        <span className="font-medium text-gray-700">Parking: </span>
                        <span className="text-gray-600">{practicalInfo.parking.recommendation}</span>
                      </div>
                    )}
                    {practicalInfo.transportation && (
                      <div>
                        <span className="font-medium text-gray-700">Getting around: </span>
                        <span className="text-gray-600">{practicalInfo.transportation.bestOption}</span>
                      </div>
                    )}
                    {practicalInfo.localTips && practicalInfo.localTips.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Local tips:</span>
                        <ul className="mt-1 space-y-1 pl-4">
                          {practicalInfo.localTips.slice(0, 3).map((tip: string, i: number) => (
                            <li key={i} className="text-gray-600">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Local Events */}
              {events && events.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Local Events</h4>
                  <div className="space-y-2">
                    {events.map((event: any, index: number) => (
                      <div key={index} className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                        <div className="flex items-start gap-2">
                          <span className="text-xl">🎉</span>
                          <div>
                            <h5 className="font-medium text-gray-900">{event.name}</h5>
                            <p className="text-sm text-gray-600">{event.description}</p>
                            {event.location && (
                              <p className="mt-1 text-xs text-gray-500">{event.location}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
