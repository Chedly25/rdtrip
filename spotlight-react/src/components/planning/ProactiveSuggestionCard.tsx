/**
 * ProactiveSuggestionCard
 *
 * Contextual companion suggestions that appear when the planner
 * detects patterns that might benefit from help.
 *
 * Design: Warm Editorial with friendly, helpful tone.
 * Suggestions should feel like a knowledgeable friend, not an algorithm.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lightbulb,
  X,
  ChevronRight,
  Utensils,
  Clock,
  Sunset,
  AlertTriangle,
  Sparkles,
  Coffee,
  MapPin,
  Moon,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export type SuggestionType =
  | 'no_lunch'
  | 'no_dinner'
  | 'empty_evening'
  | 'empty_morning'
  | 'overpacked'
  | 'underpacked'
  | 'long_distance'
  | 'hidden_gem'
  | 'weather_tip';

export interface ProactiveSuggestion {
  id: string;
  type: SuggestionType;
  dayIndex: number;
  title: string;
  message: string;
  actions: SuggestionAction[];
  priority: 'low' | 'medium' | 'high';
  dismissible: boolean;
}

export interface SuggestionAction {
  id: string;
  label: string;
  variant: 'primary' | 'secondary' | 'ghost';
  action: () => void;
}

interface ProactiveSuggestionCardProps {
  suggestion: ProactiveSuggestion;
  onDismiss: (id: string) => void;
  className?: string;
}

// ============================================================================
// Suggestion Configuration
// ============================================================================

const SUGGESTION_CONFIG: Record<
  SuggestionType,
  {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    borderColor: string;
    bgGradient: string;
  }
> = {
  no_lunch: {
    icon: <Utensils className="w-4 h-4" />,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    borderColor: 'border-orange-200/50',
    bgGradient: 'from-orange-50/80 to-amber-50/50',
  },
  no_dinner: {
    icon: <Utensils className="w-4 h-4" />,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    borderColor: 'border-rose-200/50',
    bgGradient: 'from-rose-50/80 to-pink-50/50',
  },
  empty_evening: {
    icon: <Sunset className="w-4 h-4" />,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    borderColor: 'border-amber-200/50',
    bgGradient: 'from-amber-50/80 to-orange-50/50',
  },
  empty_morning: {
    icon: <Coffee className="w-4 h-4" />,
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-600',
    borderColor: 'border-yellow-200/50',
    bgGradient: 'from-yellow-50/80 to-amber-50/50',
  },
  overpacked: {
    icon: <Clock className="w-4 h-4" />,
    iconBg: 'bg-rose-100',
    iconColor: 'text-rose-600',
    borderColor: 'border-rose-200/50',
    bgGradient: 'from-rose-50/80 to-red-50/50',
  },
  underpacked: {
    icon: <Lightbulb className="w-4 h-4" />,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    borderColor: 'border-blue-200/50',
    bgGradient: 'from-blue-50/80 to-cyan-50/50',
  },
  long_distance: {
    icon: <MapPin className="w-4 h-4" />,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    borderColor: 'border-purple-200/50',
    bgGradient: 'from-purple-50/80 to-violet-50/50',
  },
  hidden_gem: {
    icon: <Sparkles className="w-4 h-4" />,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    borderColor: 'border-emerald-200/50',
    bgGradient: 'from-emerald-50/80 to-teal-50/50',
  },
  weather_tip: {
    icon: <AlertTriangle className="w-4 h-4" />,
    iconBg: 'bg-sky-100',
    iconColor: 'text-sky-600',
    borderColor: 'border-sky-200/50',
    bgGradient: 'from-sky-50/80 to-blue-50/50',
  },
};

// ============================================================================
// Main Component
// ============================================================================

export function ProactiveSuggestionCard({
  suggestion,
  onDismiss,
  className = '',
}: ProactiveSuggestionCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isActioning, setIsActioning] = useState(false);

  const config = SUGGESTION_CONFIG[suggestion.type];

  const handleAction = useCallback(
    async (action: SuggestionAction) => {
      setIsActioning(true);
      try {
        await action.action();
        // Auto-dismiss after successful action
        setTimeout(() => onDismiss(suggestion.id), 300);
      } catch {
        // Handle error silently
      } finally {
        setIsActioning(false);
      }
    },
    [suggestion.id, onDismiss]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group ${className}`}
    >
      {/* Card */}
      <div
        className={`
          relative overflow-hidden rounded-xl border-2 transition-all duration-300
          ${config.borderColor}
          ${isHovered ? 'shadow-rui-3' : 'shadow-sm'}
        `}
      >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${config.bgGradient}`} />

        {/* Subtle pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Ccircle cx='3' cy='3' r='1'/%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        {/* Content */}
        <div className="relative p-4">
          <div className="flex gap-3">
            {/* Icon */}
            <div
              className={`
                flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
                ${config.iconBg} ${config.iconColor}
                transition-transform duration-300
                ${isHovered ? 'scale-110' : ''}
              `}
            >
              {config.icon}
            </div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-display text-base text-rui-black leading-tight">
                  {suggestion.title}
                </h4>

                {/* Day badge */}
                <span className="flex-shrink-0 px-2 py-0.5 rounded-md bg-white/70 text-body-3 text-rui-grey-50 font-medium">
                  Day {suggestion.dayIndex + 1}
                </span>
              </div>

              <p className="text-body-2 text-rui-grey-60 leading-relaxed mb-3">
                {suggestion.message}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2">
                {suggestion.actions.map((action) => (
                  <motion.button
                    key={action.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction(action)}
                    disabled={isActioning}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                      text-body-3 font-medium transition-all
                      ${
                        action.variant === 'primary'
                          ? 'bg-rui-accent text-white hover:bg-rui-accent/90 shadow-sm'
                          : action.variant === 'secondary'
                            ? 'bg-white text-rui-grey-70 border border-rui-grey-20 hover:bg-rui-grey-5'
                            : 'text-rui-grey-60 hover:text-rui-black hover:bg-white/50'
                      }
                      ${isActioning ? 'opacity-50 cursor-wait' : ''}
                    `}
                  >
                    {action.label}
                    {action.variant === 'primary' && (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Dismiss button */}
            {suggestion.dismissible && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: isHovered ? 1 : 0.5 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onDismiss(suggestion.id)}
                className="flex-shrink-0 p-1.5 rounded-lg text-rui-grey-40 hover:text-rui-grey-60 hover:bg-white/50 transition-all"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>

        {/* Priority indicator */}
        {suggestion.priority === 'high' && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-rose-400 to-orange-400"
          />
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// Suggestion List Container
// ============================================================================

interface ProactiveSuggestionListProps {
  suggestions: ProactiveSuggestion[];
  onDismiss: (id: string) => void;
  maxVisible?: number;
  className?: string;
}

export function ProactiveSuggestionList({
  suggestions,
  onDismiss,
  maxVisible = 3,
  className = '',
}: ProactiveSuggestionListProps) {
  const [showAll, setShowAll] = useState(false);

  const visibleSuggestions = showAll
    ? suggestions
    : suggestions.slice(0, maxVisible);

  const hiddenCount = suggestions.length - maxVisible;

  if (suggestions.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence mode="popLayout">
        {visibleSuggestions.map((suggestion) => (
          <ProactiveSuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>

      {/* Show more button */}
      {hiddenCount > 0 && !showAll && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowAll(true)}
          className="w-full py-2 text-body-3 text-rui-grey-50 hover:text-rui-accent transition-colors"
        >
          +{hiddenCount} more suggestion{hiddenCount > 1 ? 's' : ''}
        </motion.button>
      )}
    </div>
  );
}

// ============================================================================
// Compact Suggestion (for inline display)
// ============================================================================

interface CompactSuggestionProps {
  type: SuggestionType;
  message: string;
  onAction: () => void;
  actionLabel: string;
  onDismiss: () => void;
  className?: string;
}

export function CompactSuggestion({
  type,
  message,
  onAction,
  actionLabel,
  onDismiss,
  className = '',
}: CompactSuggestionProps) {
  const config = SUGGESTION_CONFIG[type];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={`overflow-hidden ${className}`}
    >
      <div
        className={`
          flex items-center gap-3 px-3 py-2 rounded-xl border
          ${config.borderColor} bg-gradient-to-r ${config.bgGradient}
        `}
      >
        <div className={`${config.iconColor}`}>{config.icon}</div>
        <p className="flex-1 text-body-3 text-rui-grey-70">{message}</p>
        <button
          onClick={onAction}
          className="px-2.5 py-1 rounded-lg bg-white/70 text-body-3 font-medium text-rui-accent hover:bg-white transition-colors"
        >
          {actionLabel}
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded text-rui-grey-40 hover:text-rui-grey-60"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Night Suggestion Card (Special variant)
// ============================================================================

interface NightSuggestionCardProps {
  dayIndex: number;
  onFindBar: () => void;
  onFindFood: () => void;
  onDismiss: () => void;
  className?: string;
}

export function NightSuggestionCard({
  dayIndex,
  onFindBar,
  onFindFood,
  onDismiss,
  className = '',
}: NightSuggestionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`relative overflow-hidden rounded-xl border border-indigo-200/50 ${className}`}
    >
      {/* Night sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/95 via-violet-900/90 to-purple-900/95" />

      {/* Stars pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `radial-gradient(2px 2px at 20px 30px, white, transparent),
                           radial-gradient(2px 2px at 40px 70px, white, transparent),
                           radial-gradient(1px 1px at 90px 40px, white, transparent),
                           radial-gradient(2px 2px at 130px 80px, white, transparent),
                           radial-gradient(1px 1px at 160px 30px, white, transparent)`,
        }}
      />

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-400/20 flex items-center justify-center">
            <Moon className="w-4 h-4 text-indigo-200" />
          </div>

          <div className="flex-1">
            <p className="text-body-3 text-indigo-300 mb-1">Day {dayIndex + 1}</p>
            <p className="text-body-2 text-white mb-3">
              Nothing planned for tonight yet. Want me to suggest something?
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={onFindBar}
                className="px-3 py-1.5 rounded-lg bg-indigo-400/20 text-indigo-200 text-body-3 font-medium hover:bg-indigo-400/30 transition-colors"
              >
                Find a bar
              </button>
              <button
                onClick={onFindFood}
                className="px-3 py-1.5 rounded-lg bg-indigo-400/20 text-indigo-200 text-body-3 font-medium hover:bg-indigo-400/30 transition-colors"
              >
                Late-night food
              </button>
              <button
                onClick={onDismiss}
                className="px-3 py-1.5 rounded-lg text-indigo-400 text-body-3 hover:text-indigo-300 transition-colors"
              >
                Leave it free
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default ProactiveSuggestionCard;
