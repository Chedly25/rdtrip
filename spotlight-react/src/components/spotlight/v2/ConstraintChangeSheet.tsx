/**
 * Constraint Change Sheet - Adapt Your Trip Intelligently
 *
 * A beautiful bottom sheet that helps users adapt their trip when constraints change.
 * "We have 2 fewer days" → AI suggests what to cut
 * "Budget is tighter" → AI suggests cheaper alternatives
 *
 * Design: "Travel Adaptation" - Warm editorial with visual impact indicators
 * Think of it as a travel advisor helping you pivot gracefully.
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  Clock,
  Wallet,
  Users,
  Calendar,
  TrendingDown,
  TrendingUp,
  Sparkles,
  Check,
  AlertTriangle,
  Lightbulb,
  Minus,
  Plus,
  RefreshCw,
  Trash2,
  MapPin,
  Loader2,
  Shuffle
} from 'lucide-react';
import { useSpotlightStoreV2 } from '../../../stores/spotlightStoreV2';

// Types
interface Suggestion {
  type: 'remove_city' | 'reduce_nights' | 'add_nights' | 'replace_city' | 'add_city' | 'reorder' | 'tip';
  priority: 'high' | 'medium' | 'low';
  cityName: string | null;
  cityIndex: number | null;
  value: any;
  reason: string;
  tradeoff: string;
}

interface ConstraintChangeResult {
  constraintType: string;
  suggestionType: string;
  summary: string;
  impact: {
    nightsChange: number;
    citiesAffected: number;
    estimatedSavings?: string;
  };
  suggestions: Suggestion[];
  alternativeApproach?: {
    summary: string;
    suggestions: Suggestion[];
  };
  metadata: {
    originalNights: number;
    originalCities: number;
  };
}

interface ConstraintChangeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'duration' | 'budget' | 'travelers' | 'dates';
  initialValue?: any;
}

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#E86A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  goldenDark: '#B8923D',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  darkBrown: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E8E2D9',
  error: '#D9534F',
  success: '#5CB85C',
};

// Constraint type configurations
const constraintConfigs = {
  duration: {
    icon: Clock,
    title: 'Trip Duration',
    subtitle: 'Shorten or extend your journey',
    color: colors.terracotta,
    gradient: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
  },
  budget: {
    icon: Wallet,
    title: 'Budget Change',
    subtitle: 'Adapt to your new budget',
    color: colors.golden,
    gradient: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenLight} 100%)`,
  },
  travelers: {
    icon: Users,
    title: 'Travel Group',
    subtitle: 'Your companions changed',
    color: colors.sage,
    gradient: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
  },
  dates: {
    icon: Calendar,
    title: 'Travel Dates',
    subtitle: 'Moving to a different time',
    color: colors.mediumBrown,
    gradient: `linear-gradient(135deg, ${colors.mediumBrown} 0%, ${colors.lightBrown} 100%)`,
  },
};

// Suggestion type icons
const suggestionIcons: Record<string, typeof MapPin> = {
  remove_city: Trash2,
  reduce_nights: Minus,
  add_nights: Plus,
  replace_city: RefreshCw,
  add_city: MapPin,
  reorder: Shuffle,
  tip: Lightbulb,
};

// Priority badge component
const PriorityBadge = ({ priority }: { priority: 'high' | 'medium' | 'low' }) => {
  const config = {
    high: { bg: colors.terracotta + '20', color: colors.terracotta, label: 'High Impact' },
    medium: { bg: colors.golden + '20', color: colors.golden, label: 'Recommended' },
    low: { bg: colors.sage + '20', color: colors.sage, label: 'Optional' },
  };

  const { bg, color, label } = config[priority];

  return (
    <span
      className="px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
};

// Suggestion card component
const SuggestionCard = ({
  suggestion,
  index,
  onApply,
  isApplying,
}: {
  suggestion: Suggestion;
  index: number;
  onApply: () => void;
  isApplying: boolean;
}) => {
  const Icon = suggestionIcons[suggestion.type] || Lightbulb;
  const isTip = suggestion.type === 'tip';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`relative p-4 rounded-xl border transition-all ${
        isTip ? 'bg-amber-50/50' : 'bg-white hover:shadow-md'
      }`}
      style={{
        borderColor: isTip ? colors.golden + '40' : colors.border,
      }}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: isTip
              ? colors.golden + '20'
              : suggestion.priority === 'high'
              ? colors.terracotta + '15'
              : colors.border,
          }}
        >
          <Icon
            className="w-5 h-5"
            style={{
              color: isTip
                ? colors.golden
                : suggestion.priority === 'high'
                ? colors.terracotta
                : colors.mediumBrown,
            }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div>
              <h4
                className="font-semibold text-sm"
                style={{ color: colors.darkBrown }}
              >
                {suggestion.cityName
                  ? `${suggestion.type === 'remove_city' ? 'Remove' : suggestion.type === 'reduce_nights' ? 'Reduce time in' : suggestion.type === 'add_nights' ? 'More time in' : suggestion.type === 'replace_city' ? 'Replace' : ''} ${suggestion.cityName}`
                  : suggestion.reason.split('.')[0]}
              </h4>
              {suggestion.value && suggestion.type === 'reduce_nights' && (
                <span
                  className="text-xs"
                  style={{ color: colors.lightBrown }}
                >
                  -{suggestion.value} night{suggestion.value !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <PriorityBadge priority={suggestion.priority} />
          </div>

          <p
            className="text-sm mb-2"
            style={{ color: colors.mediumBrown }}
          >
            {suggestion.reason}
          </p>

          {suggestion.tradeoff && (
            <p
              className="text-xs flex items-center gap-1"
              style={{ color: colors.lightBrown }}
            >
              <AlertTriangle className="w-3 h-3" />
              {suggestion.tradeoff}
            </p>
          )}
        </div>

        {/* Apply button (not for tips) */}
        {!isTip && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onApply}
            disabled={isApplying}
            className="flex-shrink-0 self-center w-10 h-10 rounded-full flex items-center justify-center transition-all"
            style={{
              background: colors.golden,
              boxShadow: `0 2px 8px ${colors.golden}40`,
            }}
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Check className="w-4 h-4 text-white" />
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

