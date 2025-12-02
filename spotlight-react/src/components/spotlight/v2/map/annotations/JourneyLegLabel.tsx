/**
 * Journey Leg Label
 *
 * Elegant typographic annotation that appears along route segments.
 * Shows distance and estimated travel time between waypoints.
 *
 * Design: Inspired by vintage map annotations with a modern refinement.
 * Uses Playfair Display for numbers and a clean sans-serif for units.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { MAP_COLORS } from '../mapConstants';

interface JourneyLegLabelProps {
  distance: string; // e.g., "245 km"
  duration: string; // e.g., "2h 45m"
  position: { x: number; y: number };
  rotation?: number; // Angle to align with route
  isVisible?: boolean;
  delay?: number;
}

const JourneyLegLabel = memo(({
  distance,
  duration,
  position,
  rotation = 0,
  isVisible = true,
  delay = 0,
}: JourneyLegLabelProps) => {
  // Parse distance for styling
  const distanceMatch = distance.match(/^([\d,.]+)\s*(.+)$/);
  const distanceValue = distanceMatch?.[1] || distance;
  const distanceUnit = distanceMatch?.[2] || '';

  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{
        left: position.x,
        top: position.y,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        zIndex: 10,
      }}
      initial={{ opacity: 0, scale: 0.8, y: 10 }}
      animate={isVisible ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.8, y: 10 }}
      transition={{
        duration: 0.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Label container with subtle backdrop */}
      <div
        className="relative px-4 py-2 rounded-full"
        style={{
          background: `linear-gradient(135deg,
            rgba(255, 251, 245, 0.92),
            rgba(244, 237, 228, 0.88))`,
          backdropFilter: 'blur(8px)',
          boxShadow: `
            0 2px 12px rgba(139, 115, 85, 0.15),
            0 1px 3px rgba(0, 0, 0, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.6)
          `,
          border: `1px solid rgba(196, 88, 48, 0.15)`,
        }}
      >
        {/* Decorative line accents */}
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-full"
          style={{
            width: 20,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${MAP_COLORS.journey.routeStart})`,
          }}
        />
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full"
          style={{
            width: 20,
            height: 1,
            background: `linear-gradient(90deg, ${MAP_COLORS.journey.routeStart}, transparent)`,
          }}
        />

        {/* Content */}
        <div className="flex items-center gap-3">
          {/* Distance */}
          <div className="flex items-baseline gap-1">
            <span
              style={{
                fontFamily: '"Playfair Display", Georgia, serif',
                fontSize: '1.125rem',
                fontWeight: 600,
                color: MAP_COLORS.journey.routeStart,
                letterSpacing: '-0.02em',
              }}
            >
              {distanceValue}
            </span>
            <span
              style={{
                fontFamily: '"Source Sans 3", system-ui, sans-serif',
                fontSize: '0.7rem',
                fontWeight: 500,
                color: MAP_COLORS.labels.town,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              {distanceUnit}
            </span>
          </div>

          {/* Separator dot */}
          <div
            style={{
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: MAP_COLORS.roads.highway,
            }}
          />

          {/* Duration */}
          <div
            style={{
              fontFamily: '"Source Sans 3", system-ui, sans-serif',
              fontSize: '0.75rem',
              fontWeight: 500,
              color: MAP_COLORS.labels.town,
              letterSpacing: '0.02em',
            }}
          >
            {duration}
          </div>
        </div>
      </div>
    </motion.div>
  );
});

JourneyLegLabel.displayName = 'JourneyLegLabel';

export default JourneyLegLabel;
