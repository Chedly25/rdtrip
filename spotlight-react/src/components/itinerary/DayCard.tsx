import { useState } from 'react';
import { ChevronDown, ChevronUp, MapPin, Clock, Car } from 'lucide-react';
import { ActivityCard } from './ActivityCard';
import { RestaurantCard } from './RestaurantCard';
import { HotelCard } from './HotelCard';
import { ScenicStopCard } from './ScenicStopCard';
import { WeatherWidget } from './WeatherWidget';
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

export function DayCard({
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
  const [isExpanded, setIsExpanded] = useState(true);
  const theme = getTheme(agentType as any);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Day Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 text-left transition-colors hover:bg-gray-50"
        style={{
          borderLeft: `4px solid ${theme.primary}`
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-bold text-gray-900">
                Day {day.day}
              </h3>
              <span className="text-sm text-gray-500">{formatDate(day.date)}</span>
            </div>
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{day.location}</span>
              </div>
              {day.driveSegments && day.driveSegments.length > 0 && (
                <div className="flex items-center gap-1">
                  <Car className="h-4 w-4" />
                  <span>{day.driveSegments.reduce((sum: number, seg: any) => sum + seg.distance, 0)} km drive</span>
                </div>
              )}
              {day.overnight && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Overnight in {day.overnight}</span>
                </div>
              )}
            </div>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Day Content */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-6">
          <div className="space-y-6">
            {/* Weather Widget */}
            {weather && (
              <WeatherWidget weather={weather} />
            )}

            {/* Drive Segments with Scenic Stops */}
            {day.driveSegments && day.driveSegments.map((segment: any, index: number) => {
              const segmentStops = scenicStops.find(
                (ss: any) => ss.segment === `${segment.from} → ${segment.to}`
              );

              return (
                <div key={index} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Car className="h-5 w-5" style={{ color: theme.primary }} />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {segment.from} → {segment.to}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {segment.distance} km • {segment.estimatedTime}
                      </p>
                    </div>
                  </div>

                  {/* Scenic Stops along this segment */}
                  {segmentStops?.stops && segmentStops.stops.length > 0 && (
                    <div className="ml-8 space-y-3">
                      <h5 className="text-sm font-medium text-gray-700">
                        Recommended stops along the way:
                      </h5>
                      {segmentStops.stops.map((stop: any, stopIndex: number) => (
                        <ScenicStopCard key={stopIndex} stop={stop} theme={theme} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Activities */}
            {activities && activities.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Activities</h4>
                <div className="space-y-3">
                  {activities.map((activity: any, index: number) => (
                    <ActivityCard key={index} activity={activity} theme={theme} />
                  ))}
                </div>
              </div>
            )}

            {/* Restaurants */}
            {restaurants && restaurants.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Dining</h4>
                <div className="space-y-3">
                  {restaurants.map((restaurant: any, index: number) => (
                    <RestaurantCard key={index} restaurant={restaurant} theme={theme} />
                  ))}
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

            {/* Accommodation */}
            {accommodation && (
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900">Accommodation</h4>
                <HotelCard hotel={accommodation} theme={theme} />
              </div>
            )}

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
          </div>
        </div>
      )}
    </div>
  );
}
