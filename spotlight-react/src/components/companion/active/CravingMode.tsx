/**
 * CravingMode Component
 *
 * WI-7.4: "I want..." instant search interface
 *
 * Features:
 * - Text input for craving search with animated placeholder
 * - Quick chips for common cravings (coffee, food, wine, view, quiet)
 * - Searches within current city's places
 * - Filters by time-appropriateness
 * - Shows results with distance
 *
 * Design Philosophy:
 * - Conversational - feels like telling a friend what you want
 * - Instant - results appear as you type (debounced)
 * - Intimate - quick chips feel like whispered suggestions
 * - Time-aware - day/night theming
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Coffee,
  Utensils,
  Wine,
  Mountain,
  Volume2,
  Sparkles,
  ArrowLeft,
  Loader2,
} from 'lucide-react';

import { CravingResultCard } from './CravingResultCard';
import type { CravingSearchResult } from '../../../services/tripBrain/types';

// ============================================================================
// Types
// ============================================================================

export interface CravingModeProps {
  /** Search function from TripBrain */
  onSearch: (query: string) => void;
  /** Clear craving and go back */
  onClear: () => void;
  /** Select an activity */
  onSelect: (activityId: string) => void;
  /** Current search results */
  results?: CravingSearchResult;
  /** Whether search is loading */
  isLoading?: boolean;
  /** Error message if any */
  error?: string | null;
  /** Go back to choice mode */
  onBack?: () => void;
}

// ============================================================================
// Quick Craving Chips Data
// ============================================================================

interface CravingChip {
  id: string;
  label: string;
  query: string;
  icon: typeof Coffee;
  color: { day: string; night: string };
}

const CRAVING_CHIPS: CravingChip[] = [
  {
    id: 'coffee',
    label: 'Coffee',
    query: 'coffee cafe',
    icon: Coffee,
    color: { day: '#8B7355', night: '#D4A574' },
  },
  {
    id: 'food',
    label: 'Food',
    query: 'restaurant food',
    icon: Utensils,
    color: { day: '#C45830', night: '#D4A574' },
  },
  {
    id: 'drinks',
    label: 'Drinks',
    query: 'bar wine cocktails',
    icon: Wine,
    color: { day: '#A855F7', night: '#C084FC' },
  },
  {
    id: 'view',
    label: 'A view',
    query: 'scenic viewpoint panorama',
    icon: Mountain,
    color: { day: '#6B8E7B', night: '#8BA898' },
  },
  {
    id: 'quiet',
    label: 'Somewhere quiet',
    query: 'park garden peaceful',
    icon: Volume2,
    color: { day: '#6B7280', night: '#9CA3AF' },
  },
];

// ============================================================================
// Animated Placeholder Suggestions
// ============================================================================

const PLACEHOLDER_SUGGESTIONS = [
  'a good espresso...',
  'something sweet...',
  'a quiet spot...',
  'local wine...',
  'a view...',
  'street food...',
  'somewhere cozy...',
];

// ============================================================================
// Theme
// ============================================================================

const getTheme = (isNight: boolean) => {
  if (isNight) {
    return {
      bg: '#0A0A0B',
      bgGradient: 'linear-gradient(180deg, #0A0A0B 0%, #111113 100%)',
      card: {
        bg: '#18181B',
        border: 'rgba(255, 255, 255, 0.08)',
      },
      input: {
        bg: '#18181B',
        border: 'rgba(255, 255, 255, 0.1)',
        focusBorder: 'rgba(212, 165, 116, 0.5)',
        placeholder: '#71717A',
      },
      text: {
        primary: '#F4F4F5',
        secondary: '#A1A1AA',
        muted: '#71717A',
      },
      accent: '#D4A574',
      accentGlow: 'rgba(212, 165, 116, 0.15)',
    };
  }

  return {
    bg: '#FAF8F5',
    bgGradient: 'linear-gradient(180deg, #FAF8F5 0%, #F5F3F0 100%)',
    card: {
      bg: '#FFFFFF',
      border: 'rgba(0, 0, 0, 0.06)',
    },
    input: {
      bg: '#FFFFFF',
      border: 'rgba(0, 0, 0, 0.1)',
      focusBorder: 'rgba(196, 88, 48, 0.5)',
      placeholder: '#9CA3AF',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#525252',
      muted: '#737373',
    },
    accent: '#C45830',
    accentGlow: 'rgba(196, 88, 48, 0.1)',
  };
};

