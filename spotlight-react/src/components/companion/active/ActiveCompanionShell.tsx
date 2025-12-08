/**
 * ActiveCompanionShell Component
 *
 * WI-7.7: Container that orchestrates all companion modes with the mode switcher
 *
 * This component:
 * - Renders the current mode's UI component
 * - Shows the CompanionModeSwitcher at the bottom
 * - Handles smooth transitions between modes
 * - Manages mode-specific state (craving results, serendipity, etc.)
 * - Provides consistent shell with bottom navigation
 *
 * Usage:
 * ```tsx
 * <ActiveCompanionShell
 *   tripId="trip-123"
 *   dayNumber={1}
 * />
 * ```
 */

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { CompanionModeSwitcher } from './CompanionModeSwitcher';
import { ChoiceMode } from './ChoiceMode';
import { CravingMode } from './CravingMode';
import { SerendipityMode } from './SerendipityMode';
import { RestMode } from './RestMode';
import { useChoiceMode } from './useChoiceMode';
import { useCravingMode } from './useCravingMode';
import { useSerendipityMode } from './useSerendipityMode';
import { useRestMode } from './useRestMode';

import { useActiveCompanionContextSafe } from '../../../services/tripBrain/companion';
import type { ActiveCompanionSubMode } from '../../../services/tripBrain/companion/types';

// ============================================================================
// Types
// ============================================================================

export interface ActiveCompanionShellProps {
  /** Trip ID */
  tripId?: string;
  /** Current day number */
  dayNumber?: number;
  /** Initial mode */
  initialMode?: ActiveCompanionSubMode;
  /** Called when an activity is selected */
  onActivitySelect?: (activityId: string) => void;
  /** Called when viewing full itinerary */
  onViewFullItinerary?: () => void;
  /** Whether the shell is visible */
  visible?: boolean;
}

// ============================================================================
// Theme
// ============================================================================

const getShellTheme = (isNight: boolean) => {
  if (isNight) {
    return {
      bg: '#0A0A0B',
      bgGradient: 'linear-gradient(180deg, #0A0A0B 0%, #111113 100%)',
    };
  }

  return {
    bg: '#FAF8F5',
    bgGradient: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)',
  };
};

// ============================================================================
// Component
// ============================================================================

export function ActiveCompanionShell({
  initialMode = 'choice',
  onActivitySelect,
  onViewFullItinerary,
  visible = true,
}: ActiveCompanionShellProps) {
  // Time-aware theming
  const [currentHour] = useState(() => new Date().getHours());
  const isNightMode = currentHour >= 20 || currentHour < 6;
  const theme = getShellTheme(isNightMode);

  // Try to get context (may be null if outside provider)
  const companion = useActiveCompanionContextSafe();

  // Local mode state (fallback if no context)
  const [localMode, setLocalMode] = useState<ActiveCompanionSubMode>(initialMode);

  // Use context mode if available, else local
  const currentMode = companion?.subMode ?? localMode;
  const switchMode = useCallback(
    (mode: ActiveCompanionSubMode) => {
      if (companion) {
        companion.switchMode(mode);
      } else {
        setLocalMode(mode);
      }
    },
    [companion]
  );

  // ==================== Mode Hooks ====================

  const choiceMode = useChoiceMode();
  const cravingMode = useCravingMode();
  const serendipityMode = useSerendipityMode();
  const restMode = useRestMode();

  // ==================== Handlers ====================

  const handleActivitySelect = useCallback(
    (activityId: string) => {
      onActivitySelect?.(activityId);
      // Also record in context
      if (companion) {
        companion.selectActivity(activityId);
      }
    },
    [onActivitySelect, companion]
  );

  const handleBackToChoice = useCallback(() => {
    switchMode('choice');
  }, [switchMode]);

  // ==================== Mode Content ====================

  const modeContent = useMemo(() => {
    switch (currentMode) {
      case 'choice':
        return (
          <ChoiceMode
            recommendations={choiceMode.recommendations}
            onSelect={handleActivitySelect}
            onSkip={choiceMode.skipActivity}
            onRefresh={choiceMode.refreshRecommendations}
            isLoading={choiceMode.isLoading}
          />
        );

      case 'craving':
        return (
          <CravingMode
            results={cravingMode.results}
            onSearch={cravingMode.searchCraving}
            onSelect={handleActivitySelect}
            onClear={cravingMode.clearCraving}
            onBack={handleBackToChoice}
            isLoading={cravingMode.isLoading}
          />
        );

      case 'serendipity':
        return (
          <SerendipityMode
            result={serendipityMode.result}
            onGetSurprise={serendipityMode.getSurprise}
            onAccept={() => {
              serendipityMode.acceptSurprise();
              if (serendipityMode.result?.activity) {
                handleActivitySelect(serendipityMode.result.activity.activity.id);
              }
            }}
            onReject={serendipityMode.rejectSurprise}
            onBack={handleBackToChoice}
            isLoading={serendipityMode.isLoading}
            surprisesShown={serendipityMode.surprisesShown}
          />
        );

      case 'rest':
        return (
          <RestMode
            restSpots={restMode.restSpots}
            onSelect={handleActivitySelect}
            onBack={handleBackToChoice}
            isLoading={restMode.isLoading}
            activeFilter={restMode.activeFilter}
            onFilterChange={restMode.setFilter}
          />
        );

      case 'nearby':
        // "Full" mode - shows all/nearby activities
        // For now, redirect to full itinerary or show choice with more items
        if (onViewFullItinerary) {
          onViewFullItinerary();
        }
        // Fall back to choice mode display
        return (
          <ChoiceMode
            recommendations={choiceMode.recommendations}
            onSelect={handleActivitySelect}
            onSkip={choiceMode.skipActivity}
            onRefresh={choiceMode.refreshRecommendations}
            isLoading={choiceMode.isLoading}
          />
        );

      default:
        return (
          <ChoiceMode
            recommendations={choiceMode.recommendations}
            onSelect={handleActivitySelect}
            onSkip={choiceMode.skipActivity}
            onRefresh={choiceMode.refreshRecommendations}
            isLoading={choiceMode.isLoading}
          />
        );
    }
  }, [
    currentMode,
    choiceMode,
    cravingMode,
    serendipityMode,
    restMode,
    handleActivitySelect,
    handleBackToChoice,
    onViewFullItinerary,
  ]);

  if (!visible) return null;

  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{ background: theme.bgGradient }}
    >
      {/* Mode Content Area */}
      <div className="flex-1 pb-24 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentMode}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{
              duration: 0.25,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="min-h-full"
          >
            {modeContent}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Mode Switcher */}
      <CompanionModeSwitcher
        currentMode={currentMode}
        onModeChange={switchMode}
        isNightMode={isNightMode}
        visible={true}
      />
    </div>
  );
}

export default ActiveCompanionShell;
