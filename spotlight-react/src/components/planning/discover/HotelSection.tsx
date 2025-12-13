/**
 * HotelSection
 *
 * Special browse section for hotel selection.
 * Key differences from other categories:
 * - One hotel per city (typically)
 * - Shows optimal location recommendation based on planned activities
 * - Larger cards with amenity highlights
 *
 * Design: Luxury travel magazine - refined, aspirational, sanctuary-feel
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bed,
  MapPin,
  Star,
  Check,
  Sparkles,
  Navigation,
  Wifi,
  Coffee,
  Dumbbell,
  Waves,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { PriceBadge } from '../shared/PriceBadge';
import type { PlanCard, Cluster, LatLng, PriceLevel } from '../../../types/planning';

// Calculate walking minutes between two points
function calculateWalkingMinutes(from: LatLng, to: LatLng): number {
  if (!from?.lat || !to?.lat) return Infinity;

  const R = 6371;
  const dLat = ((to.lat - from.lat) * Math.PI) / 180;
  const dLng = ((to.lng - from.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.lat * Math.PI) / 180) *
      Math.cos((to.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distanceKm = R * c;

  return Math.round((distanceKm / 5) * 1.2 * 60);
}

// Calculate optimal hotel area based on activity clusters
function calculateOptimalArea(clusters: Cluster[]): LatLng | null {
  if (clusters.length === 0) return null;

  let totalWeight = 0;
  let weightedLat = 0;
  let weightedLng = 0;

  for (const cluster of clusters) {
    if (!cluster.center?.lat) continue;
    const weight = cluster.items.length + (cluster.totalDuration / 60);
    totalWeight += weight;
    weightedLat += cluster.center.lat * weight;
    weightedLng += cluster.center.lng * weight;
  }

  if (totalWeight === 0) return null;

  return {
    lat: weightedLat / totalWeight,
    lng: weightedLng / totalWeight,
  };
}

interface HotelCardProps {
  hotel: PlanCard;
  isSelected: boolean;
  isOptimalLocation: boolean;
  walkingToActivities?: number;
  onSelect: () => void;
  onRemove?: () => void;
}

function HotelCard({
  hotel,
  isSelected,
  isOptimalLocation,
  walkingToActivities,
  onSelect,
  onRemove,
}: HotelCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const hasImage = hotel.imageUrl && !imageError;

  // Mock amenities based on tags
  const amenities = useMemo(() => {
    const icons = [
      { icon: Wifi, label: 'WiFi' },
      { icon: Coffee, label: 'Breakfast' },
    ];
    if (hotel.tags?.includes('luxury') || hotel.priceLevel >= 3) {
      icons.push({ icon: Waves, label: 'Pool' });
      icons.push({ icon: Dumbbell, label: 'Gym' });
    }
    return icons.slice(0, 4);
  }, [hotel]);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }}
      className={`
        relative bg-[#FFFBF5] rounded-2xl overflow-hidden
        border-2 transition-all duration-300
        ${isSelected
          ? 'border-[#5C6B7A] shadow-xl shadow-[#5C6B7A]/20'
          : 'border-[#E5DDD0] shadow-lg shadow-[#2C2417]/5 hover:border-[#5C6B7A]/40'
        }
      `}
    >
      {/* Optimal location badge */}
      {isOptimalLocation && !isSelected && (
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-3 left-3 z-20"
        >
          <span className="
            inline-flex items-center gap-1.5 px-3 py-1.5
            bg-gradient-to-r from-[#4A7C59] to-[#5C8A6A]
            text-white text-xs font-semibold
            rounded-full shadow-lg
          ">
            <Sparkles className="w-3.5 h-3.5" />
            Best Location
          </span>
        </motion.div>
      )}

      {/* Selected badge */}
      {isSelected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-3 right-3 z-20"
        >
          <span className="
            inline-flex items-center gap-1.5 px-3 py-1.5
            bg-[#5C6B7A] text-white text-xs font-semibold
            rounded-full shadow-lg
          ">
            <Check className="w-3.5 h-3.5" strokeWidth={3} />
            Selected
          </span>
        </motion.div>
      )}

      {/* Image - 16:9 aspect ratio for hotels */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-[#F5F0E8]">
        {!imageLoaded && hasImage && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#F5F0E8] via-[#EDE5D8] to-[#F5F0E8] animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <Bed className="w-12 h-12 text-[#5C6B7A]/20" strokeWidth={1} />
            </div>
          </div>
        )}

        {hasImage ? (
          <img
            src={hotel.imageUrl}
            alt={hotel.name}
            className={`
              absolute inset-0 w-full h-full object-cover
              transition-all duration-500
              ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            `}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#5C6B7A]/10 to-[#F5F0E8] flex items-center justify-center">
            <Bed className="w-16 h-16 text-[#5C6B7A]/30" strokeWidth={1} />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C2417]/40 via-transparent to-transparent" />

        {/* Rating badge */}
        {hotel.rating && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 bg-white/90 backdrop-blur-sm rounded-lg">
            <Star className="w-3.5 h-3.5 text-[#D4A853] fill-[#D4A853]" />
            <span className="text-sm font-semibold text-[#2C2417]">{hotel.rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        {/* Name and price */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-['Fraunces',Georgia,serif] font-semibold text-xl text-[#2C2417] leading-tight line-clamp-1">
              {hotel.name}
            </h3>
            <p className="mt-1 text-sm text-[#8B7355] flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="line-clamp-1">{hotel.location?.area || 'City Center'}</span>
            </p>
          </div>
          <PriceBadge level={hotel.priceLevel as PriceLevel} />
        </div>

        {/* Description */}
        <p className="text-sm text-[#8B7355] leading-relaxed line-clamp-2 font-['Satoshi',system-ui,sans-serif]">
          {hotel.description}
        </p>

        {/* Distance to activities */}
        {walkingToActivities !== undefined && walkingToActivities < 60 && (
          <div className="flex items-center gap-2 py-2 px-3 bg-[#F0F7F4] rounded-lg">
            <Navigation className="w-4 h-4 text-[#4A7C59]" />
            <span className="text-sm text-[#4A7C59] font-medium">
              {walkingToActivities} min walk to your activities
            </span>
          </div>
        )}

        {/* Amenities */}
        <div className="flex items-center gap-3 pt-2 border-t border-[#E5DDD0]">
          {amenities.map(({ icon: Icon, label }, index) => (
            <div key={index} className="flex items-center gap-1 text-xs text-[#8B7355]">
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Action button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={isSelected ? onRemove : onSelect}
          className={`
            w-full py-3.5 rounded-xl
            font-['Satoshi',system-ui,sans-serif] font-semibold text-sm
            flex items-center justify-center gap-2
            transition-all duration-200
            ${isSelected
              ? 'bg-[#FEF3EE] border border-[#C45830]/30 text-[#C45830] hover:bg-[#FDEAE3]'
              : 'bg-[#5C6B7A] text-white shadow-md hover:bg-[#4A5866] hover:shadow-lg'
            }
          `}
        >
          {isSelected ? (
            <>
              <X className="w-4 h-4" />
              Remove Selection
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Select This Hotel
            </>
          )}
        </motion.button>
      </div>
    </motion.article>
  );
}

interface HotelSectionProps {
  hotels: PlanCard[];
  selectedHotel: PlanCard | null;
  clusters: Cluster[];
  isLoading: boolean;
  onSelectHotel: (hotel: PlanCard) => void;
  onRemoveHotel: () => void;
  onGenerateMore: () => void;
}

export function HotelSection({
  hotels,
  selectedHotel,
  clusters,
  isLoading,
  onSelectHotel,
  onRemoveHotel,
  onGenerateMore,
}: HotelSectionProps) {
  // Calculate optimal location based on activity clusters
  const optimalLocation = useMemo(() => calculateOptimalArea(clusters), [clusters]);

  // Get recommendation text
  const recommendationText = useMemo(() => {
    if (clusters.length === 0) {
      return "Add some activities first, and we'll recommend the best area to stay!";
    }
    const mainCluster = clusters.reduce((max, c) =>
      c.items.length > max.items.length ? c : max, clusters[0]);
    return `Based on your activities, we recommend staying near ${mainCluster.name}`;
  }, [clusters]);

  // Check if a hotel is in the optimal location (within 15 min walk)
  const isOptimalLocation = (hotel: PlanCard): boolean => {
    if (!optimalLocation || !hotel.location) return false;
    return calculateWalkingMinutes(hotel.location, optimalLocation) <= 15;
  };

  // Calculate walking time to activities centroid
  const getWalkingToActivities = (hotel: PlanCard): number | undefined => {
    if (!optimalLocation || !hotel.location) return undefined;
    return calculateWalkingMinutes(hotel.location, optimalLocation);
  };

  // Sort hotels: selected first, then optimal location, then by rating
  const sortedHotels = useMemo(() => {
    return [...hotels].sort((a, b) => {
      if (selectedHotel?.id === a.id) return -1;
      if (selectedHotel?.id === b.id) return 1;
      if (isOptimalLocation(a) && !isOptimalLocation(b)) return -1;
      if (!isOptimalLocation(a) && isOptimalLocation(b)) return 1;
      return (b.rating || 0) - (a.rating || 0);
    });
  }, [hotels, selectedHotel, optimalLocation]);

  return (
    <div className="space-y-6">
      {/* Selected hotel banner (if selected) */}
      <AnimatePresence>
        {selectedHotel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-gradient-to-r from-[#5C6B7A]/10 to-[#5C6B7A]/5 rounded-xl border border-[#5C6B7A]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#5C6B7A] flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" strokeWidth={3} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#2C2417]">
                    You're staying at {selectedHotel.name}
                  </p>
                  <p className="text-xs text-[#8B7355]">
                    {selectedHotel.location?.area || 'City Center'}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recommendation banner (only if not selected and has clusters) */}
      {!selectedHotel && clusters.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-r from-[#F0F7F4] to-[#EEF6F8] rounded-xl border border-[#4A7C59]/20"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#4A7C59] flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2C2417] mb-1">
                Our recommendation
              </p>
              <p className="text-sm text-[#4A7C59]">
                {recommendationText}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty state for no activities */}
      {!selectedHotel && clusters.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-8 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#F5F0E8] flex items-center justify-center">
            <MapPin className="w-8 h-8 text-[#8B7355]" />
          </div>
          <p className="text-sm text-[#8B7355] font-['Satoshi',system-ui,sans-serif] max-w-xs mx-auto">
            Add some activities first! We'll then recommend the best neighborhood for your hotel.
          </p>
        </motion.div>
      )}

      {/* Hotels grid */}
      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence mode="popLayout">
          {sortedHotels.map((hotel) => (
            <HotelCard
              key={hotel.id}
              hotel={hotel}
              isSelected={selectedHotel?.id === hotel.id}
              isOptimalLocation={isOptimalLocation(hotel)}
              walkingToActivities={getWalkingToActivities(hotel)}
              onSelect={() => onSelectHotel(hotel)}
              onRemove={onRemoveHotel}
            />
          ))}
        </AnimatePresence>

        {/* Loading skeletons */}
        {isLoading && hotels.length === 0 && (
          <>
            {[1, 2].map((i) => (
              <div
                key={i}
                className="bg-[#FFFBF5] rounded-2xl border border-[#E5DDD0] overflow-hidden animate-pulse"
              >
                <div className="w-full aspect-[16/9] bg-[#F5F0E8]" />
                <div className="p-5 space-y-4">
                  <div className="h-6 bg-[#F5F0E8] rounded-lg w-2/3" />
                  <div className="h-4 bg-[#F5F0E8] rounded w-full" />
                  <div className="h-12 bg-[#F5F0E8] rounded-xl" />
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Generate more button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onGenerateMore}
        disabled={isLoading}
        className={`
          w-full py-3.5 rounded-xl
          border border-dashed
          ${isLoading
            ? 'border-[#E5DDD0] bg-[#FAF7F2] cursor-wait'
            : 'border-[#5C6B7A]/40 hover:border-[#5C6B7A] hover:bg-[#5C6B7A]/5'
          }
          text-sm font-['Satoshi',system-ui,sans-serif] font-medium
          ${isLoading ? 'text-[#C4B8A5]' : 'text-[#5C6B7A] hover:text-[#4A5866]'}
          transition-all duration-200
          flex items-center justify-center gap-2
        `}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Finding hotels...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Show more hotel options
          </>
        )}
      </motion.button>
    </div>
  );
}

export default HotelSection;
