import { motion } from 'framer-motion'

interface City {
  name: string
  country?: string
  coordinates: [number, number]
  nights?: number
  image?: string
  description?: string
  highlights?: string[]
}

interface CityMarkerProps {
  city: City
  index: number
  isSelected: boolean
  onClick: () => void
}

export function CityMarker({ city, index, isSelected, onClick }: CityMarkerProps) {
  return (
    <motion.button
      onClick={onClick}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: index * 0.1,
        type: 'spring',
        stiffness: 200,
        damping: 15
      }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.95 }}
      className={`
        relative flex items-center justify-center
        w-10 h-10 rounded-full
        font-bold text-sm
        transition-all duration-200
        ${
          isSelected
            ? 'bg-gray-900 text-white shadow-xl scale-110'
            : 'bg-white text-gray-900 border-3 border-gray-900 shadow-lg hover:shadow-xl'
        }
      `}
      style={{
        cursor: 'pointer',
        zIndex: isSelected ? 20 : 10
      }}
    >
      {index}

      {/* Pulse animation for selected */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-full bg-gray-900"
          initial={{ scale: 1, opacity: 0.5 }}
          animate={{ scale: 1.8, opacity: 0 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeOut'
          }}
        />
      )}

      {/* City label on hover */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileHover={{ opacity: 1, y: 0 }}
        className="absolute top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap shadow-lg pointer-events-none"
      >
        {city.name}
        <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
      </motion.div>
    </motion.button>
  )
}
