import { motion } from 'framer-motion'
import { Zap, Map, FileText, Download } from 'lucide-react'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

const features = [
  {
    icon: Zap,
    title: 'Generated in 2 Minutes',
    description: 'Enter your destination and number of stops. Get 4 complete routes from different AI agents instantly.',
    color: '#4F55F1',
    example: '"Barcelona, 3 stops" → 4 custom routes in 120 seconds'
  },
  {
    icon: Map,
    title: 'Follows Real Roads',
    description: 'Routes use Mapbox Directions API to follow actual highways and roads with accurate distances.',
    color: '#09BE67',
    example: 'Same tech as Tesla & Uber - real traffic patterns'
  },
  {
    icon: FileText,
    title: 'Day-by-Day Itineraries',
    description: 'Each route includes detailed daily itineraries with hotels, restaurants, and activities.',
    color: '#EE7A40',
    example: 'Day 1: Morning in Montpellier, lunch at Place de la Comédie...'
  },
  {
    icon: Download,
    title: 'Export Everything',
    description: 'Download routes as GPX (for GPS), KML (for Google Earth), or ICS (for Calendar).',
    color: '#805CF5',
    example: 'One-click export to Garmin, Google Maps, or Apple Calendar'
  },
]

// Container animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
}

// Card animation
const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: ruiEasing
    }
  }
}

export function Features() {
  return (
    <section id="features" className="relative bg-rui-grey-2 py-24 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-rui-accent/5 to-transparent rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-success/5 to-transparent rounded-full translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: ruiEasing }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-marketing text-[2rem] sm:text-[2.5rem] md:text-[3rem] font-extrabold text-rui-black tracking-[-0.02em]">
            What You Actually Get
          </h2>
          <p className="mx-auto max-w-xl text-lg text-rui-grey-50">
            No fluff. These are the real features that save you time planning your trip.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-50px' }}
        >
          {features.map((feature) => {
            const Icon = feature.icon

            return (
              <motion.div
                key={feature.title}
                variants={cardVariants}
                className="group"
              >
                <motion.div
                  className="relative h-full overflow-hidden rounded-rui-24 bg-rui-white p-6"
                  initial={{ boxShadow: '0 0.125rem 0.1875rem rgba(25, 28, 31, 0.05)' }}
                  whileHover={{
                    y: -12,
                    scale: 1.02,
                    boxShadow: '0 1rem 4rem rgba(25, 28, 31, 0.15)'
                  }}
                  transition={{ duration: 0.4, ease: ruiEasing }}
                >
                  {/* Hover gradient background */}
                  <motion.div
                    className="absolute inset-0 opacity-0"
                    style={{
                      background: `linear-gradient(135deg, ${feature.color}08, ${feature.color}03)`
                    }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />

                  {/* Icon */}
                  <motion.div
                    className="relative mb-5"
                    whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 0.4 }}
                  >
                    <motion.div
                      className="inline-flex h-14 w-14 items-center justify-center rounded-rui-16"
                      style={{ backgroundColor: `${feature.color}12` }}
                      whileHover={{ backgroundColor: `${feature.color}20` }}
                    >
                      <Icon
                        className="h-7 w-7"
                        style={{ color: feature.color }}
                      />
                    </motion.div>
                  </motion.div>

                  {/* Content */}
                  <motion.h3
                    className="relative mb-3 text-xl font-bold text-rui-black"
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    {feature.title}
                  </motion.h3>
                  <p className="relative mb-5 text-sm text-rui-grey-50 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Example */}
                  <motion.div
                    className="relative rounded-rui-12 bg-rui-grey-2 px-4 py-3"
                    whileHover={{ backgroundColor: `${feature.color}08` }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-xs text-rui-grey-50 italic">{feature.example}</p>
                  </motion.div>

                  {/* Hover accent line */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1"
                    style={{ backgroundColor: feature.color }}
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3, ease: ruiEasing }}
                  />
                </motion.div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
