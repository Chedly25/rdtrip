/**
 * DraggableActivityList
 *
 * WI-5.6: Draggable activity list for reordering within a day's time slot
 *
 * Features:
 * - Drag to reorder activities within a slot
 * - Visual drag handle with grip indicator
 * - Smooth animations during drag
 * - Integrates with ItineraryActivityCard for display
 */

import { Reorder, useDragControls, AnimatePresence, motion } from 'framer-motion';
import { GripVertical, Plus } from 'lucide-react';
import { ItineraryActivityCard } from './ItineraryActivityCard';
import type { ItineraryActivity, TimeSlot } from '../../services/itinerary';

// ============================================================================
// Types
// ============================================================================

interface DraggableActivityListProps {
  /** Activities to display and reorder */
  activities: ItineraryActivity[];
  /** Time slot these activities belong to */
  slot: TimeSlot;
  /** Whether editing is enabled */
  isEditing: boolean;
  /** ID of the currently active activity */
  activeActivityId?: string | null;
  /** Set of completed activity IDs */
  completedActivityIds?: Set<string>;
  /** Callback when activities are reordered */
  onReorder: (reorderedActivities: ItineraryActivity[]) => void;
  /** Activity action callbacks */
  onViewDetails?: (activity: ItineraryActivity) => void;
  onSwap?: (activity: ItineraryActivity) => void;
  onRemove?: (activity: ItineraryActivity) => void;
  onNavigate?: (activity: ItineraryActivity) => void;
  /** Add activity to this slot */
  onAddActivity?: () => void;
}

interface DraggableActivityItemProps {
  activity: ItineraryActivity;
  isEditing: boolean;
  isActive: boolean;
  isCompleted: boolean;
  showConnector: boolean;
  onViewDetails?: (activity: ItineraryActivity) => void;
  onSwap?: (activity: ItineraryActivity) => void;
  onRemove?: (activity: ItineraryActivity) => void;
  onNavigate?: (activity: ItineraryActivity) => void;
}

// ============================================================================
// Slot Labels
// ============================================================================

const slotConfig: Record<TimeSlot, { label: string; emoji: string; gradient: string }> = {
  morning: {
    label: 'Morning',
    emoji: '🌅',
    gradient: 'from-amber-100 to-orange-100',
  },
  afternoon: {
    label: 'Afternoon',
    emoji: '☀️',
    gradient: 'from-sky-100 to-blue-100',
  },
  evening: {
    label: 'Evening',
    emoji: '🌙',
    gradient: 'from-indigo-100 to-purple-100',
  },
};

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Slot header with time range
 */
function SlotHeader({ slot, activityCount }: { slot: TimeSlot; activityCount: number }) {
  const config = slotConfig[slot];

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className={`px-3 py-1.5 rounded-lg bg-gradient-to-r ${config.gradient}`}>
        <span className="text-sm font-medium text-stone-700">
          {config.emoji} {config.label}
        </span>
      </div>
      {activityCount > 0 && (
        <span className="text-xs text-stone-400">
          {activityCount} {activityCount === 1 ? 'activity' : 'activities'}
        </span>
      )}
    </div>
  );
}

/**
 * Add activity button
 */
function AddActivityButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-stone-200 hover:border-terracotta/50 hover:bg-terracotta/5 text-stone-400 hover:text-terracotta transition-all group"
    >
      <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span className="font-medium">Add activity</span>
    </motion.button>
  );
}

/**
 * Draggable activity item wrapper
 */
function DraggableActivityItem({
  activity,
  isEditing,
  isActive,
  isCompleted,
  showConnector,
  onViewDetails,
  onSwap,
  onRemove,
  onNavigate,
}: DraggableActivityItemProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={activity}
      dragListener={false}
      dragControls={dragControls}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      whileDrag={{
        scale: 1.02,
        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
        zIndex: 50,
      }}
      className="relative"
    >
      <div className="flex items-stretch gap-2">
        {/* Drag handle - only visible in edit mode */}
        {isEditing && (
          <div
            onPointerDown={(e) => dragControls.start(e)}
            className="
              flex items-center justify-center w-8
              cursor-grab active:cursor-grabbing
              text-stone-300 hover:text-stone-500
              touch-none transition-colors
              rounded-l-xl
              hover:bg-stone-100
            "
            aria-label="Drag to reorder"
          >
            <GripVertical className="w-5 h-5" />
          </div>
        )}

        {/* Activity card */}
        <div className="flex-1">
          <ItineraryActivityCard
            activity={activity}
            isActive={isActive}
            isCompleted={isCompleted}
            showConnector={showConnector}
            onViewDetails={onViewDetails}
            onSwap={onSwap}
            onRemove={onRemove}
            onNavigate={onNavigate}
          />
        </div>
      </div>
    </Reorder.Item>
  );
}

/**
 * Non-draggable activity item (for view mode)
 */
