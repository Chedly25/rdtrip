/**
 * UserPreferences - Travel Profile & Memory Management
 *
 * Phase 2: Long-Term Memory
 *
 * A warm, editorial-styled component for viewing and editing
 * learned user preferences. Feels like a personal travel journal.
 *
 * Features:
 * - View personality profile with traits
 * - Edit preference categories
 * - View memory statistics
 * - Clear all data option (privacy)
 */

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Utensils,
  Wallet,
  Clock,
  Bed,
  MapPin,
  Car,
  Sparkles,
  Brain,
  Trash2,
  Edit3,
  Check,
  X,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { ResponsiveSheet, SheetFooter } from '../ui/ResponsiveSheet';
import { GlassCard } from '../ui/GlassCard';
import { EASING, DURATION } from '../transitions';

// ============================================================================
// Types
// ============================================================================

interface UserProfile {
  userId: string;
  preferences: Record<string, PreferenceValue>;
  traits: string[];
  memoryCounts: Record<string, number>;
  totalMemories: number;
  recentMemories: Array<{
    content: string;
    type: string;
    createdAt: string;
  }>;
  updatedAt: string | null;
}

interface PreferenceValue {
  value: string;
  detail?: string;
  confidence?: number;
  lastUpdated?: string;
  source?: 'user_set' | 'ai_extracted';
}

// Category configuration with icons and options
const PREFERENCE_CATEGORIES = {
  dietary: {
    label: 'Dietary',
    icon: Utensils,
    color: 'terracotta',
    description: 'Food restrictions and preferences',
    options: ['No restrictions', 'Vegetarian', 'Vegan', 'Pescatarian', 'Halal', 'Kosher', 'Gluten-free', 'Dairy-free'],
  },
  budget: {
    label: 'Budget',
    icon: Wallet,
    color: 'gold',
    description: 'Your travel spending style',
    options: ['Budget', 'Mid-range', 'Luxury', 'Ultra-luxury'],
  },
  pace: {
    label: 'Travel Pace',
    icon: Clock,
    color: 'sage',
    description: 'How you like to explore',
    options: ['Relaxed', 'Moderate', 'Fast-paced', 'Packed itinerary'],
  },
  accommodation: {
    label: 'Accommodation',
    icon: Bed,
    color: 'rui-secondary',
    description: 'Where you prefer to stay',
    options: ['Hostels', 'Budget hotels', 'Boutique hotels', 'Luxury hotels', 'Airbnb/Rentals', 'Resorts'],
  },
  activities: {
    label: 'Activities',
    icon: MapPin,
    color: 'terracotta',
    description: 'What you enjoy doing',
    options: ['Cultural/Museums', 'Outdoor/Nature', 'Adventure sports', 'Food & Wine', 'Relaxation/Spa', 'Shopping', 'Nightlife'],
  },
  transport: {
    label: 'Transport',
    icon: Car,
    color: 'rui-grey-60',
    description: 'How you like to get around',
    options: ['Walking/Cycling', 'Public transit', 'Rental car', 'Private driver', 'Mix of everything'],
  },
} as const;

type CategoryKey = keyof typeof PREFERENCE_CATEGORIES;

// ============================================================================
// API Functions
// ============================================================================

async function fetchProfile(): Promise<UserProfile | null> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return null;

    const response = await fetch('/api/agent/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.success ? data.profile : null;
  } catch {
    return null;
  }
}

async function updatePreference(category: string, value: string, detail?: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    const response = await fetch(`/api/agent/preferences/${category}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value, detail }),
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function deletePreference(category: string): Promise<boolean> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    const response = await fetch(`/api/agent/preferences/${category}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.ok;
  } catch {
    return false;
  }
}

async function clearAllMemories(): Promise<boolean> {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return false;

    const response = await fetch('/api/agent/memories', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.ok;
  } catch {
    return false;
  }
}

// ============================================================================
// Sub-components
// ============================================================================

/**
 * Animated memory count indicator
 */
function MemoryCount({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
        className={cn(
          'w-12 h-12 rounded-full mx-auto mb-2',
          'flex items-center justify-center',
          'font-display text-heading-3',
          color === 'terracotta' && 'bg-terracotta/10 text-terracotta',
          color === 'gold' && 'bg-gold/10 text-gold',
          color === 'sage' && 'bg-sage/10 text-sage'
        )}
      >
        {count}
      </motion.div>
      <p className="text-body-3 text-rui-grey-50">{label}</p>
    </motion.div>
  );
}

/**
 * Preference category card
 */
