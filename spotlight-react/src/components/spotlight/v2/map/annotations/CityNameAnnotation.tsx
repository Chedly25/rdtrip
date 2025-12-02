/**
 * City Name Annotation
 *
 * Elegant floating city name that appears near markers.
 * Features vintage typography with modern refinement.
 *
 * Design: Inspired by luxury travel magazine cartography.
 * Uses decorative underlines and subtle shadows.
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import { MAP_COLORS } from '../mapConstants';

interface CityNameAnnotationProps {
  name: string;
  country?: string;
  position: { x: number; y: number };
  alignment?: 'left' | 'center' | 'right';
  size?: 'small' | 'medium' | 'large';
  isCapital?: boolean;
  isVisible?: boolean;
  delay?: number;
}

const sizeStyles = {
  small: {
    fontSize: '0.875rem',
    countrySize: '0.625rem',
    underlineWidth: 24,
  },
  medium: {
    fontSize: '1.125rem',
    countrySize: '0.7rem',
    underlineWidth: 32,
  },
  large: {
    fontSize: '1.5rem',
    countrySize: '0.75rem',
    underlineWidth: 48,
  },
};

const CityNameAnnotation = memo(({
  name,
  country,
  position,
  alignment = 'center',
  size = 'medium',
  isCapital = false,
  isVisible = true,
  delay = 0,
}: CityNameAnnotationProps) => {
  const styles = sizeStyles[size];

  const alignmentTransform = {
    left: 'translate(0, -50%)',
    center: 'translate(-50%, -50%)',
    right: 'translate(-100%, -50%)',
  };

  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{
        left: position.x,
        top: position.y,
        transform: alignmentTransform[alignment],
        zIndex: 15,
        textAlign: alignment,
      }}
      initial={{ opacity: 0, y: 8 }}
      animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* City name with decorative styling */}
      <div className="relative inline-block">
        {/* Main city name */}
        <h3
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: styles.fontSize,
            fontWeight: isCapital ? 700 : 600,
            fontStyle: isCapital ? 'normal' : 'italic',
            color: MAP_COLORS.labels.city,
            letterSpacing: isCapital ? '0.05em' : '0.02em',
            textTransform: isCapital ? 'uppercase' : 'none',
            textShadow: `
              0 1px 2px rgba(255, 251, 245, 0.8),
              0 2px 8px rgba(255, 251, 245, 0.6)
            `,
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {name}
        </h3>

        {/* Decorative underline */}
        <motion.div
          className="mx-auto mt-1"
          style={{
            width: styles.underlineWidth,
            height: 2,
            background: `linear-gradient(90deg,
              transparent,
              ${MAP_COLORS.journey.routeEnd},
              transparent)`,
            borderRadius: 1,
            marginLeft: alignment === 'left' ? 0 : alignment === 'right' ? 'auto' : 'auto',
            marginRight: alignment === 'right' ? 0 : alignment === 'left' ? 'auto' : 'auto',
          }}
          initial={{ scaleX: 0 }}
          animate={isVisible ? { scaleX: 1 } : { scaleX: 0 }}
          transition={{
            duration: 0.4,
            delay: delay + 0.2,
            ease: 'easeOut',
          }}
        />

        {/* Country name */}
        {country && (
          <motion.p
            style={{
              fontFamily: '"Source Sans 3", system-ui, sans-serif',
              fontSize: styles.countrySize,
              fontWeight: 500,
              color: MAP_COLORS.labels.town,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              margin: '4px 0 0',
              textShadow: `0 1px 4px rgba(255, 251, 245, 0.9)`,
            }}
            initial={{ opacity: 0 }}
            animate={isVisible ? { opacity: 1 } : { opacity: 0 }}
            transition={{
              duration: 0.3,
              delay: delay + 0.3,
            }}
          >
            {country}
          </motion.p>
        )}
      </div>

      {/* Capital star indicator */}
      {isCapital && (
        <motion.div
          className="absolute -left-4 top-1"
          style={{
            color: MAP_COLORS.journey.routeEnd,
            fontSize: '0.625rem',
          }}
          initial={{ scale: 0, rotate: -180 }}
          animate={isVisible ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -180 }}
          transition={{
            duration: 0.5,
            delay: delay + 0.1,
            type: 'spring',
            stiffness: 200,
          }}
        >
          ★
        </motion.div>
      )}
    </motion.div>
  );
});

CityNameAnnotation.displayName = 'CityNameAnnotation';

export default CityNameAnnotation;
