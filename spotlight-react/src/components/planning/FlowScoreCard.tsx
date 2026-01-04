/**
 * FlowScoreCard
 *
 * Day quality indicator showing trip flow metrics.
 * Displays total duration, walking distance, and pacing assessment.
 *
 * Visual Features:
 * - Animated progress bars
 * - Color-coded pacing indicator
 * - Slot breakdown visualization
 * - Helpful tooltips
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Footprints,
  Gauge,
  Coffee,
  Sun,
  Sunset,
  Moon,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { usePlanningStore } from '../../stores/planningStore';
import { haversineDistance } from '../../utils/planningEnrichment';
import type { Slot } from '../../types/planning';

// ============================================================================
// Pacing Configuration
// ============================================================================

interface PacingConfig {
  label: string;
  description: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const PACING_CONFIG: Record<'relaxed' | 'balanced' | 'packed', PacingConfig> = {
  relaxed: {
    label: 'Relaxed',
    description: 'Plenty of time to wander',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    icon: <TrendingDown className="w-3.5 h-3.5" />,
  },
  balanced: {
    label: 'Balanced',
    description: 'Good mix of activities',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    icon: <Minus className="w-3.5 h-3.5" />,
  },
  packed: {
    label: 'Packed',
    description: 'Action-packed day!',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
  },
};

const SLOT_ICONS: Record<Slot, React.ReactNode> = {
  morning: <Coffee className="w-3 h-3" />,
  afternoon: <Sun className="w-3 h-3" />,
  evening: <Sunset className="w-3 h-3" />,
  night: <Moon className="w-3 h-3" />,
};

const SLOT_COLORS: Record<Slot, string> = {
  morning: 'bg-amber-400',
  afternoon: 'bg-orange-400',
  evening: 'bg-rose-400',
  night: 'bg-indigo-400',
};

// ============================================================================
// Main Component
// ============================================================================

export function FlowScoreCard() {
  const { tripPlan, currentDayIndex, getDayItems } = usePlanningStore();

  const metrics = useMemo(() => {
    if (!tripPlan) return null;

    const day = tripPlan.days[currentDayIndex];
    if (!day) return null;

    const items = getDayItems(currentDayIndex);
    if (items.length === 0) return null;

    // Calculate total duration
    const totalDuration = items.reduce(
      (sum, item) => sum + item.place.estimated_duration_mins,
      0
    );

    // Calculate total walking distance
    let totalWalkingKm = 0;
    for (let i = 1; i < items.length; i++) {
      const from = items[i - 1].place.geometry.location;
      const to = items[i].place.geometry.location;
      totalWalkingKm += haversineDistance(from.lat, from.lng, to.lat, to.lng);
    }

    // Calculate slot breakdown
    const slotDurations: Record<Slot, number> = {
      morning: day.slots.morning.reduce((sum, i) => sum + i.place.estimated_duration_mins, 0),
      afternoon: day.slots.afternoon.reduce((sum, i) => sum + i.place.estimated_duration_mins, 0),
      evening: day.slots.evening.reduce((sum, i) => sum + i.place.estimated_duration_mins, 0),
      night: day.slots.night.reduce((sum, i) => sum + i.place.estimated_duration_mins, 0),
    };

    // Determine pacing
    let pacing: 'relaxed' | 'balanced' | 'packed';
    if (totalDuration < 240) {
      pacing = 'relaxed';
    } else if (totalDuration < 420) {
      pacing = 'balanced';
    } else {
      pacing = 'packed';
    }

    // Calculate walking time
    const walkingTimeMins = Math.round(totalWalkingKm * 12); // ~5 km/h

    return {
      totalDuration,
      totalWalkingKm,
      walkingTimeMins,
      slotDurations,
      pacing,
      itemCount: items.length,
    };
  }, [tripPlan, currentDayIndex, getDayItems]);

  if (!metrics) {
    return (
      <div className="bg-rui-grey-5 rounded-xl p-4 text-center">
        <p className="text-body-3 text-rui-grey-50">
          Add activities to see your day's flow
        </p>
      </div>
    );
  }

  const pacingConfig = PACING_CONFIG[metrics.pacing];
  const maxSlotDuration = Math.max(...Object.values(metrics.slotDurations), 1);

  return (
    <div className="bg-rui-white rounded-xl border border-rui-grey-10 overflow-hidden">
      {/* Header with Pacing Badge */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-rui-grey-10">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-rui-grey-50" />
          <span className="text-body-2 font-medium text-rui-black">Day Flow</span>
        </div>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${pacingConfig.bgColor}`}
          title={pacingConfig.description}
        >
          <span className={pacingConfig.color}>{pacingConfig.icon}</span>
          <span className={`text-body-3 font-medium ${pacingConfig.color}`}>
            {pacingConfig.label}
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 divide-x divide-rui-grey-10">
        <MetricCell
          icon={<Clock className="w-4 h-4" />}
          label="Activities"
          value={formatDuration(metrics.totalDuration)}
          subtext={`${metrics.itemCount} stops`}
        />
        <MetricCell
          icon={<Footprints className="w-4 h-4" />}
          label="Walking"
          value={`${metrics.totalWalkingKm.toFixed(1)} km`}
          subtext={`~${metrics.walkingTimeMins} min`}
        />
        <MetricCell
          icon={<TrendingUp className="w-4 h-4" />}
          label="Total"
          value={formatDuration(metrics.totalDuration + metrics.walkingTimeMins)}
          subtext="with travel"
        />
      </div>

      {/* Slot Breakdown */}
      <div className="px-4 py-3 bg-rui-grey-2">
        <p className="text-body-3 text-rui-grey-50 mb-2">Time by slot</p>
        <div className="space-y-2">
          {(['morning', 'afternoon', 'evening', 'night'] as Slot[]).map((slot) => (
            <SlotBar
              key={slot}
              slot={slot}
              duration={metrics.slotDurations[slot]}
              maxDuration={maxSlotDuration}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface MetricCellProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
}

function MetricCell({ icon, label, value, subtext }: MetricCellProps) {
  return (
    <div className="px-3 py-3 text-center">
      <div className="flex items-center justify-center gap-1.5 mb-1 text-rui-grey-50">
        {icon}
        <span className="text-body-3">{label}</span>
      </div>
      <p className="font-display text-lg text-rui-black">{value}</p>
      <p className="text-body-3 text-rui-grey-40">{subtext}</p>
    </div>
  );
}

interface SlotBarProps {
  slot: Slot;
  duration: number;
  maxDuration: number;
}

function SlotBar({ slot, duration, maxDuration }: SlotBarProps) {
  const percentage = maxDuration > 0 ? (duration / maxDuration) * 100 : 0;
  const isEmpty = duration === 0;

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center justify-center w-5 ${
          isEmpty ? 'text-rui-grey-30' : 'text-rui-grey-50'
        }`}
      >
        {SLOT_ICONS[slot]}
      </div>
      <div className="flex-1 h-2 bg-rui-grey-10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className={`h-full rounded-full ${SLOT_COLORS[slot]}`}
        />
      </div>
      <span className={`text-body-3 w-12 text-right ${isEmpty ? 'text-rui-grey-30' : 'text-rui-grey-60'}`}>
        {isEmpty ? '—' : formatDuration(duration)}
      </span>
    </div>
  );
}

