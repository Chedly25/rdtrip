import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Check, Clock, Search, MapPin, Calendar, Sparkles, CheckCircle, Route } from 'lucide-react'
import type { TripPreferences } from '../types'
import { AVAILABLE_INTERESTS } from '../types'

interface RouteGenerationLoadingProps {
  progress: {
    total: number
    completed: number
    currentAgent: string | null
    percentComplete: number
    estimatedTimeRemaining: number
  }
  destination: string
  preferences: TripPreferences
}

// Workflow phases for unified generation
const workflowPhases = [
  {
    id: 'research',
    name: 'Research',
    icon: Search,
    description: 'Analyzing the route corridor and options'
  },
  {
    id: 'discovery',
    name: 'Discovery',
    icon: MapPin,
    description: 'Finding perfect stops based on your interests'
  },
  {
    id: 'planning',
    name: 'Planning',
    icon: Calendar,
    description: 'Optimizing route order and timing'
  },
  {
    id: 'enrichment',
    name: 'Enrichment',
    icon: Sparkles,
    description: 'Adding activities, restaurants, and hotels'
  },
  {
    id: 'validation',
    name: 'Validation',
    icon: CheckCircle,
    description: 'Verifying feasibility and quality'
  },
  {
    id: 'optimization',
    name: 'Optimization',
    icon: Route,
    description: 'Final refinements for your perfect trip'
  }
]

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

  // Determine current phase based on progress
  const currentPhaseIndex = Math.min(
    Math.floor((progress.percentComplete / 100) * workflowPhases.length),
    workflowPhases.length - 1
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="w-full max-w-2xl mx-auto p-8 bg-white rounded-3xl shadow-2xl border border-gray-100"
    >
      {/* Header */}
      <div className="text-center mb-10">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl font-bold text-gray-900 mb-3 tracking-tight"
        >
          Planning your trip to {destination}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base text-gray-600"
        >
          Crafting a personalized route based on {selectedInterestLabels}
        </motion.p>
      </div>

      {/* Progress Bar */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-900 tracking-wide">
            {progress.percentComplete}% Complete
          </span>
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span className="font-medium">{formatTimeRemaining(progress.estimatedTimeRemaining)}</span>
          </div>
        </div>

        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-gray-800 to-gray-900"
            initial={{ width: '0%' }}
            animate={{ width: `${progress.percentComplete}%` }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          >
            {/* Premium shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '200%']
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'linear'
              }}
            />
          </motion.div>
        </div>
      </div>

      {/* Workflow Phases */}
      <div className="mb-8 space-y-2">
        {workflowPhases.map((phase, index) => {
          const isCompleted = index < currentPhaseIndex
          const isCurrent = index === currentPhaseIndex
          const Icon = phase.icon

          return (
            <motion.div
              key={phase.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: index * 0.08,
                duration: 0.3,
                ease: [0.23, 1, 0.32, 1]
              }}
              className={`flex items-center p-4 rounded-xl border transition-all duration-300 ${
                isCompleted
                  ? 'border-gray-900 bg-gray-50'
                  : isCurrent
                  ? 'border-gray-900 bg-white shadow-lg'
                  : 'border-gray-200 bg-gray-50/50'
              }`}
            >
              {/* Icon/Status */}
              <div className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full mr-3 transition-all ${
                isCompleted
                  ? 'bg-gray-900'
                  : isCurrent
                  ? 'bg-gray-900'
                  : 'bg-gray-200'
              }`}>
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20
                    }}
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
                  <Icon className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {/* Phase Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5">
                  <span className={`text-base font-semibold transition-colors ${
                    isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                  }`}>
                    {phase.name}
                  </span>
                  {isCompleted && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-xs font-medium text-gray-600 bg-gray-200 px-2.5 py-0.5 rounded-full"
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
                    className="text-sm text-gray-600 mt-1.5"
                  >
                    {phase.description}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Fun Facts */}
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
            <span className="text-white text-base font-semibold">i</span>
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="text-sm font-semibold text-gray-900 mb-2 tracking-wide uppercase">Travel Tip</h3>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentFactIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                className="text-sm text-gray-700 leading-relaxed"
              >
                {travelFacts[currentFactIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Subtle animation indicator */}
      <div className="mt-8 flex justify-center">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 bg-gray-900 rounded-full"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut'
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
