import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, MapPin, Cloud, DollarSign, Car } from 'lucide-react';
import { EmptyState } from './EmptyState';
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
  density?: 'compact' | 'comfortable' | 'spacious';
}

export function DayCardV2({
  day,
  activities,
  restaurants,
  accommodation: _accommodation,
  scenicStops: _scenicStops,
  practicalInfo,
  weather,
  events,
  agentType,
  density: _density = 'compact'
}: DayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = getTheme(agentType as any);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Build activity blocks by period (morning/afternoon/evening)
  const buildActivityBlocks = () => {
    const blocks: any[] = [];

    // SAFE array validation
    const safeActivities = Array.isArray(activities) ? activities : [];
    const safeRestaurants = Array.isArray(restaurants) ? restaurants : [];

    // Group activities by block period if available
    const morningActivities = safeActivities.filter((a: any) => a.block === 'morning');
    const afternoonActivities = safeActivities.filter((a: any) => a.block === 'afternoon');
    const eveningActivities = safeActivities.filter((a: any) => a.block === 'evening');

    // If no block tags, put all activities in afternoon
    const untaggedActivities = safeActivities.filter((a: any) => !a.block);

    // Morning block
    if (morningActivities.length > 0 || day.driveSegments) {
      blocks.push({
        period: 'morning',
        icon: '🌅',
        timeRange: '8:00 - 13:00',
        activities: morningActivities,
        hasDrive: day.driveSegments && day.driveSegments.length > 0,
        driveSegment: day.driveSegments?.[0]
      });
    }

    // Afternoon block
    if (afternoonActivities.length > 0 || untaggedActivities.length > 0) {
      blocks.push({
        period: 'afternoon',
        icon: '☀️',
        timeRange: '13:00 - 18:00',
        activities: [...afternoonActivities, ...untaggedActivities],
        hasDrive: false
      });
    }

    // Evening block (usually just dinner)
    if (eveningActivities.length > 0 || safeRestaurants.length > 0) {
      blocks.push({
        period: 'evening',
        icon: '🌙',
        timeRange: '18:00 - 22:00',
        activities: eveningActivities,
        hasDrive: false
      });
    }

    return blocks;
  };

  const activityBlocks = buildActivityBlocks();

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

        {/* Block-Based Content - Organized by Time Period */}
        <div className="border-t border-gray-100">
          {!isExpanded ? (
            /* Collapsed: Show activity blocks */
            <div className="p-6 space-y-6">
              {activityBlocks.length > 0 ? (
                activityBlocks.map((block, blockIdx) => (
                  <div key={blockIdx} className="space-y-3">
                    {/* Block Header */}
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{block.icon}</span>
                      <div>
                        <h4 className="font-semibold text-gray-900 capitalize">{block.period}</h4>
                        <p className="text-sm text-gray-500">{block.timeRange}</p>
                      </div>
                    </div>

                    {/* Drive Segment */}
                    {block.hasDrive && block.driveSegment && (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="flex items-center gap-3">
                          <Car className="w-5 h-5 text-gray-600" />
                          <div>
                            <p className="font-medium text-gray-900">
                              {block.driveSegment.from} → {block.driveSegment.to}
                            </p>
                            <p className="text-sm text-gray-600">
                              {block.driveSegment.distance} km • {block.driveSegment.estimatedTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Activities in this block */}
                    {block.activities && block.activities.length > 0 && (
                      <div className="space-y-2">
                        {block.activities.map((activity: any, idx: number) => (
                          <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all">
                            <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{activity.name}</h5>
                                {activity.address && (
                                  <p className="text-sm text-gray-600 mt-1">{activity.address}</p>
                                )}
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  {activity.rating && (
                                    <span className="flex items-center gap-1">
                                      ⭐ {activity.rating} {activity.ratingCount && `(${activity.ratingCount})`}
                                    </span>
                                  )}
                                  {activity.estimatedDuration && (
                                    <span>🕐 {activity.estimatedDuration}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Restaurants in this block */}
                    {block.period === 'evening' && restaurants && restaurants.length > 0 && (
                      <div className="space-y-2">
                        {restaurants.map((restaurant: any, idx: number) => (
                          <div key={idx} className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-start gap-3">
                              <span className="text-xl">🍽️</span>
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{restaurant.name}</h5>
                                <p className="text-sm text-gray-600">{restaurant.cuisine} • {restaurant.meal}</p>
                                {restaurant.rating && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    ⭐ {restaurant.rating} ({restaurant.ratingCount} reviews)
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <EmptyState type="activities" cityName={day.location} />
              )}
            </div>
          ) : (
            /* Expanded: Show additional details like practical tips */
            <div className="p-6 space-y-6">
              {/* Activity Blocks */}
              {activityBlocks.map((block, blockIdx) => (
                <div key={blockIdx} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{block.icon}</span>
                    <h4 className="font-semibold text-gray-900 capitalize">{block.period} ({block.timeRange})</h4>
                  </div>
                  {block.hasDrive && block.driveSegment && (
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <Car className="w-5 h-5 text-gray-600 inline mr-2" />
                      {block.driveSegment.from} → {block.driveSegment.to} • {block.driveSegment.distance} km
                    </div>
                  )}
                  {block.activities?.map((activity: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-lg p-4 border border-gray-200">
                      <MapPin className="w-4 h-4 text-blue-600 inline mr-2" />
                      {activity.name} • ⭐ {activity.rating || 'N/A'}
                    </div>
                  ))}
                </div>
              ))}

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
                    {practicalInfo.localTips && Array.isArray(practicalInfo.localTips) && practicalInfo.localTips.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-700">Local tips:</span>
                        <ul className="mt-1 space-y-1 pl-4">
                          {(Array.isArray(practicalInfo.localTips) ? practicalInfo.localTips : []).slice(0, 3).map((tip: string, i: number) => (
                            <li key={i} className="text-gray-600">• {tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Local Events */}
              {events && Array.isArray(events) && events.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Local Events</h4>
                  <div className="space-y-2">
                    {(Array.isArray(events) ? events : []).map((event: any, index: number) => (
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
