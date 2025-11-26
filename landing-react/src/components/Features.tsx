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

export function Features() {
  return (
    <section id="features" className="relative bg-rui-grey-2 py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: ruiEasing }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-marketing text-display-2 text-rui-black md:text-display-1">
            What You Actually Get
          </h2>
          <p className="mx-auto max-w-xl text-body-1 text-rui-grey-50">
            No fluff. These are the real features that save you time planning your trip.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: ruiEasing }}
                className="group"
              >
                <div className="h-full overflow-hidden rounded-rui-24 bg-rui-white p-6 shadow-rui-1 transition-all duration-rui-sm ease-rui-default hover:shadow-rui-3 hover:-translate-y-1">
                  {/* Icon */}
                  <div className="mb-5">
                    <div
                      className="inline-flex h-12 w-12 items-center justify-center rounded-rui-12"
                      style={{ backgroundColor: `${feature.color}15` }}
                    >
                      <Icon
                        className="h-6 w-6"
                        style={{ color: feature.color }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <h3 className="mb-2 text-heading-3 text-rui-black">
                    {feature.title}
                  </h3>
                  <p className="mb-4 text-body-2 text-rui-grey-50 leading-relaxed">
                    {feature.description}
                  </p>

                  {/* Example */}
                  <div className="rounded-rui-8 bg-rui-grey-2 px-3 py-2">
                    <p className="text-xs text-rui-grey-50">{feature.example}</p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
