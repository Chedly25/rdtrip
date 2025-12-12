/**
 * TimeBlocksDisplay
 *
 * A visual timeline showing how time is allocated during a city visit.
 * Designed with a warm, editorial aesthetic that feels like a curated travel guide.
 *
 * Design Philosophy:
 * - Horizontal flow representing the journey through time
 * - Each block is a "capsule" with mood-specific coloring
 * - Subtle depth through shadows and layering
 * - Organic, rounded forms that feel inviting
 * - Warm color palette: terracotta, sage, amber, slate
 */

import { motion } from 'framer-motion';
import {
  Sun,
  Sunset,
  Moon,
  Coffee,
  Utensils,
  Camera,
  MapPin,
  Plane,
  Sparkles,
} from 'lucide-react';
import type { TimeBlock } from '../../types/cityIntelligence';

// =============================================================================
// Types
// =============================================================================

interface TimeBlocksDisplayProps {
  blocks: TimeBlock[];
  totalHours?: number;
  nights?: number;
  /** Compact mode for card embedding */
  compact?: boolean;
  /** Animation delay */
  delay?: number;
}

// =============================================================================
// Configuration
// =============================================================================

// Mood-based visual configuration
const MOOD_CONFIG = {
  explore: {
    gradient: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-200',
    icon: MapPin,
    iconColor: 'text-emerald-600',
    accentColor: 'bg-emerald-500',
    label: 'Explore',
  },
  dine: {
    gradient: 'from-rose-50 to-orange-50',
    border: 'border-rose-200',
    icon: Utensils,
    iconColor: 'text-rose-500',
    accentColor: 'bg-rose-500',
    label: 'Dine',
  },
  activity: {
    gradient: 'from-sky-50 to-indigo-50',
    border: 'border-sky-200',
    icon: Camera,
    iconColor: 'text-sky-600',
    accentColor: 'bg-sky-500',
    label: 'Activity',
  },
  depart: {
    gradient: 'from-slate-50 to-gray-100',
    border: 'border-slate-200',
    icon: Plane,
    iconColor: 'text-slate-500',
    accentColor: 'bg-slate-500',
    label: 'Depart',
  },
  arrive: {
    gradient: 'from-violet-50 to-purple-50',
    border: 'border-violet-200',
    icon: Sparkles,
    iconColor: 'text-violet-500',
    accentColor: 'bg-violet-500',
    label: 'Arrive',
  },
};

// Time of day icons
const TIME_ICONS = {
  Morning: Sun,
  Afternoon: Sunset,
  Evening: Moon,
};

// =============================================================================
// Main Component
// =============================================================================

export function TimeBlocksDisplay({
  blocks,
  totalHours,
  nights,
  compact = false,
  delay = 0,
}: TimeBlocksDisplayProps) {
  // Group blocks by day
  const blocksByDay = blocks.reduce((acc, block) => {
    const day = block.dayNumber || 1;
    if (!acc[day]) acc[day] = [];
    acc[day].push(block);
    return acc;
  }, {} as Record<number, TimeBlock[]>);

  const days = Object.entries(blocksByDay).sort(
    ([a], [b]) => Number(a) - Number(b)
  );

  if (compact) {
    return (
      <CompactTimelineView
        blocks={blocks}
        totalHours={totalHours}
        delay={delay}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, delay }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-gray-900">
            Your Time
          </h3>
          {totalHours && (
            <p className="text-sm text-gray-500">
              ~{Math.round(totalHours)} hours of exploration
            </p>
          )}
        </div>
        {nights && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
            <Moon className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              {nights} {nights === 1 ? 'night' : 'nights'}
            </span>
          </div>
        )}
      </div>

      {/* Timeline by day */}
      <div className="space-y-4">
        {days.map(([dayNum, dayBlocks], dayIdx) => (
          <DayTimeline
            key={dayNum}
            dayNumber={Number(dayNum)}
            blocks={dayBlocks}
            delay={delay + dayIdx * 0.1}
            isLast={dayIdx === days.length - 1}
          />
        ))}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Day Timeline
// =============================================================================

interface DayTimelineProps {
  dayNumber: number;
  blocks: TimeBlock[];
  delay: number;
  isLast: boolean;
}

function DayTimeline({ dayNumber, blocks, delay, isLast }: DayTimelineProps) {
  const totalDayHours = blocks.reduce((sum, b) => sum + b.hours, 0);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative"
    >
      {/* Day header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-900 text-white text-sm font-bold">
          {dayNumber}
        </div>
        <div>
          <span className="font-medium text-gray-900">
            Day {dayNumber}
          </span>
          <span className="text-gray-400 text-sm ml-2">
            {Math.round(totalDayHours)}h
          </span>
        </div>
      </div>

      {/* Time blocks */}
      <div className="ml-4 pl-6 border-l-2 border-gray-100">
        <div className="flex flex-wrap gap-2">
          {blocks.map((block, idx) => (
            <TimeBlockCard
              key={block.id}
              block={block}
              delay={delay + idx * 0.05}
            />
          ))}
        </div>
      </div>

      {/* Connector line */}
      {!isLast && (
        <div className="absolute left-4 top-12 bottom-0 w-0.5 bg-gradient-to-b from-gray-200 to-transparent" />
      )}
    </motion.div>
  );
}

