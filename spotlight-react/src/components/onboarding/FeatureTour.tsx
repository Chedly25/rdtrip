/**
 * Feature Tour Component - Wanderlust Editorial Design
 *
 * A beautiful, magazine-style onboarding tour that introduces
 * users to the powerful features they might otherwise miss.
 *
 * Design: Warm cream tones, terracotta accents, Fraunces typography,
 * elegant animations, and a hint of wanderlust.
 */

import { useState, useEffect } from 'react'
import Joyride, { STATUS } from 'react-joyride'
import type { CallBackProps, Step, TooltipRenderProps } from 'react-joyride'
import { motion } from 'framer-motion'
import {
  Bookmark,
  Users,
  Receipt,
  Sparkles,
  CalendarDays,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
  MapPin
} from 'lucide-react'

const TOUR_KEY = 'rdtrip_tour_completed'
const TOUR_VERSION = '2.0' // Increment to show tour again after major updates

// Tour steps targeting specific elements
const TOUR_STEPS: Step[] = [
  {
    target: 'body', // Intro step
    content: 'welcome',
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="save-button"]',
    content: 'save',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="generate-itinerary"]',
    content: 'itinerary',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '[data-tour="collaborate-button"]',
    content: 'collaborate',
    placement: 'top',
    disableBeacon: true,
  },
  {
    target: '[data-tour="companion-panel"]',
    content: 'companion',
    placement: 'left',
    disableBeacon: true,
  },
]

interface TourContent {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
  accentColor: string
}

const STEP_CONTENT: Record<string, TourContent> = {
  welcome: {
    icon: <MapPin className="w-8 h-8" />,
    title: "Welcome to Your Journey",
    description: "Let us show you how to make the most of your road trip planning. This will only take a moment.",
    gradient: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
    accentColor: '#C45830',
  },
  save: {
    icon: <Bookmark className="w-6 h-6" />,
    title: "Save Your Trip",
    description: "Don't lose your perfect route. Save it to access from anywhere and share with travel companions.",
    gradient: 'linear-gradient(135deg, #D4A853 0%, #E8C547 100%)',
    accentColor: '#D4A853',
  },
  itinerary: {
    icon: <CalendarDays className="w-6 h-6" />,
    title: "Generate Day-by-Day Plans",
    description: "Our AI creates detailed itineraries with activities, restaurants, and timing—personalized for your style.",
    gradient: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
    accentColor: '#C45830',
  },
  collaborate: {
    icon: <Users className="w-6 h-6" />,
    title: "Plan Together",
    description: "Invite friends and family to collaborate. Vote on stops, share ideas, and plan as a group.",
    gradient: 'linear-gradient(135deg, #6B8E7B 0%, #5A7D6A 100%)',
    accentColor: '#6B8E7B',
  },
  expenses: {
    icon: <Receipt className="w-6 h-6" />,
    title: "Track & Split Expenses",
    description: "Log trip costs, scan receipts, and automatically calculate who owes what. No more spreadsheets.",
    gradient: 'linear-gradient(135deg, #8B7355 0%, #6B5B4F 100%)',
    accentColor: '#8B7355',
  },
  companion: {
    icon: <MessageCircle className="w-6 h-6" />,
    title: "Your AI Travel Companion",
    description: "Ask anything about your trip. Get recommendations, resolve questions, and discover hidden gems.",
    gradient: 'linear-gradient(135deg, #5B6E8C 0%, #4A5D7B 100%)',
    accentColor: '#5B6E8C',
  },
}

