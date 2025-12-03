import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Check, Clock, Search, MapPin, Calendar, Sparkles, CheckCircle, Route, Compass, Heart, Coffee } from 'lucide-react'
import type { TripPreferences } from '../types'
import { AVAILABLE_INTERESTS } from '../types'

interface RouteGenerationLoadingProps {
  progress: {
    total: number
    completed: number
    currentAgent: string | null
    percentComplete: number
    estimatedTimeRemaining: number
    phase?: string // Current phase from backend
    message?: string // Current message from backend
  }
  destination: string
  preferences: TripPreferences
}

// Warm editorial easing
const warmEasing = [0.23, 1, 0.32, 1] as const

// Workflow phases for unified generation (matches backend phases)
const workflowPhases = [
  {
    id: 'research',
    name: 'Research',
    icon: Search,
    description: 'Analyzing the route corridor and options',
    color: '#C45830' // Terracotta
  },
  {
    id: 'discovery',
    name: 'Discovery',
    icon: MapPin,
    description: 'Finding perfect stops based on your interests',
    color: '#D4A853' // Golden
  },
  {
    id: 'planning',
    name: 'Planning',
    icon: Calendar,
    description: 'Optimizing route order and timing',
    color: '#6B8E7B' // Sage green
  },
  {
    id: 'enrichment',
    name: 'Enrichment',
    icon: Coffee,
    description: 'Adding activities, restaurants, and hotels',
    color: '#8B7355' // Warm brown
  },
  {
    id: 'validation',
    name: 'Validation',
    icon: CheckCircle,
    description: 'Verifying feasibility and quality',
    color: '#5B6E8C' // Dusty blue
  },
  {
    id: 'optimization',
    name: 'Optimization',
    icon: Route,
    description: 'Final refinements for your journey',
    color: '#C45830' // Terracotta
  },
  {
    id: 'personalizing',
    name: 'Personalizing',
    icon: Heart,
    description: 'Creating your personalized story',
    color: '#D4A853' // Golden
  }
]

// Map phase string to index
const phaseToIndex: Record<string, number> = {
  'research': 0,
  'discovery': 1,
  'planning': 2,
  'enrichment': 3,
  'validation': 4,
  'optimization': 5,
  'personalizing': 6,
  'completed': 7
}

// Fun facts about destinations and travel
const travelFacts = [
  'Most European cities are best explored on foot - pack comfortable shoes!',
  'Try to learn a few key phrases in the local language',
  'The best photos often happen during golden hour (sunrise/sunset)',
  'Local markets are great for authentic experiences and budget meals',
  "Download offline maps before you go - you'll thank yourself later",
  'Pack layers - mountain weather can change in minutes',
  'Book popular restaurants at least a week in advance',
  'Many museums offer free admission on certain days',
  'Public transportation is often faster than driving in cities',
  'Stay hydrated while exploring - bring a reusable water bottle'
]

