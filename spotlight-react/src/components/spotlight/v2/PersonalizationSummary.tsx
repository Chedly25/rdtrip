/**
 * Personalization Summary Card
 *
 * A refined "travel document" style card that displays user preferences
 * before itinerary generation. Designed with warm editorial aesthetics
 * matching the PersonalizedIntroBanner - cream tones, terracotta/gold accents,
 * and Fraunces typography.
 *
 * Visual concept: A premium boarding pass / travel voucher feel
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Utensils,
  Compass,
  Sparkles,
  ChevronDown,
  Wine,
  Camera,
  Mountain,
  Building2,
  Palette,
  TreePine,
  Waves,
  ShoppingBag,
  Music,
  BookOpen,
  Footprints,
  Gem,
  Users,
  User,
  Baby,
  UserCheck
} from 'lucide-react';
import type { TripPersonalization, TripOccasion, PersonalizationInterest } from '../../../stores/spotlightStoreV2';

interface PersonalizationSummaryProps {
  personalization: TripPersonalization;
  className?: string;
  variant?: 'full' | 'compact';
}

// Occasion display config
const OCCASION_CONFIG: Record<TripOccasion, { label: string; icon: React.ReactNode; color: string }> = {
  honeymoon: { label: 'Honeymoon', icon: <Heart className="w-3.5 h-3.5" />, color: '#C45830' },
  anniversary: { label: 'Anniversary', icon: <Heart className="w-3.5 h-3.5" />, color: '#C45830' },
  birthday: { label: 'Birthday', icon: <Sparkles className="w-3.5 h-3.5" />, color: '#D4A853' },
  graduation: { label: 'Graduation', icon: <BookOpen className="w-3.5 h-3.5" />, color: '#4A7C59' },
  retirement: { label: 'Retirement', icon: <Compass className="w-3.5 h-3.5" />, color: '#8B6914' },
  babymoon: { label: 'Babymoon', icon: <Baby className="w-3.5 h-3.5" />, color: '#4A90A4' },
  reunion: { label: 'Reunion', icon: <Users className="w-3.5 h-3.5" />, color: '#A04040' },
  'solo-adventure': { label: 'Solo Adventure', icon: <User className="w-3.5 h-3.5" />, color: '#3A6247' },
  'girls-trip': { label: "Girls' Trip", icon: <Users className="w-3.5 h-3.5" />, color: '#B54A4A' },
  'guys-trip': { label: "Guys' Trip", icon: <Users className="w-3.5 h-3.5" />, color: '#3A7284' },
  'family-vacation': { label: 'Family Vacation', icon: <UserCheck className="w-3.5 h-3.5" />, color: '#4A7C59' },
  'just-because': { label: 'Just Because', icon: <Sparkles className="w-3.5 h-3.5" />, color: '#8B6914' },
};

// Interest display config
const INTEREST_CONFIG: Record<PersonalizationInterest, { label: string; icon: React.ReactNode }> = {
  history: { label: 'History', icon: <BookOpen className="w-3 h-3" /> },
  art: { label: 'Art', icon: <Palette className="w-3 h-3" /> },
  architecture: { label: 'Architecture', icon: <Building2 className="w-3 h-3" /> },
  nature: { label: 'Nature', icon: <TreePine className="w-3 h-3" /> },
  food: { label: 'Food', icon: <Utensils className="w-3 h-3" /> },
  wine: { label: 'Wine', icon: <Wine className="w-3 h-3" /> },
  nightlife: { label: 'Nightlife', icon: <Music className="w-3 h-3" /> },
  shopping: { label: 'Shopping', icon: <ShoppingBag className="w-3 h-3" /> },
  photography: { label: 'Photography', icon: <Camera className="w-3 h-3" /> },
  adventure: { label: 'Adventure', icon: <Mountain className="w-3 h-3" /> },
  wellness: { label: 'Wellness', icon: <Sparkles className="w-3 h-3" /> },
  'local-culture': { label: 'Local Culture', icon: <Compass className="w-3 h-3" /> },
  beaches: { label: 'Beaches', icon: <Waves className="w-3 h-3" /> },
  mountains: { label: 'Mountains', icon: <Mountain className="w-3 h-3" /> },
  museums: { label: 'Museums', icon: <Building2 className="w-3 h-3" /> },
};

// Pace labels
const PACE_LABELS: Record<number, string> = {
  1: 'Very Relaxed',
  2: 'Relaxed',
  3: 'Balanced',
  4: 'Active',
  5: 'Packed',
};

// Budget display
const BUDGET_CONFIG: Record<string, { label: string; symbol: string }> = {
  budget: { label: 'Budget-Friendly', symbol: '$' },
  mid: { label: 'Moderate', symbol: '$$' },
  luxury: { label: 'Luxury', symbol: '$$$' },
};

// Dining style display
const DINING_CONFIG: Record<string, string> = {
  street: 'Street Food & Markets',
  casual: 'Casual Dining',
  mix: 'Mix of Styles',
  fine: 'Fine Dining',
};

export function PersonalizationSummary({
  personalization,
  className = '',
  variant = 'full'
}: PersonalizationSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasContent = personalization.tripStory ||
                     personalization.interests?.length ||
                     personalization.occasion;

  if (!hasContent) return null;

  const occasionConfig = personalization.occasion ? OCCASION_CONFIG[personalization.occasion] : null;
  const budgetConfig = personalization.budget ? BUDGET_CONFIG[personalization.budget] : null;
  const paceLabel = personalization.pace ? PACE_LABELS[personalization.pace] : null;
  const diningLabel = personalization.diningStyle ? DINING_CONFIG[personalization.diningStyle] : null;

  // Truncate trip story for preview
  const storyPreview = personalization.tripStory?.slice(0, 120);
  const hasMoreStory = personalization.tripStory && personalization.tripStory.length > 120;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Travel Document Style Card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #FFFDF9 0%, #FFF8ED 50%, #FFF5E6 100%)',
          boxShadow: '0 4px 20px rgba(44, 36, 23, 0.06), 0 1px 3px rgba(44, 36, 23, 0.04)',
          border: '1px solid rgba(196, 88, 48, 0.08)',
        }}
      >
        {/* Decorative top stripe - like a boarding pass */}
        <div
          className="h-1.5"
          style={{
            background: 'linear-gradient(90deg, #C45830 0%, #D4A853 35%, #E8C547 50%, #D4A853 65%, #C45830 100%)',
          }}
        />

        {/* Header with occasion */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Sparkle icon in circle */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.12) 0%, rgba(212, 168, 83, 0.12) 100%)',
              }}
            >
              <Gem className="w-5 h-5" style={{ color: '#C45830' }} />
            </div>
            <div>
              <p
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: '#8B7355' }}
              >
                Your Trip Preferences
              </p>
              <h3
                className="text-lg font-semibold"
                style={{
                  color: '#2C2417',
                  fontFamily: "'Fraunces', Georgia, serif",
                  letterSpacing: '-0.01em',
                }}
              >
                {occasionConfig ? occasionConfig.label : 'Personalized Journey'}
              </h3>
            </div>
          </div>

          {/* Occasion badge */}
          {occasionConfig && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
              style={{
                background: `${occasionConfig.color}15`,
                color: occasionConfig.color,
              }}
            >
              {occasionConfig.icon}
              <span className="text-xs font-medium">{occasionConfig.label}</span>
            </div>
          )}
        </div>

        {/* Dashed divider - boarding pass style */}
        <div className="mx-5 border-t-2 border-dashed" style={{ borderColor: 'rgba(139, 115, 85, 0.15)' }} />

        {/* Trip Story Section */}
        {personalization.tripStory && (
          <div className="px-5 py-4">
            <p
              className="text-sm leading-relaxed"
              style={{
                color: '#5C4D3D',
                fontStyle: 'italic',
              }}
            >
              "{isExpanded ? personalization.tripStory : storyPreview}{hasMoreStory && !isExpanded && '...'}"
            </p>
            {hasMoreStory && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="mt-2 text-xs font-medium flex items-center gap-1 transition-colors hover:opacity-70"
                style={{ color: '#C45830' }}
              >
                {isExpanded ? 'Show less' : 'Read more'}
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3 h-3" />
                </motion.span>
              </button>
            )}
          </div>
        )}

        {/* Interests Grid */}
        {personalization.interests && personalization.interests.length > 0 && (
          <div className="px-5 pb-4">
            <p
              className="text-[10px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: '#8B7355' }}
            >
              Interests
            </p>
            <div className="flex flex-wrap gap-2">
              {personalization.interests.slice(0, variant === 'compact' ? 4 : 8).map((interest) => {
                const config = INTEREST_CONFIG[interest];
                if (!config) return null;
                return (
                  <motion.span
                    key={interest}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: 'rgba(212, 168, 83, 0.12)',
                      color: '#8B6914',
                    }}
                  >
                    <span style={{ color: '#D4A853' }}>{config.icon}</span>
                    {config.label}
                  </motion.span>
                );
              })}
              {variant === 'compact' && personalization.interests.length > 4 && (
                <span
                  className="text-xs px-2 py-1"
                  style={{ color: '#8B7355' }}
                >
                  +{personalization.interests.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Meta Info Row */}
        <AnimatePresence>
          {(paceLabel || budgetConfig || diningLabel) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-5 pb-4"
            >
              <div
                className="flex flex-wrap gap-4 p-3 rounded-xl"
                style={{ background: 'rgba(44, 36, 23, 0.03)' }}
              >
                {/* Pace */}
                {paceLabel && (
                  <div className="flex items-center gap-2">
                    <Footprints className="w-4 h-4" style={{ color: '#8B7355' }} />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: '#8B7355' }}>Pace</p>
                      <p className="text-xs font-medium" style={{ color: '#2C2417' }}>{paceLabel}</p>
                    </div>
                  </div>
                )}

                {/* Budget */}
                {budgetConfig && (
                  <div className="flex items-center gap-2">
                    <span
                      className="text-sm font-bold"
                      style={{ color: '#4A7C59' }}
                    >
                      {budgetConfig.symbol}
                    </span>
                    <div>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: '#8B7355' }}>Budget</p>
                      <p className="text-xs font-medium" style={{ color: '#2C2417' }}>{budgetConfig.label}</p>
                    </div>
                  </div>
                )}

                {/* Dining */}
                {diningLabel && (
                  <div className="flex items-center gap-2">
                    <Utensils className="w-4 h-4" style={{ color: '#8B7355' }} />
                    <div>
                      <p className="text-[10px] uppercase tracking-wide" style={{ color: '#8B7355' }}>Dining</p>
                      <p className="text-xs font-medium" style={{ color: '#2C2417' }}>{diningLabel}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom accent */}
        <div
          className="h-1"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(212, 168, 83, 0.3) 50%, transparent 100%)',
          }}
        />
      </div>
    </motion.div>
  );
}

export default PersonalizationSummary;