// Custom Tooltip Component with Editorial Design
function EditorialTooltip({
  index,
  step,
  backProps,
  primaryProps,
  skipProps,
  tooltipProps,
  size,
}: TooltipRenderProps) {
  const content = STEP_CONTENT[step.content as string] || STEP_CONTENT.welcome
  const isFirst = index === 0
  const isLast = index === size - 1
  const progress = ((index + 1) / size) * 100

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      {...tooltipProps}
      className="relative max-w-sm"
    >
      {/* Main card */}
      <div
        className="rounded-[1.5rem] overflow-hidden"
        style={{
          background: 'linear-gradient(165deg, #FFFBF5 0%, #FAF7F2 100%)',
          boxShadow: '0 25px 60px -12px rgba(44, 36, 23, 0.25), 0 0 0 1px rgba(44, 36, 23, 0.05)',
        }}
      >
        {/* Gradient header accent */}
        <div
          className="h-1"
          style={{ background: content.gradient }}
        />

        {/* Icon header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ rotate: -10, scale: 0.8 }}
              animate={{ rotate: 0, scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400 }}
              className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${content.accentColor}15 0%, ${content.accentColor}25 100%)`,
                color: content.accentColor,
              }}
            >
              {content.icon}
            </motion.div>
            <div className="flex-1">
              <h3
                className="text-xl font-semibold mb-1"
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  color: '#2C2417',
                  letterSpacing: '-0.02em',
                }}
              >
                {content.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: '#8B7355' }}
              >
                {content.description}
              </p>
            </div>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="mx-6">
          <div
            className="h-px"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(139, 115, 85, 0.2) 50%, transparent 100%)',
            }}
          />
        </div>

        {/* Progress and actions */}
        <div className="px-6 py-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: '#8B7355' }}>
                Step {index + 1} of {size}
              </span>
              <span className="text-xs" style={{ color: '#C4B8A5' }}>
                {Math.round(progress)}% complete
              </span>
            </div>
            <div
              className="h-1 rounded-full overflow-hidden"
              style={{ background: '#F5F0E8' }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: content.gradient }}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isFirst && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  {...backProps}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    color: '#8B7355',
                    background: '#F5F0E8',
                  }}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </motion.button>
              )}
              <button
                {...skipProps}
                className="px-3 py-2 text-sm transition-colors hover:underline"
                style={{ color: '#C4B8A5' }}
              >
                Skip tour
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              {...primaryProps}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
              style={{
                background: content.gradient,
                boxShadow: `0 4px 14px ${content.accentColor}35`,
              }}
            >
              {isLast ? (
                <>
                  <Sparkles className="w-4 h-4" />
                  Start Exploring
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Bottom accent */}
        <div
          className="h-0.5"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(212, 168, 83, 0.3) 50%, transparent 100%)',
          }}
        />
      </div>
    </motion.div>
  )
}

interface FeatureTourProps {
  /** Force the tour to run, ignoring completion status */
  forceRun?: boolean
  /** Callback when tour completes or is skipped */
  onComplete?: () => void
}

export function FeatureTour({ forceRun = false, onComplete }: FeatureTourProps) {
  const [run, setRun] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    // Only run tour when explicitly triggered via forceRun
    // Auto-tour disabled due to missing target elements causing failures
    if (forceRun) {
      setRun(true)
      return
    }

    // Tour is now opt-in only - users can trigger via "Take a tour" button
    // This prevents the broken popup from appearing on every refresh
  }, [forceRun])

  const handleCallback = (data: CallBackProps) => {
    const { status, type, index } = data

    if (type === 'step:after') {
      setStepIndex(index + 1)
    }

    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      localStorage.setItem(TOUR_KEY, TOUR_VERSION)
      setRun(false)
      onComplete?.()
    }
  }

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      stepIndex={stepIndex}
      continuous
      showSkipButton
      showProgress={false}
      disableOverlayClose
      disableScrolling
      spotlightClicks={false}
      callback={handleCallback}
      tooltipComponent={EditorialTooltip}
      floaterProps={{
        disableAnimation: false,
        styles: {
          floater: {
            filter: 'none',
          },
        },
      }}
      styles={{
        options: {
          arrowColor: '#FFFBF5',
          backgroundColor: 'transparent',
          overlayColor: 'rgba(44, 36, 23, 0.5)',
          primaryColor: '#C45830',
          spotlightShadow: '0 0 40px rgba(196, 88, 48, 0.3)',
          zIndex: 10000,
        },
        spotlight: {
          borderRadius: 16,
        },
        overlay: {
          backdropFilter: 'blur(4px)',
        },
      }}
    />
  )
}

// Export a button to manually trigger the tour
export function TourTriggerButton({ className }: { className?: string }) {
  const [showTour, setShowTour] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowTour(true)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:bg-[#F5F0E8] ${className}`}
        style={{ color: '#8B7355' }}
      >
        <Sparkles className="w-4 h-4" style={{ color: '#D4A853' }} />
        Take a tour
      </button>

      {showTour && (
        <FeatureTour
          forceRun
          onComplete={() => setShowTour(false)}
        />
      )}
    </>
  )
}