export function RouteGenerationLoading({ progress, destination, preferences }: RouteGenerationLoadingProps) {
  const [currentFactIndex, setCurrentFactIndex] = useState(0)

  // Rotate facts every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFactIndex((prev) => (prev + 1) % travelFacts.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Format time remaining
  const formatTimeRemaining = (ms: number): string => {
    if (ms <= 0) return 'Almost done...'
    const seconds = Math.ceil(ms / 1000)
    if (seconds < 60) return `About ${seconds} second${seconds !== 1 ? 's' : ''} remaining`
    const minutes = Math.ceil(seconds / 60)
    return `About ${minutes} minute${minutes !== 1 ? 's' : ''} remaining`
  }

  // Get selected interest labels
  const selectedInterestLabels = preferences.interests
    .slice(0, 3)
    .map((i) => AVAILABLE_INTERESTS.find((ai) => ai.id === i.id)?.label || i.id)
    .join(', ')

  // Determine current phase based on backend phase or fall back to percentage
  const currentPhaseIndex = progress.phase
    ? (phaseToIndex[progress.phase] ?? Math.min(
        Math.floor((progress.percentComplete / 100) * workflowPhases.length),
        workflowPhases.length - 1
      ))
    : Math.min(
        Math.floor((progress.percentComplete / 100) * workflowPhases.length),
        workflowPhases.length - 1
      )

  // Note: Each phase has its own color applied dynamically in the render loop

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: warmEasing }}
      className="w-full max-w-2xl mx-auto"
    >
      {/* Main Card - Editorial warm styling */}
      <div className="relative p-8 md:p-10 bg-rui-white rounded-rui-32 shadow-rui-3 border border-rui-grey-10 overflow-hidden">
        {/* Subtle grain texture overlay */}
        <div className="absolute inset-0 opacity-[0.015] pointer-events-none"
             style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
        />

        {/* Decorative accent corner */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-rui-accent/5 to-transparent rounded-bl-full" />

        {/* Header */}
        <div className="relative text-center mb-10">
          {/* Compass icon animation */}
          <motion.div
            className="w-16 h-16 mx-auto mb-6 rounded-full bg-gradient-to-br from-rui-accent to-[#D66842] flex items-center justify-center shadow-accent"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            <Compass className="w-8 h-8 text-white" strokeWidth={1.5} />
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ease: warmEasing }}
            className="font-marketing text-display-3 text-rui-black mb-3"
          >
            Planning your trip to {destination}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, ease: warmEasing }}
            className="text-body-1 text-rui-grey-50"
          >
            Crafting a personalized route based on {selectedInterestLabels}
          </motion.p>
        </div>

        {/* Progress Bar - Warm accent gradient */}
        <div className="relative mb-10">
          <div className="flex justify-between items-center mb-3">
            <span className="text-emphasis-2 text-rui-black">
              {progress.percentComplete}% Complete
            </span>
            <div className="flex items-center gap-1.5 text-body-2 text-rui-grey-50">
              <Clock className="w-4 h-4" />
              <span>{formatTimeRemaining(progress.estimatedTimeRemaining)}</span>
            </div>
          </div>

          <div className="relative h-3 bg-rui-grey-5 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-rui-accent via-[#D66842] to-rui-accent"
              initial={{ width: '0%' }}
              animate={{ width: `${progress.percentComplete}%` }}
              transition={{ duration: 0.5, ease: warmEasing }}
            >
              {/* Premium shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
          </div>
        </div>

        {/* Workflow Phases - Editorial card style with dynamic colors */}
        <div className="mb-8 space-y-3">
          {workflowPhases.map((phase, index) => {
            const isCompleted = index < currentPhaseIndex
            const isCurrent = index === currentPhaseIndex
            const Icon = phase.icon
            const phaseColor = phase.color || '#C45830'

            return (
              <motion.div
                key={phase.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  delay: index * 0.08,
                  duration: 0.3,
                  ease: warmEasing
                }}
                style={{
                  borderColor: isCurrent ? phaseColor : isCompleted ? `${phaseColor}50` : undefined,
                  backgroundColor: isCompleted ? `${phaseColor}10` : undefined
                }}
                className={`flex items-center p-4 rounded-rui-16 border transition-all duration-300 ${
                  isCompleted
                    ? ''
                    : isCurrent
                    ? 'bg-rui-white shadow-rui-2'
                    : 'border-rui-grey-8 bg-rui-grey-2'
                }`}
              >
                {/* Icon/Status - Dynamic color per phase */}
                <div
                  className="flex-shrink-0 w-11 h-11 flex items-center justify-center rounded-rui-12 mr-4 transition-all"
                  style={{
                    backgroundColor: isCompleted || isCurrent ? phaseColor : 'var(--rui-color-grey-10)'
                  }}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </motion.div>
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                      <Loader2 className="w-5 h-5 text-white" strokeWidth={2.5} />
                    </motion.div>
                  ) : (
                    <Icon className="w-5 h-5 text-rui-grey-50" />
                  )}
                </div>

                {/* Phase Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="text-emphasis-1 transition-colors"
                      style={{ color: isCompleted ? phaseColor : isCurrent ? 'var(--rui-color-black)' : 'var(--rui-color-grey-50)' }}
                    >
                      {phase.name}
                    </span>
                    {isCompleted && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-body-3 font-medium px-2.5 py-0.5 rounded-full"
                        style={{ color: phaseColor, backgroundColor: `${phaseColor}15` }}
                      >
                        Complete
                      </motion.span>
                    )}
                  </div>

                  {isCurrent && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      transition={{ duration: 0.2 }}
                      className="text-body-2 text-rui-grey-50 mt-1"
                    >
                      {/* Use backend message if available, otherwise show static description */}
                      {progress.message || phase.description}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Travel Tips - Warm editorial card */}
        <div className="relative bg-gradient-to-br from-rui-grey-2 to-rui-accent-light/30 rounded-rui-16 p-6 border border-rui-grey-10 overflow-hidden">
          {/* Decorative element */}
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rui-accent/5 rounded-full blur-2xl" />

          <div className="relative flex items-start gap-4">
            <div className="flex-shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-rui-accent to-[#D66842] flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-emphasis-3 text-rui-accent mb-2 uppercase tracking-wider">Travel Tip</h3>
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentFactIndex}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.25, ease: warmEasing }}
                  className="text-body-2 text-rui-black leading-relaxed"
                >
                  {travelFacts[currentFactIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Subtle animation indicator */}
        <div className="mt-8 flex justify-center">
          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-rui-accent rounded-full"
                animate={{
                  scale: [1, 1.4, 1],
                  opacity: [0.3, 1, 0.3],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut'
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}