// ============================================================================
// Compact Version (for header/sidebar use)
// ============================================================================

export function CompactFlowScore() {
  const { tripPlan, currentDayIndex, getDayItems, getTotalDuration } = usePlanningStore();

  const metrics = useMemo(() => {
    if (!tripPlan) return null;

    const items = getDayItems(currentDayIndex);
    if (items.length === 0) return null;

    const totalDuration = getTotalDuration(currentDayIndex);

    let pacing: 'relaxed' | 'balanced' | 'packed';
    if (totalDuration < 240) {
      pacing = 'relaxed';
    } else if (totalDuration < 420) {
      pacing = 'balanced';
    } else {
      pacing = 'packed';
    }

    return { totalDuration, pacing, itemCount: items.length };
  }, [tripPlan, currentDayIndex, getDayItems, getTotalDuration]);

  if (!metrics) return null;

  const pacingConfig = PACING_CONFIG[metrics.pacing];

  return (
    <div className="flex items-center gap-3 text-body-3">
      <span className="text-rui-grey-50">
        {metrics.itemCount} stops · ~{formatDuration(metrics.totalDuration)}
      </span>
      <span
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${pacingConfig.bgColor} ${pacingConfig.color}`}
      >
        {pacingConfig.icon}
        {pacingConfig.label}
      </span>
    </div>
  );
}

// ============================================================================
// Progress Ring (Alternative Visualization)
// ============================================================================

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  percentage,
  size = 64,
  strokeWidth = 4,
  color = '#C45830',
  bgColor = '#E5DDD0',
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDuration(mins: number): string {
  if (mins === 0) return '0m';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  const remainder = mins % 60;
  if (remainder === 0) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export default FlowScoreCard;
