/**
 * HotelCard - Hotel Search Results Display
 *
 * WI-11.3: Updated with card animations
 *
 * Shows hotel options with ratings, prices, and booking links
 */

import { motion } from 'framer-motion';
import { Hotel, Star, MapPin, ExternalLink, DollarSign } from 'lucide-react';
import { AnimatedCard, EASING, DURATION } from '../transitions';

interface HotelData {
  name: string;
  address: string;
  rating: number;
  userRatingsTotal: number;
  priceLevel?: number;
  bookingLink: string;
  photoReference?: string;
}

interface HotelSearchData {
  success: boolean;
  city: string;
  priceLevel?: string;
  hotels: HotelData[];
  count: number;
  message?: string;
  error?: string;
}

interface HotelCardProps {
  data: HotelSearchData;
}

export function HotelCard({ data }: HotelCardProps) {
  if (!data.success) {
    return (
      <AnimatedCard entry="scaleUp" hover="none" className="max-w-2xl">
        <div className="bg-danger/5 border-2 border-danger/20 rounded-rui-24 p-rui-24">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-danger/10 rounded-full flex items-center justify-center">
              <Hotel className="w-5 h-5 text-danger" />
            </div>
            <div>
              <h3 className="text-heading-4 font-display text-rui-black">Hotel Search Failed</h3>
              <p className="text-body-2 text-danger">{data.error || 'Unknown error'}</p>
            </div>
          </div>
        </div>
      </AnimatedCard>
    );
  }

  const { city, priceLevel, hotels } = data;

  const getPriceLevelDisplay = (level?: number) => {
    if (!level) return 'Price not available';
    return '€'.repeat(level);
  };

  return (
    <AnimatedCard entry="slideUp" hover="none" className="max-w-3xl">
      <div className="bg-rui-white border-2 border-rui-grey-10 rounded-rui-24 p-rui-24 shadow-rui-1">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: DURATION.normal, ease: EASING.smooth }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-10 h-10 bg-warning/10 rounded-full flex items-center justify-center">
            <Hotel className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="text-heading-4 font-display text-rui-black">Hotels in {city}</h3>
            <p className="text-body-2 text-rui-grey-50">
              {hotels.length} {priceLevel ? `${priceLevel} ` : ''}option{hotels.length !== 1 ? 's' : ''} found
            </p>
          </div>
        </motion.div>

        {/* Hotel List */}
        <div className="space-y-4">
          {hotels.map((hotel, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.15 + index * 0.08,
                duration: DURATION.normal,
                ease: EASING.smooth,
              }}
              whileHover={{
                y: -2,
                boxShadow: '0 8px 24px -8px rgba(0, 0, 0, 0.1)',
              }}
              className="border border-rui-grey-10 rounded-rui-16 p-rui-16 hover:border-warning/40 hover:bg-warning/5 transition-colors duration-rui-sm"
            >
              {/* Hotel Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-display font-semibold text-rui-black mb-1">{hotel.name}</h4>
                  <div className="flex items-center gap-2 text-body-3 text-rui-grey-50">
                    <MapPin className="w-4 h-4" />
                    <span className="line-clamp-1">{hotel.address}</span>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-4 mb-3">
                {/* Rating */}
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-rui-golden fill-rui-golden" />
                  <span className="font-semibold text-rui-black">{hotel.rating.toFixed(1)}</span>
                  <span className="text-body-3 text-rui-grey-40">({hotel.userRatingsTotal})</span>
                </div>

                {/* Price Level */}
                {hotel.priceLevel && (
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4 text-rui-grey-40" />
                    <span className="text-body-2 font-medium text-rui-grey-60">
                      {getPriceLevelDisplay(hotel.priceLevel)}
                    </span>
                  </div>
                )}
              </div>

              {/* Booking Button */}
              <motion.a
                href={hotel.bookingLink}
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-warning text-white rounded-rui-12 font-medium hover:bg-warning/90 transition-colors duration-rui-sm"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="w-4 h-4" />
              </motion.a>
            </motion.div>
          ))}
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 + hotels.length * 0.08 }}
          className="mt-6 pt-4 border-t border-rui-grey-10"
        >
          <p className="text-body-3 text-rui-grey-40 text-center">
            Prices and availability may vary. Check with hotels directly for best rates.
          </p>
        </motion.div>
      </div>
    </AnimatedCard>
  );
}
