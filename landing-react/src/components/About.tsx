import { motion } from 'framer-motion'
import { Check, MapPin, Route, Star } from 'lucide-react'

const stats = [
  { value: '10K+', label: 'Routes Created', icon: Route },
  { value: '50+', label: 'Countries Covered', icon: MapPin },
  { value: '4.9', label: 'Average Rating', icon: Star },
]

const benefits = [
  'Save hours of research time with AI-powered recommendations',
  'Discover hidden gems and local favorites off the beaten path',
  'Get personalized suggestions based on your travel style',
  'Optimize your route for efficiency and maximum enjoyment',
  'Access real-time updates and community insights',
  'Plan with confidence using trusted travel data',
]

export function About() {
  return (
    <section id="about" className="relative bg-gradient-to-b from-gray-50 to-white py-24">
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
            Why Choose{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              RoadTrip
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            The most intelligent way to plan your perfect road trip adventure
          </p>
        </motion.div>

        {/* Stats */}
        <div className="mb-20 grid grid-cols-1 gap-8 md:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon

            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-2xl bg-white p-8 text-center shadow-lg"
              >
                <div className="mb-4 flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="mb-2 text-4xl font-bold text-gray-900">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            )
          })}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&h=600&fit=crop"
                alt="Road trip planning"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Floating card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="absolute -bottom-6 -right-6 rounded-xl bg-white p-6 shadow-2xl"
            >
              <div className="mb-2 text-sm font-semibold text-gray-600">
                Next Adventure
              </div>
              <div className="mb-1 text-2xl font-bold text-gray-900">
                Paris → Barcelona
              </div>
              <div className="text-sm text-gray-500">5 amazing stops</div>
            </motion.div>
          </motion.div>

          {/* Right: Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <h3 className="mb-6 text-3xl font-bold text-gray-900">
              Plan Smarter, Travel Better
            </h3>
            <p className="mb-8 text-lg text-gray-600">
              Our AI-powered platform transforms the way you plan road trips.
              Say goodbye to endless research and hello to perfectly crafted
              itineraries that match your travel style.
            </p>

            <div className="space-y-4">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500">
                    <Check className="h-4 w-4 text-white" strokeWidth={3} />
                  </div>
                  <p className="text-gray-700">{benefit}</p>
                </motion.div>
              ))}
            </div>

            <motion.button
              onClick={() => {
                const formElement = document.getElementById('route-form')
                formElement?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-4 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Planning Now
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
