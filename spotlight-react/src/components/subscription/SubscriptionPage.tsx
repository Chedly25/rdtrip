/**
 * SubscriptionPage
 *
 * WI-10.6: Subscription management page
 *
 * Allows users to:
 * - View current subscription status
 * - See feature comparison
 * - Upgrade/downgrade subscription
 * - Manage billing (cancel, resume)
 *
 * Design: Clean, informative, pressure-free
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Crown,
  Check,
  X,
  Infinity,
  CloudOff,
  Brain,
  CloudSun,
  Headphones,
  Sparkles,
  Users,
  ArrowRight,
  Calendar,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { useSubscription, useSubscriptionActions } from '../../stores/subscriptionStore';
import {
  type SubscriptionFeature,
  type BillingPeriod,
  TIER_FEATURES,
  getMonthlyPrice,
  getYearlyPrice,
  getYearlySavings,
} from '../../services/subscription';

// ============================================================================
// Types
// ============================================================================

export interface SubscriptionPageProps {
  /** Callback when user navigates back */
  onBack?: () => void;
  /** Custom className */
  className?: string;
}

// ============================================================================
// Feature Config
// ============================================================================

const FEATURE_CONFIG: Record<SubscriptionFeature, {
  icon: typeof Sparkles;
  label: string;
  description: string;
}> = {
  unlimited_ai: {
    icon: Infinity,
    label: 'Unlimited AI Conversations',
    description: 'Chat with your travel companion without limits',
  },
  offline_mode: {
    icon: CloudOff,
    label: 'Offline Mode',
    description: 'Download trips and access them anywhere, even without internet',
  },
  cross_trip_memory: {
    icon: Brain,
    label: 'Cross-Trip Memory',
    description: 'Your companion remembers your preferences across all trips',
  },
  weather_rerouting: {
    icon: CloudSun,
    label: 'Weather Rerouting',
    description: 'Automatic itinerary adjustments based on weather forecasts',
  },
  priority_support: {
    icon: Headphones,
    label: 'Priority Support',
    description: 'Get help faster with priority customer support',
  },
  advanced_preferences: {
    icon: Sparkles,
    label: 'Advanced Preferences',
    description: 'Deep learning for highly personalized recommendations',
  },
  collaborative_trips: {
    icon: Users,
    label: 'Collaborative Trips',
    description: 'Plan and share trips with travel companions',
  },
  export_itinerary: {
    icon: ArrowRight,
    label: 'Export Itinerary',
    description: 'Export your trips to PDF or sync with your calendar',
  },
  early_access: {
    icon: Crown,
    label: 'Early Access',
    description: 'Be the first to try new features',
  },
};

// Features to show in comparison
const COMPARISON_FEATURES: SubscriptionFeature[] = [
  'unlimited_ai',
  'offline_mode',
  'cross_trip_memory',
  'weather_rerouting',
  'collaborative_trips',
  'priority_support',
];

// ============================================================================
// Sub-components
// ============================================================================

function FeatureRow({
  feature,
  freeIncluded,
  premiumIncluded,
}: {
  feature: SubscriptionFeature;
  freeIncluded: boolean;
  premiumIncluded: boolean;
}) {
  const config = FEATURE_CONFIG[feature];
  const Icon = config.icon;

  return (
    <div className="flex items-center py-3 border-b border-stone-100 last:border-0">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-stone-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-stone-800">{config.label}</p>
          <p className="text-xs text-stone-500 hidden sm:block">{config.description}</p>
        </div>
      </div>

      <div className="w-20 text-center">
        {freeIncluded ? (
          <Check className="w-5 h-5 text-sage mx-auto" />
        ) : (
          <X className="w-5 h-5 text-stone-300 mx-auto" />
        )}
      </div>

      <div className="w-20 text-center">
        {premiumIncluded ? (
          <Check className="w-5 h-5 text-amber-500 mx-auto" />
        ) : (
          <X className="w-5 h-5 text-stone-300 mx-auto" />
        )}
      </div>
    </div>
  );
}

