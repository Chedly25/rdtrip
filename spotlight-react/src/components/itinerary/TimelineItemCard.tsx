/**
 * TimelineItemCard
 *
 * WI-11.3: Enhanced with card animation system
 *
 * Expandable timeline entry for itineraries.
 * Premium editorial feel with smooth animations.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  Star,
  Clock,
  MapPin,
  Globe,
  Phone,
  Utensils,
  Hotel,
  Landmark,
  Image as ImageIcon
} from 'lucide-react';
import { PhotoLightbox } from './PhotoLightbox';
import { EASING, DURATION } from '../transitions';

interface TimelineItemCardProps {
  type: 'activity' | 'restaurant' | 'accommodation' | 'drive';
  time?: string;
  item: any;
  color?: string;
  density?: 'compact' | 'comfortable' | 'spacious';
  /** Animation stagger index */
  index?: number;
}

export function TimelineItemCard({
  type,
  time,
  item,
  color = '#C45830', // RUI accent
  density = 'compact',
  index = 0
}: TimelineItemCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'activity':
        return <Landmark className="h-5 w-5" />;
      case 'restaurant':
        return <Utensils className="h-5 w-5" />;
      case 'accommodation':
        return <Hotel className="h-5 w-5" />;
      case 'drive':
        return <MapPin className="h-5 w-5" />;
      default:
        return <MapPin className="h-5 w-5" />;
    }
  };

  // Get price display
  const getPriceDisplay = () => {
    if (item.priceLevel) {
      return '€'.repeat(item.priceLevel);
    }
    if (item.priceRange) {
      return item.priceRange;
    }
    if (item.estimatedCost) {
      return `€${item.estimatedCost}`;
    }
    if (item.cost) {
      return item.cost;
    }
    return null;
  };

  // Get duration display
  const getDuration = () => {
    if (item.estimatedDuration) return item.estimatedDuration;
    if (item.duration) return item.duration;
    return null;
  };

  // Get status badge
  const getStatusBadge = () => {
    if (item.isOpenNow === true) {
      return <span className="text-xs text-green-600 font-medium">Open now</span>;
    }
    if (item.isOpenNow === false) {
      return <span className="text-xs text-red-600 font-medium">Closed</span>;
    }
    return null;
  };

  // Get thumbnail
  const getThumbnail = () => {
    if (item.photos && item.photos.length > 0) {
      const photo = item.photos[0];
      // Handle both string URLs and photo objects
      return typeof photo === 'string' ? photo : photo?.url || photo?.thumbnail || null;
    }
    if (item.primaryPhoto) {
      return typeof item.primaryPhoto === 'string' ? item.primaryPhoto : item.primaryPhoto?.url;
    }
    if (item.imageUrl) {
      return item.imageUrl;
    }
    if (item.image) {
      return item.image;
    }
    return null;
  };

  const thumbnail = getThumbnail();
  const price = getPriceDisplay();
  const duration = getDuration();
  const rating = item.rating;
  const ratingCount = item.ratingCount || item.user_ratings_total;

  // Density-based sizing
  const densityStyles = {
    compact: {
      padding: 'p-3',
      iconSize: 'w-8 h-8',
      thumbSize: 'w-12 h-12',
      fontSize: 'text-sm',
      gap: 'gap-2'
    },
    comfortable: {
      padding: 'p-4',
      iconSize: 'w-10 h-10',
      thumbSize: 'w-16 h-16',
      fontSize: 'text-base',
      gap: 'gap-4'
    },
    spacious: {
      padding: 'p-6',
      iconSize: 'w-12 h-12',
      thumbSize: 'w-20 h-20',
      fontSize: 'text-lg',
      gap: 'gap-6'
    }
  };

  const styles = densityStyles[density];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: DURATION.normal,
        ease: EASING.smooth,
        delay: index * 0.05,
      }}
      whileHover={{
        y: -2,
        boxShadow: '0 8px 24px -8px rgba(0, 0, 0, 0.1)',
      }}
      className="bg-rui-white rounded-rui-16 border border-rui-grey-10 overflow-hidden shadow-rui-1 transition-colors duration-rui-sm"
    >
      {/* Collapsed State */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full ${styles.padding} flex items-center ${styles.gap} text-left hover:bg-rui-grey-5 transition-colors duration-rui-sm`}
      >
        {/* Time Marker */}
        {time && (
          <div className="flex-shrink-0 w-16 text-sm font-medium text-gray-600">
            {time}
          </div>
        )}

        {/* Icon with color */}
        <div
          className={`flex-shrink-0 ${styles.iconSize} rounded-lg flex items-center justify-center text-white`}
          style={{ backgroundColor: color }}
        >
          {getIcon()}
        </div>

        {/* Thumbnail (optional) */}
        {thumbnail && (
          <div className={`flex-shrink-0 ${styles.thumbSize} rounded-md overflow-hidden bg-gray-100`}>
            <img
              src={thumbnail}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900 truncate">{item.name}</h4>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                {duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {duration}
                  </span>
                )}
                {item.cuisine && (
                  <span>{item.cuisine}</span>
                )}
                {item.type && (
                  <span className="capitalize">{item.type}</span>
                )}
                {getStatusBadge()}
              </div>
            </div>

            {/* Rating & Price */}
            <div className="flex-shrink-0 flex items-center gap-3 text-sm">
              {rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{rating}</span>
                  {ratingCount && (
                    <span className="text-gray-400 text-xs">({ratingCount})</span>
                  )}
                </div>
              )}
              {price && (
                <span className="font-medium text-gray-700">{price}</span>
              )}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: DURATION.fast, ease: EASING.quick }}
              >
                <ChevronDown className="h-5 w-5 text-rui-grey-40" />
              </motion.div>
            </div>
          </div>
        </div>
      </button>

      {/* Expanded State */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: DURATION.slow, ease: EASING.smooth }}
            className="border-t border-rui-grey-10"
          >
            <div className="p-4 space-y-4">
              {/* Photo Gallery - Clickable to open lightbox */}
              {item.photos && item.photos.length > 0 && (
                <div>
                  <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {item.photos.slice(0, 5).map((photo: any, index: number) => {
                      const photoUrl = typeof photo === 'string' ? photo : photo?.url || photo?.thumbnail;
                      if (!photoUrl) return null;
                      return (
                        <button
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxIndex(index);
                            setLightboxOpen(true);
                          }}
                          className="relative group h-32 w-48 flex-shrink-0 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
                        >
                          <img
                            src={photoUrl}
                            alt={`${item.name} ${index + 1}`}
                            className="h-full w-full object-cover"
                          />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity flex items-center justify-center">
                          <ImageIcon className="h-8 w-8 text-white" />
                        </div>
                      </button>
                    );
                    })}
                  </div>
                  {item.photos.length > 5 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(0);
                        setLightboxOpen(true);
                      }}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      View all {item.photos.length} photos
                    </button>
                  )}
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {item.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{item.address}</span>
                  </div>
                )}

                {item.openingHours && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">
                      {item.openingHours.weekday_text?.[0] || 'See website for hours'}
                    </span>
                  </div>
                )}

                {item.website && (
                  <div className="flex items-start gap-2">
                    <Globe className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <a
                      href={item.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate"
                    >
                      Visit website
                    </a>
                  </div>
                )}

                {item.phone && (
                  <div className="flex items-start gap-2">
                    <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-600">{item.phone}</span>
                  </div>
                )}
              </div>

              {/* Top Review or Highlight */}
              {(item.topReview || item.reviewHighlight || item.whyVisit) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-sm text-gray-700 italic">
                    "{item.topReview || item.reviewHighlight || item.whyVisit}"
                  </p>
                </div>
              )}

              {/* Tips */}
              {item.tips && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-gray-700">
                    💡 <span className="font-medium">Tip:</span> {item.tips}
                  </p>
                </div>
              )}

              {/* Amenities (for accommodations) */}
              {item.amenities && item.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.amenities.map((amenity: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                {item.website && (
                  <motion.a
                    href={item.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-2 bg-rui-accent text-white text-body-2 font-medium rounded-rui-12 hover:bg-rui-accent/90 transition-colors duration-rui-sm text-center"
                  >
                    Visit Website
                  </motion.a>
                )}
                {item.place_id && (
                  <motion.a
                    href={`https://www.google.com/maps/place/?q=place_id:${item.place_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 px-4 py-2 border border-rui-grey-20 text-rui-grey-70 text-body-2 font-medium rounded-rui-12 hover:bg-rui-grey-5 transition-colors duration-rui-sm text-center"
                  >
                    View on Map
                  </motion.a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Lightbox */}
      {item.photos && item.photos.length > 0 && (
        <PhotoLightbox
          photos={item.photos.map((p: any) => typeof p === 'string' ? p : p?.url || p?.thumbnail || '')}
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          initialIndex={lightboxIndex}
        />
      )}
    </motion.div>
  );
}
