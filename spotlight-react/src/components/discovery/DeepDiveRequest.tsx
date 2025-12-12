/**
 * DeepDiveRequest
 *
 * An elegant interface for requesting deeper intelligence on specific topics.
 * Users can tap quick-action chips or type custom queries to get more detailed
 * information from the AI agents.
 *
 * Design Philosophy:
 * - Conversational, approachable UI
 * - Quick-action chips for common questions
 * - Typewriter-style input for custom queries
 * - Visual feedback during processing
 * - Integrates seamlessly with companion sidebar
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Send,
  Utensils,
  Wine,
  Camera,
  Footprints,
  ShoppingBag,
  TreePine,
  Clock,
  Car,
  Gem,
  CloudSun,
  MessageCircle,
  Loader2,
  ChevronRight,
  X,
  Zap,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export type DeepDiveTopic =
  | 'restaurants'
  | 'nightlife'
  | 'photography'
  | 'walking'
  | 'shopping'
  | 'nature'
  | 'timing'
  | 'parking'
  | 'hidden_gems'
  | 'weather'
  | 'custom';

interface DeepDiveRequestProps {
  /** City ID to request deep dive for */
  cityId: string;
  /** City name for display */
  cityName: string;
  /** Callback when deep dive is requested */
  onRequest: (topic: DeepDiveTopic, customQuery?: string) => Promise<void>;
  /** Whether a request is currently processing */
  isLoading?: boolean;
  /** Compact mode for inline use */
  compact?: boolean;
  /** Topics to show (defaults to all) */
  availableTopics?: DeepDiveTopic[];
}

interface TopicConfig {
  icon: typeof Utensils;
  label: string;
  prompt: string;
  color: string;
  bgColor: string;
}

// =============================================================================
// Configuration
// =============================================================================

const TOPIC_CONFIG: Record<Exclude<DeepDiveTopic, 'custom'>, TopicConfig> = {
  restaurants: {
    icon: Utensils,
    label: 'Restaurants',
    prompt: 'Find the best restaurants',
    color: '#f43f5e',
    bgColor: '#fef2f2',
  },
  nightlife: {
    icon: Wine,
    label: 'Nightlife',
    prompt: 'Discover evening entertainment',
    color: '#a855f7',
    bgColor: '#faf5ff',
  },
  photography: {
    icon: Camera,
    label: 'Photo spots',
    prompt: 'Find Instagram-worthy locations',
    color: '#ec4899',
    bgColor: '#fdf2f8',
  },
  walking: {
    icon: Footprints,
    label: 'Walking routes',
    prompt: 'Plan walkable itineraries',
    color: '#10b981',
    bgColor: '#ecfdf5',
  },
  shopping: {
    icon: ShoppingBag,
    label: 'Shopping',
    prompt: 'Discover local shops and markets',
    color: '#f59e0b',
    bgColor: '#fffbeb',
  },
  nature: {
    icon: TreePine,
    label: 'Nature',
    prompt: 'Find parks and outdoor activities',
    color: '#22c55e',
    bgColor: '#f0fdf4',
  },
  timing: {
    icon: Clock,
    label: 'Best times',
    prompt: 'Optimize visit timing',
    color: '#3b82f6',
    bgColor: '#eff6ff',
  },
  parking: {
    icon: Car,
    label: 'Parking',
    prompt: 'Find parking options',
    color: '#6366f1',
    bgColor: '#eef2ff',
  },
  hidden_gems: {
    icon: Gem,
    label: 'Hidden gems',
    prompt: 'Uncover local secrets',
    color: '#eab308',
    bgColor: '#fefce8',
  },
  weather: {
    icon: CloudSun,
    label: 'Weather tips',
    prompt: 'Get weather-aware recommendations',
    color: '#0ea5e9',
    bgColor: '#f0f9ff',
  },
};

const DEFAULT_TOPICS: DeepDiveTopic[] = [
  'restaurants',
  'hidden_gems',
  'photography',
  'walking',
  'nightlife',
  'timing',
];

// =============================================================================
// Main Component
// =============================================================================

