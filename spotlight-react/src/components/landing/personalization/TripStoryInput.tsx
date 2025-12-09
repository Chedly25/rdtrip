/**
 * Trip Story Input
 *
 * A beautiful, inviting textarea where users can express their trip context naturally.
 * Designed to feel like writing in a luxury travel journal - warm, personal, and inspiring.
 *
 * Features:
 * - Rotating placeholder examples that inspire users
 * - Elegant focus states with terracotta accents
 * - Character hint (not limit) for guidance
 * - Editorial typography that makes writing a pleasure
 * - Full mobile responsiveness
 * - WCAG 2.1 AA accessibility compliance
 */

import { useState, useEffect, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Feather, Sparkles } from 'lucide-react'

// Smooth easing for editorial feel
const editorialEasing = [0.25, 0.1, 0.25, 1] as const
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 30 }

// Inspiring placeholder examples that rotate
const PLACEHOLDER_EXAMPLES = [
  "We're celebrating our 10th anniversary and want romantic spots with amazing food. My partner loves art museums and I'm into local wine bars...",
  "Traveling with our two kids (ages 5 and 8) who need regular breaks. We want fun activities but also some grown-up dining experiences...",
  "First time in Europe! Want iconic sights but hate crowds. Love finding hidden cafés and local neighborhoods...",
  "Budget-conscious trip but willing to splurge on one special dinner. Looking for authentic local experiences over tourist traps...",
  "Celebrating retirement, taking it slow and luxurious. Love history, beautiful gardens, and scenic viewpoints...",
  "Group of friends on an adventure trip. We're active, love hiking, and want great nightlife options too...",
  "Solo traveler looking for photography opportunities and quiet moments. Coffee culture is a must...",
]

interface TripStoryInputProps {
  value: string
  onChange: (value: string) => void
  maxLength?: number
  className?: string
}