function CurrentPlanCard({
  subscription,
  onCancel,
  onResume,
}: {
  subscription: ReturnType<typeof useSubscription>;
  onCancel: () => void;
  onResume: () => void;
}) {
  const { isPremium } = subscription;
  const sub = subscription.subscription;
  const isCanceling = sub.cancelAt && sub.status === 'active';

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div
      className={`
        p-6 rounded-2xl border-2
        ${isPremium
          ? 'bg-gradient-to-br from-amber-50 to-amber-100/30 border-amber-200'
          : 'bg-stone-50 border-stone-200'
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {isPremium && <Crown className="w-5 h-5 text-amber-500" />}
            <h3
              className="text-xl font-bold text-stone-900"
              style={{ fontFamily: "'Fraunces', Georgia, serif" }}
            >
              {isPremium ? 'Premium' : 'Free'}
            </h3>
          </div>
          <p className="text-sm text-stone-500">
            {isPremium
              ? sub.billingPeriod === 'yearly' ? 'Billed annually' : 'Billed monthly'
              : 'Basic features'
            }
          </p>
        </div>

        {isPremium && (
          <div className="text-right">
            <p className="text-2xl font-bold text-stone-900">
              {sub.billingPeriod === 'yearly'
                ? getYearlyPrice('premium')
                : getMonthlyPrice('premium')
              }
            </p>
            <p className="text-xs text-stone-500">
              /{sub.billingPeriod === 'yearly' ? 'year' : 'month'}
            </p>
          </div>
        )}
      </div>

      {/* Status info */}
      {isPremium && (
        <div className="space-y-2 mb-4">
          {sub.currentPeriodEnd && (
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Calendar className="w-4 h-4" />
              <span>
                {isCanceling
                  ? `Access until ${formatDate(sub.currentPeriodEnd)}`
                  : `Renews ${formatDate(sub.currentPeriodEnd)}`
                }
              </span>
            </div>
          )}

          {isCanceling && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-100 px-3 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>Subscription will cancel at end of period</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isPremium && (
        <div className="flex gap-2">
          {isCanceling ? (
            <button
              onClick={onResume}
              className="flex-1 py-2 px-4 rounded-xl bg-amber-500 text-white font-medium text-sm hover:bg-amber-600 transition-colors"
            >
              Resume subscription
            </button>
          ) : (
            <button
              onClick={onCancel}
              className="flex-1 py-2 px-4 rounded-xl bg-stone-200 text-stone-700 font-medium text-sm hover:bg-stone-300 transition-colors"
            >
              Cancel subscription
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function PricingCard({
  period,
  isSelected,
  onSelect,
}: {
  period: BillingPeriod;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const price = period === 'monthly' ? getMonthlyPrice('premium') : getYearlyPrice('premium');
  const savings = getYearlySavings('premium');
  const monthlyEquivalent = period === 'yearly' ? `$${(7999 / 12 / 100).toFixed(2)}` : null;

  return (
    <motion.button
      onClick={onSelect}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        relative p-4 rounded-2xl border-2 text-left transition-all
        ${isSelected
          ? 'border-amber-400 bg-amber-50'
          : 'border-stone-200 bg-white hover:border-stone-300'
        }
      `}
    >
      {period === 'yearly' && savings > 0 && (
        <div className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          Save {savings}%
        </div>
      )}

      <p className="font-medium text-stone-800 capitalize mb-1">{period}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-stone-900">{price}</span>
        <span className="text-sm text-stone-500">/{period === 'yearly' ? 'year' : 'month'}</span>
      </div>
      {monthlyEquivalent && (
        <p className="text-xs text-stone-500 mt-1">{monthlyEquivalent}/month</p>
      )}

      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        </div>
      )}
    </motion.button>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function SubscriptionPage({ onBack, className = '' }: SubscriptionPageProps) {
  const subscription = useSubscription();
  const { upgrade, cancel, resume, startTrial } = useSubscriptionActions();
  const [selectedPeriod, setSelectedPeriod] = React.useState<BillingPeriod>('yearly');

  const handleUpgrade = () => {
    upgrade(selectedPeriod);
  };

  return (
    <div className={`min-h-screen bg-stone-50 ${className}`}>
      {/* Header */}
      <div className="bg-white border-b border-stone-200 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              className="text-stone-600 hover:text-stone-800 transition-colors"
            >
              ← Back
            </button>
          )}
          <h1
            className="text-xl font-bold text-stone-900"
            style={{ fontFamily: "'Fraunces', Georgia, serif" }}
          >
            Subscription
          </h1>
          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Current Plan */}
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
            Your Plan
          </h2>
          <CurrentPlanCard
            subscription={subscription}
            onCancel={cancel}
            onResume={resume}
          />
        </section>

        {/* Upgrade Section (for free users) */}
        {!subscription.isPremium && (
          <section>
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
              Upgrade to Premium
            </h2>

            <div className="bg-white rounded-2xl border border-stone-200 p-6">
              {/* Pricing options */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <PricingCard
                  period="monthly"
                  isSelected={selectedPeriod === 'monthly'}
                  onSelect={() => setSelectedPeriod('monthly')}
                />
                <PricingCard
                  period="yearly"
                  isSelected={selectedPeriod === 'yearly'}
                  onSelect={() => setSelectedPeriod('yearly')}
                />
              </div>

              {/* Upgrade button */}
              <motion.button
                onClick={handleUpgrade}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-2xl font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.4)',
                }}
              >
                Upgrade to Premium
              </motion.button>

              {/* Trial option */}
              <button
                onClick={() => startTrial(7)}
                className="w-full mt-3 py-2 text-sm text-stone-500 hover:text-stone-700 transition-colors"
              >
                Or start a 7-day free trial
              </button>

              {/* Trust indicators */}
              <div className="flex items-center justify-center gap-4 mt-4 text-xs text-stone-400">
                <span className="flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Cancel anytime
                </span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  Secure payment
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Feature Comparison */}
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-3">
            Compare Plans
          </h2>

          <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center py-3 px-4 bg-stone-50 border-b border-stone-200">
              <div className="flex-1 text-sm font-medium text-stone-700">Feature</div>
              <div className="w-20 text-center text-sm font-medium text-stone-700">Free</div>
              <div className="w-20 text-center text-sm font-medium text-amber-700">Premium</div>
            </div>

            {/* Features */}
            <div className="px-4">
              {COMPARISON_FEATURES.map((feature) => (
                <FeatureRow
                  key={feature}
                  feature={feature}
                  freeIncluded={TIER_FEATURES.free.includes(feature)}
                  premiumIncluded={TIER_FEATURES.premium.includes(feature)}
                />
              ))}

              {/* AI Limit row */}
              <div className="flex items-center py-3 border-b border-stone-100">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">AI Messages</p>
                    <p className="text-xs text-stone-500 hidden sm:block">Per trip limit</p>
                  </div>
                </div>
                <div className="w-20 text-center text-sm text-stone-600">50</div>
                <div className="w-20 text-center">
                  <Infinity className="w-5 h-5 text-amber-500 mx-auto" />
                </div>
              </div>

              {/* Trips row */}
              <div className="flex items-center py-3">
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center">
                    <Calendar className="w-4 h-4 text-stone-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-800">Active Trips</p>
                    <p className="text-xs text-stone-500 hidden sm:block">Concurrent trips</p>
                  </div>
                </div>
                <div className="w-20 text-center text-sm text-stone-600">3</div>
                <div className="w-20 text-center">
                  <Infinity className="w-5 h-5 text-amber-500 mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ/Help */}
        <section className="text-center py-6">
          <p className="text-sm text-stone-500">
            Questions? <a href="#" className="text-amber-600 hover:underline">Contact support</a>
          </p>
        </section>
      </div>
    </div>
  );
}

export default SubscriptionPage;