// ============================================================================
// Component
// ============================================================================

export function CravingMode({
  onSearch,
  onClear,
  onSelect,
  results,
  isLoading = false,
  error,
  onBack,
}: CravingModeProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Time-aware theming
  const [currentHour] = useState(() => new Date().getHours());
  const isNightMode = currentHour >= 20 || currentHour < 6;
  const theme = getTheme(isNightMode);

  // Rotate placeholder suggestions
  useEffect(() => {
    if (isFocused || query) return;

    const interval = setInterval(() => {
      setPlaceholderIndex(i => (i + 1) % PLACEHOLDER_SUGGESTIONS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isFocused, query]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) return;

    const timer = setTimeout(() => {
      onSearch(query.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Handle chip click
  const handleChipClick = useCallback((chip: CravingChip) => {
    setQuery(chip.label);
    onSearch(chip.query);
  }, [onSearch]);

  // Handle clear
  const handleClear = useCallback(() => {
    setQuery('');
    onClear();
    inputRef.current?.focus();
  }, [onClear]);

  // Handle back
  const handleBack = useCallback(() => {
    onClear();
    onBack?.();
  }, [onClear, onBack]);

  // Results to show
  const resultsToShow = useMemo(() => {
    return results?.results || [];
  }, [results]);

  const hasResults = resultsToShow.length > 0;
  const hasSearched = Boolean(results);

  return (
    <motion.div
      className="min-h-full flex flex-col"
      style={{ background: theme.bgGradient }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* ============ Header ============ */}
      <div className="px-5 pt-5 pb-4">
        {/* Back button + Title */}
        <div className="flex items-center gap-3 mb-4">
          {onBack && (
            <motion.button
              onClick={handleBack}
              className="p-2 -ml-2 rounded-xl"
              style={{
                background: theme.card.bg,
                border: `1px solid ${theme.card.border}`,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft size={18} color={theme.text.secondary} />
            </motion.button>
          )}

          <div>
            <h1
              className="text-xl"
              style={{
                color: theme.text.primary,
                fontFamily: "'Fraunces', Georgia, serif",
                fontWeight: 600,
              }}
            >
              What are you craving?
            </h1>
            <p
              className="text-sm"
              style={{
                color: theme.text.secondary,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Tell me what you're in the mood for
            </p>
          </div>
        </div>

        {/* ============ Search Input ============ */}
        <motion.div
          className="relative"
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200"
            style={{
              background: theme.input.bg,
              border: `2px solid ${isFocused ? theme.input.focusBorder : theme.input.border}`,
              boxShadow: isFocused ? `0 0 0 4px ${theme.accentGlow}` : 'none',
            }}
          >
            <Search
              size={20}
              color={isFocused ? theme.accent : theme.text.muted}
              className="flex-shrink-0 transition-colors duration-200"
            />

            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full bg-transparent outline-none text-base"
                style={{
                  color: theme.text.primary,
                  fontFamily: "'DM Sans', sans-serif",
                }}
                placeholder=""
              />

              {/* Animated placeholder */}
              {!query && !isFocused && (
                <motion.div
                  className="absolute inset-0 flex items-center pointer-events-none"
                  key={placeholderIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <span
                    className="text-base"
                    style={{
                      color: theme.input.placeholder,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    I'm craving{' '}
                    <span style={{ fontStyle: 'italic' }}>
                      {PLACEHOLDER_SUGGESTIONS[placeholderIndex]}
                    </span>
                  </span>
                </motion.div>
              )}

              {/* Focus placeholder */}
              {!query && isFocused && (
                <span
                  className="absolute inset-0 flex items-center pointer-events-none text-base"
                  style={{
                    color: theme.input.placeholder,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Type what you want...
                </span>
              )}
            </div>

            {/* Clear / Loading */}
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <Loader2
                    size={18}
                    color={theme.accent}
                    className="animate-spin"
                  />
                </motion.div>
              ) : query ? (
                <motion.button
                  key="clear"
                  onClick={handleClear}
                  className="p-1 rounded-full"
                  style={{ background: theme.card.border }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                >
                  <X size={14} color={theme.text.muted} />
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>

      {/* ============ Quick Chips ============ */}
      <AnimatePresence>
        {!hasSearched && (
          <motion.div
            className="px-5 pb-4"
            initial={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p
              className="text-xs font-medium mb-3 uppercase tracking-wider"
              style={{
                color: theme.text.muted,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Quick picks
            </p>

            <div className="flex flex-wrap gap-2">
              {CRAVING_CHIPS.map((chip, index) => {
                const Icon = chip.icon;
                const chipColor = isNightMode ? chip.color.night : chip.color.day;

                return (
                  <motion.button
                    key={chip.id}
                    onClick={() => handleChipClick(chip)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full"
                    style={{
                      background: theme.card.bg,
                      border: `1px solid ${theme.card.border}`,
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.15 + index * 0.05 }}
                    whileHover={{
                      scale: 1.05,
                      background: `${chipColor}15`,
                      borderColor: `${chipColor}30`,
                    }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon size={14} color={chipColor} />
                    <span
                      className="text-sm font-medium"
                      style={{
                        color: theme.text.primary,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {chip.label}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ Results ============ */}
      <div className="flex-1 px-5 pb-6 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Error state */}
          {error && (
            <motion.div
              key="error"
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p
                className="text-sm"
                style={{
                  color: theme.text.secondary,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {error}
              </p>
            </motion.div>
          )}

          {/* Results */}
          {hasResults && (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Interpretation / count */}
              <motion.div
                className="flex items-center gap-2 mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Sparkles size={14} color={theme.accent} />
                <p
                  className="text-sm"
                  style={{
                    color: theme.text.secondary,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {results?.interpretation || `Found ${results?.totalMatches} places`}
                </p>
              </motion.div>

              {/* Result cards */}
              <div className="space-y-2">
                {resultsToShow.map((activity, index) => (
                  <CravingResultCard
                    key={activity.activity.id}
                    activity={activity}
                    index={index}
                    onSelect={onSelect}
                    isNightMode={isNightMode}
                  />
                ))}
              </div>

              {/* More results hint */}
              {results && results.totalMatches > resultsToShow.length && (
                <motion.p
                  className="text-center text-xs mt-4 py-2"
                  style={{
                    color: theme.text.muted,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  Showing top {resultsToShow.length} of {results.totalMatches} matches
                </motion.p>
              )}
            </motion.div>
          )}

          {/* No results */}
          {hasSearched && !hasResults && !isLoading && !error && (
            <motion.div
              key="no-results"
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                style={{
                  background: theme.accentGlow,
                  border: `1px solid ${theme.card.border}`,
                }}
              >
                <Search size={24} color={theme.text.muted} />
              </motion.div>
              <p
                className="text-base mb-2"
                style={{
                  color: theme.text.primary,
                  fontFamily: "'Fraunces', Georgia, serif",
                }}
              >
                Nothing quite like that nearby
              </p>
              <p
                className="text-sm"
                style={{
                  color: theme.text.secondary,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Try a different search or one of the quick picks
              </p>
            </motion.div>
          )}

          {/* Initial state - visual hint */}
          {!hasSearched && !query && (
            <motion.div
              key="initial"
              className="text-center py-16"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="w-20 h-20 mx-auto mb-5 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${theme.accent}20 0%, ${theme.accent}05 100%)`,
                  border: `1px solid ${theme.accent}20`,
                }}
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Sparkles size={32} color={theme.accent} strokeWidth={1.2} />
              </motion.div>
              <p
                className="text-lg mb-2"
                style={{
                  color: theme.text.primary,
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontWeight: 500,
                }}
              >
                What calls to you?
              </p>
              <p
                className="text-sm max-w-xs mx-auto"
                style={{
                  color: theme.text.secondary,
                  fontFamily: "'DM Sans', sans-serif",
                  lineHeight: 1.6,
                }}
              >
                Type what you're craving, or tap one of the quick picks above
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

export default CravingMode;
