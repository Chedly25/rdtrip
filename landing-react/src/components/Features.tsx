import { motion } from 'framer-motion'
import { Brain, Map, Sparkles, Users, Calendar, Shield } from 'lucide-react'

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Planning',
    description: 'Our intelligent algorithms analyze thousands of destinations to create the perfect route tailored to your preferences.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: Map,
    title: 'Optimal Routes',
    description: 'Get the most efficient paths between destinations with smart waypoint suggestions and real-time traffic optimization.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Sparkles,
    title: 'Personalized Experiences',
    description: 'Choose from adventure, culture, food, and hidden gems agents to customize every aspect of your journey.',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Users,
    title: 'Community Insights',
    description: 'Benefit from real traveler experiences and recommendations to discover the best spots at each destination.',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Calendar,
    title: 'Flexible Itineraries',
    description: 'Easily adjust your plans with drag-and-drop functionality, add landmarks, or remove stops on the fly.',
    color: 'from-indigo-500 to-purple-500',
  },
  {
    icon: Shield,
    title: 'Reliable & Secure',
    description: 'Your data is encrypted and stored securely. Plan with confidence knowing your information is protected.',
    color: 'from-pink-500 to-rose-500',
  },
]

export function Features() {
  return (
    <section id="features" className="relative bg-white py-24">
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
            Everything You Need for the
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {' '}
              Perfect Journey
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Powerful features designed to make your road trip planning effortless,
            enjoyable, and unforgettable
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
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
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-lg transition-shadow hover:shadow-2xl"
              >
                {/* Gradient background on hover */}
                <div
                  className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-10"
                  style={{
                    background: `linear-gradient(135deg, ${feature.color.replace('from-', '').replace(' to-', ', ')})`,
                  }}
                />

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
                <p className="relative text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