function PreferenceCard({
  categoryKey,
  value,
  onEdit,
  onDelete,
  index,
}: {
  categoryKey: CategoryKey;
  value?: PreferenceValue;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
}) {
  const config = PREFERENCE_CATEGORIES[categoryKey];
  const Icon = config.icon;
  const hasValue = value?.value;

  const colorClasses = {
    terracotta: 'bg-terracotta/10 text-terracotta border-terracotta/20',
    gold: 'bg-gold/10 text-gold border-gold/20',
    sage: 'bg-sage/10 text-sage border-sage/20',
    'rui-secondary': 'bg-rui-secondary/10 text-rui-secondary border-rui-secondary/20',
    'rui-grey-60': 'bg-rui-grey-10 text-rui-grey-60 border-rui-grey-20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: DURATION.normal, ease: EASING.smooth }}
      className={cn(
        'group relative',
        'bg-white rounded-rui-16 border border-rui-grey-10',
        'p-4 hover:shadow-rui-2 transition-shadow duration-rui-sm'
      )}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-rui-12 flex items-center justify-center flex-shrink-0',
            colorClasses[config.color]
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-display text-emphasis-1 text-rui-black">{config.label}</h4>

            {/* Actions */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onEdit}
                className="p-1.5 rounded-full hover:bg-rui-grey-5 text-rui-grey-40 hover:text-rui-grey-60 transition-colors"
                aria-label={`Edit ${config.label}`}
              >
                <Edit3 className="w-4 h-4" />
              </button>
              {hasValue && (
                <button
                  onClick={onDelete}
                  className="p-1.5 rounded-full hover:bg-danger/10 text-rui-grey-40 hover:text-danger transition-colors"
                  aria-label={`Delete ${config.label}`}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <p className="text-body-3 text-rui-grey-50 mt-0.5">{config.description}</p>

          {/* Value display */}
          {hasValue ? (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2"
            >
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
                  'text-emphasis-3',
                  colorClasses[config.color]
                )}
              >
                <Check className="w-3 h-3" />
                {value.value}
              </span>
              {value.source === 'ai_extracted' && (
                <span className="ml-2 text-body-3 text-rui-grey-40 italic">
                  (learned from chat)
                </span>
              )}
            </motion.div>
          ) : (
            <button
              onClick={onEdit}
              className="mt-2 text-body-3 text-rui-accent hover:underline flex items-center gap-1"
            >
              Set preference
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Edit preference sheet content
 */
function EditPreferenceContent({
  categoryKey,
  currentValue,
  onSave,
  onCancel,
  isLoading,
}: {
  categoryKey: CategoryKey;
  currentValue?: PreferenceValue;
  onSave: (value: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}) {
  const [selected, setSelected] = useState(currentValue?.value || '');
  const config = PREFERENCE_CATEGORIES[categoryKey];

  const colorClasses = {
    terracotta: 'border-terracotta bg-terracotta/5 text-terracotta',
    gold: 'border-gold bg-gold/5 text-gold',
    sage: 'border-sage bg-sage/5 text-sage',
    'rui-secondary': 'border-rui-secondary bg-rui-secondary/5 text-rui-secondary',
    'rui-grey-60': 'border-rui-grey-40 bg-rui-grey-5 text-rui-grey-60',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {config.options.map((option) => (
          <motion.button
            key={option}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelected(option)}
            className={cn(
              'p-3 rounded-rui-12 border-2 text-left transition-all duration-rui-sm',
              'text-emphasis-2',
              selected === option
                ? colorClasses[config.color]
                : 'border-rui-grey-10 bg-white text-rui-grey-60 hover:border-rui-grey-20'
            )}
          >
            <div className="flex items-center justify-between">
              {option}
              {selected === option && <Check className="w-4 h-4" />}
            </div>
          </motion.button>
        ))}
      </div>

      <SheetFooter
        primaryLabel={isLoading ? 'Saving...' : 'Save Preference'}
        onPrimary={() => selected && onSave(selected)}
        primaryDisabled={!selected || isLoading}
        primaryLoading={isLoading}
        secondaryLabel="Cancel"
        onSecondary={onCancel}
      />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export interface UserPreferencesProps {
  className?: string;
}

export function UserPreferences({ className = '' }: UserPreferencesProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState<CategoryKey | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const data = await fetchProfile();
    if (data) {
      setProfile(data);
    } else {
      setError('Unable to load your profile. Please sign in.');
    }
    setIsLoading(false);
  }, []);

  const handleSavePreference = useCallback(async (value: string) => {
    if (!editingCategory) return;

    setIsSaving(true);
    const success = await updatePreference(editingCategory, value);
    if (success) {
      await loadProfile();
      setEditingCategory(null);
    }
    setIsSaving(false);
  }, [editingCategory, loadProfile]);

  const handleDeletePreference = useCallback(async (category: CategoryKey) => {
    const success = await deletePreference(category);
    if (success) {
      await loadProfile();
    }
  }, [loadProfile]);

  const handleClearAll = useCallback(async () => {
    const success = await clearAllMemories();
    if (success) {
      setProfile(prev => prev ? {
        ...prev,
        preferences: {},
        traits: [],
        memoryCounts: {},
        totalMemories: 0,
        recentMemories: [],
      } : null);
      setShowClearConfirm(false);
    }
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('p-6 flex items-center justify-center min-h-[300px]', className)}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Brain className="w-8 h-8 text-rui-accent" />
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error || !profile) {
    return (
      <div className={cn('p-6 text-center', className)}>
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rui-grey-5 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-rui-grey-40" />
        </div>
        <p className="text-body-1 text-rui-grey-60">{error || 'Unable to load profile'}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with profile summary */}
      <GlassCard className="p-5" hover={false}>
        <div className="flex items-center gap-4 mb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-terracotta to-gold flex items-center justify-center"
          >
            <User className="w-7 h-7 text-white" />
          </motion.div>
          <div>
            <h3 className="font-display text-heading-3 text-rui-black">Your Travel Profile</h3>
            <p className="text-body-2 text-rui-grey-50">
              Preferences the assistant has learned about you
            </p>
          </div>
        </div>

        {/* Traits */}
        {profile.traits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap gap-2 mb-4"
          >
            {profile.traits.map((trait, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rui-grey-5 text-body-3 text-rui-grey-60"
              >
                <Sparkles className="w-3 h-3 text-gold" />
                {trait}
              </span>
            ))}
          </motion.div>
        )}

        {/* Memory stats */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-rui-grey-10">
          <MemoryCount
            count={profile.memoryCounts['preference'] || 0}
            label="Preferences"
            color="terracotta"
          />
          <MemoryCount
            count={profile.memoryCounts['experience'] || 0}
            label="Experiences"
            color="sage"
          />
          <MemoryCount
            count={profile.totalMemories}
            label="Total Memories"
            color="gold"
          />
        </div>
      </GlassCard>

      {/* Preference categories */}
      <div>
        <h4 className="font-display text-emphasis-1 text-rui-black mb-3 px-1">
          Preference Settings
        </h4>
        <div className="space-y-3">
          {(Object.keys(PREFERENCE_CATEGORIES) as CategoryKey[]).map((key, index) => (
            <PreferenceCard
              key={key}
              categoryKey={key}
              value={profile.preferences[key]}
              onEdit={() => setEditingCategory(key)}
              onDelete={() => handleDeletePreference(key)}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* Recent memories preview */}
      {profile.recentMemories.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <h4 className="font-display text-emphasis-1 text-rui-black mb-3 px-1">
            Recent Memories
          </h4>
          <div className="space-y-2">
            {profile.recentMemories.slice(0, 3).map((memory, i) => (
              <div
                key={i}
                className="p-3 rounded-rui-8 bg-rui-grey-2 border border-rui-grey-8"
              >
                <p className="text-body-3 text-rui-grey-60 line-clamp-2">
                  {memory.content}
                </p>
                <p className="text-body-3 text-rui-grey-40 mt-1 flex items-center gap-2">
                  <span className="capitalize">{memory.type}</span>
                  <span>•</span>
                  <span>{new Date(memory.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Clear all data */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="pt-4 border-t border-rui-grey-10"
      >
        <button
          onClick={() => setShowClearConfirm(true)}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-rui-8',
            'text-body-2 text-danger',
            'hover:bg-danger/5 transition-colors',
            'touch-target'
          )}
        >
          <Trash2 className="w-4 h-4" />
          Clear all memories & preferences
        </button>
      </motion.div>

      {/* Edit preference sheet */}
      <ResponsiveSheet
        isOpen={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title={editingCategory ? `Set ${PREFERENCE_CATEGORIES[editingCategory].label}` : ''}
        subtitle={editingCategory ? PREFERENCE_CATEGORIES[editingCategory].description : ''}
        size="sm"
      >
        {editingCategory && (
          <EditPreferenceContent
            categoryKey={editingCategory}
            currentValue={profile.preferences[editingCategory]}
            onSave={handleSavePreference}
            onCancel={() => setEditingCategory(null)}
            isLoading={isSaving}
          />
        )}
      </ResponsiveSheet>

      {/* Clear confirmation sheet */}
      <ResponsiveSheet
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        title="Clear All Data?"
        subtitle="This cannot be undone"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-rui-12 bg-danger/5 border border-danger/20">
            <p className="text-body-2 text-rui-grey-70">
              This will permanently delete all your learned preferences and conversation memories.
              The assistant will no longer remember your travel style.
            </p>
          </div>
          <SheetFooter
            primaryLabel="Clear Everything"
            onPrimary={handleClearAll}
            secondaryLabel="Keep My Data"
            onSecondary={() => setShowClearConfirm(false)}
          />
        </div>
      </ResponsiveSheet>
    </div>
  );
}

export default UserPreferences;
