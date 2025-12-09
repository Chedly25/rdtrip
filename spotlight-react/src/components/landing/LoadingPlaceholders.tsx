import { motion } from 'framer-motion'

// Skeleton loading animation
const skeletonVariants = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: 1,
    transition: {
      repeat: Infinity,
      repeatType: "reverse" as const,
      duration: 1
    }
  }
}

// Section Loading Placeholder (for restaurants, hotels, events)
export function SectionLoadingPlaceholder({
  title,
  icon,
  description
}: {
  title: string
  icon: string
  description: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-12 px-6 border-t border-gray-100"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">{icon}</span>
          <h3 className="text-2xl font-bold text-gray-900">{title}</h3>
        </div>

        <div className="text-center py-12">
          <motion.div
            variants={skeletonVariants}
            initial="initial"
            animate="animate"
            className="inline-flex items-center gap-3 px-6 py-4 bg-gray-100 rounded-xl"
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
            <p className="text-gray-600 font-medium">{description}</p>
          </motion.div>

          {/* Skeleton cards preview */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                variants={skeletonVariants}
                initial="initial"
                animate="animate"
                className="bg-gray-100 rounded-xl h-48"
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Restaurants Loading Placeholder
export function RestaurantsLoading() {
  return (
    <SectionLoadingPlaceholder
      title="Best Restaurants"
      icon="🍽️"
      description="Finding the best restaurants for you..."
    />
  )
}

// Hotels Loading Placeholder
export function HotelsLoading() {
  return (
    <SectionLoadingPlaceholder
      title="Where to Stay"
      icon="🏨"
      description="Searching for perfect accommodations..."
    />
  )
}

// Events Loading Placeholder
export function EventsLoading() {
  return (
    <SectionLoadingPlaceholder
      title="Events & Festivals"
      icon="🎉"
      description="Checking out local events and festivals..."
    />
  )
}

// Parking & Zones Loading Placeholder
export function ParkingLoading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-12 px-6 border-t border-gray-100 bg-amber-50"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🚗</span>
          <h3 className="text-2xl font-bold text-gray-900">Parking & Driving</h3>
        </div>

        <div className="text-center py-8">
          <motion.div
            variants={skeletonVariants}
            initial="initial"
            animate="animate"
            className="inline-flex items-center gap-3 px-6 py-4 bg-white rounded-xl shadow-sm"
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
            <p className="text-gray-600 font-medium">Analyzing parking and environmental zones...</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// Tips & Warnings Loading Placeholder
export function TipsLoading() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="py-12 px-6 border-t border-gray-100"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">💡</span>
          <h3 className="text-2xl font-bold text-gray-900">Local Tips</h3>
        </div>

        <div className="text-center py-8">
          <motion.div
            variants={skeletonVariants}
            initial="initial"
            animate="animate"
            className="inline-flex items-center gap-3 px-6 py-4 bg-blue-50 rounded-xl"
          >
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 font-medium">Gathering insider tips from locals...</p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
