/**
 * Route Overview Badge
 *
 * A elegant badge showing total journey statistics.
 * Displays total distance, duration, and number of stops.
 *
 * Design: Inspired by vintage travel tickets and baggage tags.
 * Features a distinctive shape with decorative borders.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { MAP_COLORS } from '../mapConstants';

interface RouteOverviewBadgeProps {
  totalDistance: string; // e.g., "1,245 km"
  totalDuration: string; // e.g., "14h 30m"
  cityCount: number;
  landmarkCount?: number;
  isVisible?: boolean;
}

const RouteOverviewBadge = memo(({
  totalDistance,
  totalDuration,
  cityCount,
  landmarkCount = 0,
  isVisible = true,
}: RouteOverviewBadgeProps) => {
  // Parse values
  const distanceMatch = totalDistance.match(/^([\d,.]+)\s*(.+)$/);
  const distanceValue = distanceMatch?.[1] || totalDistance;
  const distanceUnit = distanceMatch?.[2] || '';

  return (
    <motion.div
      className="absolute bottom-6 left-6 z-30"
      initial={{ opacity: 0, x: -20, scale: 0.9 }}
      animate={isVisible ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -20, scale: 0.9 }}
      transition={{
        duration: 0.6,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Main badge container */}
      <div
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(145deg,
            rgba(255, 251, 245, 0.95),
            rgba(244, 237, 228, 0.92))`,
          borderRadius: '16px',
          boxShadow: `
            0 4px 24px rgba(139, 115, 85, 0.2),
            0 2px 8px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.8)
          `,
          border: `2px solid ${MAP_COLORS.markers.border}`,
          backdropFilter: 'blur(12px)',
        }}
      >
        {/* Decorative corner flourishes */}
        <div
          className="absolute top-2 left-2 w-3 h-3 border-l-2 border-t-2"
          style={{ borderColor: MAP_COLORS.journey.routeEnd, opacity: 0.4 }}
        />
        <div
          className="absolute top-2 right-2 w-3 h-3 border-r-2 border-t-2"
          style={{ borderColor: MAP_COLORS.journey.routeEnd, opacity: 0.4 }}
        />
        <div
          className="absolute bottom-2 left-2 w-3 h-3 border-l-2 border-b-2"
          style={{ borderColor: MAP_COLORS.journey.routeEnd, opacity: 0.4 }}
        />
        <div
          className="absolute bottom-2 right-2 w-3 h-3 border-r-2 border-b-2"
          style={{ borderColor: MAP_COLORS.journey.routeEnd, opacity: 0.4 }}
        />

        {/* Header */}
        <div
          className="px-5 py-2 text-center"
          style={{
            background: `linear-gradient(135deg, ${MAP_COLORS.journey.routeStart}, ${MAP_COLORS.journey.routeEnd})`,
          }}
        >
          <span
            style={{
              fontFamily: '"Source Sans 3", system-ui, sans-serif',
              fontSize: '0.625rem',
              fontWeight: 600,
              color: '#FFFFFF',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
          >
            Your Journey
          </span>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          {/* Total distance - hero stat */}
          <div className="text-center mb-3">
            <div className="flex items-baseline justify-center gap-1">
              <span
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: MAP_COLORS.labels.city,
                  letterSpacing: '-0.02em',
                  lineHeight: 1,
                }}
              >
                {distanceValue}
              </span>
              <span
                style={{
                  fontFamily: '"Source Sans 3", system-ui, sans-serif',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: MAP_COLORS.labels.town,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {distanceUnit}
              </span>
            </div>
          </div>

          {/* Decorative divider */}
          <div
            className="w-full h-px my-3"
            style={{
              background: `linear-gradient(90deg, transparent, ${MAP_COLORS.roads.highway}, transparent)`,
            }}
          />

          {/* Stats row */}
          <div className="flex justify-between gap-4">
            {/* Duration */}
            <div className="text-center flex-1">
              <p
                style={{
                  fontFamily: '"Source Sans 3", system-ui, sans-serif',
                  fontSize: '0.6rem',
                  fontWeight: 500,
                  color: MAP_COLORS.labels.town,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  margin: '0 0 2px',
                }}
              >
                Duration
              </p>
              <p
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: MAP_COLORS.journey.routeStart,
                  margin: 0,
                }}
              >
                {totalDuration}
              </p>
            </div>

            {/* Separator */}
            <div
              style={{
                width: 1,
                background: MAP_COLORS.roads.highway,
                opacity: 0.3,
              }}
            />

            {/* Cities */}
            <div className="text-center flex-1">
              <p
                style={{
                  fontFamily: '"Source Sans 3", system-ui, sans-serif',
                  fontSize: '0.6rem',
                  fontWeight: 500,
                  color: MAP_COLORS.labels.town,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  margin: '0 0 2px',
                }}
              >
                Cities
              </p>
              <p
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: MAP_COLORS.journey.routeStart,
                  margin: 0,
                }}
              >
                {cityCount}
              </p>
            </div>

            {/* Landmarks (if any) */}
            {landmarkCount > 0 && (
              <>
                <div
                  style={{
                    width: 1,
                    background: MAP_COLORS.roads.highway,
                    opacity: 0.3,
                  }}
                />
                <div className="text-center flex-1">
                  <p
                    style={{
                      fontFamily: '"Source Sans 3", system-ui, sans-serif',
                      fontSize: '0.6rem',
                      fontWeight: 500,
                      color: MAP_COLORS.labels.town,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      margin: '0 0 2px',
                    }}
                  >
                    Stops
                  </p>
                  <p
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      color: MAP_COLORS.journey.routeEnd,
                      margin: 0,
                    }}
                  >
                    {landmarkCount}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Decorative bottom border */}
        <div
          className="h-1"
          style={{
            background: `linear-gradient(90deg, ${MAP_COLORS.journey.routeStart}, ${MAP_COLORS.journey.routeEnd})`,
          }}
        />
      </div>
    </motion.div>
  );
});

RouteOverviewBadge.displayName = 'RouteOverviewBadge';

export default RouteOverviewBadge;