function StaticActivityItem({
  activity,
  isActive,
  isCompleted,
  showConnector,
  onViewDetails,
  onSwap,
  onRemove,
  onNavigate,
}: Omit<DraggableActivityItemProps, 'isEditing'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className="relative"
    >
      <ItineraryActivityCard
        activity={activity}
        isActive={isActive}
        isCompleted={isCompleted}
        showConnector={showConnector}
        onViewDetails={onViewDetails}
        onSwap={onSwap}
        onRemove={onRemove}
        onNavigate={onNavigate}
      />
    </motion.div>
  );
}

/**
 * Empty slot placeholder
 */
function EmptySlot({ slot, isEditing, onAddActivity }: {
  slot: TimeSlot;
  isEditing: boolean;
  onAddActivity?: () => void;
}) {
  const config = slotConfig[slot];

  return (
    <div className="py-6 text-center">
      {isEditing && onAddActivity ? (
        <AddActivityButton onClick={onAddActivity} />
      ) : (
        <div className="flex flex-col items-center gap-2">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center text-xl`}>
            {config.emoji}
          </div>
          <p className="text-sm text-stone-400">
            No {config.label.toLowerCase()} activities planned
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DraggableActivityList({
  activities,
  slot,
  isEditing,
  activeActivityId,
  completedActivityIds = new Set(),
  onReorder,
  onViewDetails,
  onSwap,
  onRemove,
  onNavigate,
  onAddActivity,
}: DraggableActivityListProps) {
  // Handle reorder
  const handleReorder = (reorderedActivities: ItineraryActivity[]) => {
    onReorder(reorderedActivities);
  };

  return (
    <div className="mb-6">
      {/* Slot header */}
      <SlotHeader slot={slot} activityCount={activities.length} />

      {/* Activities */}
      {activities.length > 0 ? (
        isEditing ? (
          // Draggable list in edit mode
          <Reorder.Group
            axis="y"
            values={activities}
            onReorder={handleReorder}
            className="space-y-4"
          >
            <AnimatePresence mode="popLayout">
              {activities.map((activity, index) => (
                <DraggableActivityItem
                  key={activity.id}
                  activity={activity}
                  isEditing={isEditing}
                  isActive={activity.id === activeActivityId}
                  isCompleted={completedActivityIds.has(activity.id)}
                  showConnector={index < activities.length - 1}
                  onViewDetails={onViewDetails}
                  onSwap={onSwap}
                  onRemove={onRemove}
                  onNavigate={onNavigate}
                />
              ))}
            </AnimatePresence>
          </Reorder.Group>
        ) : (
          // Static list in view mode
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {activities.map((activity, index) => (
                <StaticActivityItem
                  key={activity.id}
                  activity={activity}
                  isActive={activity.id === activeActivityId}
                  isCompleted={completedActivityIds.has(activity.id)}
                  showConnector={index < activities.length - 1}
                  onViewDetails={onViewDetails}
                  onSwap={onSwap}
                  onRemove={onRemove}
                  onNavigate={onNavigate}
                />
              ))}
            </AnimatePresence>
          </div>
        )
      ) : (
        <EmptySlot slot={slot} isEditing={isEditing} onAddActivity={onAddActivity} />
      )}

      {/* Add button at the end of non-empty slots in edit mode */}
      {isEditing && activities.length > 0 && onAddActivity && (
        <div className="mt-3">
          <AddActivityButton onClick={onAddActivity} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Day Activity List (combines all time slots)
// ============================================================================

interface DayActivityListProps {
  /** All activities for the day, grouped by slot */
  activitiesBySlot: Record<TimeSlot, ItineraryActivity[]>;
  /** Whether editing is enabled */
  isEditing: boolean;
  /** ID of the currently active activity */
  activeActivityId?: string | null;
  /** Set of completed activity IDs */
  completedActivityIds?: Set<string>;
  /** Callback when activities in a slot are reordered */
  onReorderInSlot: (slot: TimeSlot, reorderedActivities: ItineraryActivity[]) => void;
  /** Activity action callbacks */
  onViewDetails?: (activity: ItineraryActivity) => void;
  onSwap?: (activity: ItineraryActivity) => void;
  onRemove?: (activity: ItineraryActivity) => void;
  onNavigate?: (activity: ItineraryActivity) => void;
  /** Add activity to a slot */
  onAddToSlot?: (slot: TimeSlot) => void;
}

export function DayActivityList({
  activitiesBySlot,
  isEditing,
  activeActivityId,
  completedActivityIds,
  onReorderInSlot,
  onViewDetails,
  onSwap,
  onRemove,
  onNavigate,
  onAddToSlot,
}: DayActivityListProps) {
  const slots: TimeSlot[] = ['morning', 'afternoon', 'evening'];

  return (
    <div>
      {slots.map((slot) => (
        <DraggableActivityList
          key={slot}
          activities={activitiesBySlot[slot] || []}
          slot={slot}
          isEditing={isEditing}
          activeActivityId={activeActivityId}
          completedActivityIds={completedActivityIds}
          onReorder={(activities) => onReorderInSlot(slot, activities)}
          onViewDetails={onViewDetails}
          onSwap={onSwap}
          onRemove={onRemove}
          onNavigate={onNavigate}
          onAddActivity={onAddToSlot ? () => onAddToSlot(slot) : undefined}
        />
      ))}
    </div>
  );
}
