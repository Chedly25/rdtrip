/**
 * CompanionModeSwitcher Component
 *
 * WI-7.7: Bottom navigation for switching between companion modes
 *
 * Design Philosophy:
 * - REFINED FLOATING PILL - premium, not edge-to-edge
 * - Thumb-friendly for one-handed mobile use
 * - Animated sliding indicator for current mode
 * - Icons expand to show label when active
 * - Glass morphism for depth and polish
 * - Day/night theme awareness
 *
 * Modes:
 * - Choice (default): Curated recommendations
 * - Craving: "I want..." search
 * - Serendipity: Surprise me
 * - Rest: I'm tired
 * - Full: View all activities
 */

import { useMemo, useRef, useLayoutEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  Shuffle,
  Coffee,
  LayoutList,
} from 'lucide-react';

import type { ActiveCompanionSubMode } from '../../../services/tripBrain/companion/types';

// ============================================================================
// Types
// ============================================================================

export interface CompanionModeSwitcherProps {
  /** Current active mode */
  currentMode: ActiveCompanionSubMode;
  /** Called when mode changes */
  onModeChange: (mode: ActiveCompanionSubMode) => void;
  /** Whether night mode is active */
  isNightMode?: boolean;
  /** Whether to show the switcher */
  visible?: boolean;
}

// ============================================================================
// Mode Configuration
// ============================================================================

type SwitcherMode = 'choice' | 'craving' | 'serendipity' | 'rest' | 'full';

interface ModeConfig {
  id: SwitcherMode;
  subMode: ActiveCompanionSubMode | 'full';
  icon: typeof Sparkles;
  label: string;
  shortLabel: string;
}

const MODES: ModeConfig[] = [
  {
    id: 'choice',
    subMode: 'choice',
    icon: Sparkles,
    label: 'For you',
    shortLabel: 'For you',
  },
  {
    id: 'craving',
    subMode: 'craving',
    icon: Search,
    label: 'I want...',
    shortLabel: 'Want',
  },
  {
    id: 'serendipity',
    subMode: 'serendipity',
    icon: Shuffle,
    label: 'Surprise',
    shortLabel: 'Surprise',
  },
  {
    id: 'rest',
    subMode: 'rest',
    icon: Coffee,
    label: 'Rest',
    shortLabel: 'Rest',
  },
  {
    id: 'full',
    subMode: 'nearby', // Maps to nearby for now, or could be a new mode
    icon: LayoutList,
    label: 'All',
    shortLabel: 'All',
  },
];

// ============================================================================
// Theme
// ============================================================================

const getTheme = (isNight: boolean) => {
  if (isNight) {
    return {
      bar: {
        bg: 'rgba(24, 24, 27, 0.85)',
        border: 'rgba(255, 255, 255, 0.08)',
        shadow: '0 -4px 30px rgba(0, 0, 0, 0.4)',
        blur: 'blur(20px)',
      },
      indicator: {
        bg: 'rgba(255, 255, 255, 0.12)',
        border: 'rgba(255, 255, 255, 0.15)',
      },
      icon: {
        inactive: '#71717A',
        active: '#F4F4F5',
      },
      label: {
        color: '#F4F4F5',
      },
      accent: '#D4A853',
    };
  }

  return {
    bar: {
      bg: 'rgba(255, 255, 255, 0.85)',
      border: 'rgba(0, 0, 0, 0.06)',
      shadow: '0 -4px 30px rgba(0, 0, 0, 0.08)',
      blur: 'blur(20px)',
    },
    indicator: {
      bg: 'rgba(0, 0, 0, 0.06)',
      border: 'rgba(0, 0, 0, 0.08)',
    },
    icon: {
      inactive: '#A1A1AA',
      active: '#18181B',
    },
    label: {
      color: '#18181B',
    },
    accent: '#D4A853',
  };
};

// ============================================================================
// Component
// ============================================================================

export function CompanionModeSwitcher({
  currentMode,
  onModeChange,
  isNightMode = false,
  visible = true,
}: CompanionModeSwitcherProps) {
  const theme = getTheme(isNightMode);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  // Find current active mode config
  const activeMode = useMemo(() => {
    return MODES.find((m) => m.subMode === currentMode) || MODES[0];
  }, [currentMode]);

  // Calculate indicator position
  useLayoutEffect(() => {
    const activeButton = buttonRefs.current.get(activeMode.id);
    const container = containerRef.current;

    if (activeButton && container) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = activeButton.getBoundingClientRect();

      setIndicatorStyle({
        left: buttonRect.left - containerRect.left,
        width: buttonRect.width,
      });
    }
  }, [activeMode.id]);

  const handleModeClick = (mode: ModeConfig) => {
    if (mode.subMode === 'full') {
      // For now, map to 'nearby' or handle specially
      onModeChange('nearby');
    } else {
      onModeChange(mode.subMode as ActiveCompanionSubMode);
    }
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{
            type: 'spring',
            damping: 25,
            stiffness: 300,
          }}
        >
          {/* Gradient fade above bar */}
          <div
            className="absolute bottom-full left-0 right-0 h-8 pointer-events-none"
            style={{
              background: isNightMode
                ? 'linear-gradient(to top, rgba(10,10,11,0.8) 0%, transparent 100%)'
                : 'linear-gradient(to top, rgba(250,248,245,0.8) 0%, transparent 100%)',
            }}
          />

          {/* Main bar container */}
          <div className="px-4 pb-2">
            <motion.div
              ref={containerRef}
              className="relative flex items-center justify-around rounded-2xl overflow-hidden"
              style={{
                background: theme.bar.bg,
                backdropFilter: theme.bar.blur,
                WebkitBackdropFilter: theme.bar.blur,
                border: `1px solid ${theme.bar.border}`,
                boxShadow: theme.bar.shadow,
                padding: '6px',
              }}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              {/* Sliding indicator */}
              <motion.div
                className="absolute rounded-xl"
                style={{
                  background: theme.indicator.bg,
                  border: `1px solid ${theme.indicator.border}`,
                  height: 'calc(100% - 12px)',
                  top: '6px',
                }}
                animate={{
                  left: indicatorStyle.left,
                  width: indicatorStyle.width,
                }}
                transition={{
                  type: 'spring',
                  damping: 25,
                  stiffness: 350,
                }}
              />

              {/* Mode buttons */}
              {MODES.map((mode) => {
                const Icon = mode.icon;
                const isActive = mode.id === activeMode.id;

                return (
                  <motion.button
                    key={mode.id}
                    ref={(el) => {
                      if (el) buttonRefs.current.set(mode.id, el);
                    }}
                    onClick={() => handleModeClick(mode)}
                    className="relative flex items-center justify-center gap-1.5 py-3 px-4 rounded-xl z-10"
                    style={{
                      minWidth: isActive ? 'auto' : '48px',
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      animate={{
                        scale: isActive ? 1.05 : 1,
                      }}
                      transition={{ type: 'spring', damping: 20 }}
                    >
                      <Icon
                        size={20}
                        color={isActive ? theme.icon.active : theme.icon.inactive}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                    </motion.div>

                    <AnimatePresence mode="wait">
                      {isActive && (
                        <motion.span
                          className="text-sm font-medium whitespace-nowrap"
                          style={{
                            color: theme.label.color,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{
                            opacity: { duration: 0.15 },
                            width: { type: 'spring', damping: 25, stiffness: 300 },
                          }}
                        >
                          {mode.shortLabel}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CompanionModeSwitcher;
