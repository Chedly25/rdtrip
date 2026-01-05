/**
 * VoyagerStreamingUI
 *
 * Elegant streaming indicators for the Voyager Discovery Agent.
 * Warm Editorial aesthetic - sophisticated, unobtrusive, like watching
 * a thoughtful companion work.
 *
 * Components:
 * - VoyagerThinkingIndicator: Shows thinking state with animated dots
 * - VoyagerToolBadge: Inline badge showing active tool
 * - VoyagerActionNotification: Toast for route actions
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  MapPin,
  Search,
  Replace,
  ArrowUpDown,
  Moon,
  BarChart3,
  Sparkles,
  Check,
  Plus,
  Minus,
  RefreshCw,
} from 'lucide-react';

// ============================================================================
// Voyager Thinking Indicator
// ============================================================================

interface VoyagerThinkingIndicatorProps {
  isThinking: boolean;
  text?: string;
}

export function VoyagerThinkingIndicator({
  isThinking,
  text,
}: VoyagerThinkingIndicatorProps) {
  return (
    <AnimatePresence>
      {isThinking && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="flex items-start gap-3 mr-8"
        >
          {/* Voyager avatar with breathing animation */}
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.9, 1, 0.9],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="
              w-8 h-8 rounded-full flex-shrink-0
              bg-gradient-to-br from-amber-100 to-orange-100
              border border-amber-200/60
              flex items-center justify-center
              shadow-sm
            "
          >
            <Compass className="w-4 h-4 text-amber-700" />
          </motion.div>

          {/* Thinking bubble */}
          <div
            className="
              flex-1 rounded-2xl rounded-tl-md
              bg-gradient-to-br from-stone-50 to-stone-100/80
              border border-stone-200/60
              px-4 py-3
              shadow-sm
            "
          >
            <div className="flex items-center gap-3">
              {/* Animated dots */}
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.span
                    key={i}
                    animate={{
                      opacity: [0.3, 1, 0.3],
                      scale: [0.85, 1, 0.85],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.15,
                      ease: 'easeInOut',
                    }}
                    className="w-1.5 h-1.5 rounded-full bg-amber-500"
                  />
                ))}
              </div>

              {/* Thinking text */}
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-stone-500 font-medium tracking-tight"
                style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}
              >
                {text || 'Thinking...'}
              </motion.span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Voyager Tool Badge
// ============================================================================

interface VoyagerToolBadgeProps {
  tool: {
    name: string;
    displayName: string;
  } | null;
}

const TOOL_ICONS: Record<string, typeof Search> = {
  search_cities: Search,
  add_city_to_route: Plus,
  remove_city_from_route: Minus,
  replace_city: Replace,
  reorder_cities: ArrowUpDown,
  adjust_nights: Moon,
  analyze_route: BarChart3,
  get_city_highlights: Sparkles,
  search_places_in_city: MapPin,
};