export function TripStoryInput({
  value,
  onChange,
  maxLength = 500,
  className = '',
}: TripStoryInputProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [placeholderIndex, setPlaceholderIndex] = useState(0)
  const [isTypingPlaceholder, setIsTypingPlaceholder] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Generate unique IDs for accessibility
  const inputId = useId()
  const descriptionId = useId()
  const counterId = useId()

  // Rotate placeholders when not focused and empty
  useEffect(() => {
    if (isFocused || value) return

    const interval = setInterval(() => {
      setIsTypingPlaceholder(false)
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length)
        setIsTypingPlaceholder(true)
      }, 300)
    }, 5000)

    return () => clearInterval(interval)
  }, [isFocused, value])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.max(100, textarea.scrollHeight)}px`
    }
  }, [value])

  const characterCount = value.length
  const isNearLimit = characterCount > maxLength * 0.8
  const percentUsed = (characterCount / maxLength) * 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: editorialEasing }}
      className={`relative ${className}`}
      role="group"
      aria-labelledby={`${inputId}-label`}
    >
      {/* Section Header - Responsive layout */}
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{
              rotate: isFocused ? [0, -10, 10, -5, 5, 0] : 0,
              scale: isFocused ? [1, 1.1, 1] : 1,
            }}
            transition={{ duration: 0.5, ease: editorialEasing }}
          >
            <Feather className="h-5 w-5 text-rui-accent" aria-hidden="true" />
          </motion.div>
          <h3
            id={`${inputId}-label`}
            className="font-display text-base font-semibold text-rui-black sm:text-lg"
          >
            Tell us about your trip
          </h3>
        </div>
        <AnimatePresence mode="wait">
          {value && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8, x: -10 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: -10 }}
              transition={springTransition}
              className="flex w-fit items-center gap-1 rounded-full bg-rui-accent/10 px-2.5 py-1 text-xs font-medium text-rui-accent"
              aria-live="polite"
            >
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              Personalized
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Subtitle */}
      <p
        id={descriptionId}
        className="mb-3 text-sm leading-relaxed text-rui-grey-50 sm:mb-4"
      >
        Share what makes this trip special. The more you tell us, the better we can tailor your route.
      </p>

      {/* Textarea Container */}
      <motion.div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl"
        animate={{
          boxShadow: isFocused
            ? '0 0 0 2px var(--rui-color-accent), 0 8px 32px rgba(196, 88, 48, 0.15)'
            : '0 4px 12px rgba(44, 36, 23, 0.08)',
        }}
        transition={{ duration: 0.25, ease: editorialEasing }}
      >
        {/* Decorative top border gradient - animated */}
        <motion.div
          className="absolute top-0 left-0 right-0 h-1 origin-left"
          initial={{ scaleX: 0 }}
          animate={{
            scaleX: isFocused ? 1 : 0.3,
            opacity: isFocused ? 1 : 0.5,
          }}
          transition={{ duration: 0.4, ease: editorialEasing }}
          style={{
            background: 'linear-gradient(90deg, #C45830 0%, #D4A853 50%, #C45830 100%)',
          }}
        />

        {/* Inner container with warm background */}
        <motion.div
          className="relative p-4 pt-5 sm:p-5 sm:pt-6"
          animate={{
            background: isFocused
              ? 'linear-gradient(180deg, #FEF3EE 0%, #FFFBF5 100%)'
              : '#FFFBF5',
          }}
          transition={{ duration: 0.3 }}
        >
          {/* Decorative quote mark - hidden on small screens */}
          <motion.div
            className="pointer-events-none absolute right-4 top-3 hidden select-none font-display text-5xl leading-none sm:block sm:right-5 sm:top-4 sm:text-6xl"
            animate={{
              color: isFocused ? 'rgba(196, 88, 48, 0.12)' : 'rgba(44, 36, 23, 0.05)',
              scale: isFocused ? 1.1 : 1,
            }}
            transition={{ duration: 0.3 }}
            aria-hidden="true"
          >
            "
          </motion.div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            aria-describedby={`${descriptionId} ${counterId}`}
            aria-label="Your trip story"
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed text-rui-black placeholder:text-rui-grey-50/70 focus:outline-none sm:text-base"
            style={{
              fontFamily: 'var(--font-body)',
              minHeight: '100px',
            }}
            placeholder=""
          />

          {/* Animated Placeholder */}
          <AnimatePresence mode="wait">
            {!value && !isFocused && (
              <motion.div
                key={placeholderIndex}
                className="pointer-events-none absolute left-4 right-4 top-5 text-[15px] leading-relaxed text-rui-grey-50/60 sm:left-5 sm:right-16 sm:top-6 sm:text-base"
                style={{ fontFamily: 'var(--font-body)' }}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: isTypingPlaceholder ? 1 : 0, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3, ease: editorialEasing }}
                aria-hidden="true"
              >
                {PLACEHOLDER_EXAMPLES[placeholderIndex]}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Focus placeholder hint */}
          <AnimatePresence>
            {!value && isFocused && (
              <motion.div
                className="pointer-events-none absolute left-4 right-4 top-5 text-[15px] italic leading-relaxed text-rui-grey-50/40 sm:left-5 sm:right-16 sm:top-6 sm:text-base"
                style={{ fontFamily: 'var(--font-body)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                aria-hidden="true"
              >
                Start typing your story...
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer with character count and hint */}
          <div className="mt-3 flex items-center justify-between border-t border-rui-grey-10 pt-3 sm:mt-4 sm:pt-4">
            <span className="text-[11px] text-rui-grey-50 sm:text-xs">
              Optional · helps us personalize your route
            </span>
            <div className="flex items-center gap-2">
              {/* Visual progress indicator */}
              <div className="hidden h-1 w-12 overflow-hidden rounded-full bg-rui-grey-10 sm:block">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: isNearLimit
                      ? 'linear-gradient(90deg, #D4A853, #C45830)'
                      : 'var(--rui-color-grey-20)',
                  }}
                  animate={{ width: `${percentUsed}%` }}
                  transition={{ duration: 0.2 }}
                />
              </div>
              <motion.span
                id={counterId}
                className={`text-[11px] font-medium tabular-nums sm:text-xs ${
                  isNearLimit ? 'text-rui-accent' : 'text-rui-grey-50'
                }`}
                animate={{
                  scale: isNearLimit && characterCount > 0 ? [1, 1.05, 1] : 1,
                }}
                transition={{ duration: 0.2 }}
                aria-live="polite"
                aria-atomic="true"
              >
                {characterCount}/{maxLength}
              </motion.span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Inspirational prompts - Better mobile layout */}
      <AnimatePresence>
        {!value && !isFocused && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, delay: 0.2, ease: editorialEasing }}
            className="mt-3 sm:mt-4"
            role="group"
            aria-label="Suggested topics"
          >
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] text-rui-grey-50 sm:text-xs">Try mentioning:</span>
              {['occasion', 'interests', 'travel style', 'must-sees'].map((prompt, index) => (
                <motion.button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    textareaRef.current?.focus()
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05, y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{
                    delay: 0.3 + index * 0.06,
                    ...springTransition
                  }}
                  className="rounded-full border border-rui-grey-10 bg-rui-grey-2 px-2 py-0.5 text-[11px] font-medium text-rui-grey-50 transition-colors hover:border-rui-accent hover:bg-rui-accent/5 hover:text-rui-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rui-accent focus-visible:ring-offset-2 sm:px-2.5 sm:py-1 sm:text-xs"
                >
                  {prompt}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default TripStoryInput
