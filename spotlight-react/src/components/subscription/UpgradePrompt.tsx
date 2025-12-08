/**
 * UpgradePrompt
 *
 * WI-10.6: Premium upgrade prompt component
 *
 * Design Philosophy:
 * - INVITING, not pushy - "join us" rather than "you're missing out"
 * - Premium feel - golden warmth, elegant typography
 * - Aspirational - shows the value, not the restriction
 * - Respectful - easy to dismiss, no guilt trips
 *
 * Aesthetic: Warm travel invitation with golden accents
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Infinity,
  CloudOff,
  Brain,
  CloudSun,
  Headphones,
  Users,
  Crown,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useUpgradePrompt, useSubscriptionStore } from '../../stores/subscriptionStore';
import {
  type SubscriptionFeature,
  type LimitedResource,
  getMonthlyPrice,
  getYearlyPrice,
  getYearlySavings,
} from '../../services/subscription';

// ============================================================================
// Types
// ============================================================================

export interface UpgradePromptProps {
  /** Override visibility */
  isOpen?: boolean;
  /** Override dismiss handler */
  onDismiss?: () => void;
  /** Custom className */
  className?: string;
}

// ============================================================================
// Feature Icons & Labels
// ============================================================================

const FEATURE_CONFIG: Record<SubscriptionFeature, {
  icon: typeof Sparkles;
  label: string;
  description: string;
}> = {
  unlimited_ai: {
    icon: Infinity,
    label: 'Unlimited AI',
    description: 'Chat without limits',
  },
  offline_mode: {
    icon: CloudOff,
    label: 'Offline Mode',
    description: 'Access trips anywhere',
  },
  cross_trip_memory: {
    icon: Brain,
    label: 'Trip Memory',
    description: 'AI remembers you',
  },
  weather_rerouting: {
    icon: CloudSun,
    label: 'Weather Routing',
    description: 'Auto-adjust for weather',
  },
  priority_support: {
    icon: Headphones,
    label: 'Priority Support',
    description: 'Get help faster',
  },
  advanced_preferences: {
    icon: Sparkles,
    label: 'Deep Learning',
    description: 'Smarter recommendations',
  },
  collaborative_trips: {
    icon: Users,
    label: 'Share Trips',
    description: 'Travel with friends',
  },
  export_itinerary: {
    icon: ArrowRight,
    label: 'Export',
    description: 'PDF & calendar',
  },
  early_access: {
    icon: Crown,
    label: 'Early Access',
    description: 'New features first',
  },
};

const LIMIT_LABELS: Record<LimitedResource, string> = {
  ai_interactions: 'AI messages',
  trips_active: 'active trips',
  places_per_trip: 'saved places',
  photos_per_trip: 'photos',
};

// Highlighted features for the prompt
const HIGHLIGHT_FEATURES: SubscriptionFeature[] = [
  'unlimited_ai',
  'offline_mode',
  'cross_trip_memory',
  'weather_rerouting',
];

// ============================================================================
// Sub-components
// ============================================================================

function FeatureHighlight({ feature }: { feature: SubscriptionFeature }) {
  const config = FEATURE_CONFIG[feature];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center gap-3"
    >
      <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
        <Icon className="w-4 h-4 text-amber-700" />
      </div>
      <div>
        <p className="text-sm font-medium text-stone-800">{config.label}</p>
        <p className="text-xs text-stone-500">{config.description}</p>
      </div>
    </motion.div>
  );
}

