/**
 * Planning Empty States & Onboarding
 *
 * Beautiful empty state components for the planning feature.
 * Design: Wanderlust Editorial - warm earth tones, refined typography,
 * magazine-quality illustrations with subtle motion.
 */

import { motion } from 'framer-motion';
import {
  MapPin,
  Compass,
  Sparkles,
  Coffee,
  Camera,
  Utensils,
  Heart,
  ArrowRight,
  Plus,
  Lightbulb,
  Route,
  Star,
} from 'lucide-react';
import type { ReactNode } from 'react';

// ============================================
// Animation Variants
// ============================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
};

// Animations defined inline to avoid TypeScript readonly array issues with Framer Motion
const floatAnimation = {
  y: [-4, 4, -4],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  opacity: [0.7, 1, 0.7],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: 'easeInOut' as const,
  },
};

// ============================================
// Decorative Illustration Components
// ============================================

function WanderlustIllustration() {
  return (
    <div className="relative w-48 h-48 mx-auto">
      {/* Background circles */}
      <motion.div
        animate={pulseAnimation}
        className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FEF3EE] to-[#FCE8DE]"
      />
      <motion.div
        animate={pulseAnimation}
        style={{ animationDelay: '1s' }}
        className="absolute inset-4 rounded-full bg-gradient-to-br from-[#FFFBF5] to-[#FEF3EE] opacity-80"
      />

      {/* Center icon */}
      <motion.div
        animate={floatAnimation}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#C45830] to-[#D4724A] shadow-xl shadow-[#C45830]/30 flex items-center justify-center transform rotate-6">
          <MapPin className="w-10 h-10 text-white" strokeWidth={1.5} />
        </div>
      </motion.div>

      {/* Orbiting elements */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
      >
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-8 rounded-lg bg-[#4A7C59] shadow-lg flex items-center justify-center">
          <Coffee className="w-4 h-4 text-white" />
        </div>
      </motion.div>

      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
      >
        <div className="absolute bottom-4 right-0 w-8 h-8 rounded-lg bg-[#7C5CDB] shadow-lg flex items-center justify-center">
          <Camera className="w-4 h-4 text-white" />
        </div>
      </motion.div>

      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
      >
        <div className="absolute bottom-8 left-2 w-8 h-8 rounded-lg bg-[#D4A853] shadow-lg flex items-center justify-center">
          <Utensils className="w-4 h-4 text-white" />
        </div>
      </motion.div>

      {/* Sparkle accents */}
      <motion.div
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.5, 1, 0.5],
        }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute top-6 right-6"
      >
        <Sparkles className="w-5 h-5 text-[#D4A853]" />
      </motion.div>
    </div>
  );
}

function CompassIllustration() {
  return (
    <div className="relative w-32 h-32 mx-auto">
      <motion.div
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute inset-0 flex items-center justify-center"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FEF3EE] to-[#FCE8DE] border-4 border-[#E5DDD0] flex items-center justify-center shadow-lg">
          <Compass className="w-12 h-12 text-[#C45830]" strokeWidth={1.5} />
        </div>
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute -top-1 -right-1"
      >
        <Star className="w-6 h-6 text-[#D4A853] fill-[#D4A853]" />
      </motion.div>
    </div>
  );
}

// ============================================
// Empty State Components
// ============================================

interface EmptyStateProps {
  title: string;
  description: string;
  illustration?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  tips?: string[];
}

