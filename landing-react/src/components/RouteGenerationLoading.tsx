import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Check, Clock } from 'lucide-react'

interface RouteGenerationLoadingProps {
  progress: {
    total: number
    completed: number
    currentAgent: string | null
    percentComplete: number
    estimatedTimeRemaining: number
  }
  destination: string
  agents: string[]
}

// Agent metadata for display
const agentMetadata: Record<string, { name: string; color: string; icon: string; description: string }> = {
  adventure: {
    name: 'Adventure',
    color: '#055948',
    icon: '⛰️',
    description: 'Discovering outdoor activities and scenic routes'
  },
  culture: {
    name: 'Culture',
    color: '#a87600',
    icon: '🏛️',
    description: 'Finding museums, historic sites, and cultural gems'
  },
  food: {
    name: 'Food',
    color: '#650411',
    icon: '🍽️',
    description: 'Locating best restaurants and local cuisine'
  },
  'hidden-gems': {
    name: 'Hidden Gems',
    color: '#081d5b',
    icon: '💎',
    description: 'Uncovering charming villages and secret spots'
  }
}

// Fun facts about destinations and travel
const travelFacts = [
  'Most European cities are best explored on foot - pack comfortable shoes!',
  'Try to learn a few key phrases in the local language',
  'The best photos often happen during golden hour (sunrise/sunset)',
  'Local markets are great for authentic experiences and budget meals',
  'Download offline maps before you go - you\'ll thank yourself later',
  'Pack layers - mountain weather can change in minutes',
  'Book popular restaurants at least a week in advance',
  'Many museums offer free admission on certain days',
  'Public transportation is often faster than driving in cities',
  'Stay hydrated while exploring - bring a reusable water bottle'
]

export function RouteGenerationLoading({ progress, destination, agents }: RouteGenerationLoadingProps) {
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

  // Get current agent metadata
  const getCurrentAgentColor = (): string => {
    if (!progress.currentAgent) return '#4B5563'
    const agentKey = agents.find(a =>
      agentMetadata[a]?.name === progress.currentAgent
    )
    return agentKey ? agentMetadata[agentKey].color : '#4B5563'
  }

  const getCurrentAgentDescription = (): string => {
    if (!progress.currentAgent) return 'Preparing your route...'
    const agentKey = agents.find(a =>
      agentMetadata[a]?.name === progress.currentAgent
    )
    return agentKey ? agentMetadata[agentKey].description : 'Processing...'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-xl"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Creating your perfect route to {destination}
        </h2>
        <p className="text-gray-600">
          Our AI agents are crafting the ideal itinerary for you
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {progress.percentComplete}% Complete
          </span>
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-1" />
            {formatTimeRemaining(progress.estimatedTimeRemaining)}
          </div>
        </div>

        <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="absolute top-0 left-0 h-full rounded-full"
            style={{
              backgroundColor: getCurrentAgentColor(),
            }}
            initial={{ width: '0%' }}
            animate={{ width: `${progress.percentComplete}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
          </motion.div>
        </div>
      </div>

      {/* Agent Status Cards */}
      <div className="mb-8 space-y-3">
        {agents.map((agentKey) => {
          const agent = agentMetadata[agentKey]
          if (!agent) return null

          const agentIndex = agents.indexOf(agentKey)
          const isCompleted = progress.completed > agentIndex
          const isCurrent = progress.currentAgent === agent.name

          return (
            <motion.div
              key={agentKey}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: agentIndex * 0.1 }}
              className={`flex items-center p-4 rounded-lg border-2 transition-all ${
                isCompleted
                  ? 'border-green-500 bg-green-50'
                  : isCurrent
                  ? 'border-current bg-white shadow-md'
                  : 'border-gray-200 bg-gray-50'
              }`}
              style={{
                borderColor: isCurrent ? agent.color : undefined,
              }}
            >
              {/* Icon/Status */}
              <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-full mr-4"
                style={{
                  backgroundColor: isCompleted || isCurrent ? agent.color + '20' : '#F3F4F6'
                }}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                  >
                    <Check className="w-6 h-6 text-green-600" strokeWidth={3} />
                  </motion.div>
                ) : isCurrent ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 className="w-6 h-6" style={{ color: agent.color }} />
                  </motion.div>
                ) : (
                  <span className="text-2xl opacity-40">{agent.icon}</span>
                )}
              </div>

              {/* Agent Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold" style={{
                    color: isCompleted || isCurrent ? agent.color : '#6B7280'
                  }}>
                    {agent.icon} {agent.name} Agent
                  </span>
                  {isCompleted && (
                    <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded">
                      Complete
                    </span>
                  )}
                </div>

                {isCurrent && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-gray-600 mt-1"
                  >
                    {getCurrentAgentDescription()}
                  </motion.p>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Fun Facts */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-white text-lg">💡</span>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Travel Tip</h3>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentFactIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-gray-700"
              >
                {travelFacts[currentFactIndex]}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Subtle animation indicator */}
      <div className="mt-6 flex justify-center">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 bg-gray-400 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
