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

    // Filter restaurants by meal type
    const breakfastRestaurants = safeRestaurants.filter((r: any) => r.meal === 'breakfast');
    const lunchRestaurants = safeRestaurants.filter((r: any) => r.meal === 'lunch');
    const dinnerRestaurants = safeRestaurants.filter((r: any) => r.meal === 'dinner');

    // Morning block
    if (morningActivities.length > 0 || day.driveSegments || breakfastRestaurants.length > 0) {
      blocks.push({
        period: 'morning',
        icon: '🌅',
        timeRange: '8:00 - 13:00',
        activities: morningActivities,
        restaurants: breakfastRestaurants,
        hasDrive: day.driveSegments && day.driveSegments.length > 0,
        driveSegment: day.driveSegments?.[0]
      });
    }

    // Afternoon block
    if (afternoonActivities.length > 0 || untaggedActivities.length > 0 || lunchRestaurants.length > 0) {
      blocks.push({
        period: 'afternoon',
        icon: '☀️',
        timeRange: '13:00 - 18:00',
        activities: [...afternoonActivities, ...untaggedActivities],
        restaurants: lunchRestaurants,
        hasDrive: false
      });
    }

    // Evening block (dinner)
    if (eveningActivities.length > 0 || dinnerRestaurants.length > 0) {
      blocks.push({
        period: 'evening',
        icon: '🌙',
        timeRange: '18:00 - 22:00',
        activities: eveningActivities,
        restaurants: dinnerRestaurants,
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
                      <div className="space-y-3">
                        {block.activities.map((activity: any, idx: number) => {
                          // Get activity image
                          const photo = activity.photos?.[0];
                          const photoUrl = typeof photo === 'string' ? photo :
                            photo?.url || activity.primaryPhoto?.url || activity.primaryPhoto || null;

                          // Get activity type for badge
                          const activityType = activity.type ||
                            (activity.place_types?.includes('museum') ? 'Museum' :
                             activity.place_types?.includes('park') ? 'Park' :
                             activity.place_types?.includes('church') ? 'Historical' :
                             activity.place_types?.includes('art_gallery') ? 'Art Gallery' :
                             activity.place_types?.includes('natural_feature') ? 'Nature' :
                             activity.place_types?.includes('tourist_attraction') ? 'Attraction' :
                             'Activity');

                          return (
                            <div key={idx} className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all">
                              {/* Activity Image */}
                              {photoUrl && (
                                <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                                  <img
                                    src={photoUrl}
                                    alt={activity.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      // Hide image if load fails
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  {/* Activity Type Badge */}
                                  <div className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 border border-gray-200">
                                    {activityType}
                                  </div>
                                </div>
                              )}

                              {/* Activity Details */}
                              <div className="p-4">
                                <div className="flex items-start gap-3">
                                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 text-lg">{activity.name}</h5>

                                    {/* Place Types as Tags */}
                                    {activity.place_types && activity.place_types.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 mt-2">
                                        {activity.place_types.slice(0, 3).map((type: string, typeIdx: number) => (
                                          <span key={typeIdx} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">
                                            {type.replace(/_/g, ' ')}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {activity.address && (
                                      <p className="text-sm text-gray-600 mt-2">{activity.address}</p>
                                    )}

                                    <div className="flex items-center gap-4 mt-3 text-sm">
                                      {activity.rating && (
                                        <span className="flex items-center gap-1 font-medium text-gray-700">
                                          ⭐ {activity.rating} {activity.ratingCount && <span className="text-gray-500">({activity.ratingCount})</span>}
                                        </span>
                                      )}
                                      {activity.estimatedDuration && (
                                        <span className="text-gray-600">🕐 {activity.estimatedDuration}</span>
                                      )}
                                      {activity.estimatedCost && (
                                        <span className="text-gray-600">💰 {activity.estimatedCost}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Restaurants in this block */}
                    {block.restaurants && block.restaurants.length > 0 && (
                      <div className="space-y-3">
                        {block.restaurants.map((restaurant: any, idx: number) => {
                          // Get restaurant image
                          const photo = restaurant.photos?.[0];
                          const photoUrl = typeof photo === 'string' ? photo :
                            photo?.url || restaurant.primaryPhoto?.url || restaurant.primaryPhoto || null;

                          return (
                            <div key={idx} className="bg-orange-50/50 rounded-xl overflow-hidden border-2 border-orange-200 hover:border-orange-300 hover:shadow-lg transition-all">
                              {/* Restaurant Image */}
                              {photoUrl && (
                                <div className="relative h-32 w-full overflow-hidden bg-gray-100">
                                  <img
                                    src={photoUrl}
                                    alt={restaurant.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  {/* Meal Badge */}
                                  <div className="absolute top-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-gray-700 border border-gray-200 capitalize">
                                    {restaurant.meal}
                                  </div>
                                </div>
                              )}

                              {/* Restaurant Details */}
                              <div className="p-4">
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl">🍽️</span>
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 text-lg">{restaurant.name}</h5>
                                    <p className="text-sm text-gray-700 mt-1">{restaurant.cuisine}</p>
                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                      {restaurant.rating && (
                                        <span className="font-medium text-gray-700">
                                          ⭐ {restaurant.rating} {restaurant.ratingCount && <span className="text-gray-500">({restaurant.ratingCount} reviews)</span>}
                                        </span>
                                      )}
                                      {restaurant.priceRange && (
                                        <span className="text-gray-600">{restaurant.priceRange}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
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
