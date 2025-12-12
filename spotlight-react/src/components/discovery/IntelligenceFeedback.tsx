/**
 * IntelligenceFeedback
 *
 * A thoughtful feedback mechanism for city intelligence quality.
 * Users can provide quick reactions or detailed feedback to help
 * improve future recommendations.
 *
 * Design Philosophy:
 * - Non-intrusive, appears after viewing intelligence
 * - Quick emoji reactions for fast feedback
 * - Optional detailed feedback for specific issues
 * - Celebratory animation for positive feedback
 * - Graceful handling of negative feedback with improvement options
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Check,
  X,
  AlertCircle,
  Sparkles,
  Send,
  ChevronDown,
  Heart,
  Meh,
  Frown,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export type FeedbackRating = 'love' | 'good' | 'okay' | 'poor';
export type FeedbackCategory =
  | 'accuracy'
  | 'relevance'
  | 'completeness'
  | 'timing'
  | 'preferences'
  | 'other';

interface FeedbackData {
  cityId: string;
  rating: FeedbackRating;
  categories?: FeedbackCategory[];
  comment?: string;
  timestamp: Date;
}

interface IntelligenceFeedbackProps {
  /** City ID the feedback is for */
  cityId: string;
  /** City name for display */
  cityName: string;
  /** Callback when feedback is submitted */
  onSubmit: (feedback: FeedbackData) => Promise<void>;
  /** Variant: inline or floating */
  variant?: 'inline' | 'floating' | 'minimal';
  /** Show after intelligence is complete */
  showOnComplete?: boolean;
}

interface RatingConfig {
  icon: typeof Heart;
  label: string;
  color: string;
  bgColor: string;
  emoji: string;
}

interface CategoryConfig {
  label: string;
  description: string;
}

// =============================================================================
// Configuration
// =============================================================================

const RATING_CONFIG: Record<FeedbackRating, RatingConfig> = {
  love: {
    icon: Heart,
    label: 'Love it!',
    color: '#ec4899',
    bgColor: '#fdf2f8',
    emoji: '😍',
  },
  good: {
    icon: ThumbsUp,
    label: 'Helpful',
    color: '#10b981',
    bgColor: '#ecfdf5',
    emoji: '👍',
  },
  okay: {
    icon: Meh,
    label: 'Okay',
    color: '#f59e0b',
    bgColor: '#fffbeb',
    emoji: '😐',
  },
  poor: {
    icon: Frown,
    label: 'Not great',
    color: '#ef4444',
    bgColor: '#fef2f2',
    emoji: '😕',
  },
};

const CATEGORY_CONFIG: Record<FeedbackCategory, CategoryConfig> = {
  accuracy: {
    label: 'Accuracy',
    description: 'Information was incorrect or outdated',
  },
  relevance: {
    label: 'Relevance',
    description: "Didn't match my interests",
  },
  completeness: {
    label: 'Missing info',
    description: 'Important details were missing',
  },
  timing: {
    label: 'Timing',
    description: 'Time estimates were off',
  },
  preferences: {
    label: 'Preferences',
    description: "Didn't understand what I wanted",
  },
  other: {
    label: 'Other',
    description: 'Something else',
  },
};

// =============================================================================
// Main Component
// =============================================================================

