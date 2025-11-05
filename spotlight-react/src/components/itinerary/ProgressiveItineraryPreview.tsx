import { motion, AnimatePresence } from 'framer-motion';

// Type definitions for partial itinerary results
export interface PartialItinerary {
  activities?: Activity[];
  restaurants?: Restaurant[];
  accommodations?: Accommodation[];
  scenicStops?: ScenicStop[];
  weather?: WeatherInfo[];
  events?: Event[];
  practicalInfo?: PracticalInfo;
}

interface Activity {
  id: string;
  name: string;
  description?: string;
  rating?: number;
  photos?: Photo[];
  openingHours?: string;
  city?: string;
}

interface Restaurant {
  id: string;
  name: string;
  cuisine?: string;
  priceLevel?: number;
  rating?: number;
  photos?: Photo[];
  mealType?: string;
}

interface Accommodation {
  id: string;
  name: string;
  type?: string;
  rating?: number;
  priceLevel?: number;
  photos?: Photo[];
}

interface ScenicStop {
  id: string;
  name: string;
  description?: string;
  photos?: Photo[];
}

interface WeatherInfo {
  city: string;
  temperature?: number;
  condition?: string;
}

interface Event {
  id: string;
  name: string;
  date?: string;
  description?: string;
}

interface PracticalInfo {
  parkingInfo?: string;
  tips?: string[];
}

interface Photo {
  url: string;
  thumbnail?: string;
}

// Activity Preview Card
function ActivityPreviewCard({ activity }: { activity: Activity }) {
  const photo = activity.photos?.[0];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      {photo && (
        <div className="h-32 overflow-hidden bg-gray-200">
          <img
            src={photo.thumbnail || photo.url}
            alt={activity.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 truncate">{activity.name}</h4>
        <div className="flex items-center gap-2 mt-2">
          {activity.rating && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">⭐</span>
              <span className="text-sm text-gray-600">{activity.rating.toFixed(1)}</span>
            </div>
          )}
          {activity.city && (
            <span className="text-sm text-gray-500">• {activity.city}</span>
          )}
        </div>
        {activity.openingHours && (
          <p className="text-xs text-gray-500 mt-2">{activity.openingHours}</p>
        )}
      </div>
    </motion.div>
  );
}

// Restaurant Preview Card
function RestaurantPreviewCard({ restaurant }: { restaurant: Restaurant }) {
  const photo = restaurant.photos?.[0];
  const priceSymbol = restaurant.priceLevel ? '$'.repeat(restaurant.priceLevel) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      {photo && (
        <div className="h-32 overflow-hidden bg-gray-200">
          <img
            src={photo.thumbnail || photo.url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 truncate">{restaurant.name}</h4>
        <div className="flex items-center gap-2 mt-2">
          {restaurant.cuisine && (
            <span className="text-sm text-gray-600">{restaurant.cuisine}</span>
          )}
          {priceSymbol && (
            <span className="text-sm text-green-600 font-semibold">{priceSymbol}</span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {restaurant.rating && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-500">⭐</span>
              <span className="text-sm text-gray-600">{restaurant.rating.toFixed(1)}</span>
            </div>
          )}
          {restaurant.mealType && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
              {restaurant.mealType}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Accommodation Preview Card
function AccommodationPreviewCard({ accommodation }: { accommodation: Accommodation }) {
  const photo = accommodation.photos?.[0];
  const priceSymbol = accommodation.priceLevel ? '$'.repeat(accommodation.priceLevel) : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
    >
      {photo && (
        <div className="h-32 overflow-hidden bg-gray-200">
          <img
            src={photo.thumbnail || photo.url}
            alt={accommodation.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h4 className="font-semibold text-gray-900 truncate">{accommodation.name}</h4>
        <div className="flex items-center gap-2 mt-2">
          {accommodation.type && (
            <span className="text-sm text-gray-600">{accommodation.type}</span>
          )}
          {priceSymbol && (
            <span className="text-sm text-green-600 font-semibold">{priceSymbol}</span>
          )}
        </div>
        {accommodation.rating && (
          <div className="flex items-center gap-1 mt-2">
            <span className="text-yellow-500">⭐</span>
            <span className="text-sm text-gray-600">{accommodation.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// Main Progressive Preview Component
export function ProgressiveItineraryPreview({ results }: { results: PartialItinerary }) {
  const hasResults = Object.keys(results).length > 0;

  if (!hasResults) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <AnimatePresence mode="popLayout">
        {/* Activities Section */}
        {results.activities && results.activities.length > 0 && (
          <motion.div
            key="activities-section"
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.span
                className="text-3xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                🎯
              </motion.span>
              <h3 className="text-xl font-bold text-gray-900">Activities Discovered</h3>
              <motion.div
                className="ml-auto bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {results.activities.length} found
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.activities.slice(0, 3).map(activity => (
                <ActivityPreviewCard key={activity.id} activity={activity} />
              ))}
            </div>

            {results.activities.length > 3 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-600 mt-4 text-center"
              >
                +{results.activities.length - 3} more activities
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Restaurants Section */}
        {results.restaurants && results.restaurants.length > 0 && (
          <motion.div
            key="restaurants-section"
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.span
                className="text-3xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                🍽️
              </motion.span>
              <h3 className="text-xl font-bold text-gray-900">Restaurants Found</h3>
              <motion.div
                className="ml-auto bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {results.restaurants.length} found
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.restaurants.slice(0, 3).map(restaurant => (
                <RestaurantPreviewCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>

            {results.restaurants.length > 3 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-600 mt-4 text-center"
              >
                +{results.restaurants.length - 3} more restaurants
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Accommodations Section */}
        {results.accommodations && results.accommodations.length > 0 && (
          <motion.div
            key="accommodations-section"
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.span
                className="text-3xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                🏨
              </motion.span>
              <h3 className="text-xl font-bold text-gray-900">Accommodations Secured</h3>
              <motion.div
                className="ml-auto bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {results.accommodations.length} found
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.accommodations.slice(0, 3).map(accommodation => (
                <AccommodationPreviewCard key={accommodation.id} accommodation={accommodation} />
              ))}
            </div>

            {results.accommodations.length > 3 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-600 mt-4 text-center"
              >
                +{results.accommodations.length - 3} more options
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Scenic Stops Section */}
        {results.scenicStops && results.scenicStops.length > 0 && (
          <motion.div
            key="scenic-section"
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.span
                className="text-3xl"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
              >
                🏞️
              </motion.span>
              <h3 className="text-xl font-bold text-gray-900">Scenic Stops</h3>
              <motion.div
                className="ml-auto bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                {results.scenicStops.length} found
              </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {results.scenicStops.slice(0, 3).map(stop => (
                <ActivityPreviewCard key={stop.id} activity={stop} />
              ))}
            </div>

            {results.scenicStops.length > 3 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-gray-600 mt-4 text-center"
              >
                +{results.scenicStops.length - 3} more stops
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Quick info cards for weather, events, etc. */}
        <motion.div
          key="info-cards"
          layout
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {results.weather && results.weather.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-sky-50 to-blue-100 rounded-xl p-4 shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">☀️</span>
                <h4 className="font-semibold text-gray-900">Weather Info</h4>
              </div>
              <p className="text-sm text-gray-700">
                Weather data loaded for {results.weather.length} locations
              </p>
            </motion.div>
          )}

          {results.events && results.events.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-yellow-50 to-amber-100 rounded-xl p-4 shadow"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">🎉</span>
                <h4 className="font-semibold text-gray-900">Local Events</h4>
              </div>
              <p className="text-sm text-gray-700">
                {results.events.length} events discovered
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
