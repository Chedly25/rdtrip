/**
 * ConflictWarnings
 *
 * Smart warning system for Planning Mode.
 * Displays helpful suggestions without blocking the user.
 *
 * Warning Types:
 * - Opening hours conflicts
 * - Distance/travel time warnings
 * - Overpacked slot detection
 * - Duplicate place warnings
 *
 * Philosophy: "Warn, don't block" - soft suggestions, not hard stops
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  Clock,
  AlertTriangle,
  X,
  ChevronRight,
  Footprints,
  Copy,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { haversineDistance, estimateWalkingTime } from '../../utils/planningEnrichment';
import type { ConflictWarning, Slot } from '../../types/planning';

// ============================================================================
// Warning Configuration
// ============================================================================

const WARNING_CONFIG: Record<ConflictWarning['type'], {
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  opening_hours: {
    icon: <Clock className="w-4 h-4" />,
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
  },
  distance: {
    icon: <Footprints className="w-4 h-4" />,
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
  overpacked: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  duplicate: {
    icon: <Copy className="w-4 h-4" />,
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
  },
};

// ============================================================================
// Main Component
// ============================================================================

export function ConflictWarnings() {
  const {
    warnings,
    dismissWarning,
    clearWarnings,
    tripPlan,
    currentDayIndex,
    getDayItems,
  } = usePlanningStore();

  const [expandedWarning, setExpandedWarning] = useState<number | null>(null);

  // Auto-detect warnings based on current plan
  const detectedWarnings = useMemo(() => {
    if (!tripPlan) return [];

    const dayItems = getDayItems(currentDayIndex);
    const detected: ConflictWarning[] = [];

    // Check for distance warnings (consecutive items > 2km apart)
    for (let i = 1; i < dayItems.length; i++) {
      const prev = dayItems[i - 1];
      const curr = dayItems[i];
      const distance = haversineDistance(
        prev.place.geometry.location.lat,
        prev.place.geometry.location.lng,
        curr.place.geometry.location.lat,
        curr.place.geometry.location.lng
      );

      if (distance > 2) {
        const walkTime = estimateWalkingTime(
          prev.place.geometry.location.lat,
          prev.place.geometry.location.lng,
          curr.place.geometry.location.lat,
          curr.place.geometry.location.lng
        );
        detected.push({
          type: 'distance',
          message: `${prev.place.name} → ${curr.place.name} is ${distance.toFixed(1)}km apart (~${walkTime} min walk)`,
          severity: distance > 4 ? 'warning' : 'info',
          place_id: curr.place.place_id,
        });
      }
    }

    // Check for overpacked slots
    const slots: Slot[] = ['morning', 'afternoon', 'evening', 'night'];
    const day = tripPlan.days[currentDayIndex];
    if (day) {
      for (const slot of slots) {
        const slotItems = day.slots[slot];
        const slotDuration = slotItems.reduce((sum, item) => sum + item.place.estimated_duration_mins, 0);

        // Morning: 4 hours, others: 6 hours max recommended
        const maxDuration = slot === 'morning' ? 240 : 360;

        if (slotDuration > maxDuration) {
          detected.push({
            type: 'overpacked',
            message: `Your ${slot} has ~${Math.round(slotDuration / 60)} hours of activities. Consider moving something.`,
            severity: 'warning',
          });
        }
      }
    }

    // Check for duplicate places
    const seenPlaces = new Set<string>();
    for (const item of dayItems) {
      if (seenPlaces.has(item.place.place_id)) {
        detected.push({
          type: 'duplicate',
          message: `${item.place.name} appears multiple times in your plan`,
          severity: 'info',
          place_id: item.place.place_id,
        });
      }
      seenPlaces.add(item.place.place_id);
    }

    return detected;
  }, [tripPlan, currentDayIndex, getDayItems]);

  // Combine manual and detected warnings
  const allWarnings = [...warnings, ...detectedWarnings];

  if (allWarnings.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Warning Count Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <span className="text-body-3 text-rui-grey-60">
            {allWarnings.length} {allWarnings.length === 1 ? 'suggestion' : 'suggestions'}
          </span>
        </div>
        {warnings.length > 0 && (
          <button
            onClick={clearWarnings}
            className="text-body-3 text-rui-grey-50 hover:text-rui-accent transition-colors"
          >
            Dismiss all
          </button>
        )}
      </div>

      {/* Warning Cards */}
      <AnimatePresence>
        {allWarnings.map((warning, index) => (
          <WarningCard
            key={`${warning.type}-${index}`}
            warning={warning}
            isExpanded={expandedWarning === index}
            onToggle={() => setExpandedWarning(expandedWarning === index ? null : index)}
            onDismiss={index < warnings.length ? () => dismissWarning(index) : undefined}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Warning Card
// ============================================================================

interface WarningCardProps {
  warning: ConflictWarning;
  isExpanded: boolean;
  onToggle: () => void;
  onDismiss?: () => void;
}

function WarningCard({ warning, isExpanded, onToggle, onDismiss }: WarningCardProps) {
  const config = WARNING_CONFIG[warning.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className={`
        rounded-xl border overflow-hidden
        ${config.bgColor} ${config.borderColor}
      `}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer"
        onClick={onToggle}
      >
        <span className={`flex-shrink-0 ${config.color}`}>
          {config.icon}
        </span>
        <p className={`flex-1 text-body-3 ${config.color}`}>
          {warning.message}
        </p>
        <div className="flex items-center gap-1">
          {warning.suggested_action && (
            <ChevronRight
              className={`w-4 h-4 text-rui-grey-40 transition-transform ${
                isExpanded ? 'rotate-90' : ''
              }`}
            />
          )}
          {onDismiss && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="p-1 rounded hover:bg-black/5 transition-colors"
            >
              <X className="w-3.5 h-3.5 text-rui-grey-40" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && warning.suggested_action && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-3"
          >
            <button
              onClick={warning.suggested_action.action}
              className={`
                w-full py-2 rounded-lg text-body-3 font-medium
                ${config.color} bg-white/60 hover:bg-white
                transition-colors
              `}
            >
              {warning.suggested_action.label}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// Toast-style Warning (for temporary notifications)
// ============================================================================

interface WarningToastProps {
  warning: ConflictWarning;
  onDismiss: () => void;
  autoDismiss?: number; // ms
}

export function WarningToast({ warning, onDismiss, autoDismiss = 5000 }: WarningToastProps) {
  const config = WARNING_CONFIG[warning.type];

  // Auto-dismiss
  useMemo(() => {
    if (autoDismiss > 0) {
      const timer = setTimeout(onDismiss, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [autoDismiss, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.95 }}
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        flex items-center gap-3 px-4 py-3
        rounded-xl shadow-rui-4 border
        ${config.bgColor} ${config.borderColor}
      `}
    >
      <span className={config.color}>{config.icon}</span>
      <p className={`text-body-2 ${config.color}`}>{warning.message}</p>
      {warning.suggested_action && (
        <button
          onClick={warning.suggested_action.action}
          className={`
            px-3 py-1 rounded-lg text-body-3 font-medium
            bg-white/80 hover:bg-white ${config.color}
            transition-colors
          `}
        >
          {warning.suggested_action.label}
        </button>
      )}
      <button
        onClick={onDismiss}
        className="p-1 rounded hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4 text-rui-grey-40" />
      </button>
    </motion.div>
  );
}

// ============================================================================
// Inline Warning (for slot-level warnings)
// ============================================================================

interface InlineWarningProps {
  message: string;
  type: ConflictWarning['type'];
  onDismiss?: () => void;
}

export function InlineWarning({ message, type, onDismiss }: InlineWarningProps) {
  const config = WARNING_CONFIG[type];

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bgColor}`}>
      <span className={config.color}>{config.icon}</span>
      <p className={`flex-1 text-body-3 ${config.color}`}>{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-0.5 rounded hover:bg-black/5 transition-colors"
        >
          <X className="w-3 h-3 text-rui-grey-40" />
        </button>
      )}
    </div>
  );
}

export default ConflictWarnings;