// =============================================================================
// Time Block Card
// =============================================================================

interface TimeBlockCardProps {
  block: TimeBlock;
  delay: number;
}

function TimeBlockCard({ block, delay }: TimeBlockCardProps) {
  const config = MOOD_CONFIG[block.mood] || MOOD_CONFIG.explore;
  const Icon = config.icon;

  // Determine time of day icon
  const TimeIcon = block.name.includes('Morning')
    ? TIME_ICONS.Morning
    : block.name.includes('Afternoon')
    ? TIME_ICONS.Afternoon
    : block.name.includes('Evening')
    ? TIME_ICONS.Evening
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay }}
      whileHover={{ scale: 1.02, y: -2 }}
      className={`
        relative overflow-hidden
        px-4 py-3 rounded-2xl
        bg-gradient-to-br ${config.gradient}
        border ${config.border}
        cursor-default
        group
      `}
    >
      {/* Accent bar */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 ${config.accentColor}`}
      />

      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={`
            flex items-center justify-center
            w-9 h-9 rounded-xl
            bg-white/70 backdrop-blur-sm
            shadow-sm
            ${config.iconColor}
          `}
        >
          <Icon className="w-4.5 h-4.5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 text-sm">
              {block.name.replace(/Day \d+ /, '')}
            </span>
            {TimeIcon && (
              <TimeIcon className="w-3.5 h-3.5 text-gray-400" />
            )}
          </div>

          {/* Hours badge */}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-semibold text-gray-600 tabular-nums">
              {block.hours}h
            </span>
            {block.flexibility && (
              <FlexibilityBadge level={block.flexibility} />
            )}
          </div>

          {/* Suggestion */}
          {block.suggested && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-1 group-hover:line-clamp-none transition-all">
              {block.suggested}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Flexibility Badge
// =============================================================================

function FlexibilityBadge({ level }: { level: 'high' | 'medium' | 'low' }) {
  const configs = {
    high: { label: 'Flexible', color: 'text-emerald-600 bg-emerald-50' },
    medium: { label: 'Moderate', color: 'text-amber-600 bg-amber-50' },
    low: { label: 'Fixed', color: 'text-slate-600 bg-slate-50' },
  };

  const config = configs[level];

  return (
    <span
      className={`
        inline-flex items-center
        px-1.5 py-0.5 rounded
        text-[10px] font-medium uppercase tracking-wide
        ${config.color}
      `}
    >
      {config.label}
    </span>
  );
}

// =============================================================================
// Compact Timeline View
// =============================================================================

interface CompactTimelineViewProps {
  blocks: TimeBlock[];
  totalHours?: number;
  delay: number;
}

function CompactTimelineView({
  blocks,
  totalHours,
  delay,
}: CompactTimelineViewProps) {
  // Show just mood pills
  const moodSummary = blocks.reduce((acc, block) => {
    acc[block.mood] = (acc[block.mood] || 0) + block.hours;
    return acc;
  }, {} as Record<string, number>);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay }}
    >
      {/* Horizontal pill bar */}
      <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden bg-gray-100">
        {Object.entries(moodSummary).map(([mood, hours]) => {
          const config = MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG];
          const percentage = totalHours ? (hours / totalHours) * 100 : 25;

          return (
            <motion.div
              key={mood}
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.5, delay: delay + 0.2 }}
              className={`h-full ${config?.accentColor || 'bg-gray-400'}`}
              title={`${config?.label || mood}: ${Math.round(hours)}h`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2">
        {Object.entries(moodSummary)
          .slice(0, 3)
          .map(([mood, hours]) => {
            const config = MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG];
            return (
              <div key={mood} className="flex items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full ${config?.accentColor || 'bg-gray-400'}`}
                />
                <span className="text-xs text-gray-500">
                  {config?.label || mood}
                </span>
              </div>
            );
          })}
        {totalHours && (
          <span className="text-xs text-gray-400 ml-auto">
            {Math.round(totalHours)}h total
          </span>
        )}
      </div>
    </motion.div>
  );
}

export default TimeBlocksDisplay;