function PricingToggle({
  period,
  onToggle,
}: {
  period: 'monthly' | 'yearly';
  onToggle: (p: 'monthly' | 'yearly') => void;
}) {
  const savings = getYearlySavings('premium');

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => onToggle('monthly')}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
          period === 'monthly'
            ? 'bg-white text-stone-800 shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        Monthly
      </button>
      <button
        onClick={() => onToggle('yearly')}
        className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${
          period === 'yearly'
            ? 'bg-white text-stone-800 shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        }`}
      >
        Yearly
        {savings > 0 && (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
            -{savings}%
          </span>
        )}
      </button>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function UpgradePrompt({
  isOpen: isOpenProp,
  onDismiss: onDismissProp,
  className = '',
}: UpgradePromptProps) {
  const { show, prompt, dismiss } = useUpgradePrompt();
  const { upgrade } = useSubscriptionStore();

  const isOpen = isOpenProp ?? show;
  const handleDismiss = onDismissProp ?? dismiss;

  // Local state for pricing toggle
  const [billingPeriod, setBillingPeriod] = React.useState<'monthly' | 'yearly'>('yearly');

  const monthlyPrice = getMonthlyPrice('premium');
  const yearlyPrice = getYearlyPrice('premium');
  const monthlyEquivalent = `$${(7999 / 12 / 100).toFixed(2)}`;

  const handleUpgrade = () => {
    upgrade(billingPeriod);
    handleDismiss();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`
              fixed inset-x-4 top-[10%] md:inset-auto md:left-1/2 md:top-1/2
              md:-translate-x-1/2 md:-translate-y-1/2
              md:w-full md:max-w-md
              z-50
              ${className}
            `}
          >
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* Premium gradient header */}
              <div
                className="relative h-32 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)',
                }}
              >
                {/* Decorative pattern */}
                <div
                  className="absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 5 L35 25 L55 30 L35 35 L30 55 L25 35 L5 30 L25 25 Z' fill='%23fff' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                    backgroundSize: '40px 40px',
                  }}
                />

                {/* Crown icon */}
                <motion.div
                  initial={{ y: -20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="absolute top-6 left-1/2 -translate-x-1/2"
                >
                  <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Crown className="w-8 h-8 text-white" />
                  </div>
                </motion.div>

                {/* Close button */}
                {prompt?.dismissible !== false && (
                  <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Title */}
                <div className="text-center mb-6">
                  <h2
                    className="text-2xl font-bold text-stone-900 mb-2"
                    style={{ fontFamily: "'Fraunces', Georgia, serif" }}
                  >
                    {prompt?.title || 'Upgrade to Premium'}
                  </h2>
                  <p className="text-stone-600 text-sm">
                    {prompt?.description || 'Unlock the full Waycraft experience'}
                  </p>
                </div>

                {/* Feature highlights */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {HIGHLIGHT_FEATURES.map((feature, i) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                    >
                      <FeatureHighlight feature={feature} />
                    </motion.div>
                  ))}
                </div>

                {/* Pricing section */}
                <div className="bg-stone-50 rounded-2xl p-4 mb-6">
                  <PricingToggle period={billingPeriod} onToggle={setBillingPeriod} />

                  <div className="text-center mt-4">
                    {billingPeriod === 'monthly' ? (
                      <>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-bold text-stone-900">{monthlyPrice}</span>
                          <span className="text-stone-500">/month</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-3xl font-bold text-stone-900">{yearlyPrice}</span>
                          <span className="text-stone-500">/year</span>
                        </div>
                        <p className="text-xs text-stone-500 mt-1">
                          Just {monthlyEquivalent}/month, billed annually
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  onClick={handleUpgrade}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 rounded-2xl font-semibold text-white shadow-lg transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  {prompt?.ctaText || 'Upgrade to Premium'}
                </motion.button>

                {/* Secondary action */}
                {prompt?.dismissible !== false && (
                  <button
                    onClick={handleDismiss}
                    className="w-full mt-3 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
                  >
                    Maybe later
                  </button>
                )}

                {/* Trust badge */}
                <div className="flex items-center justify-center gap-2 mt-4 text-xs text-stone-400">
                  <Check className="w-3 h-3" />
                  <span>Cancel anytime</span>
                  <span className="w-1 h-1 rounded-full bg-stone-300" />
                  <span>Instant access</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Compact Inline Variant
// ============================================================================

export function UpgradePromptInline({
  message,
  onUpgrade,
  className = '',
}: {
  message?: string;
  onUpgrade?: () => void;
  className?: string;
}) {
  const { upgrade } = useSubscriptionStore();

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      upgrade('monthly');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        flex items-center justify-between gap-4 p-4
        bg-gradient-to-r from-amber-50 to-amber-100/50
        border border-amber-200/50 rounded-2xl
        ${className}
      `}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-200/50 flex items-center justify-center">
          <Crown className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-medium text-stone-800">
            {message || 'Unlock more with Premium'}
          </p>
          <p className="text-xs text-stone-500">
            Unlimited AI, offline mode & more
          </p>
        </div>
      </div>

      <motion.button
        onClick={handleUpgrade}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="px-4 py-2 rounded-xl font-medium text-white text-sm"
        style={{
          background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        }}
      >
        Upgrade
      </motion.button>
    </motion.div>
  );
}

// ============================================================================
// Usage Limit Banner
// ============================================================================

export function UsageLimitBanner({
  resource,
  used,
  limit,
  className = '',
}: {
  resource: LimitedResource;
  used: number;
  limit: number;
  className?: string;
}) {
  const remaining = Math.max(0, limit - used);
  const percentage = Math.min(100, (used / limit) * 100);
  const isLow = remaining <= 5;
  const isExhausted = remaining === 0;

  if (!isLow && !isExhausted) {
    return null;
  }

  const resourceLabel = LIMIT_LABELS[resource];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className={`
        p-3 rounded-xl border
        ${isExhausted
          ? 'bg-rose-50 border-rose-200'
          : 'bg-amber-50 border-amber-200'
        }
        ${className}
      `}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${isExhausted ? 'text-rose-700' : 'text-amber-700'}`}>
          {isExhausted
            ? `${resourceLabel} limit reached`
            : `${remaining} ${resourceLabel} remaining`
          }
        </span>
        <span className="text-xs text-stone-500">
          {used}/{limit}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          className={`h-full rounded-full ${
            isExhausted ? 'bg-rose-400' : 'bg-amber-400'
          }`}
        />
      </div>

      {isExhausted && (
        <p className="mt-2 text-xs text-rose-600">
          Upgrade to Premium for unlimited {resourceLabel.toLowerCase()}
        </p>
      )}
    </motion.div>
  );
}

export default UpgradePrompt;
