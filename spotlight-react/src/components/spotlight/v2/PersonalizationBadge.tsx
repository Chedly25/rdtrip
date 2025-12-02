/**
 * Personalization Badge
 *
 * An elegant badge that appears when a route has personalization context.
 * Shows a subtle indicator with expandable details about the trip story
 * and preferences that were used to generate this route.
 *
 * Design: Warm editorial style with terracotta/gold accents
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ChevronDown,
  Heart,
  Utensils,
  Accessibility,
  X,
  Compass,
  Gauge,
  Wallet,
  Coffee,
  Landmark,
  Mountain,
  Wine,
  Cake,
  GraduationCap,
  Sunrise,
  Baby,
  Users,
  Backpack,
  Building,
  Home,
  Castle,
  Tent,
  Store,
  UtensilsCrossed,
  Scroll,
  Palette,
  Building2,
  Frame,
  Drama,
  Leaf,
  Umbrella,
  Moon,
  ShoppingBag,
  Camera,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { TripPersonalization } from '../../../stores/spotlightStoreV2';

interface PersonalizationBadgeProps {
  personalization: TripPersonalization;
  className?: string;
}

// Occasion mapping with labels and icons
const OCCASION_DATA: Record<string, { label: string; icon: LucideIcon }> = {
  honeymoon: { label: 'Honeymoon', icon: Heart },
  anniversary: { label: 'Anniversary', icon: Wine },
  birthday: { label: 'Birthday', icon: Cake },
  graduation: { label: 'Graduation', icon: GraduationCap },
  retirement: { label: 'Retirement', icon: Sunrise },
  babymoon: { label: 'Babymoon', icon: Baby },
  reunion: { label: 'Reunion', icon: Users },
  'solo-adventure': { label: 'Solo Adventure', icon: Backpack },
  'girls-trip': { label: 'Girls Trip', icon: Users },
  'guys-trip': { label: 'Guys Trip', icon: Users },
  'family-vacation': { label: 'Family Vacation', icon: Users },
  'just-because': { label: 'Just Because', icon: Sparkles },
};

// Travel style labels
const TRAVEL_STYLE_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  explorer: { label: 'Explorer', icon: Compass },
  relaxer: { label: 'Relaxer', icon: Coffee },
  culture: { label: 'Culture Seeker', icon: Landmark },
  adventurer: { label: 'Adventurer', icon: Mountain },
  foodie: { label: 'Foodie', icon: Utensils },
};

// Pace labels
const PACE_LABELS: Record<number, string> = {
  1: 'Very Relaxed',
  2: 'Relaxed',
  3: 'Balanced',
  4: 'Active',
  5: 'Packed',
};

// Dining style labels
const DINING_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  street: { label: 'Street Food', icon: Store },
  casual: { label: 'Casual Dining', icon: Coffee },
  mix: { label: 'Mixed', icon: UtensilsCrossed },
  fine: { label: 'Fine Dining', icon: Sparkles },
};

// Budget labels
const BUDGET_LABELS: Record<string, { label: string; priceIndicator: string }> = {
  budget: { label: 'Budget-Friendly', priceIndicator: '$' },
  mid: { label: 'Mid-Range', priceIndicator: '$$' },
  luxury: { label: 'Luxury', priceIndicator: '$$$' },
};

// Accommodation labels
const ACCOMMODATION_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  budget: { label: 'Budget', icon: Building },
  mid: { label: 'Comfortable', icon: Home },
  luxury: { label: 'Luxury', icon: Castle },
  unique: { label: 'Unique', icon: Tent },
};

// Interest labels
const INTEREST_LABELS: Record<string, { label: string; icon: LucideIcon }> = {
  history: { label: 'History', icon: Scroll },
  art: { label: 'Art', icon: Palette },
  architecture: { label: 'Architecture', icon: Building2 },
  nature: { label: 'Nature', icon: Leaf },
  food: { label: 'Food', icon: UtensilsCrossed },
  wine: { label: 'Wine', icon: Wine },
  nightlife: { label: 'Nightlife', icon: Moon },
  shopping: { label: 'Shopping', icon: ShoppingBag },
  photography: { label: 'Photography', icon: Camera },
  adventure: { label: 'Adventure', icon: Backpack },
  wellness: { label: 'Wellness', icon: Sparkles },
  'local-culture': { label: 'Local Culture', icon: Drama },
  beaches: { label: 'Beaches', icon: Umbrella },
  mountains: { label: 'Mountains', icon: Mountain },
  museums: { label: 'Museums', icon: Frame },
};

export function PersonalizationBadge({
  personalization,
  className = '',
}: PersonalizationBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count how many preferences are set
  const preferencesCount = [
    personalization.travelStyle,
    personalization.pace !== undefined,
    personalization.interests?.length,
    personalization.diningStyle,
    personalization.dietary?.length,
    personalization.budget,
    personalization.accommodation,
    personalization.accessibility?.length,
    personalization.occasion,
    personalization.avoidCrowds,
    personalization.preferOutdoor,
  ].filter(Boolean).length;

  const hasStory = personalization.tripStory && personalization.tripStory.trim().length > 0;

  if (!hasStory && preferencesCount === 0) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Compact Badge */}
      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="group flex items-center gap-2 rounded-full px-3 py-1.5 transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.1) 0%, rgba(212, 168, 83, 0.1) 100%)',
          border: '1px solid rgba(196, 88, 48, 0.2)',
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Sparkles
            className="h-3.5 w-3.5"
            style={{ color: '#C45830' }}
          />
        </motion.div>
        <span
          className="text-xs font-medium"
          style={{ color: '#C45830' }}
        >
          Personalized
        </span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            className="h-3 w-3 transition-colors group-hover:text-[#C45830]"
            style={{ color: '#8B7355' }}
          />
        </motion.div>
      </motion.button>

      {/* Expanded Details Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.15, 0.5, 0.5, 1] }}
            className="absolute top-full left-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl shadow-xl"
            style={{
              background: 'linear-gradient(180deg, #FFFBF5 0%, #FAF7F2 100%)',
              border: '1px solid #E5DDD0',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{
                background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.08) 0%, rgba(212, 168, 83, 0.08) 100%)',
                borderBottom: '1px solid #E5DDD0',
              }}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: '#C45830' }} />
                <span
                  className="text-sm font-semibold"
                  style={{
                    color: '#2C2417',
                    fontFamily: "'Fraunces', Georgia, serif",
                  }}
                >
                  Your Trip Context
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="rounded-full p-1 transition-colors hover:bg-black/5"
              >
                <X className="h-4 w-4" style={{ color: '#8B7355' }} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-4 p-4">
              {/* Trip Story */}
              {hasStory && (
                <div>
                  <h4
                    className="mb-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#8B7355' }}
                  >
                    Your Story
                  </h4>
                  <p
                    className="text-sm leading-relaxed"
                    style={{
                      color: '#5C4D3D',
                      fontFamily: "'Satoshi', sans-serif",
                    }}
                  >
                    "{personalization.tripStory}"
                  </p>
                </div>
              )}

              {/* Preferences Grid */}
              {preferencesCount > 0 && (
                <div>
                  <h4
                    className="mb-2 text-xs font-semibold uppercase tracking-wider"
                    style={{ color: '#8B7355' }}
                  >
                    Preferences
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {/* Occasion */}
                    {personalization.occasion && OCCASION_DATA[personalization.occasion] && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: '#FEF3EE',
                          color: '#C45830',
                        }}
                      >
                        {(() => {
                          const OccasionIcon = OCCASION_DATA[personalization.occasion!].icon;
                          return <OccasionIcon className="h-3 w-3" />;
                        })()}
                        {OCCASION_DATA[personalization.occasion].label}
                      </span>
                    )}

                    {/* Travel Style */}
                    {personalization.travelStyle && TRAVEL_STYLE_LABELS[personalization.travelStyle] && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: '#FEF3EE',
                          color: '#C45830',
                        }}
                      >
                        {(() => {
                          const StyleIcon = TRAVEL_STYLE_LABELS[personalization.travelStyle!].icon;
                          return <StyleIcon className="h-3 w-3" />;
                        })()}
                        {TRAVEL_STYLE_LABELS[personalization.travelStyle].label}
                      </span>
                    )}

                    {/* Pace */}
                    {personalization.pace !== undefined && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: '#FEF3EE',
                          color: '#8B6914',
                        }}
                      >
                        <Gauge className="h-3 w-3" />
                        {PACE_LABELS[personalization.pace] || `Pace: ${personalization.pace}`}
                      </span>
                    )}

                    {/* Interests */}
                    {personalization.interests?.slice(0, 3).map((interest) => {
                      const interestData = INTEREST_LABELS[interest];
                      const InterestIcon = interestData?.icon;
                      return (
                        <span
                          key={interest}
                          className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                          style={{
                            background: '#F5F0E8',
                            color: '#5C4D3D',
                          }}
                        >
                          {InterestIcon && <InterestIcon className="h-3 w-3" />}
                          {interestData?.label || interest}
                        </span>
                      );
                    })}
                    {personalization.interests && personalization.interests.length > 3 && (
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: '#F5F0E8',
                          color: '#8B7355',
                        }}
                      >
                        +{personalization.interests.length - 3} more
                      </span>
                    )}

                    {/* Dining Style */}
                    {personalization.diningStyle && DINING_LABELS[personalization.diningStyle] && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: '#FEF3EE',
                          color: '#8B3A3A',
                        }}
                      >
                        {(() => {
                          const DiningIcon = DINING_LABELS[personalization.diningStyle!].icon;
                          return <DiningIcon className="h-3 w-3" />;
                        })()}
                        {DINING_LABELS[personalization.diningStyle].label}
                      </span>
                    )}

                    {/* Dietary */}
                    {personalization.dietary?.map((diet) => (
                      <span
                        key={diet}
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: '#E8F4E8',
                          color: '#4A7C59',
                        }}
                      >
                        {diet}
                      </span>
                    ))}

                    {/* Budget */}
                    {personalization.budget && BUDGET_LABELS[personalization.budget] && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: '#FEF3EE',
                          color: '#8B6914',
                        }}
                      >
                        <Wallet className="h-3 w-3" />
                        <span className="font-semibold">{BUDGET_LABELS[personalization.budget].priceIndicator}</span>
                        {BUDGET_LABELS[personalization.budget].label}
                      </span>
                    )}

                    {/* Accommodation */}
                    {personalization.accommodation && ACCOMMODATION_LABELS[personalization.accommodation] && (
                      <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: '#F5F0E8',
                          color: '#5C4D3D',
                        }}
                      >
                        {(() => {
                          const AccomIcon = ACCOMMODATION_LABELS[personalization.accommodation!].icon;
                          return <AccomIcon className="h-3 w-3" />;
                        })()}
                        {ACCOMMODATION_LABELS[personalization.accommodation].label}
                      </span>
                    )}

                    {/* Accessibility */}
                    {personalization.accessibility?.length ? (
                      <span
                        className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: '#E8F4F7',
                          color: '#4A90A4',
                        }}
                      >
                        <Accessibility className="h-3 w-3" />
                        {personalization.accessibility.length} accessibility{' '}
                        {personalization.accessibility.length === 1 ? 'need' : 'needs'}
                      </span>
                    ) : null}

                    {/* Avoid Crowds */}
                    {personalization.avoidCrowds && (
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: '#F5F0E8',
                          color: '#8B7355',
                        }}
                      >
                        🚶 Avoiding crowds
                      </span>
                    )}

                    {/* Prefer Outdoor */}
                    {personalization.preferOutdoor && (
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: '#E8F4E8',
                          color: '#4A7C59',
                        }}
                      >
                        🌳 Outdoor preference
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div
              className="px-4 py-3 text-center"
              style={{
                background: '#FAF7F2',
                borderTop: '1px solid #E5DDD0',
              }}
            >
              <p className="text-xs" style={{ color: '#8B7355' }}>
                This route was tailored to your preferences
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PersonalizationBadge;
