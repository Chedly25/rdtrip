/**
 * AI Insights - The Oracle's Whisper
 *
 * A mystical yet refined insight panel that reveals AI-discovered patterns
 * from user preferences. Shows proactive recommendations and explains
 * the AI's reasoning in an engaging, trustworthy way.
 *
 * Design: "The Oracle's Whisper" - warm golden tones, subtle sparkle effects
 *
 * Features:
 * - Pattern discovery from preferences
 * - "You might also like..." suggestions
 * - Preference-to-recommendation connections
 * - Animated insight reveals
 * - Trust-building explanations
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Lightbulb,
  ChevronRight,
  Eye,
  Compass,
  Target,
  Mountain,
  Utensils,
  X,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Gem,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TripPersonalization } from '../../stores/spotlightStoreV2';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  goldenDark: '#B8923D',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  darkBrown: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E8E2D9',
  subtle: '#F5F0E8',
  mystic: '#8B6914',
};

// Insight types
export interface AIInsight {
  id: string;
  type: 'pattern' | 'suggestion' | 'connection' | 'discovery';
  icon: LucideIcon;
  title: string;
  description: string;
  confidence: number; // 0-1
  action?: {
    label: string;
    onClick: () => void;
  };
  relatedPreferences?: string[];
  suggestion?: {
    name: string;
    type: string;
    reason: string;
  };
}

// Sparkle animation component
const SparkleEffect = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute"
    style={{
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
    }}
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 3,
    }}
  >
    <Sparkles className="h-3 w-3" style={{ color: colors.golden }} />
  </motion.div>
);

// Insight card component
const InsightCard = ({
  insight,
  index,
  onDismiss,
  onFeedback,
}: {
  insight: AIInsight;
  index: number;
  onDismiss?: (id: string) => void;
  onFeedback?: (id: string, helpful: boolean) => void;
}) => {
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState<boolean | null>(null);

  const Icon = insight.icon;

  const typeStyles = {
    pattern: { bg: `${colors.golden}15`, color: colors.golden, label: 'Pattern' },
    suggestion: { bg: `${colors.sage}15`, color: colors.sage, label: 'Suggestion' },
    connection: { bg: `${colors.terracotta}15`, color: colors.terracotta, label: 'Connection' },
    discovery: { bg: `${colors.mystic}15`, color: colors.mystic, label: 'Discovery' },
  };

  const style = typeStyles[insight.type];

  const handleFeedback = (helpful: boolean) => {
    setFeedbackGiven(helpful);
    onFeedback?.(insight.id, helpful);
    setTimeout(() => setShowFeedback(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300, damping: 25 }}
      className="relative overflow-hidden rounded-2xl"
      style={{
        background: colors.warmWhite,
        border: `1px solid ${colors.border}`,
      }}
    >
      {/* Decorative gradient overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at top right, ${style.bg} 0%, transparent 50%)`,
        }}
      />

      <div className="relative p-4">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: style.bg }}
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Icon className="h-5 w-5" style={{ color: style.color }} />
            </motion.div>
            <div>
              <div className="flex items-center gap-2">
                <h4
                  className="text-sm font-semibold"
                  style={{ color: colors.darkBrown }}
                >
                  {insight.title}
                </h4>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider"
                  style={{ background: style.bg, color: style.color }}
                >
                  {style.label}
                </span>
              </div>
              {/* Confidence indicator */}
              <div className="mt-1 flex items-center gap-1">
                <div
                  className="h-1 w-16 overflow-hidden rounded-full"
                  style={{ background: colors.border }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: style.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${insight.confidence * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                  />
                </div>
                <span className="text-[10px]" style={{ color: colors.lightBrown }}>
                  {Math.round(insight.confidence * 100)}% confident
                </span>
              </div>
            </div>
          </div>
          {onDismiss && (
            <motion.button
              onClick={() => onDismiss(insight.id)}
              className="rounded-full p-1 transition-colors hover:bg-black/5"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-4 w-4" style={{ color: colors.lightBrown }} />
            </motion.button>
          )}
        </div>

        {/* Description */}
        <p className="mb-3 text-sm leading-relaxed" style={{ color: colors.mediumBrown }}>
          {insight.description}
        </p>

        {/* Suggestion preview */}
        {insight.suggestion && (
          <motion.div
            className="mb-3 rounded-xl p-3"
            style={{
              background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.subtle} 100%)`,
              border: `1px dashed ${colors.border}`,
            }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span
                  className="text-[10px] font-medium uppercase tracking-wider"
                  style={{ color: colors.lightBrown }}
                >
                  {insight.suggestion.type}
                </span>
                <h5 className="text-sm font-semibold" style={{ color: colors.darkBrown }}>
                  {insight.suggestion.name}
                </h5>
                <p className="text-xs" style={{ color: colors.lightBrown }}>
                  {insight.suggestion.reason}
                </p>
              </div>
              <ArrowRight className="h-5 w-5" style={{ color: colors.golden }} />
            </div>
          </motion.div>
        )}

        {/* Related preferences tags */}
        {insight.relatedPreferences && insight.relatedPreferences.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {insight.relatedPreferences.map((pref) => (
              <span
                key={pref}
                className="rounded-full px-2 py-0.5 text-[10px]"
                style={{ background: colors.subtle, color: colors.lightBrown }}
              >
                {pref}
              </span>
            ))}
          </div>
        )}

        {/* Footer with action and feedback */}
        <div className="flex items-center justify-between pt-2" style={{ borderTop: `1px solid ${colors.border}` }}>
          {insight.action ? (
            <motion.button
              onClick={insight.action.onClick}
              className="flex items-center gap-1 text-xs font-medium"
              style={{ color: colors.terracotta }}
              whileHover={{ x: 3 }}
            >
              {insight.action.label}
              <ChevronRight className="h-3 w-3" />
            </motion.button>
          ) : (
            <div />
          )}

          {/* Feedback buttons */}
          <AnimatePresence mode="wait">
            {feedbackGiven !== null ? (
              <motion.span
                key="thanks"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs"
                style={{ color: colors.sage }}
              >
                Thanks for the feedback!
              </motion.span>
            ) : showFeedback ? (
              <motion.div
                key="buttons"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs" style={{ color: colors.lightBrown }}>
                  Helpful?
                </span>
                <motion.button
                  onClick={() => handleFeedback(true)}
                  className="rounded-full p-1.5"
                  style={{ background: `${colors.sage}15` }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ThumbsUp className="h-3 w-3" style={{ color: colors.sage }} />
                </motion.button>
                <motion.button
                  onClick={() => handleFeedback(false)}
                  className="rounded-full p-1.5"
                  style={{ background: `${colors.terracotta}15` }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ThumbsDown className="h-3 w-3" style={{ color: colors.terracotta }} />
                </motion.button>
              </motion.div>
            ) : (
              <motion.button
                key="ask"
                onClick={() => setShowFeedback(true)}
                className="text-xs"
                style={{ color: colors.lightBrown }}
                whileHover={{ color: colors.mediumBrown }}
              >
                Was this helpful?
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

// Generate insights from personalization
const generateInsightsFromPersonalization = (
  personalization: TripPersonalization
): AIInsight[] => {
  const insights: AIInsight[] = [];

  // Pattern: Travel style + interests alignment
  if (personalization.travelStyle && personalization.interests?.length) {
    const styleInterestMap: Record<string, string[]> = {
      explorer: ['history', 'architecture', 'local-culture'],
      foodie: ['food', 'wine', 'local-culture'],
      adventurer: ['adventure', 'nature', 'mountains'],
      culture: ['art', 'museums', 'history'],
      relaxer: ['beaches', 'wellness', 'nature'],
    };

    const matchingInterests = personalization.interests.filter((i) =>
      styleInterestMap[personalization.travelStyle!]?.includes(i)
    );

    if (matchingInterests.length >= 2) {
      insights.push({
        id: 'style-interest-alignment',
        type: 'pattern',
        icon: Target,
        title: 'Your preferences align perfectly',
        description: `Your ${personalization.travelStyle} travel style matches beautifully with your interests in ${matchingInterests.slice(0, 2).join(' and ')}. We're prioritizing authentic experiences that combine these.`,
        confidence: 0.92,
        relatedPreferences: [personalization.travelStyle, ...matchingInterests.slice(0, 2)],
      });
    }
  }

  // Discovery: Occasion-based insights
  if (personalization.occasion) {
    const occasionInsights: Record<string, { title: string; description: string }> = {
      honeymoon: {
        title: 'Romance-focused curation',
        description: 'We\'re highlighting intimate restaurants, scenic spots for two, and accommodations with special romantic touches.',
      },
      anniversary: {
        title: 'Celebrating your milestone',
        description: 'We\'ve selected venues that offer memorable experiences and often have special anniversary services.',
      },
      birthday: {
        title: 'Making it celebratory',
        description: 'We\'re including activities and restaurants known for making birthdays special.',
      },
      'family-vacation': {
        title: 'Family-friendly filtering',
        description: 'Every recommendation has been checked for family suitability, with kid-friendly options highlighted.',
      },
      'solo-adventure': {
        title: 'Solo traveler perks',
        description: 'We\'re featuring social spots, safe neighborhoods, and activities perfect for meeting fellow travelers.',
      },
    };

    const occasionData = occasionInsights[personalization.occasion];
    if (occasionData) {
      insights.push({
        id: 'occasion-insight',
        type: 'discovery',
        icon: Gem,
        title: occasionData.title,
        description: occasionData.description,
        confidence: 0.88,
        relatedPreferences: [personalization.occasion],
      });
    }
  }

  // Suggestion: Based on dining + budget
  if (personalization.diningStyle && personalization.budget) {
    const diningBudgetSuggestions: Record<string, Record<string, { name: string; reason: string }>> = {
      fine: {
        luxury: { name: 'Michelin-starred tastings', reason: 'Matches your refined palate and budget' },
        mid: { name: 'Chef\'s table experiences', reason: 'Fine dining at accessible prices' },
      },
      casual: {
        budget: { name: 'Local market tours', reason: 'Authentic flavors without the price tag' },
        mid: { name: 'Neighborhood bistros', reason: 'Quality dining in local favorites' },
      },
      street: {
        budget: { name: 'Food truck crawls', reason: 'Maximum flavor, minimal spend' },
        mid: { name: 'Night market adventures', reason: 'Street food elevated' },
      },
    };

    const suggestion = diningBudgetSuggestions[personalization.diningStyle]?.[personalization.budget];
    if (suggestion) {
      insights.push({
        id: 'dining-budget-suggestion',
        type: 'suggestion',
        icon: Utensils,
        title: 'Perfect dining match found',
        description: `Based on your dining preferences and budget, we think you'll love this type of experience.`,
        confidence: 0.85,
        suggestion: {
          name: suggestion.name,
          type: 'Dining Experience',
          reason: suggestion.reason,
        },
        relatedPreferences: [personalization.diningStyle, personalization.budget],
      });
    }
  }

  // Connection: Pace affects recommendations
  if (personalization.pace !== undefined) {
    const paceDescriptions: Record<number, string> = {
      1: 'leisurely mornings and plenty of downtime between activities',
      2: 'a relaxed flow with room to linger at places you love',
      3: 'a balanced mix of activity and rest',
      4: 'an energetic schedule with diverse experiences',
      5: 'maximum experiences packed into each day',
    };

    insights.push({
      id: 'pace-connection',
      type: 'connection',
      icon: Compass,
      title: 'Your rhythm shapes the journey',
      description: `Your pace preference means we're planning ${paceDescriptions[personalization.pace]}. Each day is designed to match your energy.`,
      confidence: 0.9,
      relatedPreferences: [`Pace: ${personalization.pace}/5`],
    });
  }

  // Pattern: Multiple dietary restrictions
  if (personalization.dietary && personalization.dietary.length >= 2) {
    insights.push({
      id: 'dietary-pattern',
      type: 'pattern',
      icon: Lightbulb,
      title: 'Special dietary care',
      description: `We're filtering all restaurant recommendations to accommodate your ${personalization.dietary.join(' and ')} requirements. Each suggestion has been verified for compatibility.`,
      confidence: 0.95,
      relatedPreferences: personalization.dietary,
    });
  }

  // Discovery: Outdoor + crowd preferences
  if (personalization.preferOutdoor && personalization.avoidCrowds) {
    insights.push({
      id: 'nature-escape',
      type: 'discovery',
      icon: Mountain,
      title: 'Hidden gems prioritized',
      description: 'We\'re featuring off-the-beaten-path outdoor locations, lesser-known viewpoints, and peaceful nature spots away from tourist crowds.',
      confidence: 0.87,
      relatedPreferences: ['Outdoor preference', 'Crowd avoidance'],
      suggestion: {
        name: 'Secret local spots',
        type: 'Hidden Gems',
        reason: 'Nature + tranquility combined',
      },
    });
  }

  return insights;
};

