import { motion } from 'framer-motion';
import { MapPin, Calendar, Hotel } from 'lucide-react';
import { CompactActivityCard } from './CompactActivityCard';
import { CompactRestaurantCard } from './CompactRestaurantCard';
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
  routeId?: string;
  currentUserId?: string;
}

export function DayCardV2({
  day,
  activities,
  restaurants,
  accommodation,
  agentType,
  routeId,
  currentUserId,
}: DayCardProps) {
  const theme = getTheme(agentType as any);

  // SAFE array validation
  const safeActivities = Array.isArray(activities) ? activities : [];
  const safeRestaurants = Array.isArray(restaurants) ? restaurants : [];

  // Group activities by time period
  const morningActivities = safeActivities.filter((a: any) => a.block === 'morning');
  const afternoonActivities = safeActivities.filter((a: any) => a.block === 'afternoon');
  const eveningActivities = safeActivities.filter((a: any) => a.block === 'evening');

  // Fallback: if no block tags, put activities in afternoon
  const untaggedActivities = safeActivities.filter((a: any) => !a.block);
  const afternoonWithFallback = [...afternoonActivities, ...untaggedActivities];

  // Group restaurants by meal type
  const breakfastRestaurants = safeRestaurants.filter((r: any) => r.meal === 'breakfast');
  const lunchRestaurants = safeRestaurants.filter((r: any) => r.meal === 'lunch');
  const dinnerRestaurants = safeRestaurants.filter((r: any) => r.meal === 'dinner');

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  // Time period section component
  const TimePeriodSection = ({
    icon,
    title,
    activities,
    cityName
  }: {
    icon: string;
    title: string;
    activities: any[];
    cityName: string;
  }) => {
    if (activities.length === 0) return null;

    return (
      <div className="mb-8">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{icon}</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {title} in {cityName}
            </h3>
            <p className="text-sm text-gray-600">
              Choose 2-3 activities from these options
            </p>
          </div>
        </div>

        {/* Activity grid: Responsive columns that fit the available space */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          {activities.slice(0, 6).map((activity: any, index: number) => (
            <CompactActivityCard
              key={activity.place_id || activity.name || index}
              activity={activity}
              routeId={routeId}
              currentUserId={currentUserId}
              dayNumber={day.day}
            />
          ))}
        </div>
      </div>
    );
  };

  // Restaurant section component
  const RestaurantSection = () => {
    const hasRestaurants = breakfastRestaurants.length > 0 || lunchRestaurants.length > 0 || dinnerRestaurants.length > 0;

    if (!hasRestaurants) return null;

    return (
      <div className="mb-8 bg-orange-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🍽️</span>
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              Where to Eat
            </h3>
            <p className="text-sm text-gray-600">
              Pick your favorite spots for each meal
            </p>
          </div>
        </div>

        {/* Responsive meal layout: stacked on mobile, 3 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Breakfast column */}
          {breakfastRestaurants.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">🍳</span>
                Breakfast
              </h4>
              <div className="space-y-3">
                {breakfastRestaurants.slice(0, 3).map((restaurant: any, index: number) => (
                  <CompactRestaurantCard
                    key={restaurant.place_id || restaurant.name || index}
                    restaurant={restaurant}
                    mealType="breakfast"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Lunch column */}
          {lunchRestaurants.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">🥗</span>
                Lunch
              </h4>
              <div className="space-y-3">
                {lunchRestaurants.slice(0, 3).map((restaurant: any, index: number) => (
                  <CompactRestaurantCard
                    key={restaurant.place_id || restaurant.name || index}
                    restaurant={restaurant}
                    mealType="lunch"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Dinner column */}
          {dinnerRestaurants.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="text-lg">🍽️</span>
                Dinner
              </h4>
              <div className="space-y-3">
                {dinnerRestaurants.slice(0, 3).map((restaurant: any, index: number) => (
                  <CompactRestaurantCard
                    key={restaurant.place_id || restaurant.name || index}
                    restaurant={restaurant}
                    mealType="dinner"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Accommodation section component
  const AccommodationSection = () => {
    if (!accommodation || !day.overnight) return null;

    // Extract photo URL
    const photo = accommodation.photos?.[0];
    const photoUrl = typeof photo === 'string' ? photo :
      photo?.url || accommodation.primaryPhoto?.url || accommodation.primaryPhoto || null;

    // Google Maps link
    const getGoogleMapsLink = () => {
      if (accommodation.place_id) {
        return `https://www.google.com/maps/place/?q=place_id:${accommodation.place_id}`;
      } else if (accommodation.coordinates?.lat && accommodation.coordinates?.lng) {
        return `https://www.google.com/maps/search/?api=1&query=${accommodation.coordinates.lat},${accommodation.coordinates.lng}`;
      } else if (accommodation.name) {
        return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(accommodation.name)}`;
      }
      return null;
    };

    const mapsLink = getGoogleMapsLink();

    return (
      <div className="mb-8 bg-purple-50 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Hotel className="w-6 h-6 text-purple-600" />
          <h3 className="text-xl font-bold text-gray-900">
            Tonight's Accommodation
          </h3>
        </div>

        <div className="bg-white rounded-lg overflow-hidden border border-purple-200 max-w-md">
          {photoUrl && (
            <div className="h-48 w-full overflow-hidden bg-gray-100">
              <img
                src={photoUrl}
                alt={accommodation.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-4">
            <h4 className="font-bold text-lg text-gray-900 mb-2">
              {accommodation.name}
            </h4>

            {accommodation.address && (
              <p className="text-sm text-gray-600 mb-3">
                {accommodation.address}
              </p>
            )}

            {accommodation.rating && (
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <span className="font-semibold">⭐ {accommodation.rating.toFixed(1)}</span>
                {accommodation.ratingCount && (
                  <span>({accommodation.ratingCount} reviews)</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-2">
              {mapsLink && (
                <a
                  href={mapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  View on Map
                </a>
              )}

              {accommodation.website && (
                <a
                  href={accommodation.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Book Now
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg border-2 overflow-hidden mb-6"
      style={{ borderColor: theme.primary }}
    >
      {/* Day header */}
      <div
        className="px-6 py-4"
        style={{ backgroundColor: `${theme.primary}15` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl font-bold"
              style={{ backgroundColor: theme.primary }}
            >
              {day.day}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {day.title || `Day ${day.day}`}
              </h2>
              {day.date && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(day.date)}</span>
                </div>
              )}
              {day.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                  <MapPin className="w-4 h-4" />
                  <span>{day.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Day content */}
      <div className="p-6">
        {/* Morning section */}
        <TimePeriodSection
          icon="🌅"
          title="Morning"
          activities={morningActivities}
          cityName={day.location || 'City'}
        />

        {/* Afternoon section */}
        <TimePeriodSection
          icon="☀️"
          title="Afternoon"
          activities={afternoonWithFallback}
          cityName={day.location || 'City'}
        />

        {/* Evening section */}
        <TimePeriodSection
          icon="🌆"
          title="Evening"
          activities={eveningActivities}
          cityName={day.location || 'City'}
        />

        {/* Restaurants section */}
        <RestaurantSection />

        {/* Accommodation section */}
        <AccommodationSection />

        {/* Empty state if no activities */}
        {safeActivities.length === 0 && safeRestaurants.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>No activities or restaurants planned for this day yet.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}
