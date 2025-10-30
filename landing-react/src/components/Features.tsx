import { motion } from 'framer-motion'
import { Zap, Map, FileText, Download } from 'lucide-react'

const features = [
  {
    icon: Zap,
    title: 'Generated in 2 Minutes',
    description: 'Enter your destination and number of stops. Get 4 complete routes from different AI agents instantly. No more hours on Google Maps.',
    color: 'from-blue-500 to-cyan-500',
    example: 'Example: "Barcelona, 3 stops" → 4 custom routes in 120 seconds'
  },
  {
    icon: Map,
    title: 'Follows Real Roads',
    description: 'Routes use Mapbox Directions API to follow actual highways and roads. Not straight lines - real driveable paths with accurate distances.',
    color: 'from-green-500 to-emerald-500',
    example: 'Same tech as Tesla & Uber - real traffic patterns, actual routes'
  },
  {
    icon: FileText,
    title: 'Day-by-Day Itineraries',
    description: 'Each route includes detailed daily itineraries with hotels, restaurants, landmarks, and activities - researched by Perplexity AI.',
    color: 'from-orange-500 to-red-500',
    example: 'Day 1: Morning in Montpellier, lunch at Place de la Comédie, evening Musée Fabre...'
  },
  {
    icon: Download,
    title: 'Export Everything',
    description: 'Download routes as GPX (for GPS), KML (for Google Earth), or ICS (for Google Calendar). Share links with friends.',
    color: 'from-purple-500 to-pink-500',
    example: 'One-click export to your Garmin, Google Maps, or Apple Calendar'
  },
]

export function Features() {
  return (
    <section id="features" className="relative bg-gray-50 py-24">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            What You Actually Get
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            No fluff. These are the real features that save you time planning your trip.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => {
            const Icon = feature.icon

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-shadow hover:shadow-2xl"
              >
                {/* Icon */}
                <div className="relative mb-4">
                  <div
                    className={`inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="relative mb-3 text-xl font-bold text-gray-900">
                  {feature.title}
                </h3>
                <p className="relative mb-3 text-gray-600 leading-relaxed text-sm">
                  {feature.description}
                </p>

                {/* Example */}
                <div className="relative mt-4 rounded-lg bg-gray-50 px-3 py-2">
                  <p className="text-xs text-gray-500">{feature.example}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
