import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, MapPin, Cloud, DollarSign, Car, ExternalLink, Navigation, Globe, Hotel } from 'lucide-react';
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
  accommodation,
  scenicStops: _scenicStops,
  practicalInfo,
  weather,
  events,
  agentType,
  density: _density = 'compact'
}: DayCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const theme = getTheme(agentType as any);

  // Helper to generate Google Maps link
  const getGoogleMapsLink = (place: any) => {
    if (place.place_id) {
      return `https://www.google.com/maps/place/?q=place_id:${place.place_id}`;
    } else if (place.coordinates?.lat && place.coordinates?.lng) {
      return `https://www.google.com/maps/search/?api=1&query=${place.coordinates.lat},${place.coordinates.lng}`;
    } else if (place.name) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;
    }
    return null;
  };

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

                          const mapsLink = getGoogleMapsLink(activity);

                          return (
                            <div key={idx} className="bg-white rounded-xl overflow-hidden border-2 border-gray-200 hover:border-blue-400 hover:shadow-2xl transition-all">
                              {/* Activity Image - MUCH LARGER */}
                              {photoUrl && (
                                <div className="relative h-80 w-full overflow-hidden bg-gray-100">
                                  <img
                                    src={photoUrl}
                                    alt={activity.name}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      // Hide image if load fails
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  {/* Activity Type Badge */}
                                  <div className="absolute top-4 left-4 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-bold text-gray-800 shadow-lg">
                                    {activityType}
                                  </div>
                                  {/* Rating Badge */}
                                  {activity.rating && (
                                    <div className="absolute top-4 right-4 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-bold text-gray-800 shadow-lg">
                                      ⭐ {activity.rating}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Activity Details */}
                              <div className="p-6">
                                <div className="flex items-start gap-4">
                                  <MapPin className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 text-2xl mb-2">{activity.name}</h5>

                                    {/* Place Types as Tags */}
                                    {activity.place_types && activity.place_types.length > 0 && (
                                      <div className="flex flex-wrap gap-2 mb-3">
                                        {activity.place_types.slice(0, 3).map((type: string, typeIdx: number) => (
                                          <span key={typeIdx} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
                                            {type.replace(/_/g, ' ')}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {activity.address && (
                                      <p className="text-sm text-gray-600 mb-4">{activity.address}</p>
                                    )}

                                    {/* Stats Row */}
                                    <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                                      {activity.rating && activity.ratingCount && (
                                        <span className="flex items-center gap-1.5 font-medium text-gray-700">
                                          ⭐ {activity.rating} <span className="text-gray-500">({activity.ratingCount} reviews)</span>
                                        </span>
                                      )}
                                      {activity.estimatedDuration && (
                                        <span className="text-gray-600">🕐 {activity.estimatedDuration}</span>
                                      )}
                                      {activity.estimatedCost && (
                                        <span className="text-gray-600">💰 {activity.estimatedCost}</span>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3">
                                      {mapsLink && (
                                        <a
                                          href={mapsLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                                        >
                                          <Navigation className="w-4 h-4" />
                                          Get Directions
                                        </a>
                                      )}
                                      {activity.website && (
                                        <a
                                          href={activity.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                                        >
                                          <Globe className="w-4 h-4" />
                                          Website
                                        </a>
                                      )}
                                      {activity.phone && (
                                        <a
                                          href={`tel:${activity.phone}`}
                                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                                        >
                                          📞 Call
                                        </a>
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
                      <div className="space-y-4">
                        {block.restaurants.map((restaurant: any, idx: number) => {
                          // Get restaurant image
                          const photo = restaurant.photos?.[0];
                          const photoUrl = typeof photo === 'string' ? photo :
                            photo?.url || restaurant.primaryPhoto?.url || restaurant.primaryPhoto || null;

                          const mapsLink = getGoogleMapsLink(restaurant);

                          return (
                            <div key={idx} className="bg-orange-50/50 rounded-xl overflow-hidden border-2 border-orange-200 hover:border-orange-400 hover:shadow-2xl transition-all">
                              {/* Restaurant Image - LARGER */}
                              {photoUrl && (
                                <div className="relative h-60 w-full overflow-hidden bg-gray-100">
                                  <img
                                    src={photoUrl}
                                    alt={restaurant.name}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  {/* Meal Badge */}
                                  <div className="absolute top-4 left-4 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-bold text-gray-800 shadow-lg capitalize">
                                    {restaurant.meal}
                                  </div>
                                  {/* Rating Badge */}
                                  {restaurant.rating && (
                                    <div className="absolute top-4 right-4 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-bold text-gray-800 shadow-lg">
                                      ⭐ {restaurant.rating}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Restaurant Details */}
                              <div className="p-6">
                                <div className="flex items-start gap-4">
                                  <span className="text-3xl">🍽️</span>
                                  <div className="flex-1">
                                    <h5 className="font-bold text-gray-900 text-2xl mb-2">{restaurant.name}</h5>
                                    <p className="text-base text-gray-700 mb-3">{restaurant.cuisine}</p>

                                    {restaurant.address && (
                                      <p className="text-sm text-gray-600 mb-4">{restaurant.address}</p>
                                    )}

                                    {/* Stats Row */}
                                    <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                                      {restaurant.rating && restaurant.ratingCount && (
                                        <span className="font-medium text-gray-700">
                                          ⭐ {restaurant.rating} <span className="text-gray-500">({restaurant.ratingCount} reviews)</span>
                                        </span>
                                      )}
                                      {restaurant.priceRange && (
                                        <span className="text-gray-600">💰 {restaurant.priceRange}</span>
                                      )}
                                      {restaurant.priceLevel && (
                                        <span className="text-gray-600">{'€'.repeat(restaurant.priceLevel)}</span>
                                      )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-wrap gap-3">
                                      {mapsLink && (
                                        <a
                                          href={mapsLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                                        >
                                          <Navigation className="w-4 h-4" />
                                          Get Directions
                                        </a>
                                      )}
                                      {restaurant.website && (
                                        <a
                                          href={restaurant.website}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                                        >
                                          <Globe className="w-4 h-4" />
                                          Website
                                        </a>
                                      )}
                                      {restaurant.phone && (
                                        <a
                                          href={`tel:${restaurant.phone}`}
                                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                                        >
                                          📞 Call
                                        </a>
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

              {/* Accommodation Section */}
              {accommodation && day.overnight && (
                <div className="mt-6 pt-6 border-t-2 border-gray-200">
                  <div className="flex items-center gap-3 mb-4">
                    <Hotel className="w-6 h-6 text-purple-600" />
                    <h4 className="font-semibold text-gray-900 text-lg">Tonight's Accommodation</h4>
                  </div>

                  <div className="bg-purple-50/50 rounded-xl overflow-hidden border-2 border-purple-200 hover:border-purple-400 hover:shadow-2xl transition-all">
                    {/* Hotel Image */}
                    {accommodation.photos && accommodation.photos[0] && (
                      <div className="relative h-60 w-full overflow-hidden bg-gray-100">
                        <img
                          src={typeof accommodation.photos[0] === 'string' ? accommodation.photos[0] : accommodation.photos[0]?.url}
                          alt={accommodation.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        {/* Hotel Badge */}
                        <div className="absolute top-4 left-4 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-bold text-gray-800 shadow-lg">
                          Hotel
                        </div>
                        {/* Rating Badge */}
                        {accommodation.rating && (
                          <div className="absolute top-4 right-4 px-4 py-2 bg-white/95 backdrop-blur-sm rounded-full text-sm font-bold text-gray-800 shadow-lg">
                            ⭐ {accommodation.rating}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Hotel Details */}
                    <div className="p-6">
                      <div className="flex items-start gap-4">
                        <Hotel className="w-8 h-8 text-purple-600 flex-shrink-0 mt-1" />
                        <div className="flex-1">
                          <h5 className="font-bold text-gray-900 text-2xl mb-2">{accommodation.name}</h5>

                          {accommodation.address && (
                            <p className="text-sm text-gray-600 mb-4">{accommodation.address}</p>
                          )}

                          {/* Stats Row */}
                          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm">
                            {accommodation.rating && accommodation.ratingCount && (
                              <span className="font-medium text-gray-700">
                                ⭐ {accommodation.rating} <span className="text-gray-500">({accommodation.ratingCount} reviews)</span>
                              </span>
                            )}
                            {accommodation.priceRange && (
                              <span className="text-gray-600">💰 {accommodation.priceRange}</span>
                            )}
                            {accommodation.priceLevel && (
                              <span className="text-gray-600">{'€'.repeat(accommodation.priceLevel)}</span>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-3">
                            {getGoogleMapsLink(accommodation) && (
                              <a
                                href={getGoogleMapsLink(accommodation)!}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                              >
                                <Navigation className="w-4 h-4" />
                                Get Directions
                              </a>
                            )}
                            {accommodation.website && (
                              <a
                                href={accommodation.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                              >
                                <Globe className="w-4 h-4" />
                                Website
                              </a>
                            )}
                            {accommodation.phone && (
                              <a
                                href={`tel:${accommodation.phone}`}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors"
                              >
                                📞 Call
                              </a>
                            )}
                            {accommodation.bookingUrl && (
                              <a
                                href={accommodation.bookingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg"
                              >
                                <ExternalLink className="w-4 h-4" />
                                Book Now
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
