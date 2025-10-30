import { motion } from 'framer-motion'
import { MapPin, Clock, TrendingUp, ArrowRight } from 'lucide-react'
import { destinations, getAgentColor, getAgentIcon } from '../data/destinations'
import { useFormStore } from '../stores/formStore'

export function DestinationShowcase() {
  const { setDestination, setStops } = useFormStore()

  const handleCardClick = (destName: string, stops: number) => {
    // Pre-fill the form
    setDestination(destName)
    setStops(stops)

    // Smooth scroll to form
    setTimeout(() => {
      const formElement = document.getElementById('route-form')
      formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-gray-50 to-white py-24">
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
            Popular Destinations from Aix-en-Provence
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Not sure where to go? Start with one of these favorites. Click any destination to pre-fill your route.
          </p>
        </motion.div>

        {/* Destinations Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {destinations.map((destination, index) => (
            <motion.div
              key={destination.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative cursor-pointer"
              onClick={() => handleCardClick(destination.name, destination.recommendedStops)}
            >
              <div className="overflow-hidden rounded-2xl bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
                {/* Image Section */}
                <div className="relative h-56 overflow-hidden">
                  {/* Image with fallback gradient */}
                  <div
                    className="absolute inset-0 bg-gradient-to-br"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${destination.imageFallback}dd, ${destination.imageFallback})`
                    }}
                  >
                    <img
                      src={destination.imageUrl}
                      alt={destination.name}
                      className="h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-110"
                      onError={(e) => {
                        // Hide image on error, show gradient instead
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                  {/* Flag and country */}
                  <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 backdrop-blur-sm">
                    <span className="text-xl">{destination.flag}</span>
                    <span className="text-sm font-semibold text-gray-900">{destination.country}</span>
                  </div>

                  {/* Drive time badge */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 backdrop-blur-sm">
                    <Clock className="h-4 w-4 text-white" />
                    <span className="text-sm font-semibold text-white">{destination.driveTime}</span>
                  </div>

                  {/* City name overlay */}
                  <div className="absolute bottom-4 left-4">
                    <h3 className="text-3xl font-bold text-white drop-shadow-lg">
                      {destination.name}
                    </h3>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6">
                  {/* Pitch */}
                  <p className="mb-4 text-sm font-medium text-gray-700 leading-relaxed">
                    {destination.pitch}
                  </p>

                  {/* Stats Row */}
                  <div className="mb-4 flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>{destination.distance} km</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4" />
                      <span>{destination.recommendedStops} stops</span>
                    </div>
                  </div>

                  {/* Best For Agents */}
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Best For
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {destination.bestFor.map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium"
                          style={{
                            backgroundColor: `${getAgentColor(item.agent)}20`,
                            color: getAgentColor(item.agent)
                          }}
                        >
                          <span>{getAgentIcon(item.agent)}</span>
                          <span className="capitalize">{item.agent.replace('-', ' ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Highlights */}
                  <div className="mb-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Highlights
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {destination.highlights.slice(0, 3).map((highlight, i) => (
                        <span
                          key={i}
                          className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <button
                    className="group/btn mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 font-semibold text-white transition-all hover:bg-slate-800"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCardClick(destination.name, destination.recommendedStops)
                    }}
                  >
                    <span>Plan Route to {destination.name}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <p className="text-gray-600">
            Don't see your destination?{' '}
            <button
              onClick={() => {
                const formElement = document.getElementById('route-form')
                formElement?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="font-semibold text-slate-900 underline decoration-2 underline-offset-4 transition-colors hover:text-slate-700"
            >
              Enter any European city
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