export function EmptyState({
  title,
  description,
  illustration,
  action,
  secondaryAction,
  tips,
}: EmptyStateProps) {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-12 px-6 text-center"
    >
      {/* Illustration */}
      {illustration && (
        <motion.div variants={itemVariants} className="mb-8">
          {illustration}
        </motion.div>
      )}

      {/* Title */}
      <motion.h3
        variants={itemVariants}
        className="font-['Fraunces',serif] text-xl sm:text-2xl text-[#2C2417] font-semibold mb-3"
      >
        {title}
      </motion.h3>

      {/* Description */}
      <motion.p
        variants={itemVariants}
        className="text-[#8B7355] font-['Satoshi',sans-serif] text-sm sm:text-base max-w-sm mb-8 leading-relaxed"
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-3">
          {action && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.onClick}
              className="
                group relative px-6 py-3
                bg-gradient-to-r from-[#C45830] to-[#D4724A]
                text-white font-['Satoshi',sans-serif] font-semibold text-sm
                rounded-xl shadow-lg shadow-[#C45830]/20
                hover:shadow-xl hover:shadow-[#C45830]/30
                transition-shadow duration-200
                flex items-center gap-2
              "
            >
              {action.icon || <Plus className="w-4 h-4" />}
              {action.label}
              <ArrowRight className="w-4 h-4 opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all" />
            </motion.button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="
                px-5 py-2.5
                text-[#8B7355] font-['Satoshi',sans-serif] font-medium text-sm
                hover:text-[#C45830] transition-colors
              "
            >
              {secondaryAction.label}
            </button>
          )}
        </motion.div>
      )}

      {/* Tips */}
      {tips && tips.length > 0 && (
        <motion.div
          variants={itemVariants}
          className="mt-10 pt-8 border-t border-[#E5DDD0] w-full max-w-md"
        >
          <div className="flex items-center gap-2 mb-4 justify-center">
            <Lightbulb className="w-4 h-4 text-[#D4A853]" />
            <span className="text-xs text-[#C4B8A5] font-['Satoshi',sans-serif] uppercase tracking-wider">
              Quick tips
            </span>
          </div>
          <div className="space-y-2">
            {tips.map((tip, index) => (
              <motion.p
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-xs text-[#8B7355] font-['Satoshi',sans-serif]"
              >
                <span className="text-[#C45830] mr-2">•</span>
                {tip}
              </motion.p>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// Pre-built Empty State Variants
// ============================================

interface EmptyPlanProps {
  cityName?: string;
  onCreateCluster: () => void;
  onExploreSuggestions?: () => void;
}

export function EmptyPlan({ cityName, onCreateCluster, onExploreSuggestions }: EmptyPlanProps) {
  return (
    <EmptyState
      title={`Start planning ${cityName || 'your trip'}`}
      description="Create areas to organize your activities by location. We'll help you find the best spots within walking distance of each other."
      illustration={<WanderlustIllustration />}
      action={{
        label: 'Create your first area',
        onClick: onCreateCluster,
        icon: <MapPin className="w-4 h-4" />,
      }}
      secondaryAction={
        onExploreSuggestions
          ? {
              label: 'Browse suggestions first →',
              onClick: onExploreSuggestions,
            }
          : undefined
      }
      tips={[
        'Group nearby places together for easy walking tours',
        'Our AI suggests optimal areas based on your interests',
        'Drag and drop to reorder activities',
      ]}
    />
  );
}

interface EmptyClusterProps {
  clusterName: string;
  onAddFromSuggestions: () => void;
  onAskCompanion?: () => void;
}

export function EmptyCluster({ clusterName, onAddFromSuggestions, onAskCompanion }: EmptyClusterProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="py-8 px-4 text-center"
    >
      <motion.div
        animate={{ y: [-2, 2, -2] }}
        transition={{ duration: 3, repeat: Infinity }}
        className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#FEF3EE] to-[#FCE8DE] flex items-center justify-center"
      >
        <Heart className="w-8 h-8 text-[#C45830]" strokeWidth={1.5} />
      </motion.div>

      <h4 className="font-['Satoshi',sans-serif] font-semibold text-[#2C2417] mb-2">
        {clusterName} is waiting
      </h4>
      <p className="text-sm text-[#8B7355] font-['Satoshi',sans-serif] max-w-xs mx-auto mb-6">
        Add restaurants, activities, and hidden gems to this area from suggestions.
      </p>

      <div className="flex flex-col items-center gap-2">
        <button
          onClick={onAddFromSuggestions}
          className="
            flex items-center gap-2 px-4 py-2
            text-[#C45830] font-['Satoshi',sans-serif] font-medium text-sm
            hover:bg-[#FEF3EE] rounded-lg transition-colors
          "
        >
          <Sparkles className="w-4 h-4" />
          Browse suggestions
        </button>

        {onAskCompanion && (
          <button
            onClick={onAskCompanion}
            className="
              text-xs text-[#8B7355] font-['Satoshi',sans-serif]
              hover:text-[#2C2417] transition-colors
            "
          >
            Or ask the companion for recommendations
          </button>
        )}
      </div>
    </motion.div>
  );
}

interface EmptySuggestionsProps {
  type: string;
  onGenerate: () => void;
  isLoading?: boolean;
}

export function EmptySuggestions({ type, onGenerate, isLoading }: EmptySuggestionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-8 text-center"
    >
      <CompassIllustration />

      <h4 className="font-['Satoshi',sans-serif] font-semibold text-[#2C2417] mt-4 mb-2">
        No {type} suggestions yet
      </h4>
      <p className="text-sm text-[#8B7355] font-['Satoshi',sans-serif] max-w-xs mx-auto mb-6">
        Generate personalized recommendations based on your travel style.
      </p>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onGenerate}
        disabled={isLoading}
        className="
          flex items-center gap-2 px-5 py-2.5 mx-auto
          bg-[#FFFBF5] border border-[#E5DDD0]
          text-[#2C2417] font-['Satoshi',sans-serif] font-medium text-sm
          rounded-xl hover:border-[#C45830] hover:text-[#C45830]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-4 h-4 border-2 border-[#C45830]/30 border-t-[#C45830] rounded-full"
          />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        Generate {type} suggestions
      </motion.button>
    </motion.div>
  );
}

// ============================================
// Onboarding Component
// ============================================

interface OnboardingStep {
  icon: ReactNode;
  title: string;
  description: string;
}

interface PlanningOnboardingProps {
  cityName: string;
  onGetStarted: () => void;
  onSkip?: () => void;
}

export function PlanningOnboarding({ cityName, onGetStarted, onSkip }: PlanningOnboardingProps) {
  const steps: OnboardingStep[] = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Create walkable areas',
      description: 'Group activities by neighborhood so you can explore without rushing.',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Get AI suggestions',
      description: 'Personalized recommendations based on your travel style and preferences.',
    },
    {
      icon: <Route className="w-6 h-6" />,
      title: 'Build your perfect day',
      description: 'Drag, drop, and reorder to create the ideal flow for each day.',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-6"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-lg w-full"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-10">
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-[#C45830] to-[#D4724A] shadow-xl shadow-[#C45830]/30 flex items-center justify-center"
          >
            <Compass className="w-10 h-10 text-white" strokeWidth={1.5} />
          </motion.div>

          <h1 className="font-['Fraunces',serif] text-2xl sm:text-3xl text-[#2C2417] font-semibold mb-3">
            Plan your {cityName} adventure
          </h1>
          <p className="text-[#8B7355] font-['Satoshi',sans-serif] leading-relaxed">
            Let's create the perfect itinerary together. Here's how it works:
          </p>
        </motion.div>

        {/* Steps */}
        <motion.div variants={itemVariants} className="space-y-4 mb-10">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="
                flex items-start gap-4 p-4
                bg-[#FFFBF5] rounded-xl border border-[#E5DDD0]
                hover:border-[#C45830]/30 hover:shadow-md
                transition-all duration-200
              "
            >
              <div
                className="
                  flex-shrink-0 w-12 h-12 rounded-xl
                  bg-gradient-to-br from-[#FEF3EE] to-[#FCE8DE]
                  flex items-center justify-center text-[#C45830]
                "
              >
                {step.icon}
              </div>
              <div>
                <h3 className="font-['Satoshi',sans-serif] font-semibold text-[#2C2417] mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-[#8B7355] font-['Satoshi',sans-serif]">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Actions */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onGetStarted}
            className="
              w-full py-4 px-6
              bg-gradient-to-r from-[#C45830] to-[#D4724A]
              text-white font-['Satoshi',sans-serif] font-semibold
              rounded-xl shadow-lg shadow-[#C45830]/20
              hover:shadow-xl hover:shadow-[#C45830]/30
              transition-shadow duration-200
              flex items-center justify-center gap-2
            "
          >
            <Sparkles className="w-5 h-5" />
            Let's get started
          </motion.button>

          {onSkip && (
            <button
              onClick={onSkip}
              className="
                text-sm text-[#8B7355] font-['Satoshi',sans-serif]
                hover:text-[#2C2417] transition-colors
              "
            >
              Skip intro and start planning
            </button>
          )}
        </motion.div>

        {/* Decorative footer */}
        <motion.p
          variants={itemVariants}
          className="text-center text-xs text-[#C4B8A5] font-['Satoshi',sans-serif] mt-8"
        >
          Your plan auto-saves as you go. No work will be lost.
        </motion.p>
      </motion.div>
    </motion.div>
  );
}

export default {
  EmptyState,
  EmptyPlan,
  EmptyCluster,
  EmptySuggestions,
  PlanningOnboarding,
};
