import { motion } from 'framer-motion'
import { UtensilsCrossed, Mountain, Compass } from 'lucide-react'

interface Landmark {
  name: string
  type: 'restaurant' | 'activity' | 'scenic'
  coordinates: [number, number]
  image?: string
  description?: string
}

interface LandmarkMarkerProps {
  landmark: Landmark
}

const landmarkConfig = {
  restaurant: {
    icon: UtensilsCrossed,
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-500',
    iconColor: 'text-orange-600'
  },
  activity: {
    icon: Mountain,
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-500',
    iconColor: 'text-blue-600'
  },
  scenic: {
    icon: Compass,
    bgColor: 'bg-green-100',
    borderColor: 'border-green-500',
    iconColor: 'text-green-600'
  }
}

export function LandmarkMarker({ landmark }: LandmarkMarkerProps) {
  const config = landmarkConfig[landmark.type]
  const Icon = config.icon

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        type: 'spring',
        stiffness: 200,
        damping: 15
      }}
      whileHover={{ scale: 1.2 }}
      className={`
        relative flex items-center justify-center
        w-8 h-8 rounded-lg
        border-2 ${config.borderColor} ${config.bgColor}
        shadow-md hover:shadow-lg
        transition-all duration-200
        cursor-pointer
      `}
    >
      <Icon className={`w-4 h-4 ${config.iconColor}`} strokeWidth={2.5} />

      {/* Landmark name tooltip on hover */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute top-10 left-1/2 -translate-x-1/2 px-2.5 py-1 bg-gray-900 text-white text-xs font-medium rounded-md whitespace-nowrap shadow-lg pointer-events-none z-50"
      >
        {landmark.name}
        <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gray-900 rotate-45" />
      </motion.div>
    </motion.div>
  )
}