export function DeepDiveRequest({
  cityId,
  cityName,
  onRequest,
  isLoading = false,
  compact = false,
  availableTopics = DEFAULT_TOPICS,
}: DeepDiveRequestProps) {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<DeepDiveTopic | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleTopicClick = useCallback(async (topic: DeepDiveTopic) => {
    if (isLoading) return;
    setSelectedTopic(topic);
    try {
      await onRequest(topic);
    } finally {
      setSelectedTopic(null);
    }
  }, [onRequest, isLoading]);

  const handleCustomSubmit = useCallback(async () => {
    if (!customQuery.trim() || isLoading) return;
    setSelectedTopic('custom');
    try {
      await onRequest('custom', customQuery.trim());
      setCustomQuery('');
      setShowCustomInput(false);
    } finally {
      setSelectedTopic(null);
    }
  }, [customQuery, onRequest, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCustomSubmit();
    }
    if (e.key === 'Escape') {
      setShowCustomInput(false);
      setCustomQuery('');
    }
  };

  return (
    <div className={compact ? '' : 'space-y-4'}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Explore deeper</h4>
            <p className="text-xs text-gray-500">Ask about {cityName}</p>
          </div>
        </div>
      )}

      {/* Topic chips */}
      <div className={`flex flex-wrap gap-2 ${compact ? '' : 'mt-3'}`}>
        {availableTopics.filter(t => t !== 'custom').map((topic) => {
          const config = TOPIC_CONFIG[topic as keyof typeof TOPIC_CONFIG];
          if (!config) return null;

          const Icon = config.icon;
          const isSelected = selectedTopic === topic;
          const isDisabled = isLoading && selectedTopic !== topic;

          return (
            <motion.button
              key={topic}
              whileHover={{ scale: isDisabled ? 1 : 1.02 }}
              whileTap={{ scale: isDisabled ? 1 : 0.98 }}
              onClick={() => handleTopicClick(topic)}
              disabled={isDisabled}
              className={`
                group relative flex items-center gap-1.5
                px-3 py-1.5 rounded-full
                text-xs font-medium
                border transition-all duration-200
                ${isDisabled
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer hover:shadow-md'
                }
                ${isSelected
                  ? 'border-transparent shadow-lg'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
              style={{
                backgroundColor: isSelected ? config.color : config.bgColor,
                color: isSelected ? 'white' : config.color,
              }}
            >
              {isSelected && isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader2 className="w-3.5 h-3.5" />
                </motion.div>
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              <span>{config.label}</span>

              {/* Hover tooltip */}
              <span className="
                absolute bottom-full left-1/2 -translate-x-1/2 mb-2
                px-2 py-1 rounded-md
                bg-gray-900 text-white text-xs
                opacity-0 group-hover:opacity-100 pointer-events-none
                transition-opacity whitespace-nowrap
                shadow-lg
              ">
                {config.prompt}
              </span>
            </motion.button>
          );
        })}

        {/* Custom query button */}
        <motion.button
          whileHover={{ scale: isLoading ? 1 : 1.02 }}
          whileTap={{ scale: isLoading ? 1 : 0.98 }}
          onClick={() => {
            setShowCustomInput(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          disabled={isLoading}
          className={`
            flex items-center gap-1.5
            px-3 py-1.5 rounded-full
            text-xs font-medium
            border border-dashed border-gray-300
            text-gray-500 hover:text-gray-700 hover:border-gray-400
            transition-colors
            ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Ask anything</span>
        </motion.button>
      </div>

      {/* Custom input field */}
      <AnimatePresence>
        {showCustomInput && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="relative mt-3">
              <div className="
                flex items-center gap-2
                p-2 rounded-xl
                bg-gray-50 border border-gray-200
                focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/20
                transition-all
              ">
                <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 ml-1" />
                <input
                  ref={inputRef}
                  type="text"
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`What would you like to know about ${cityName}?`}
                  disabled={isLoading}
                  className="
                    flex-1 bg-transparent
                    text-sm text-gray-900 placeholder:text-gray-400
                    focus:outline-none
                  "
                />
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomQuery('');
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={handleCustomSubmit}
                    disabled={!customQuery.trim() || isLoading}
                    className={`
                      p-1.5 rounded-lg transition-all
                      ${customQuery.trim() && !isLoading
                        ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/25'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {isLoading && selectedTopic === 'custom' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 className="w-4 h-4" />
                      </motion.div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Suggested queries */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {[
                  'Best local coffee shops?',
                  'Romantic dinner spots?',
                  'Family-friendly activities?',
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setCustomQuery(suggestion)}
                    className="
                      text-xs px-2 py-1 rounded-md
                      bg-gray-100 text-gray-600
                      hover:bg-gray-200 transition-colors
                    "
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// Compact Deep Dive Button
// =============================================================================

interface DeepDiveButtonProps {
  onClick: () => void;
  isLoading?: boolean;
}

export function DeepDiveButton({ onClick, isLoading }: DeepDiveButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={isLoading}
      className="
        flex items-center gap-2
        px-4 py-2 rounded-xl
        bg-gradient-to-r from-amber-500 to-orange-500
        text-white text-sm font-medium
        shadow-lg shadow-amber-500/25
        hover:from-amber-600 hover:to-orange-600
        transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
      "
    >
      {isLoading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-4 h-4" />
        </motion.div>
      ) : (
        <Zap className="w-4 h-4" />
      )}
      <span>Explore deeper</span>
      <ChevronRight className="w-4 h-4" />
    </motion.button>
  );
}

// =============================================================================
// Deep Dive Response Card
// =============================================================================

interface DeepDiveResponseProps {
  topic: DeepDiveTopic;
  customQuery?: string;
  response: string;
  timestamp: Date;
  onDismiss?: () => void;
}

export function DeepDiveResponse({
  topic,
  customQuery,
  response,
  timestamp,
  onDismiss,
}: DeepDiveResponseProps) {
  const config = topic !== 'custom' ? TOPIC_CONFIG[topic] : null;
  const Icon = config?.icon || MessageCircle;
  const color = config?.color || '#6b7280';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="rounded-xl border border-gray-200 overflow-hidden bg-white"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-3"
        style={{ backgroundColor: config?.bgColor || '#f9fafb' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: color }}
          >
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {customQuery || config?.prompt || 'Custom query'}
            </p>
            <p className="text-xs text-gray-500">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>

      {/* Response content */}
      <div className="p-3 text-sm text-gray-700 leading-relaxed">
        {response}
      </div>
    </motion.div>
  );
}

export default DeepDiveRequest;
