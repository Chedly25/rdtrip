/**
 * Travel Stamp Marker
 *
 * A luxurious, editorial-style city marker inspired by luggage tags
 * and passport stamps. Features:
 * - City photo with vintage border effect
 * - Numbered badge for route position
 * - Expandable info panel on hover/selection
 * - Elegant pin pointer
 *
 * Design language: warm, sophisticated, story-driven
 */

import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCityImageCached } from '../../../../../services/wikipedia';
import { MAP_COLORS, MARKER_STYLE } from '../mapConstants';

interface TravelStampMarkerProps {
  index: number;
  cityName: string;
  country?: string;
  nights: number;
  isSelected: boolean;
  isHovered: boolean;
  agentColors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const TravelStampMarker = memo(({
  index,
  cityName,
  country,
  nights,
  isSelected,
  isHovered,
  agentColors,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: TravelStampMarkerProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Fetch city image
  useEffect(() => {
    const loadImage = async () => {
      setImageLoaded(false);
      setImageError(false);
      const url = await fetchCityImageCached(cityName);
      setImageUrl(url);
    };
    loadImage();
  }, [cityName]);

  const isExpanded = isSelected || isHovered;

  // Animation variants
  const containerVariants = {
    collapsed: {
      width: MARKER_STYLE.city.collapsedSize,
      transition: {
        type: 'spring' as const,
        stiffness: MARKER_STYLE.animation.springStiffness,
        damping: MARKER_STYLE.animation.springDamping,
      },
    },
    expanded: {
      width: MARKER_STYLE.city.expandedWidth,
      transition: {
        type: 'spring' as const,
        stiffness: MARKER_STYLE.animation.springStiffness,
        damping: MARKER_STYLE.animation.springDamping,
      },
    },
  };

  const infoVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      marginTop: 0,
    },
    visible: {
      opacity: 1,
      height: 'auto',
      marginTop: 8,
      transition: {
        opacity: { delay: 0.1, duration: 0.2 },
        height: { duration: 0.3 },
      },
    },
  };

  return (
    <div
      className="flex flex-col items-center cursor-pointer"
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{ filter: `drop-shadow(0 4px 12px ${MAP_COLORS.markers.shadow})` }}
    >
      {/* Main stamp container */}
      <motion.div
        initial="collapsed"
        animate={isExpanded ? 'expanded' : 'collapsed'}
        variants={containerVariants}
        className="relative"
      >
        {/* Glow effect for selected state */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 0.5, scale: 1.3 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 rounded-2xl blur-xl pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${agentColors.accent}, transparent)`,
                zIndex: -1,
              }}
            />
          )}
        </AnimatePresence>

        {/* Stamp body */}
        <motion.div
          className="relative overflow-hidden"
          style={{
            backgroundColor: MAP_COLORS.markers.highlight,
            borderRadius: MARKER_STYLE.city.borderRadius,
            border: `${MARKER_STYLE.city.borderWidth}px solid ${MAP_COLORS.markers.border}`,
            boxShadow: `
              inset 0 0 0 1px rgba(196, 88, 48, 0.1),
              0 2px 8px ${MAP_COLORS.markers.shadow}
            `,
          }}
        >
          {/* Photo section */}
          <div
            className="relative overflow-hidden"
            style={{
              width: '100%',
              height: isExpanded ? 80 : MARKER_STYLE.city.collapsedSize - MARKER_STYLE.city.borderWidth * 2,
            }}
          >
            {/* Photo or placeholder */}
            {imageUrl && !imageError ? (
              <>
                {/* Skeleton while loading */}
                {!imageLoaded && (
                  <div
                    className="absolute inset-0 animate-pulse"
                    style={{ backgroundColor: MAP_COLORS.land.dark }}
                  />
                )}
                <img
                  src={imageUrl}
                  alt={cityName}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    filter: 'saturate(0.9) contrast(1.05)',
                    opacity: imageLoaded ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                  }}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </>
            ) : (
              /* Gradient placeholder with city initial */
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${agentColors.primary}, ${agentColors.secondary})`,
                }}
              >
                <span
                  className="text-white font-bold"
                  style={{
                    fontSize: isExpanded ? 28 : 20,
                    fontFamily: 'Playfair Display, Georgia, serif',
                  }}
                >
                  {cityName.charAt(0)}
                </span>
              </div>
            )}

            {/* Vintage border overlay */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 20px rgba(139, 115, 85, 0.25)',
              }}
            />

            {/* Number badge */}
            <div
              className="absolute top-2 right-2 flex items-center justify-center text-white font-bold text-xs"
              style={{
                width: MARKER_STYLE.city.numberBadgeSize,
                height: MARKER_STYLE.city.numberBadgeSize,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${MAP_COLORS.journey.routeStart}, ${MAP_COLORS.journey.routeEnd})`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
              }}
            >
              {index + 1}
            </div>
          </div>

          {/* Expandable info section */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="hidden"
                variants={infoVariants}
                className="px-3 pb-3"
              >
                {/* Decorative divider */}
                <div
                  className="w-full h-px mb-2"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${MAP_COLORS.roads.highway}, transparent)`,
                  }}
                />

                {/* City name */}
                <h3
                  className="font-semibold text-sm tracking-tight truncate"
                  style={{
                    color: MAP_COLORS.labels.city,
                    fontFamily: 'Playfair Display, Georgia, serif',
                  }}
                >
                  {cityName}
                </h3>

                {/* Country and nights */}
                <p
                  className="text-xs truncate"
                  style={{ color: MAP_COLORS.labels.town }}
                >
                  {country && `${country} · `}{nights} {nights === 1 ? 'night' : 'nights'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Pin pointer */}
      <div
        className="flex-shrink-0"
        style={{
          width: 0,
          height: 0,
          borderLeft: '10px solid transparent',
          borderRight: '10px solid transparent',
          borderTop: `14px solid ${MAP_COLORS.markers.border}`,
          marginTop: -2,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
        }}
      />
    </div>
  );
});

TravelStampMarker.displayName = 'TravelStampMarker';

export default TravelStampMarker;