export function IntelligenceFeedback({
  cityId,
  cityName,
  onSubmit,
  variant = 'inline',
}: IntelligenceFeedbackProps) {
  const [rating, setRating] = useState<FeedbackRating | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<FeedbackCategory[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleRatingSelect = (selectedRating: FeedbackRating) => {
    setRating(selectedRating);
    // Show details for neutral/negative feedback
    if (selectedRating === 'okay' || selectedRating === 'poor') {
      setShowDetails(true);
    }
  };

  const toggleCategory = (category: FeedbackCategory) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = useCallback(async () => {
    if (!rating || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        cityId,
        rating,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        comment: comment.trim() || undefined,
        timestamp: new Date(),
      });
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  }, [cityId, rating, selectedCategories, comment, onSubmit, isSubmitting]);

  // Auto-submit for positive ratings without details
  const handleQuickSubmit = useCallback(async (quickRating: FeedbackRating) => {
    if (quickRating === 'love' || quickRating === 'good') {
      setRating(quickRating);
      setIsSubmitting(true);
      try {
        await onSubmit({
          cityId,
          rating: quickRating,
          timestamp: new Date(),
        });
        setIsSubmitted(true);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      handleRatingSelect(quickRating);
    }
  }, [cityId, onSubmit]);

  // Success state
  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`
          flex items-center gap-3 p-4 rounded-xl
          ${variant === 'floating' ? 'bg-white shadow-lg border border-gray-200' : 'bg-emerald-50 border border-emerald-200'}
        `}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, delay: 0.1 }}
          className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center"
        >
          <Check className="w-5 h-5 text-white" />
        </motion.div>
        <div>
          <p className="font-medium text-emerald-800">Thanks for your feedback!</p>
          <p className="text-sm text-emerald-600">This helps us improve recommendations</p>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="ml-auto"
        >
          <Sparkles className="w-5 h-5 text-emerald-400" />
        </motion.div>
      </motion.div>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Was this helpful?</span>
        <div className="flex items-center gap-1">
          {(['love', 'good', 'okay', 'poor'] as FeedbackRating[]).map((r) => {
            const config = RATING_CONFIG[r];
            return (
              <motion.button
                key={r}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleQuickSubmit(r)}
                disabled={isSubmitting}
                className={`
                  p-1.5 rounded-lg transition-colors
                  ${rating === r ? 'bg-gray-100' : 'hover:bg-gray-50'}
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                title={config.label}
              >
                <span className="text-lg">{config.emoji}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        overflow-hidden rounded-xl
        ${variant === 'floating'
          ? 'bg-white shadow-xl border border-gray-200'
          : 'bg-gray-50 border border-gray-200'
        }
      `}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">
              How was the intelligence for {cityName}?
            </h4>
            <p className="text-xs text-gray-500">Your feedback helps us improve</p>
          </div>
        </div>
      </div>

      {/* Rating selection */}
      <div className="p-4">
        <div className="flex items-center justify-center gap-3">
          {(['love', 'good', 'okay', 'poor'] as FeedbackRating[]).map((r) => {
            const config = RATING_CONFIG[r];
            const Icon = config.icon;
            const isSelected = rating === r;

            return (
              <motion.button
                key={r}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleQuickSubmit(r)}
                disabled={isSubmitting}
                className={`
                  flex flex-col items-center gap-1.5
                  p-3 rounded-xl transition-all
                  ${isSelected
                    ? 'ring-2 shadow-lg'
                    : 'hover:bg-gray-100'
                  }
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                style={{
                  backgroundColor: isSelected ? config.bgColor : undefined,
                  ringColor: isSelected ? config.color : undefined,
                }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: isSelected ? config.color : '#e5e7eb',
                    color: isSelected ? 'white' : '#9ca3af',
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className="text-xs font-medium"
                  style={{ color: isSelected ? config.color : '#6b7280' }}
                >
                  {config.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Detailed feedback (for okay/poor ratings) */}
      <AnimatePresence>
        {showDetails && (rating === 'okay' || rating === 'poor') && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="p-4 space-y-4">
              {/* Category selection */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  What could be better? <span className="text-gray-400">(optional)</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(CATEGORY_CONFIG) as FeedbackCategory[]).map((cat) => {
                    const config = CATEGORY_CONFIG[cat];
                    const isSelected = selectedCategories.includes(cat);

                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-medium
                          border transition-colors
                          ${isSelected
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                          }
                        `}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Comment field */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Additional comments <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  rows={3}
                  className="
                    w-full px-3 py-2 rounded-lg
                    border border-gray-200 bg-white
                    text-sm text-gray-900 placeholder:text-gray-400
                    focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500
                    resize-none
                  "
                />
              </div>

              {/* Submit button */}
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="
                  w-full flex items-center justify-center gap-2
                  py-2.5 rounded-xl
                  bg-gray-900 text-white text-sm font-medium
                  hover:bg-gray-800 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Send className="w-4 h-4" />
                  </motion.div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>Submit feedback</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// =============================================================================
// Quick Feedback Bar
// =============================================================================

interface QuickFeedbackBarProps {
  cityId: string;
  onFeedback: (rating: 'positive' | 'negative') => void;
}

export function QuickFeedbackBar({ cityId, onFeedback }: QuickFeedbackBarProps) {
  const [submitted, setSubmitted] = useState<'positive' | 'negative' | null>(null);

  const handleFeedback = (rating: 'positive' | 'negative') => {
    setSubmitted(rating);
    onFeedback(rating);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 text-xs text-gray-500"
      >
        <Check className="w-3.5 h-3.5 text-emerald-500" />
        <span>Thanks!</span>
      </motion.div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">Helpful?</span>
      <div className="flex items-center gap-0.5">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleFeedback('positive')}
          className="p-1 rounded hover:bg-emerald-50 transition-colors group"
        >
          <ThumbsUp className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500" />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleFeedback('negative')}
          className="p-1 rounded hover:bg-red-50 transition-colors group"
        >
          <ThumbsDown className="w-3.5 h-3.5 text-gray-400 group-hover:text-red-500" />
        </motion.button>
      </div>
    </div>
  );
}

// =============================================================================
// Floating Feedback Prompt
// =============================================================================

interface FloatingFeedbackPromptProps {
  cityId: string;
  cityName: string;
  onSubmit: (feedback: FeedbackData) => Promise<void>;
  onDismiss: () => void;
}

export function FloatingFeedbackPrompt({
  cityId,
  cityName,
  onSubmit,
  onDismiss,
}: FloatingFeedbackPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 w-80"
    >
      <div className="relative">
        <button
          onClick={onDismiss}
          className="absolute -top-2 -right-2 p-1 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
        <IntelligenceFeedback
          cityId={cityId}
          cityName={cityName}
          onSubmit={onSubmit}
          variant="floating"
        />
      </div>
    </motion.div>
  );
}

export default IntelligenceFeedback;
