/**
 * Manual Preferences Panel
 *
 * WI-4.5: Optional panel for explicit preference control
 *
 * Design: "Travel Passport" - clean, scannable sections that feel like
 * stamps in a passport. Each preference is a small, tactile control
 * that's quick to adjust.
 *
 * Key principles:
 * - Clearly optional ("Want more control?")
 * - Quick to scan and modify
 * - Changes feel instant
 * - Non-mandatory - many users won't touch it
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Settings2,
  X,
  Utensils,
  Mountain,
  Landmark,
  Moon,
  ShoppingBag,
  Camera,
  Coffee,
  Leaf,
  Sparkles,
  Gauge,
  Check,
  ChevronRight,
  Zap,
  MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePreferencesStore, type PreferencesState } from '../../stores/preferencesStore';
import type { InterestCategories, TripPace, BudgetLevel } from '../../services/preferences';

// ============================================================================
// Design Tokens
// ============================================================================

const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#E8A090',
  golden: '#D4A853',
  goldenLight: '#E8D4A8',
  sage: '#6B8E7B',
  sageLight: '#A8C4B4',
  espresso: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E5DDD0',
  subtle: '#F5F0E8',
  blue: '#4A90A4',
  blueLight: '#C4DDE4',
};

// ============================================================================
// Types
// ============================================================================

interface InterestOption {
  key: keyof InterestCategories;
  label: string;
  icon: LucideIcon;
  color: string;
}

interface PaceOption {
  value: TripPace;
  label: string;
  description: string;
  icon: LucideIcon;
}

interface BudgetOption {
  value: BudgetLevel;
  label: string;
  symbol: string;
}

interface DietaryOption {
  id: string;
  label: string;
}

// ============================================================================
// Options Data
// ============================================================================

const INTEREST_OPTIONS: InterestOption[] = [
  { key: 'food', label: 'Food & Dining', icon: Utensils, color: colors.terracotta },
  { key: 'culture', label: 'Culture & History', icon: Landmark, color: colors.blue },
  { key: 'nature', label: 'Nature & Outdoors', icon: Leaf, color: colors.sage },
  { key: 'nightlife', label: 'Nightlife', icon: Moon, color: '#6B5B95' },
  { key: 'shopping', label: 'Shopping', icon: ShoppingBag, color: colors.golden },
  { key: 'photography', label: 'Photography', icon: Camera, color: '#4A6FA5' },
  { key: 'relaxation', label: 'Relaxation', icon: Coffee, color: '#8B7355' },
  { key: 'adventure', label: 'Adventure', icon: Mountain, color: colors.terracotta },
  { key: 'localExperiences', label: 'Local Gems', icon: MapPin, color: colors.sage },
];

const PACE_OPTIONS: PaceOption[] = [
  { value: 'relaxed', label: 'Relaxed', description: '2-3 activities/day', icon: Coffee },
  { value: 'balanced', label: 'Balanced', description: '3-4 activities/day', icon: Gauge },
  { value: 'packed', label: 'Packed', description: '5+ activities/day', icon: Zap },
];

const BUDGET_OPTIONS: BudgetOption[] = [
  { value: 'budget', label: 'Budget', symbol: '$' },
  { value: 'moderate', label: 'Moderate', symbol: '$$' },
  { value: 'comfort', label: 'Comfort', symbol: '$$$' },
  { value: 'luxury', label: 'Luxury', symbol: '$$$$' },
];

const DIETARY_OPTIONS: DietaryOption[] = [
  { id: 'vegetarian', label: 'Vegetarian' },
  { id: 'vegan', label: 'Vegan' },
  { id: 'gluten-free', label: 'Gluten-free' },
  { id: 'halal', label: 'Halal' },
  { id: 'kosher', label: 'Kosher' },
];

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Interest slider with visual feedback
 */
