import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Gem, Moon, Plus, ChevronRight, ChevronDown, Sparkles } from 'lucide-react';
import type { DiscoveryCity } from '../../stores/discoveryStore';
import { useDiscoveryStore } from '../../stores/discoveryStore';
import { PlaceCard } from './PlaceCard';
import { HotelBookingCard } from '../booking';

interface DiscoveryCityPreviewProps {
  city: DiscoveryCity | null;
  onClose: () => void;
  onToggleSelection: () => void;
}

/** Number of places to show initially before "See all" */
const INITIAL_PLACES_COUNT = 4;

/**
 * DiscoveryCityPreview
 *
 * Modal that shows when a city is tapped on the map.
 * Displays city details, top places, and allows adding/removing from trip.
 *
 * Features:
 * - City header with image and essential stats
 * - Top 4-5 places with photos, ratings, hidden gem badges
 * - Expandable "See all" section for full place list
 * - Favourite individual places
 * - Add to trip / Remove from trip toggle
 */
export function DiscoveryCityPreview({
  city,
  onClose,
  onToggleSelection,
}: DiscoveryCityPreviewProps) {
  const [showAllPlaces, setShowAllPlaces] = useState(false);

  // Get favourites state from store
  const { isPlaceFavourited, togglePlaceFavourite } = useDiscoveryStore();

  if (!city) return null;

  const isInTrip = city.isSelected;
  const isFixed = city.isFixed;

  // Places to display
  const allPlaces = city.places || [];
  const hasMorePlaces = allPlaces.length > INITIAL_PLACES_COUNT;
  const visiblePlaces = showAllPlaces
    ? allPlaces
    : allPlaces.slice(0, INITIAL_PLACES_COUNT);
  const hiddenGemsCount = allPlaces.filter((p) => p.isHiddenGem).length;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="
          fixed bottom-0 left-0 right-0
          md:bottom-auto md:top-1/2 md:left-1/2
          md:-translate-x-1/2 md:-translate-y-1/2
          md:max-w-lg md:w-full md:mx-4
          z-50
          max-h-[90vh] md:max-h-[85vh]
        "
      >
        <div
          className="
            bg-white rounded-t-3xl md:rounded-3xl
            shadow-2xl shadow-black/20
            overflow-hidden
            flex flex-col
            max-h-[90vh] md:max-h-[85vh]
          "
        >
          {/* Header image */}
          <div
            className="
              relative h-40 md:h-48
              bg-gradient-to-br from-rui-sage/30 to-rui-golden/30
              flex-shrink-0
            "
          >
            {/* Background image or placeholder pattern */}
            {city.imageUrl ? (
              <img
                src={city.imageUrl}
                alt={city.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
            )}

            {/* City type badge */}
            <div
              className={`
                absolute top-4 left-4
                px-3 py-1.5 rounded-full
                text-body-3 font-semibold
                backdrop-blur-sm
                ${isFixed
                  ? 'bg-rui-accent text-white'
                  : 'bg-white/90 text-rui-black'
                }
              `}
            >
              {isFixed
                ? city.id === 'origin'
                  ? 'Starting Point'
                  : 'Destination'
                : 'Suggested Stop'}
            </div>

            {/* Close button */}
            <button
              onClick={onClose}
              className="
                absolute top-4 right-4
                w-10 h-10 rounded-full
                bg-black/20 backdrop-blur-sm
                hover:bg-black/30
                flex items-center justify-center
                text-white
                transition-colors duration-200
              "
            >
              <X className="w-5 h-5" />
            </button>

            {/* City name overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
              <h2 className="font-display text-2xl font-semibold text-white">
                {city.name}
              </h2>
              <p className="text-white/80 text-body-2">{city.country}</p>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="p-5">
              {/* Description */}
              {city.description && (
                <p className="text-body-1 text-rui-grey-60 mb-4 leading-relaxed">
                  {city.description}
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 mb-6">
                {/* Place count */}
                {city.placeCount && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rui-golden/10 flex items-center justify-center">
                      <Gem className="w-4 h-4 text-rui-golden" />
                    </div>
                    <div>
                      <p className="text-body-2 font-semibold text-rui-black">
                        {city.placeCount}
                      </p>
                      <p className="text-body-3 text-rui-grey-50">places</p>
                    </div>
                  </div>
                )}

                {/* Nights */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-rui-accent/10 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-rui-accent" />
                  </div>
                  <div>
                    <p className="text-body-2 font-semibold text-rui-black">
                      {city.nights ?? city.suggestedNights ?? 1}
                    </p>
                    <p className="text-body-3 text-rui-grey-50">
                      {(city.nights ?? city.suggestedNights ?? 1) === 1 ? 'night' : 'nights'}
                    </p>
                  </div>
                </div>

                {/* Distance from route */}
                {city.distanceFromRoute !== undefined && city.distanceFromRoute > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-rui-sage/10 flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-rui-sage" />
                    </div>
                    <div>
                      <p className="text-body-2 font-semibold text-rui-black">
                        {city.distanceFromRoute}km
                      </p>
                      <p className="text-body-3 text-rui-grey-50">detour</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Places section */}
              {allPlaces.length > 0 && (
                <div className="mb-6">
                  {/* Section header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-display text-body-1 font-semibold text-rui-black">
                        Top Places
                      </h3>
                      {hiddenGemsCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rui-golden/10 text-rui-golden text-body-3 font-medium">
                          <Sparkles className="w-3 h-3" />
                          {hiddenGemsCount} hidden {hiddenGemsCount === 1 ? 'gem' : 'gems'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Places list */}
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {visiblePlaces.map((place, index) => (
                        <PlaceCard
                          key={place.id}
                          place={place}
                          isFavourited={isPlaceFavourited(place.id)}
                          onToggleFavourite={() => togglePlaceFavourite(place.id)}
                          delay={index * 0.05}
                          cityName={city.name}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* See all / Show less button */}
                  {hasMorePlaces && (
                    <motion.button
                      onClick={() => setShowAllPlaces(!showAllPlaces)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      className="
                        w-full mt-3 py-3 px-4
                        flex items-center justify-center gap-2
                        rounded-xl border border-rui-grey-15
                        text-body-2 font-medium text-rui-grey-60
                        hover:bg-rui-grey-5 hover:border-rui-grey-20
                        transition-colors duration-200
                      "
                    >
                      <span>
                        {showAllPlaces
                          ? 'Show less'
                          : `See all ${allPlaces.length} places`}
                      </span>
                      <motion.div
                        animate={{ rotate: showAllPlaces ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4" />
                      </motion.div>
                    </motion.button>
                  )}
                </div>
              )}

              {/* Empty state for places */}
              {allPlaces.length === 0 && city.placeCount && city.placeCount > 0 && (
                <div className="mb-6 p-4 rounded-xl bg-rui-grey-5 text-center">
                  <Gem className="w-8 h-8 text-rui-golden/40 mx-auto mb-2" />
                  <p className="text-body-2 text-rui-grey-50">
                    {city.placeCount} places to discover
                  </p>
                  <p className="text-body-3 text-rui-grey-40 mt-1">
                    Add this city to explore hidden gems
                  </p>
                </div>
              )}

              {/* Hotel Booking Section */}
              {isInTrip && (city.nights ?? city.suggestedNights ?? 0) > 0 && (
                <HotelBookingCard
                  cityName={city.name}
                  country={city.country}
                  nights={city.nights ?? city.suggestedNights ?? 1}
                  guests={2}
                  sourceContext={{
                    type: 'city_preview',
                    cityId: city.id,
                  }}
                  variant="default"
                  dismissible
                  className="mb-4"
                />
              )}
            </div>
          </div>

          {/* Action buttons - sticky at bottom */}
          <div className="flex-shrink-0 p-5 pt-3 border-t border-rui-grey-10 bg-white">
            <div className="flex gap-3">
              {/* Add/Remove button */}
              {!isFixed && (
                <motion.button
                  onClick={onToggleSelection}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    flex-1 flex items-center justify-center gap-2
                    py-4 rounded-2xl
                    font-display font-semibold
                    transition-colors duration-200
                    ${isInTrip
                      ? 'bg-rui-grey-10 text-rui-grey-60 hover:bg-danger/10 hover:text-danger'
                      : 'bg-rui-accent text-white shadow-lg shadow-rui-accent/25'
                    }
                  `}
                >
                  {isInTrip ? (
                    <>
                      <X className="w-5 h-5" />
                      <span>Remove from trip</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Add to trip</span>
                    </>
                  )}
                </motion.button>
              )}

              {/* Explore button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  ${isFixed ? 'flex-1' : 'w-14'}
                  flex items-center justify-center gap-2
                  py-4 rounded-2xl
                  bg-rui-grey-5 text-rui-black
                  font-display font-semibold
                  hover:bg-rui-grey-10
                  transition-colors duration-200
                `}
              >
                {isFixed ? (
                  <>
                    <span>Explore places</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                ) : (
                  <ChevronRight className="w-5 h-5" />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
