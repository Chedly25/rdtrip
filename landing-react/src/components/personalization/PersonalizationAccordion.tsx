/**
 * Personalization Accordion
 *
 * An elegant, collapsible container for advanced trip customization options.
 * Collapsed by default to keep the form clean, but reveals powerful
 * personalization tools for power users.
 *
 * Features:
 * - Smooth expand/collapse animations with spring physics
 * - Visual completion indicators showing filled sections
 * - Warm editorial styling (terracotta/gold accents)
 * - Progressive disclosure pattern
 * - Full mobile responsiveness
 * - WCAG 2.1 AA accessibility compliance
 *
 * Sections:
 * - Occasion: What's the trip for?
 * - Travel Style: Explorer, Relaxer, Culture, Adventurer, Foodie
 * - Pace: Very relaxed → Packed schedule
 * - Interests: What draws you to places?
 * - Dining: Style & dietary requirements
 * - Budget & Accommodation: Comfort level
 * - Accessibility: Physical considerations
 */

import { useState, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Sliders, Sparkles } from 'lucide-react'
import type {
  TripPersonalization,
  TravelStyle,
  DiningStyle,
  PersonalizationBudget,
  AccommodationStyle,
  TripOccasion,
  PersonalizationInterest,
} from '../../types'

import {
  OccasionSection,
  TravelStyleSection,
  PaceSection,
  InterestsSection,
  DiningSection,
  BudgetSection,
  AccessibilitySection,
} from './sections'

// Smooth editorial easing
const editorialEasing = [0.25, 0.1, 0.25, 1] as const
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30 }

// Exclude tripStory since it's handled separately by TripStoryInput
export type PersonalizationData = Omit<TripPersonalization, 'tripStory'>

interface PersonalizationAccordionProps {
  value: PersonalizationData
  onChange: (data: PersonalizationData) => void
  className?: string
}