function InterestSlider({
  option,
  value,
  onChange,
}: {
  option: InterestOption;
  value: number;
  onChange: (value: number) => void;
}) {
  const Icon = option.icon;
  const isActive = value > 0.5;
  const isStrong = value > 0.7;

  return (
    <motion.div
      className="flex items-center gap-3 py-2"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      {/* Icon */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200"
        style={{
          backgroundColor: isActive ? `${option.color}15` : colors.subtle,
          color: isActive ? option.color : colors.lightBrown,
        }}
      >
        <Icon size={16} />
      </div>

      {/* Label & Slider */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span
            className="text-sm font-medium truncate"
            style={{ color: isActive ? colors.espresso : colors.lightBrown }}
          >
            {option.label}
          </span>
          {isStrong && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${option.color}20`, color: option.color }}
            >
              High
            </motion.span>
          )}
        </div>

        {/* Slider track */}
        <div className="relative h-1.5 rounded-full" style={{ backgroundColor: colors.border }}>
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{ backgroundColor: option.color }}
            initial={false}
            animate={{ width: `${value * 100}%` }}
            transition={{ duration: 0.15 }}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>
      </div>
    </motion.div>
  );
}


/**
 * Toggle pill for dietary options
 */
function DietaryToggle({
  option,
  isSelected,
  onToggle,
}: {
  option: DietaryOption;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <motion.button
      onClick={onToggle}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all"
      style={{
        backgroundColor: isSelected ? `${colors.sage}20` : colors.subtle,
        color: isSelected ? colors.sage : colors.lightBrown,
        borderWidth: 1,
        borderColor: isSelected ? colors.sage : 'transparent',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
          <Check size={12} />
        </motion.div>
      )}
      {option.label}
    </motion.button>
  );
}

/**
 * Section header with optional action
 */
function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-3">
      <h3
        className="text-sm font-semibold tracking-wide uppercase"
        style={{ color: colors.lightBrown }}
      >
        {title}
      </h3>
      {subtitle && (
        <p className="text-xs mt-0.5" style={{ color: colors.lightBrown }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export interface ManualPreferencesPanelProps {
  /** Whether panel is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Trip ID for trip-specific preferences */
  tripId?: string | null;
  /** Custom className */
  className?: string;
}

export function ManualPreferencesPanel({
  isOpen,
  onClose,
  tripId,
  className = '',
}: ManualPreferencesPanelProps) {
  // Get preferences from store
  const effectivePrefs = usePreferencesStore((state: PreferencesState) =>
    state.getEffectivePreferences(tripId)
  );
  const updateInterest = usePreferencesStore((state: PreferencesState) => state.updateInterest);
  const setPace = usePreferencesStore((state: PreferencesState) => state.setPace);
  const setBudget = usePreferencesStore((state: PreferencesState) => state.setBudget);
  const addDietary = usePreferencesStore((state: PreferencesState) => state.addDietary);

  // Local state for dietary toggles
  const [selectedDietary, setSelectedDietary] = useState<Set<string>>(() => {
    const set = new Set<string>();
    effectivePrefs.dietaryRequirements.forEach((d) => set.add(d.tag));
    return set;
  });

  // Get current values
  const interests = effectivePrefs.interests.value;
  const currentPace = effectivePrefs.pace.value;
  const currentBudget = effectivePrefs.budget.value;

  // Handlers
  const handleInterestChange = useCallback(
    (category: keyof InterestCategories, value: number) => {
      updateInterest(category, value, 'stated', tripId);
    },
    [updateInterest, tripId]
  );

  const handlePaceChange = useCallback(
    (pace: TripPace) => {
      setPace(pace, 'stated', tripId);
    },
    [setPace, tripId]
  );

  const handleBudgetChange = useCallback(
    (budget: BudgetLevel) => {
      setBudget(budget, 'stated', tripId);
    },
    [setBudget, tripId]
  );

  const handleDietaryToggle = useCallback(
    (dietaryId: string) => {
      setSelectedDietary((prev) => {
        const next = new Set(prev);
        if (next.has(dietaryId)) {
          next.delete(dietaryId);
        } else {
          next.add(dietaryId);
          addDietary(dietaryId, true, 'stated', tripId);
        }
        return next;
      });
    },
    [addDietary, tripId]
  );

  // Animation variants
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const panelVariants = {
    hidden: { x: '100%', opacity: 0.8 },
    visible: {
      x: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 300, damping: 30 },
    },
    exit: {
      x: '100%',
      opacity: 0.8,
      transition: { duration: 0.2 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className={`fixed right-0 top-0 bottom-0 w-full max-w-sm z-50 overflow-hidden flex flex-col ${className}`}
            style={{ backgroundColor: colors.cream }}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Header */}
            <div
              className="flex-shrink-0 px-5 py-4 border-b flex items-center justify-between"
              style={{ borderColor: colors.border }}
            >
              <div>
                <h2
                  className="text-lg font-semibold"
                  style={{ fontFamily: 'var(--font-display)', color: colors.espresso }}
                >
                  Refine Your Trip
                </h2>
                <p className="text-xs mt-0.5" style={{ color: colors.lightBrown }}>
                  Adjust preferences for better recommendations
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full transition-colors hover:bg-black/5"
                aria-label="Close preferences"
              >
                <X size={20} style={{ color: colors.mediumBrown }} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
              {/* Interests Section */}
              <section>
                <SectionHeader
                  title="Your Interests"
                  subtitle="Slide to adjust how much you care about each"
                />
                <div className="space-y-1">
                  {INTEREST_OPTIONS.map((option, index) => (
                    <motion.div
                      key={option.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                    >
                      <InterestSlider
                        option={option}
                        value={interests[option.key]}
                        onChange={(v) => handleInterestChange(option.key, v)}
                      />
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Pace Section */}
              <section>
                <SectionHeader title="Trip Pace" subtitle="How busy do you want your days?" />
                <div className="flex gap-2">
                  {PACE_OPTIONS.map((option) => {
                    const isSelected = currentPace === option.value;
                    const Icon = option.icon;
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => handlePaceChange(option.value)}
                        className="flex-1 p-3 rounded-xl text-center transition-all"
                        style={{
                          backgroundColor: isSelected ? colors.terracotta : colors.subtle,
                          color: isSelected ? colors.cream : colors.mediumBrown,
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon
                          size={20}
                          className="mx-auto mb-1"
                          style={{ opacity: isSelected ? 1 : 0.7 }}
                        />
                        <div className="text-sm font-medium">{option.label}</div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ opacity: 0.8 }}
                        >
                          {option.description}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              {/* Budget Section */}
              <section>
                <SectionHeader title="Budget Level" />
                <div className="flex gap-2">
                  {BUDGET_OPTIONS.map((option) => {
                    const isSelected = currentBudget === option.value;
                    return (
                      <motion.button
                        key={option.value}
                        onClick={() => handleBudgetChange(option.value)}
                        className="flex-1 py-2.5 px-3 rounded-lg text-center transition-all"
                        style={{
                          backgroundColor: isSelected ? colors.golden : colors.subtle,
                          color: isSelected ? colors.espresso : colors.mediumBrown,
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="text-lg font-bold">{option.symbol}</div>
                        <div className="text-xs">{option.label}</div>
                      </motion.button>
                    );
                  })}
                </div>
              </section>

              {/* Dietary Section */}
              <section>
                <SectionHeader title="Dietary Needs" subtitle="We'll filter restaurant suggestions" />
                <div className="flex flex-wrap gap-2">
                  {DIETARY_OPTIONS.map((option) => (
                    <DietaryToggle
                      key={option.id}
                      option={option}
                      isSelected={selectedDietary.has(option.id)}
                      onToggle={() => handleDietaryToggle(option.id)}
                    />
                  ))}
                </div>
              </section>

              {/* Hidden Gems Toggle */}
              <section
                className="p-4 rounded-xl"
                style={{ backgroundColor: colors.subtle }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${colors.sage}20`, color: colors.sage }}
                    >
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: colors.espresso }}>
                        Prefer Hidden Gems
                      </div>
                      <div className="text-xs" style={{ color: colors.lightBrown }}>
                        Less touristy, more authentic
                      </div>
                    </div>
                  </div>
                  <HiddenGemsToggle tripId={tripId} />
                </div>
              </section>
            </div>

            {/* Footer */}
            <div
              className="flex-shrink-0 px-5 py-4 border-t"
              style={{ borderColor: colors.border, backgroundColor: colors.warmWhite }}
            >
              <p className="text-xs text-center" style={{ color: colors.lightBrown }}>
                Changes apply instantly to recommendations
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Hidden gems toggle with animation
 */
function HiddenGemsToggle({ tripId }: { tripId?: string | null }) {
  const prefersHiddenGems = usePreferencesStore(
    (state: PreferencesState) => state.getEffectivePreferences(tripId).prefersHiddenGems.value
  );
  const setHiddenGemsPreference = usePreferencesStore(
    (state: PreferencesState) => state.setHiddenGemsPreference
  );

  return (
    <motion.button
      onClick={() => setHiddenGemsPreference(!prefersHiddenGems, 'stated', tripId)}
      className="relative w-12 h-7 rounded-full transition-colors"
      style={{
        backgroundColor: prefersHiddenGems ? colors.sage : colors.border,
      }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute top-1 w-5 h-5 rounded-full shadow-sm"
        style={{ backgroundColor: colors.cream }}
        animate={{ left: prefersHiddenGems ? 'calc(100% - 24px)' : '4px' }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}

// ============================================================================
// Trigger Button Component
// ============================================================================

interface PreferencesTriggerProps {
  onClick: () => void;
  className?: string;
}

export function PreferencesTrigger({ onClick, className = '' }: PreferencesTriggerProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-colors ${className}`}
      style={{
        backgroundColor: colors.subtle,
        color: colors.mediumBrown,
      }}
      whileHover={{
        backgroundColor: colors.border,
        scale: 1.02,
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Settings2 size={16} />
      <span>Preferences</span>
      <ChevronRight size={14} style={{ opacity: 0.6 }} />
    </motion.button>
  );
}

// ============================================================================
// Hook for easy usage
// ============================================================================

export function useManualPreferencesPanel(tripId?: string | null) {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  return {
    isOpen,
    open,
    close,
    toggle,
    tripId,
    Panel: useMemo(
      () =>
        function PanelWrapper() {
          return (
            <ManualPreferencesPanel isOpen={isOpen} onClose={close} tripId={tripId} />
          );
        },
      [isOpen, close, tripId]
    ),
  };
}