export function VoyagerToolBadge({ tool }: VoyagerToolBadgeProps) {
  return (
    <AnimatePresence>
      {tool && (
        <motion.div
          initial={{ opacity: 0, x: -8, scale: 0.9 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 8, scale: 0.9 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
          className="inline-flex items-center gap-2 mb-2"
        >
          <div
            className="
              inline-flex items-center gap-2
              px-3 py-1.5
              rounded-full
              bg-gradient-to-r from-amber-50 to-orange-50
              border border-amber-200/60
              shadow-sm
            "
          >
            {/* Tool icon with pulse */}
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              {(() => {
                const Icon = TOOL_ICONS[tool.name] || Compass;
                return <Icon className="w-3.5 h-3.5 text-amber-600" />;
              })()}
            </motion.div>

            {/* Tool name */}
            <span
              className="text-xs font-medium text-amber-700 tracking-tight"
              style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}
            >
              {tool.displayName}
            </span>

            {/* Subtle loading spinner */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              }}
              className="w-3 h-3"
            >
              <RefreshCw className="w-3 h-3 text-amber-400" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Voyager Action Notification
// ============================================================================

interface VoyagerActionNotificationProps {
  action: {
    type: string;
    city?: { name: string };
    oldCity?: { name: string };
    newCity?: { name: string };
  } | null;
  onDismiss?: () => void;
}

const ACTION_CONFIGS: Record<string, {
  icon: typeof Check;
  label: (action: VoyagerActionNotificationProps['action']) => string;
  color: string;
}> = {
  add_city: {
    icon: Plus,
    label: (a) => `Added ${a?.city?.name || 'city'} to route`,
    color: 'from-emerald-50 to-teal-50 border-emerald-200 text-emerald-700',
  },
  remove_city: {
    icon: Minus,
    label: (a) => `Removed ${a?.city?.name || 'city'} from route`,
    color: 'from-rose-50 to-pink-50 border-rose-200 text-rose-700',
  },
  replace_city: {
    icon: Replace,
    label: (a) => `Replaced ${a?.oldCity?.name || 'city'} with ${a?.newCity?.name || 'new city'}`,
    color: 'from-violet-50 to-purple-50 border-violet-200 text-violet-700',
  },
  reorder: {
    icon: ArrowUpDown,
    label: () => 'Optimized route order',
    color: 'from-blue-50 to-indigo-50 border-blue-200 text-blue-700',
  },
  adjust_nights: {
    icon: Moon,
    label: (a) => `Updated nights in ${a?.city?.name || 'city'}`,
    color: 'from-amber-50 to-orange-50 border-amber-200 text-amber-700',
  },
};

export function VoyagerActionNotification({
  action,
  onDismiss,
}: VoyagerActionNotificationProps) {
  const config = action ? ACTION_CONFIGS[action.type] : null;

  return (
    <AnimatePresence>
      {action && config && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          onAnimationComplete={() => {
            // Auto-dismiss after 3 seconds
            setTimeout(() => onDismiss?.(), 3000);
          }}
          className={`
            inline-flex items-center gap-2.5
            px-4 py-2.5
            rounded-xl
            bg-gradient-to-r ${config.color}
            border
            shadow-lg shadow-stone-200/50
          `}
        >
          {/* Success checkmark */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
          >
            <Check className="w-4 h-4" />
          </motion.div>

          {/* Action text */}
          <span
            className="text-sm font-medium tracking-tight"
            style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}
          >
            {config.label(action)}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Voyager Proactive Suggestion Card
// ============================================================================

interface VoyagerProactiveSuggestionProps {
  suggestion: {
    message: string;
    quickActions: Array<{ label: string; action: string; data?: unknown }>;
    priority: 'high' | 'medium' | 'low';
  } | null;
  onAction: (action: string, data?: unknown) => void;
  onDismiss: () => void;
}

export function VoyagerProactiveSuggestion({
  suggestion,
  onAction,
  onDismiss,
}: VoyagerProactiveSuggestionProps) {
  return (
    <AnimatePresence>
      {suggestion && (
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="
            rounded-2xl
            bg-gradient-to-br from-amber-50 via-orange-50/80 to-rose-50/60
            border border-amber-200/50
            shadow-xl shadow-amber-100/50
            overflow-hidden
          "
        >
          {/* Subtle top accent line */}
          <div className="h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400" />

          <div className="p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="
                  w-8 h-8 rounded-full flex-shrink-0
                  bg-gradient-to-br from-amber-400 to-orange-500
                  flex items-center justify-center
                  shadow-lg shadow-amber-500/30
                "
              >
                <Sparkles className="w-4 h-4 text-white" />
              </motion.div>

              <div className="flex-1">
                <p
                  className="text-sm text-stone-700 leading-relaxed"
                  style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}
                >
                  {suggestion.message}
                </p>
              </div>

              {/* Dismiss button */}
              <button
                onClick={onDismiss}
                className="
                  p-1.5 rounded-lg
                  text-stone-400 hover:text-stone-600
                  hover:bg-stone-100
                  transition-colors
                "
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Quick actions */}
            {suggestion.quickActions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggestion.quickActions.map((action, i) => (
                  <motion.button
                    key={action.action}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.05 }}
                    onClick={() => onAction(action.action, action.data)}
                    className={`
                      px-3 py-1.5 rounded-lg
                      text-sm font-medium
                      transition-all duration-200
                      ${i === 0
                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40'
                        : 'bg-white/80 text-stone-600 border border-stone-200 hover:bg-white hover:border-stone-300'
                      }
                    `}
                    style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}
                  >
                    {action.label}
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Voyager Message Bubble
// ============================================================================

interface VoyagerMessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  actions?: Array<{ type: string; city?: { name: string } }>;
}

export function VoyagerMessageBubble({
  role,
  content,
  isStreaming,
  actions,
}: VoyagerMessageBubbleProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`
          max-w-[85%]
          ${isUser ? 'ml-8' : 'mr-8'}
        `}
      >
        {/* Avatar for assistant */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1.5">
            <div
              className="
                w-6 h-6 rounded-full
                bg-gradient-to-br from-amber-100 to-orange-100
                border border-amber-200/60
                flex items-center justify-center
              "
            >
              <Compass className="w-3 h-3 text-amber-700" />
            </div>
            <span
              className="text-xs font-medium text-stone-500 tracking-wide"
              style={{ fontFamily: 'Fraunces, serif' }}
            >
              Voyager
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`
            rounded-2xl px-4 py-3
            ${isUser
              ? 'rounded-br-md bg-gradient-to-br from-stone-800 to-stone-900 text-white'
              : 'rounded-tl-md bg-gradient-to-br from-stone-50 to-stone-100/80 border border-stone-200/60 text-stone-700'
            }
            ${isStreaming ? 'animate-pulse' : ''}
          `}
        >
          <p
            className="text-[15px] leading-relaxed whitespace-pre-wrap"
            style={{ fontFamily: 'Satoshi, system-ui, sans-serif' }}
          >
            {content}
            {isStreaming && (
              <motion.span
                animate={{ opacity: [1, 0.4, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-0.5 h-4 bg-current ml-0.5 align-middle"
              />
            )}
          </p>

          {/* Action badges */}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-stone-200/50">
              {actions.map((action, i) => (
                <span
                  key={i}
                  className="
                    inline-flex items-center gap-1
                    px-2 py-0.5 rounded-full
                    bg-emerald-100/80 text-emerald-700
                    text-xs font-medium
                  "
                >
                  <Check className="w-3 h-3" />
                  {action.city?.name || action.type}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
