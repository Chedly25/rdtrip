import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const destinations = [
  {
    name: 'European Adventure',
    route: 'Paris → Lyon → Geneva → Milan',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop',
    stops: 8,
    days: 12,
    gradient: 'from-blue-600 to-purple-600',
  },
  {
    name: 'Mediterranean Coast',
    route: 'Barcelona → Valencia → Málaga',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=800&h=600&fit=crop',
    stops: 6,
    days: 9,
    gradient: 'from-orange-500 to-pink-500',
  },
  {
    name: 'Alpine Explorer',
    route: 'Munich → Innsbruck → Zurich',
    image: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&h=600&fit=crop',
    stops: 5,
    days: 7,
    gradient: 'from-green-500 to-teal-500',
  },
]

export function Showcase() {
  const scrollToForm = () => {
    const formElement = document.getElementById('route-form')
    formElement?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative bg-gradient-to-b from-white to-gray-50 py-24">
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
            Popular{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Route Ideas
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Get inspired by these amazing journeys created by our community
          </p>
        </motion.div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative overflow-hidden rounded-2xl shadow-xl transition-all hover:shadow-2xl"
            >
              {/* Image */}
              <div className="relative h-80 overflow-hidden">
                <img
                  src={destination.image}
                  alt={destination.name}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                {/* Gradient Overlay */}
                <div
                  className={`absolute inset-0 bg-gradient-to-t ${destination.gradient} opacity-60`}
                />

                {/* Content Overlay */}
                <div className="absolute inset-0 flex flex-col justify-end p-6 text-white">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  >
                    <h3 className="mb-2 text-2xl font-bold">
                      {destination.name}
                    </h3>
                    <p className="mb-4 text-sm font-medium text-white/90">
                      {destination.route}
                    </p>

                    {/* Stats */}
                    <div className="mb-4 flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{destination.stops}</span>
                        <span className="text-white/80">stops</span>
                      </div>
                      <div className="h-1 w-1 rounded-full bg-white/60" />
                      <div className="flex items-center gap-1">
                        <span className="font-semibold">{destination.days}</span>
                        <span className="text-white/80">days</span>
                      </div>
                    </div>

                    {/* Button */}
                    <button
                      onClick={scrollToForm}
                      className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm font-semibold backdrop-blur-sm transition-all hover:bg-white/30"
                    >
                      Create Similar Route
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="mb-4 text-gray-600">
            Ready to create your own custom route?
          </p>
          <motion.button
            onClick={scrollToForm}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Planning Your Journey
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </motion.div>
      </div>
    </section>
  )
}
