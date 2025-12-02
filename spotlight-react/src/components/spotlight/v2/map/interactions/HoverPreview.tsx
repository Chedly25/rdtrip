/**
 * Hover Preview Component
 *
 * Shows a preview tooltip when hovering over map elements.
 * Features smooth animations and contextual information.
 *
 * Design: Minimal, elegant tooltip that doesn't distract
 * but provides useful information on demand.
 */

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MAP_COLORS } from '../mapConstants';

interface HoverPreviewProps {
  isVisible: boolean;
  position: { x: number; y: number };
  content: {
    title: string;
    subtitle?: string;
    detail?: string;
  };
  variant?: 'city' | 'landmark' | 'route';
}

const variantStyles = {
  city: {
    accent: MAP_COLORS.journey.routeStart,
    icon: '🏛',
  },
  landmark: {
    accent: MAP_COLORS.journey.routeEnd,
    icon: '⭐',
  },
  route: {
    accent: MAP_COLORS.roads.highway,
    icon: '→',
  },
};

const HoverPreview = memo(({
  isVisible,
  position,
  content,
  variant = 'city',
}: HoverPreviewProps) => {
  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed pointer-events-none z-50"
          style={{
            left: position.x,
            top: position.y,
          }}
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{
            duration: 0.2,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          {/* Tooltip container */}
          <div
            className="relative -translate-x-1/2 -translate-y-full mb-3"
            style={{
              background: `linear-gradient(145deg,
                rgba(255, 251, 245, 0.98),
                rgba(244, 237, 228, 0.96))`,
              borderRadius: '12px',
              boxShadow: `
                0 4px 20px rgba(139, 115, 85, 0.2),
                0 2px 6px rgba(0, 0, 0, 0.08),
                inset 0 1px 0 rgba(255, 255, 255, 0.8)
              `,
              border: `1px solid rgba(196, 88, 48, 0.12)`,
              backdropFilter: 'blur(12px)',
              minWidth: 140,
              maxWidth: 220,
            }}
          >
            {/* Accent bar */}
            <div
              className="absolute top-0 left-4 right-4 h-0.5 rounded-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${styles.accent}, transparent)`,
              }}
            />

            {/* Content */}
            <div className="px-4 py-3">
              {/* Title row */}
              <div className="flex items-center gap-2">
                <span className="text-xs">{styles.icon}</span>
                <h4
                  style={{
                    fontFamily: '"Playfair Display", Georgia, serif',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: MAP_COLORS.labels.city,
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {content.title}
                </h4>
              </div>

              {/* Subtitle */}
              {content.subtitle && (
                <p
                  style={{
                    fontFamily: '"Source Sans 3", system-ui, sans-serif',
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: MAP_COLORS.labels.town,
                    margin: '4px 0 0 0',
                    letterSpacing: '0.02em',
                  }}
                >
                  {content.subtitle}
                </p>
              )}

              {/* Detail */}
              {content.detail && (
                <p
                  style={{
                    fontFamily: '"Source Sans 3", system-ui, sans-serif',
                    fontSize: '0.65rem',
                    fontWeight: 400,
                    color: styles.accent,
                    margin: '6px 0 0 0',
                    letterSpacing: '0.01em',
                  }}
                >
                  {content.detail}
                </p>
              )}
            </div>

            {/* Arrow pointer */}
            <div
              className="absolute left-1/2 -translate-x-1/2 -bottom-2"
              style={{
                width: 0,
                height: 0,
                borderLeft: '8px solid transparent',
                borderRight: '8px solid transparent',
                borderTop: '8px solid rgba(244, 237, 228, 0.96)',
                filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.08))',
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

HoverPreview.displayName = 'HoverPreview';

export default HoverPreview;
