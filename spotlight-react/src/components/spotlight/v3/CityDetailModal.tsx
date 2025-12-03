import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  MapPin,
  Utensils,
  Moon,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Star,
  Calendar,
  Sun,
  Cloud,
  Thermometer,
} from 'lucide-react';
import { useSpotlightStoreV2, type Activity, type Restaurant } from '../../../stores/spotlightStoreV2';
import { Button, NightStepper, Badge } from '../../ui';
import { fetchCityImage } from '../../../services/cityImages';
import { WhyThisCard } from '../v2/WhyThisCard';

interface CityDetailModalProps {
  cityIndex: number | null;
  onClose: () => void;
}

const CityDetailModal = ({ cityIndex, onClose }: CityDetailModalProps) => {
  const { route, getCityName, updateCityNights, removeCity } = useSpotlightStoreV2();
  const [cityImage, setCityImage] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);

  const city = cityIndex !== null && route ? route.cities[cityIndex] : null;
  const cityName = city ? getCityName(city.city) : '';
  const country = city && typeof city.city === 'object' ? city.city.country : '';

  // Fetch city image
  useEffect(() => {
    if (!cityName) return;

    const loadImage = async () => {
      setImageLoading(true);
      const imageUrl = await fetchCityImage(cityName);
      setCityImage(imageUrl);
      setImageLoading(false);
    };
    loadImage();
  }, [cityName]);

  if (cityIndex === null || !city || !route) return null;

  const handleNightsChange = (nights: number) => {
    updateCityNights(cityName, nights);
  };

  const handleRemoveCity = () => {
    if (cityIndex !== null && route && route.cities.length > 2) {
      removeCity(cityIndex);
      onClose();
    }
  };

  const navigateToCity = (direction: 'prev' | 'next') => {
    const newIndex = direction === 'prev' ? cityIndex - 1 : cityIndex + 1;
    if (newIndex >= 0 && newIndex < route.cities.length) {
      // We need to update the selected city through a callback
      // This will be handled by passing through SpotlightV2
    }
  };

  // Generate mock weather data based on city name (in production, fetch from API)
  const weather = {
    temp: 22,
    condition: 'Sunny',
    high: 26,
    low: 18,
  };

  // Generate mock events based on city
  const events = city.events || [
    { name: 'Local Food Festival', date: 'Dec 5-7' },
    { name: 'Art Exhibition', date: 'Dec 1-15' },
  ];

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-rui-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-rui-24 shadow-rui-4 overflow-hidden flex flex-col"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors duration-rui-sm shadow-rui-2"
          >
            <X className="w-5 h-5 text-rui-black" />
          </button>

          {/* Navigation buttons */}
          {cityIndex > 0 && (
            <button
              onClick={() => navigateToCity('prev')}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors duration-rui-sm shadow-rui-2"
            >
              <ChevronLeft className="w-5 h-5 text-rui-black" />
            </button>
          )}
          {cityIndex < route.cities.length - 1 && (
            <button
              onClick={() => navigateToCity('next')}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors duration-rui-sm shadow-rui-2"
            >
              <ChevronRight className="w-5 h-5 text-rui-black" />
            </button>
          )}

          {/* Hero Image */}
          <div className="relative h-48 bg-rui-grey-5 flex-shrink-0">
            {imageLoading ? (
              <div className="absolute inset-0 bg-rui-grey-5 animate-pulse" />
            ) : cityImage ? (
              <img
                src={cityImage}
                alt={cityName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-rui-grey-5 to-rui-grey-10" />
            )}

            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* City number badge */}
            <div className="absolute top-4 left-4 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-rui-2">
              <span className="text-emphasis-1 text-rui-black">{cityIndex + 1}</span>
            </div>

            {/* City name on image */}
            <div className="absolute bottom-4 left-4 right-4">
              <h2 className="text-display-3 text-white mb-1">{cityName}</h2>
              {country && (
                <p className="text-body-2 text-white/80">{country}</p>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-rui-grey-2 rounded-rui-16 p-4 text-center">
                  <Moon className="w-5 h-5 text-rui-grey-50 mx-auto mb-2" />
                  <p className="text-display-3 text-rui-black">{city.nights || 0}</p>
                  <p className="text-body-3 text-rui-grey-50">nights</p>
                </div>
                <div className="bg-rui-grey-2 rounded-rui-16 p-4 text-center">
                  <MapPin className="w-5 h-5 text-rui-grey-50 mx-auto mb-2" />
                  <p className="text-display-3 text-rui-black">{city.activities?.length || 0}</p>
                  <p className="text-body-3 text-rui-grey-50">activities</p>
                </div>
                <div className="bg-rui-grey-2 rounded-rui-16 p-4 text-center">
                  <Utensils className="w-5 h-5 text-rui-grey-50 mx-auto mb-2" />
                  <p className="text-display-3 text-rui-black">{city.restaurants?.length || 0}</p>
                  <p className="text-body-3 text-rui-grey-50">restaurants</p>
                </div>
              </div>

              {/* Night Allocation */}
              <div className="bg-rui-grey-2 rounded-rui-16 p-5 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-emphasis-1 text-rui-black mb-1">Nights in {cityName}</h3>
                    <p className="text-body-3 text-rui-grey-50">Adjust how long you'll stay</p>
                  </div>
                  <NightStepper
                    value={city.nights || 0}
                    onChange={handleNightsChange}
                    min={0}
                    max={14}
                  />
                </div>
              </div>

              {/* Weather Section */}
              <div className="mb-6">
                <h3 className="text-emphasis-1 text-rui-black mb-4 flex items-center gap-2">
                  <Sun className="w-5 h-5 text-rui-grey-50" />
                  Weather
                </h3>
                <div className="bg-rui-grey-2 rounded-rui-16 p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-white rounded-rui-12 flex items-center justify-center shadow-rui-1">
                        {weather.condition === 'Sunny' ? (
                          <Sun className="w-8 h-8 text-yellow-500" />
                        ) : (
                          <Cloud className="w-8 h-8 text-rui-grey-50" />
                        )}
                      </div>
                      <div>
                        <p className="text-display-3 text-rui-black">{weather.temp}°C</p>
                        <p className="text-body-3 text-rui-grey-50">{weather.condition}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2 text-body-3 text-rui-grey-50">
                        <Thermometer className="w-4 h-4" />
                        <span>H: {weather.high}° L: {weather.low}°</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Activities Section */}
              {city.activities && city.activities.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-emphasis-1 text-rui-black mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-rui-grey-50" />
                    Top Activities
                  </h3>
                  <div className="space-y-3">
                    {city.activities.slice(0, 5).map((activity: Activity, index: number) => (
                      <div
                        key={index}
                        className="bg-rui-grey-2 rounded-rui-12 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-emphasis-2 text-rui-black">{activity.name || String(activity)}</p>
                            {activity.description && (
                              <p className="text-body-3 text-rui-grey-50 mt-1 line-clamp-2">
                                {activity.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {activity.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-emphasis-3 text-rui-black">{activity.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* WhyThisCard inline - shows when activity has match reasons */}
                        {activity.matchReasons && activity.matchReasons.length > 0 && (
                          <div className="mt-3">
                            <WhyThisCard
                              matchReasons={activity.matchReasons}
                              matchScore={activity.matchScore}
                              placeName={activity.name || 'this place'}
                              variant="inline"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Restaurants Section */}
              {city.restaurants && city.restaurants.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-emphasis-1 text-rui-black mb-4 flex items-center gap-2">
                    <Utensils className="w-5 h-5 text-rui-grey-50" />
                    Recommended Restaurants
                  </h3>
                  <div className="space-y-3">
                    {city.restaurants.slice(0, 5).map((restaurant: Restaurant, index: number) => (
                      <div
                        key={index}
                        className="bg-rui-grey-2 rounded-rui-12 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-emphasis-2 text-rui-black">{restaurant.name || String(restaurant)}</p>
                            {restaurant.cuisine && (
                              <p className="text-body-3 text-rui-grey-50 mt-1">{restaurant.cuisine}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {restaurant.rating && (
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                <span className="text-emphasis-3 text-rui-black">{restaurant.rating}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {/* WhyThisCard inline - shows when restaurant has match reasons */}
                        {restaurant.matchReasons && restaurant.matchReasons.length > 0 && (
                          <div className="mt-3">
                            <WhyThisCard
                              matchReasons={restaurant.matchReasons}
                              matchScore={restaurant.matchScore}
                              placeName={restaurant.name || 'this restaurant'}
                              variant="inline"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Local Events */}
              {events.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-emphasis-1 text-rui-black mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-rui-grey-50" />
                    Events During Your Visit
                  </h3>
                  <div className="space-y-3">
                    {events.map((event: any, index: number) => (
                      <div
                        key={index}
                        className="bg-rui-grey-2 rounded-rui-12 p-4 flex items-center justify-between"
                      >
                        <div>
                          <p className="text-emphasis-2 text-rui-black">{event.name}</p>
                          <p className="text-body-3 text-rui-grey-50 mt-1">{event.date}</p>
                        </div>
                        <Badge variant="secondary" size="sm">Event</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 p-6 bg-rui-grey-2 border-t border-rui-grey-10">
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={onClose}
              >
                Done
              </Button>
              {cityIndex > 0 && cityIndex < route.cities.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveCity}
                  className="text-danger hover:bg-danger/10"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export { CityDetailModal };
export type { CityDetailModalProps };