export function ConstraintChangeSheet({
  isOpen,
  onClose,
  initialType = 'duration',
  initialValue,
}: ConstraintChangeSheetProps) {
  const { route, getCityName, removeCity, updateCityNights } = useSpotlightStoreV2();

  const [activeType, setActiveType] = useState<'duration' | 'budget' | 'travelers' | 'dates'>(initialType);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ConstraintChangeResult | null>(null);
  const [showAlternative, setShowAlternative] = useState(false);
  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);

  // Duration-specific state
  const [dayChange, setDayChange] = useState(initialValue?.days || -2);

  // Budget-specific state
  const [budgetDirection, setBudgetDirection] = useState<'tighter' | 'generous'>('tighter');

  // Travelers-specific state
  const [travelerDescription, setTravelerDescription] = useState('');

  // Dates-specific state
  const [newSeason, setNewSeason] = useState('');

  const config = constraintConfigs[activeType];
  const TypeIcon = config.icon;

  // Reset when type changes
  useEffect(() => {
    setResult(null);
    setShowAlternative(false);
  }, [activeType]);

  // Fetch suggestions
  const handleGetSuggestions = useCallback(async () => {
    if (!route) return;

    setIsLoading(true);
    setResult(null);

    try {
      const routeContext = {
        cities: route.cities.map(city => ({
          name: getCityName(city.city),
          nights: city.nights,
        })),
      };

      let change: any = {};
      switch (activeType) {
        case 'duration':
          change = { days: dayChange };
          break;
        case 'budget':
          change = { direction: budgetDirection };
          break;
        case 'travelers':
          change = { description: travelerDescription || 'traveling with different companions' };
          break;
        case 'dates':
          change = { season: newSeason || 'a different time of year' };
          break;
      }

      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/route/handle-constraint-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          constraintType: activeType,
          change,
          routeContext,
          personalization: route.personalization,
        }),
      });

      if (!response.ok) throw new Error('Failed to get suggestions');

      const data: ConstraintChangeResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error('Failed to get constraint suggestions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [route, activeType, dayChange, budgetDirection, travelerDescription, newSeason, getCityName]);

  // Apply a suggestion
  const handleApplySuggestion = async (suggestion: Suggestion, index: number) => {
    if (!route) return;

    setApplyingIndex(index);

    try {
      switch (suggestion.type) {
        case 'remove_city':
          if (suggestion.cityIndex !== null) {
            removeCity(suggestion.cityIndex);
          }
          break;

        case 'reduce_nights':
        case 'add_nights':
          if (suggestion.cityName && suggestion.value) {
            const currentCity = route.cities.find(
              c => getCityName(c.city) === suggestion.cityName
            );
            if (currentCity) {
              const newNights = suggestion.type === 'reduce_nights'
                ? Math.max(1, currentCity.nights - suggestion.value)
                : currentCity.nights + suggestion.value;
              updateCityNights(suggestion.cityName, newNights);
            }
          }
          break;

        // Other types would need more complex handling
        default:
          console.log('Suggestion type not yet implemented:', suggestion.type);
      }

      // Brief delay for visual feedback
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setApplyingIndex(null);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[160] flex items-end justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
          style={{
            background: 'rgba(44, 36, 23, 0.6)',
            backdropFilter: 'blur(8px)',
          }}
        />

        {/* Sheet */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          className="relative w-full max-w-2xl max-h-[85vh] rounded-t-3xl overflow-hidden shadow-2xl"
          style={{
            background: colors.cream,
          }}
        >
          {/* Decorative top gradient */}
          <div
            className="absolute top-0 left-0 right-0 h-24 opacity-20"
            style={{ background: config.gradient }}
          />

          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div
              className="w-12 h-1.5 rounded-full"
              style={{ background: colors.border }}
            />
          </div>

          {/* Header */}
          <div className="relative px-6 pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: config.gradient,
                    boxShadow: `0 4px 12px ${config.color}30`,
                  }}
                >
                  <TypeIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{
                      color: colors.darkBrown,
                      fontFamily: "'Playfair Display', Georgia, serif",
                    }}
                  >
                    {config.title}
                  </h2>
                  <p className="text-sm" style={{ color: colors.lightBrown }}>
                    {config.subtitle}
                  </p>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: colors.border }}
              >
                <X className="w-5 h-5" style={{ color: colors.mediumBrown }} />
              </motion.button>
            </div>

            {/* Type selector tabs */}
            <div
              className="flex gap-2 p-1 rounded-xl mb-4"
              style={{ background: colors.warmWhite }}
            >
              {(Object.keys(constraintConfigs) as Array<keyof typeof constraintConfigs>).map((type) => {
                const Icon = constraintConfigs[type].icon;
                const isActive = type === activeType;

                return (
                  <motion.button
                    key={type}
                    onClick={() => setActiveType(type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                      isActive ? 'shadow-md' : ''
                    }`}
                    style={{
                      background: isActive ? 'white' : 'transparent',
                      color: isActive ? constraintConfigs[type].color : colors.lightBrown,
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{constraintConfigs[type].title.split(' ')[0]}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Input area based on type */}
            <div
              className="p-4 rounded-xl"
              style={{
                background: colors.warmWhite,
                border: `1px solid ${colors.border}`,
              }}
            >
              {activeType === 'duration' && (
                <div>
                  <label
                    className="block text-sm font-medium mb-3"
                    style={{ color: colors.mediumBrown }}
                  >
                    How many days to adjust?
                  </label>
                  <div className="flex items-center justify-center gap-4">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDayChange((d: number) => Math.max(-7, d - 1))}
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: config.gradient,
                        boxShadow: `0 2px 8px ${config.color}30`,
                      }}
                    >
                      <Minus className="w-5 h-5 text-white" />
                    </motion.button>

                    <div className="text-center w-32">
                      <motion.span
                        key={dayChange}
                        initial={{ scale: 1.3, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-4xl font-bold block"
                        style={{
                          color: dayChange < 0 ? colors.terracotta : colors.sage,
                          fontFamily: "'Playfair Display', Georgia, serif",
                        }}
                      >
                        {dayChange > 0 ? '+' : ''}{dayChange}
                      </motion.span>
                      <span className="text-sm" style={{ color: colors.lightBrown }}>
                        {Math.abs(dayChange) === 1 ? 'day' : 'days'}
                      </span>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setDayChange((d: number) => Math.min(7, d + 1))}
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{
                        background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
                        boxShadow: `0 2px 8px ${colors.sage}30`,
                      }}
                    >
                      <Plus className="w-5 h-5 text-white" />
                    </motion.button>
                  </div>
                  <div
                    className="flex items-center justify-center gap-2 mt-3 text-sm"
                    style={{ color: colors.lightBrown }}
                  >
                    {dayChange < 0 ? (
                      <>
                        <TrendingDown className="w-4 h-4" style={{ color: colors.terracotta }} />
                        <span>Shorten your trip</span>
                      </>
                    ) : dayChange > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4" style={{ color: colors.sage }} />
                        <span>Extend your trip</span>
                      </>
                    ) : (
                      <span>No change</span>
                    )}
                  </div>
                </div>
              )}

              {activeType === 'budget' && (
                <div>
                  <label
                    className="block text-sm font-medium mb-3"
                    style={{ color: colors.mediumBrown }}
                  >
                    How has your budget changed?
                  </label>
                  <div className="flex gap-3">
                    {(['tighter', 'generous'] as const).map((option) => (
                      <motion.button
                        key={option}
                        onClick={() => setBudgetDirection(option)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`flex-1 py-4 px-4 rounded-xl text-center transition-all ${
                          budgetDirection === option ? 'shadow-md' : ''
                        }`}
                        style={{
                          background: budgetDirection === option ? 'white' : 'transparent',
                          border: `2px solid ${budgetDirection === option ? colors.golden : colors.border}`,
                        }}
                      >
                        {option === 'tighter' ? (
                          <TrendingDown
                            className="w-6 h-6 mx-auto mb-2"
                            style={{ color: budgetDirection === option ? colors.terracotta : colors.lightBrown }}
                          />
                        ) : (
                          <TrendingUp
                            className="w-6 h-6 mx-auto mb-2"
                            style={{ color: budgetDirection === option ? colors.sage : colors.lightBrown }}
                          />
                        )}
                        <span
                          className="block font-medium text-sm"
                          style={{ color: budgetDirection === option ? colors.darkBrown : colors.lightBrown }}
                        >
                          {option === 'tighter' ? 'Tighter Budget' : 'More Generous'}
                        </span>
                        <span className="text-xs" style={{ color: colors.lightBrown }}>
                          {option === 'tighter' ? 'Need to save money' : 'Can splurge more'}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {activeType === 'travelers' && (
                <div>
                  <label
                    className="block text-sm font-medium mb-3"
                    style={{ color: colors.mediumBrown }}
                  >
                    How has your travel group changed?
                  </label>
                  <input
                    type="text"
                    value={travelerDescription}
                    onChange={(e) => setTravelerDescription(e.target.value)}
                    placeholder="e.g., Now traveling with kids, elderly parents joining..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: 'white',
                      border: `2px solid ${colors.border}`,
                      color: colors.darkBrown,
                    }}
                  />
                </div>
              )}

              {activeType === 'dates' && (
                <div>
                  <label
                    className="block text-sm font-medium mb-3"
                    style={{ color: colors.mediumBrown }}
                  >
                    When are you moving the trip to?
                  </label>
                  <input
                    type="text"
                    value={newSeason}
                    onChange={(e) => setNewSeason(e.target.value)}
                    placeholder="e.g., December, Summer, Spring break..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: 'white',
                      border: `2px solid ${colors.border}`,
                      color: colors.darkBrown,
                    }}
                  />
                </div>
              )}

              {/* Get suggestions button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGetSuggestions}
                disabled={isLoading || (activeType === 'duration' && dayChange === 0)}
                className={`w-full mt-4 py-3 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                  isLoading || (activeType === 'duration' && dayChange === 0)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                style={{
                  background: config.gradient,
                  color: 'white',
                  boxShadow: `0 4px 12px ${config.color}30`,
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Getting suggestions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Get Smart Suggestions
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Results area */}
          <div
            className="px-6 pb-6 max-h-[40vh] overflow-y-auto"
            style={{ scrollbarWidth: 'thin' }}
          >
            <AnimatePresence mode="wait">
              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  {/* Summary */}
                  <div
                    className="p-4 rounded-xl mb-4"
                    style={{
                      background: `linear-gradient(135deg, ${config.color}10 0%, ${config.color}05 100%)`,
                      border: `1px solid ${config.color}30`,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: config.color }} />
                      <div>
                        <p className="font-medium" style={{ color: colors.darkBrown }}>
                          {result.summary}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm">
                          {result.impact.nightsChange !== 0 && (
                            <span style={{ color: colors.lightBrown }}>
                              {result.impact.nightsChange > 0 ? '+' : ''}{result.impact.nightsChange} nights
                            </span>
                          )}
                          {result.impact.citiesAffected > 0 && (
                            <span style={{ color: colors.lightBrown }}>
                              {result.impact.citiesAffected} cities affected
                            </span>
                          )}
                          {result.impact.estimatedSavings && (
                            <span style={{ color: colors.sage }}>
                              {result.impact.estimatedSavings} savings
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3
                        className="font-semibold"
                        style={{ color: colors.darkBrown }}
                      >
                        {showAlternative ? 'Alternative Approach' : 'Recommended Changes'}
                      </h3>
                      {result.alternativeApproach && (
                        <button
                          onClick={() => setShowAlternative(!showAlternative)}
                          className="flex items-center gap-1 text-sm font-medium"
                          style={{ color: colors.golden }}
                        >
                          <Shuffle className="w-4 h-4" />
                          {showAlternative ? 'Main approach' : 'See alternative'}
                        </button>
                      )}
                    </div>

                    {(showAlternative && result.alternativeApproach
                      ? result.alternativeApproach.suggestions
                      : result.suggestions
                    ).map((suggestion, index) => (
                      <SuggestionCard
                        key={`${suggestion.type}-${suggestion.cityName}-${index}`}
                        suggestion={suggestion}
                        index={index}
                        onApply={() => handleApplySuggestion(suggestion, index)}
                        isApplying={applyingIndex === index}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}

export default ConstraintChangeSheet;