export function PersonalizationAccordion({
  value,
  onChange,
  className = '',
}: PersonalizationAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Generate unique IDs for accessibility
  const accordionId = useId()
  const contentId = `${accordionId}-content`
  const headerId = `${accordionId}-header`

  // Calculate how many sections are filled (total 7 sections)
  const filledSections = [
    value.occasion,
    value.travelStyle,
    value.pace !== undefined,
    value.interests?.length,
    value.diningStyle || value.dietary?.length,
    value.budget || value.accommodation,
    value.accessibility?.length || value.avoidCrowds || value.preferOutdoor,
  ].filter(Boolean).length

  const totalSections = 7

  // Section change handlers
  const handleOccasionChange = (occasion: TripOccasion | undefined) => {
    onChange({ ...value, occasion })
  }

  const handleTravelStyleChange = (travelStyle: TravelStyle | undefined) => {
    onChange({ ...value, travelStyle })
  }

  const handlePaceChange = (pace: number | undefined) => {
    onChange({ ...value, pace })
  }

  const handleInterestsChange = (interests: PersonalizationInterest[] | undefined) => {
    onChange({ ...value, interests })
  }

  const handleDiningStyleChange = (diningStyle: DiningStyle | undefined) => {
    onChange({ ...value, diningStyle })
  }

  const handleDietaryChange = (dietary: string[] | undefined) => {
    onChange({ ...value, dietary })
  }

  const handleBudgetChange = (budget: PersonalizationBudget | undefined) => {
    onChange({ ...value, budget })
  }

  const handleAccommodationChange = (accommodation: AccommodationStyle | undefined) => {
    onChange({ ...value, accommodation })
  }

  const handleAccessibilityChange = (accessibility: string[] | undefined) => {
    onChange({ ...value, accessibility })
  }

  const handleAvoidCrowdsChange = (avoidCrowds: boolean | undefined) => {
    onChange({ ...value, avoidCrowds })
  }

  const handlePreferOutdoorChange = (preferOutdoor: boolean | undefined) => {
    onChange({ ...value, preferOutdoor })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: editorialEasing }}
      className={`relative ${className}`}
      role="region"
      aria-labelledby={headerId}
    >
      {/* Accordion Header - Always visible */}
      <button
        type="button"
        id={headerId}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className="group flex w-full items-center justify-between rounded-2xl p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 sm:rounded-3xl sm:p-4"
        style={{
          background: isExpanded
            ? 'linear-gradient(180deg, #FEF3EE 0%, #FAF7F2 100%)'
            : '#F5F0E8',
          border: isExpanded ? '2px solid rgba(196, 88, 48, 0.2)' : '2px solid transparent',
          // @ts-expect-error CSS variable
          '--tw-ring-color': '#C45830',
        }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3">
          <motion.div
            animate={{
              rotate: isExpanded ? [0, -5, 5, 0] : 0,
              scale: isExpanded ? [1, 1.05, 1] : 1,
            }}
            transition={{ duration: 0.4, ease: editorialEasing }}
            className="flex h-10 w-10 items-center justify-center rounded-full shadow-sm sm:h-12 sm:w-12"
            style={{
              background: filledSections > 0
                ? 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)'
                : '#FFFBF5',
            }}
          >
            <Sliders
              className="h-5 w-5 sm:h-6 sm:w-6"
              style={{ color: filledSections > 0 ? '#FFFBF5' : '#C45830' }}
              aria-hidden="true"
            />
          </motion.div>
          <div className="text-left">
            <h3
              className="text-sm font-semibold sm:text-base"
              style={{
                color: '#2C2417',
                fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)",
              }}
            >
              Fine-tune your experience
            </h3>
            <p className="text-xs sm:text-sm" style={{ color: '#8B7355' }}>
              {filledSections > 0
                ? `${filledSections} of ${totalSections} sections customized`
                : 'Optional advanced settings'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Progress indicator */}
          <AnimatePresence>
            {filledSections > 0 && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={springTransition}
                className="hidden items-center gap-0.5 sm:flex"
                aria-label={`${filledSections} of ${totalSections} sections filled`}
              >
                {Array.from({ length: totalSections }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: i * 0.03, ...springTransition }}
                    className="h-1.5 w-1.5 rounded-full transition-colors sm:h-2 sm:w-2"
                    style={{
                      background: i < filledSections
                        ? 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)'
                        : '#E5DDD0',
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mobile: Show filled count badge */}
          <AnimatePresence>
            {filledSections > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={springTransition}
                className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold sm:hidden"
                style={{
                  background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
                  color: '#FFFBF5',
                }}
              >
                {filledSections}
              </motion.span>
            )}
          </AnimatePresence>

          {/* Expand/Collapse chevron */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3, ease: editorialEasing }}
            className="flex h-8 w-8 items-center justify-center rounded-full shadow-sm transition-colors group-hover:bg-[#C45830] group-hover:text-white sm:h-9 sm:w-9"
            style={{ background: '#FFFBF5' }}
          >
            <ChevronDown
              className="h-4 w-4 sm:h-5 sm:w-5"
              style={{ color: 'inherit' }}
              aria-hidden="true"
            />
          </motion.div>
        </div>
      </button>

      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            id={contentId}
            role="region"
            aria-labelledby={headerId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: editorialEasing }}
            className="overflow-hidden"
          >
            <div
              className="space-y-6 rounded-b-2xl px-3 pb-4 pt-4 sm:space-y-8 sm:rounded-b-3xl sm:px-4 sm:pb-6 sm:pt-5"
              style={{
                background: 'linear-gradient(180deg, #FAF7F2 0%, #FFFBF5 100%)',
                borderTop: '1px solid #E5DDD0',
              }}
            >
              {/* Personalized badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.3, ease: editorialEasing }}
                className="flex items-center justify-center gap-2"
              >
                <Sparkles className="h-4 w-4" style={{ color: '#D4A853' }} />
                <span
                  className="text-xs font-medium sm:text-sm"
                  style={{ color: '#8B7355' }}
                >
                  Customize any section below to personalize your route
                </span>
              </motion.div>

              {/* Section: Occasion */}
              <OccasionSection
                value={value.occasion}
                onChange={handleOccasionChange}
              />

              {/* Section: Travel Style */}
              <TravelStyleSection
                value={value.travelStyle}
                onChange={handleTravelStyleChange}
              />

              {/* Section: Pace */}
              <PaceSection
                value={value.pace}
                onChange={handlePaceChange}
              />

              {/* Section: Interests */}
              <InterestsSection
                value={value.interests}
                onChange={handleInterestsChange}
              />

              {/* Section: Dining */}
              <DiningSection
                diningStyle={value.diningStyle}
                dietary={value.dietary}
                onDiningStyleChange={handleDiningStyleChange}
                onDietaryChange={handleDietaryChange}
              />

              {/* Section: Budget & Accommodation */}
              <BudgetSection
                budget={value.budget}
                accommodation={value.accommodation}
                onBudgetChange={handleBudgetChange}
                onAccommodationChange={handleAccommodationChange}
              />

              {/* Section: Accessibility */}
              <AccessibilitySection
                accessibility={value.accessibility}
                avoidCrowds={value.avoidCrowds}
                preferOutdoor={value.preferOutdoor}
                onAccessibilityChange={handleAccessibilityChange}
                onAvoidCrowdsChange={handleAvoidCrowdsChange}
                onPreferOutdoorChange={handlePreferOutdoorChange}
              />

              {/* Summary footer */}
              <AnimatePresence>
                {filledSections >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3, ease: editorialEasing }}
                    className="rounded-2xl p-4 text-center sm:p-5"
                    style={{
                      background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.1) 0%, rgba(212, 168, 83, 0.1) 100%)',
                      border: '1px solid rgba(196, 88, 48, 0.2)',
                    }}
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5" style={{ color: '#C45830' }} />
                      <span
                        className="text-sm font-semibold sm:text-base"
                        style={{
                          color: '#C45830',
                          fontFamily: "var(--font-display, 'Fraunces', Georgia, serif)",
                        }}
                      >
                        Your route will be highly personalized
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm" style={{ color: '#5C4D3D' }}>
                      We'll use your preferences to find the perfect experiences for you
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default PersonalizationAccordion