interface AIInsightsProps {
  personalization: TripPersonalization;
  customInsights?: AIInsight[];
  onFeedback?: (insightId: string, helpful: boolean) => void;
  className?: string;
}

export const AIInsights: React.FC<AIInsightsProps> = ({
  personalization,
  customInsights,
  onFeedback,
  className = '',
}) => {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Generate insights
  const allInsights = useMemo(() => {
    const generated = generateInsightsFromPersonalization(personalization);
    return customInsights ? [...generated, ...customInsights] : generated;
  }, [personalization, customInsights]);

  // Filter dismissed insights
  const visibleInsights = allInsights.filter((i) => !dismissedIds.has(i.id));

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  };

  if (visibleInsights.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative overflow-hidden rounded-3xl ${className}`}
      style={{
        background: `linear-gradient(180deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
      }}
    >
      {/* Sparkle effects */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(5)].map((_, i) => (
          <SparkleEffect key={i} delay={i * 0.5} />
        ))}
      </div>

      {/* Decorative gradient */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-40 w-40 opacity-50"
        style={{
          background: `radial-gradient(circle, ${colors.golden}20 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="relative px-6 pb-2 pt-5">
        <div className="flex items-center gap-3">
          <motion.div
            className="flex h-12 w-12 items-center justify-center rounded-2xl"
            style={{
              background: `linear-gradient(135deg, ${colors.golden}20 0%, ${colors.terracotta}10 100%)`,
            }}
            animate={{
              boxShadow: [
                `0 0 0 0 ${colors.golden}00`,
                `0 0 0 8px ${colors.golden}10`,
                `0 0 0 0 ${colors.golden}00`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-6 w-6" style={{ color: colors.golden }} />
          </motion.div>
          <div>
            <h3
              className="text-lg font-semibold"
              style={{
                color: colors.darkBrown,
                fontFamily: "'Fraunces', Georgia, serif",
              }}
            >
              AI Insights
            </h3>
            <p className="text-xs" style={{ color: colors.lightBrown }}>
              Patterns we've discovered from your preferences
            </p>
          </div>
        </div>
      </div>

      {/* Insights list */}
      <div className="relative space-y-3 px-5 pb-5 pt-3">
        <AnimatePresence>
          {visibleInsights.map((insight, index) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              index={index}
              onDismiss={handleDismiss}
              onFeedback={onFeedback}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div
        className="px-6 py-4"
        style={{
          background: colors.subtle,
          borderTop: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs" style={{ color: colors.lightBrown }}>
            <Eye className="mr-1 inline h-3 w-3" />
            {visibleInsights.length} insight{visibleInsights.length !== 1 ? 's' : ''} based on your preferences
          </p>
          <motion.button
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: colors.terracotta }}
            whileHover={{ x: 2 }}
          >
            View all patterns
            <ChevronRight className="h-3 w-3" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// Compact insight badge for inline use
export const InsightBadge: React.FC<{
  insight: string;
  icon?: LucideIcon;
  onClick?: () => void;
}> = ({ insight, icon: Icon = Lightbulb, onClick }) => (
  <motion.button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
    style={{
      background: `linear-gradient(135deg, ${colors.golden}15 0%, ${colors.terracotta}10 100%)`,
      border: `1px solid ${colors.golden}30`,
    }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Icon className="h-3 w-3" style={{ color: colors.golden }} />
    <span className="text-xs font-medium" style={{ color: colors.darkBrown }}>
      {insight}
    </span>
  </motion.button>
);

// Mini insight for recommendation cards
export const MiniInsight: React.FC<{
  text: string;
  type?: 'match' | 'suggestion' | 'pattern';
}> = ({ text, type = 'match' }) => {
  const typeColors = {
    match: colors.sage,
    suggestion: colors.golden,
    pattern: colors.terracotta,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-1.5"
    >
      <Sparkles className="mt-0.5 h-3 w-3 flex-shrink-0" style={{ color: typeColors[type] }} />
      <span className="text-xs leading-tight" style={{ color: colors.mediumBrown }}>
        {text}
      </span>
    </motion.div>
  );
};

export default AIInsights;
