/**
 * Quick Preference Editor - Personal Compass
 *
 * An elegant inline editor for modifying trip preferences without
 * regenerating the entire route. Users can toggle preferences and
 * choose to apply changes to existing or only new recommendations.
 *
 * Design: "Personal Compass" - refined, tactile toggles with warm tones
 *
 * Features:
 * - Grouped preference sections
 * - Toggle switches with satisfying animations
 * - "Apply to all" vs "New recommendations only"
 * - Visual indicators for active preferences
 * - Smooth expand/collapse animations
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Heart,
  Utensils,
  Mountain,
  Gauge,
  Wallet,
  Users,
  Baby,
  Wine,
  Cake,
  GraduationCap,
  Sunrise,
  Backpack,
  Coffee,
  Landmark,
  ChevronDown,
  Check,
  Sparkles,
  X,
  Settings2,
  RefreshCw,
  Leaf,
  Camera,
  ShoppingBag,
  Moon,
  Umbrella,
  Scroll,
  Palette,
  Building2,
  Frame,
  Drama,
  Store,
  Home,
  Castle,
  Tent,
  Accessibility,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TripPersonalization, PersonalizationInterest } from '../../stores/spotlightStoreV2';

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
};

// Preference options with icons
const OCCASION_OPTIONS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'honeymoon', label: 'Honeymoon', icon: Heart },
  { id: 'anniversary', label: 'Anniversary', icon: Wine },
  { id: 'birthday', label: 'Birthday', icon: Cake },
  { id: 'graduation', label: 'Graduation', icon: GraduationCap },
  { id: 'retirement', label: 'Retirement', icon: Sunrise },
  { id: 'babymoon', label: 'Babymoon', icon: Baby },
  { id: 'reunion', label: 'Reunion', icon: Users },
  { id: 'solo-adventure', label: 'Solo Adventure', icon: Backpack },
  { id: 'family-vacation', label: 'Family Vacation', icon: Users },
  { id: 'just-because', label: 'Just Because', icon: Sparkles },
];

const TRAVEL_STYLE_OPTIONS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'explorer', label: 'Explorer', icon: Compass },
  { id: 'relaxer', label: 'Relaxer', icon: Coffee },
  { id: 'culture', label: 'Culture Seeker', icon: Landmark },
  { id: 'adventurer', label: 'Adventurer', icon: Mountain },
  { id: 'foodie', label: 'Foodie', icon: Utensils },
];

const INTEREST_OPTIONS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'history', label: 'History', icon: Scroll },
  { id: 'art', label: 'Art', icon: Palette },
  { id: 'architecture', label: 'Architecture', icon: Building2 },
  { id: 'nature', label: 'Nature', icon: Leaf },
  { id: 'food', label: 'Food', icon: Utensils },
  { id: 'wine', label: 'Wine', icon: Wine },
  { id: 'nightlife', label: 'Nightlife', icon: Moon },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'adventure', label: 'Adventure', icon: Backpack },
  { id: 'wellness', label: 'Wellness', icon: Sparkles },
  { id: 'local-culture', label: 'Local Culture', icon: Drama },
  { id: 'beaches', label: 'Beaches', icon: Umbrella },
  { id: 'mountains', label: 'Mountains', icon: Mountain },
  { id: 'museums', label: 'Museums', icon: Frame },
];

const DINING_OPTIONS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'street', label: 'Street Food', icon: Store },
  { id: 'casual', label: 'Casual', icon: Coffee },
  { id: 'mix', label: 'Mixed', icon: Utensils },
  { id: 'fine', label: 'Fine Dining', icon: Sparkles },
];

const BUDGET_OPTIONS: Array<{ id: string; label: string; price: string }> = [
  { id: 'budget', label: 'Budget', price: '$' },
  { id: 'mid', label: 'Mid-Range', price: '$$' },
  { id: 'luxury', label: 'Luxury', price: '$$$' },
];

const ACCOMMODATION_OPTIONS: Array<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'budget', label: 'Budget', icon: Home },
  { id: 'mid', label: 'Comfortable', icon: Home },
  { id: 'luxury', label: 'Luxury', icon: Castle },
  { id: 'unique', label: 'Unique Stays', icon: Tent },
];

// Custom toggle switch component
const ToggleSwitch = ({
  isOn,
  onToggle,
  disabled = false,
}: {
  isOn: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) => (
  <motion.button
    onClick={onToggle}
    disabled={disabled}
    className="relative h-6 w-11 rounded-full transition-colors"
    style={{
      background: isOn
        ? `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`
        : colors.border,
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
    whileTap={!disabled ? { scale: 0.95 } : {}}
  >
    <motion.div
      className="absolute top-0.5 h-5 w-5 rounded-full shadow-md"
      style={{ background: 'white' }}
      animate={{ left: isOn ? '22px' : '2px' }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
    />
  </motion.button>
);

// Preference chip for single/multi select
const PreferenceChip = ({
  label,
  icon: Icon,
  isSelected,
  onClick,
  variant = 'default',
}: {
  label: string;
  icon?: LucideIcon;
  isSelected: boolean;
  onClick: () => void;
  variant?: 'default' | 'budget';
}) => (
  <motion.button
    onClick={onClick}
    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
    style={{
      background: isSelected
        ? variant === 'budget'
          ? `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`
          : `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`
        : colors.subtle,
      color: isSelected ? 'white' : colors.mediumBrown,
      border: `1px solid ${isSelected ? 'transparent' : colors.border}`,
    }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    {Icon && <Icon className="h-3 w-3" />}
    {label}
    {isSelected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500 }}
      >
        <Check className="h-3 w-3" />
      </motion.div>
    )}
  </motion.button>
);

// Section header with expand/collapse
const SectionHeader = ({
  title,
  icon: Icon,
  isExpanded,
  onToggle,
  hasChanges,
}: {
  title: string;
  icon: LucideIcon;
  isExpanded: boolean;
  onToggle: () => void;
  hasChanges: boolean;
}) => (
  <motion.button
    onClick={onToggle}
    className="flex w-full items-center justify-between py-3"
    whileTap={{ scale: 0.99 }}
  >
    <div className="flex items-center gap-2">
      <div
        className="flex h-7 w-7 items-center justify-center rounded-lg"
        style={{ background: `${colors.terracotta}15` }}
      >
        <Icon className="h-3.5 w-3.5" style={{ color: colors.terracotta }} />
      </div>
      <span className="text-sm font-medium" style={{ color: colors.darkBrown }}>
        {title}
      </span>
      {hasChanges && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="h-2 w-2 rounded-full"
          style={{ background: colors.golden }}
        />
      )}
    </div>
    <motion.div
      animate={{ rotate: isExpanded ? 180 : 0 }}
      transition={{ duration: 0.2 }}
    >
      <ChevronDown className="h-4 w-4" style={{ color: colors.lightBrown }} />
    </motion.div>
  </motion.button>
);

// Pace slider component
const PaceSlider = ({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) => {
  const paceLabels = ['Very Relaxed', 'Relaxed', 'Balanced', 'Active', 'Packed'];

  return (
    <div className="space-y-3">
      <div className="flex justify-between">
        {paceLabels.map((label, i) => (
          <button
            key={label}
            onClick={() => onChange(i + 1)}
            className="flex flex-col items-center gap-1"
          >
            <motion.div
              className="h-3 w-3 rounded-full transition-colors"
              style={{
                background:
                  i + 1 === value
                    ? colors.terracotta
                    : i + 1 < value
                      ? `${colors.terracotta}40`
                      : colors.border,
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
            />
            <span
              className="text-[10px]"
              style={{
                color: i + 1 === value ? colors.terracotta : colors.lightBrown,
                fontWeight: i + 1 === value ? 600 : 400,
              }}
            >
              {label}
            </span>
          </button>
        ))}
      </div>
      <div className="relative h-1 rounded-full" style={{ background: colors.border }}>
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full"
          style={{
            background: `linear-gradient(90deg, ${colors.terracotta} 0%, ${colors.golden} 100%)`,
          }}
          animate={{ width: `${((value - 1) / 4) * 100}%` }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      </div>
    </div>
  );
};

interface QuickPreferenceEditorProps {
  personalization: TripPersonalization;
  onUpdate: (updates: Partial<TripPersonalization>) => void;
  onApply: (applyTo: 'all' | 'new') => Promise<void>;
  isApplying?: boolean;
  className?: string;
}

export const QuickPreferenceEditor: React.FC<QuickPreferenceEditorProps> = ({
  personalization,
  onUpdate,
  onApply,
  isApplying = false,
  className = '',
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('occasion');
  const [hasChanges, setHasChanges] = useState(false);
  const [changedSections, setChangedSections] = useState<Set<string>>(new Set());

  // Track changes
  const handleUpdate = useCallback(
    (section: string, updates: Partial<TripPersonalization>) => {
      onUpdate(updates);
      setHasChanges(true);
      setChangedSections((prev) => new Set([...prev, section]));
    },
    [onUpdate]
  );

  // Toggle interest
  const toggleInterest = useCallback(
    (interest: PersonalizationInterest) => {
      const current = personalization.interests || [];
      const updated = current.includes(interest)
        ? current.filter((i) => i !== interest)
        : [...current, interest];
      handleUpdate('interests', { interests: updated });
    },
    [personalization.interests, handleUpdate]
  );

  // Toggle dietary
  const toggleDietary = useCallback(
    (diet: string) => {
      const current = personalization.dietary || [];
      const updated = current.includes(diet)
        ? current.filter((d) => d !== diet)
        : [...current, diet];
      handleUpdate('dietary', { dietary: updated });
    },
    [personalization.dietary, handleUpdate]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`overflow-hidden rounded-2xl ${className}`}
      style={{
        background: colors.warmWhite,
        border: `1px solid ${colors.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          background: `linear-gradient(135deg, ${colors.cream} 0%, ${colors.warmWhite} 100%)`,
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              background: `linear-gradient(135deg, ${colors.terracotta}15 0%, ${colors.golden}15 100%)`,
            }}
          >
            <Settings2 className="h-5 w-5" style={{ color: colors.terracotta }} />
          </div>
          <div>
            <h3
              className="text-base font-semibold"
              style={{ color: colors.darkBrown, fontFamily: "'Fraunces', Georgia, serif" }}
            >
              Edit Preferences
            </h3>
            <p className="text-xs" style={{ color: colors.lightBrown }}>
              Fine-tune your trip recommendations
            </p>
          </div>
        </div>
        {hasChanges && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="rounded-full px-2 py-0.5 text-xs font-medium"
            style={{ background: `${colors.golden}20`, color: colors.goldenDark }}
          >
            Unsaved
          </motion.span>
        )}
      </div>

      {/* Sections */}
      <div className="divide-y" style={{ borderColor: colors.border }}>
        {/* Occasion Section */}
        <div className="px-5">
          <SectionHeader
            title="Trip Occasion"
            icon={Heart}
            isExpanded={expandedSection === 'occasion'}
            onToggle={() => setExpandedSection(expandedSection === 'occasion' ? null : 'occasion')}
            hasChanges={changedSections.has('occasion')}
          />
          <AnimatePresence>
            {expandedSection === 'occasion' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-4"
              >
                <div className="flex flex-wrap gap-2">
                  {OCCASION_OPTIONS.map((option) => (
                    <PreferenceChip
                      key={option.id}
                      label={option.label}
                      icon={option.icon}
                      isSelected={personalization.occasion === option.id}
                      onClick={() =>
                        handleUpdate('occasion', {
                          occasion: personalization.occasion === option.id ? undefined : option.id as TripPersonalization['occasion'],
                        })
                      }
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Travel Style Section */}
        <div className="px-5">
          <SectionHeader
            title="Travel Style"
            icon={Compass}
            isExpanded={expandedSection === 'style'}
            onToggle={() => setExpandedSection(expandedSection === 'style' ? null : 'style')}
            hasChanges={changedSections.has('style')}
          />
          <AnimatePresence>
            {expandedSection === 'style' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-4"
              >
                <div className="flex flex-wrap gap-2">
                  {TRAVEL_STYLE_OPTIONS.map((option) => (
                    <PreferenceChip
                      key={option.id}
                      label={option.label}
                      icon={option.icon}
                      isSelected={personalization.travelStyle === option.id}
                      onClick={() =>
                        handleUpdate('style', {
                          travelStyle: personalization.travelStyle === option.id ? undefined : option.id as TripPersonalization['travelStyle'],
                        })
                      }
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pace Section */}
        <div className="px-5">
          <SectionHeader
            title="Trip Pace"
            icon={Gauge}
            isExpanded={expandedSection === 'pace'}
            onToggle={() => setExpandedSection(expandedSection === 'pace' ? null : 'pace')}
            hasChanges={changedSections.has('pace')}
          />
          <AnimatePresence>
            {expandedSection === 'pace' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-4"
              >
                <PaceSlider
                  value={personalization.pace || 3}
                  onChange={(v) => handleUpdate('pace', { pace: v })}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Interests Section */}
        <div className="px-5">
          <SectionHeader
            title="Interests"
            icon={Sparkles}
            isExpanded={expandedSection === 'interests'}
            onToggle={() => setExpandedSection(expandedSection === 'interests' ? null : 'interests')}
            hasChanges={changedSections.has('interests')}
          />
          <AnimatePresence>
            {expandedSection === 'interests' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-4"
              >
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((option) => (
                    <PreferenceChip
                      key={option.id}
                      label={option.label}
                      icon={option.icon}
                      isSelected={personalization.interests?.includes(option.id as PersonalizationInterest) ?? false}
                      onClick={() => toggleInterest(option.id as PersonalizationInterest)}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dining Section */}
        <div className="px-5">
          <SectionHeader
            title="Dining Style"
            icon={Utensils}
            isExpanded={expandedSection === 'dining'}
            onToggle={() => setExpandedSection(expandedSection === 'dining' ? null : 'dining')}
            hasChanges={changedSections.has('dining')}
          />
          <AnimatePresence>
            {expandedSection === 'dining' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 overflow-hidden pb-4"
              >
                <div className="flex flex-wrap gap-2">
                  {DINING_OPTIONS.map((option) => (
                    <PreferenceChip
                      key={option.id}
                      label={option.label}
                      icon={option.icon}
                      isSelected={personalization.diningStyle === option.id}
                      onClick={() =>
                        handleUpdate('dining', {
                          diningStyle: personalization.diningStyle === option.id ? undefined : option.id as TripPersonalization['diningStyle'],
                        })
                      }
                    />
                  ))}
                </div>
                {/* Dietary quick toggles */}
                <div className="pt-2">
                  <p className="mb-2 text-xs font-medium" style={{ color: colors.lightBrown }}>
                    Dietary Restrictions
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher'].map((diet) => (
                      <PreferenceChip
                        key={diet}
                        label={diet}
                        isSelected={personalization.dietary?.includes(diet) ?? false}
                        onClick={() => toggleDietary(diet)}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Budget Section */}
        <div className="px-5">
          <SectionHeader
            title="Budget"
            icon={Wallet}
            isExpanded={expandedSection === 'budget'}
            onToggle={() => setExpandedSection(expandedSection === 'budget' ? null : 'budget')}
            hasChanges={changedSections.has('budget')}
          />
          <AnimatePresence>
            {expandedSection === 'budget' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-4"
              >
                <div className="flex gap-2">
                  {BUDGET_OPTIONS.map((option) => (
                    <motion.button
                      key={option.id}
                      onClick={() =>
                        handleUpdate('budget', {
                          budget: personalization.budget === option.id ? undefined : option.id as TripPersonalization['budget'],
                        })
                      }
                      className="flex flex-1 flex-col items-center gap-1 rounded-xl py-3 transition-all"
                      style={{
                        background:
                          personalization.budget === option.id
                            ? `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`
                            : colors.subtle,
                        color: personalization.budget === option.id ? 'white' : colors.mediumBrown,
                        border: `1px solid ${personalization.budget === option.id ? 'transparent' : colors.border}`,
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-lg font-bold">{option.price}</span>
                      <span className="text-xs">{option.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Accommodation Section */}
        <div className="px-5">
          <SectionHeader
            title="Accommodation"
            icon={Home}
            isExpanded={expandedSection === 'accommodation'}
            onToggle={() =>
              setExpandedSection(expandedSection === 'accommodation' ? null : 'accommodation')
            }
            hasChanges={changedSections.has('accommodation')}
          />
          <AnimatePresence>
            {expandedSection === 'accommodation' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden pb-4"
              >
                <div className="flex flex-wrap gap-2">
                  {ACCOMMODATION_OPTIONS.map((option) => (
                    <PreferenceChip
                      key={option.id}
                      label={option.label}
                      icon={option.icon}
                      isSelected={personalization.accommodation === option.id}
                      onClick={() =>
                        handleUpdate('accommodation', {
                          accommodation: personalization.accommodation === option.id ? undefined : option.id as TripPersonalization['accommodation'],
                        })
                      }
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Additional Preferences Section */}
        <div className="px-5">
          <SectionHeader
            title="Additional Preferences"
            icon={Accessibility}
            isExpanded={expandedSection === 'additional'}
            onToggle={() =>
              setExpandedSection(expandedSection === 'additional' ? null : 'additional')
            }
            hasChanges={changedSections.has('additional')}
          />
          <AnimatePresence>
            {expandedSection === 'additional' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3 overflow-hidden pb-4"
              >
                {/* Toggle preferences */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" style={{ color: colors.lightBrown }} />
                    <span className="text-sm" style={{ color: colors.mediumBrown }}>
                      Avoid crowded places
                    </span>
                  </div>
                  <ToggleSwitch
                    isOn={personalization.avoidCrowds ?? false}
                    onToggle={() =>
                      handleUpdate('additional', { avoidCrowds: !personalization.avoidCrowds })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Leaf className="h-4 w-4" style={{ color: colors.lightBrown }} />
                    <span className="text-sm" style={{ color: colors.mediumBrown }}>
                      Prefer outdoor activities
                    </span>
                  </div>
                  <ToggleSwitch
                    isOn={personalization.preferOutdoor ?? false}
                    onToggle={() =>
                      handleUpdate('additional', { preferOutdoor: !personalization.preferOutdoor })
                    }
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Apply Changes Footer */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="flex flex-col gap-3 px-5 py-4"
              style={{
                background: `linear-gradient(180deg, ${colors.warmWhite} 0%, ${colors.cream} 100%)`,
                borderTop: `1px solid ${colors.border}`,
              }}
            >
              <p className="text-center text-xs" style={{ color: colors.lightBrown }}>
                How should we apply these changes?
              </p>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => onApply('new')}
                  disabled={isApplying}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all"
                  style={{
                    background: colors.subtle,
                    color: colors.mediumBrown,
                    border: `1px solid ${colors.border}`,
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Sparkles className="h-4 w-4" />
                  New Only
                </motion.button>
                <motion.button
                  onClick={() => onApply('all')}
                  disabled={isApplying}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
                    color: 'white',
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isApplying ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Apply to All
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Compact version for inline use
export const QuickPreferenceToggle: React.FC<{
  label: string;
  isActive: boolean;
  onToggle: () => void;
  icon?: LucideIcon;
}> = ({ label, isActive, onToggle, icon: Icon }) => (
  <motion.button
    onClick={onToggle}
    className="flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
    style={{
      background: isActive
        ? `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`
        : colors.subtle,
      color: isActive ? 'white' : colors.mediumBrown,
      border: `1px solid ${isActive ? 'transparent' : colors.border}`,
    }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    {Icon && <Icon className="h-3 w-3" />}
    {label}
    {isActive ? <X className="h-3 w-3" /> : <Check className="h-3 w-3 opacity-0" />}
  </motion.button>
);

export default QuickPreferenceEditor;
