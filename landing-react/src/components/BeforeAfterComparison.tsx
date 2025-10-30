import { motion } from 'framer-motion'
import { X, Check, Clock, Zap } from 'lucide-react'

export function BeforeAfterComparison() {
  const oldWaySteps = [
    "Open 15+ browser tabs for research",
    "Google 'things to do in [city]' for each stop",
    "Manually calculate driving distances",
    "Copy-paste into a messy spreadsheet",
    "Cross-reference hotel prices",
    "Try to figure out optimal route order",
    "Spend hours second-guessing choices"
  ]

  const newWayFeatures = [
    "Enter destination + number of stops",
    "AI researches 100+ sources instantly",
    "4 expert agents create custom routes",
    "Real road distances with Mapbox",
    "Day-by-day itineraries included",
    "Hotels, restaurants, activities planned",
    "Export to GPS or calendar in 1 click"
  ]

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-24">
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
            Stop Wasting Time on Manual Planning
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Most people spend 4-6 hours planning a road trip. We do it in 2 minutes.
          </p>
        </motion.div>

        {/* Comparison Grid */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* The Old Way */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl border-2 border-red-200 bg-white shadow-xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">The Old Way</h3>
                  <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                    <Clock className="h-4 w-4 text-white" />
                    <span className="text-sm font-semibold text-white">4-6 hours</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Messy Visual */}
                <div className="mb-6 rounded-lg bg-gray-100 p-4">
                  <div className="mb-3 space-y-2">
                    <div className="h-8 w-3/4 rounded bg-gray-300" />
                    <div className="h-8 w-5/6 rounded bg-gray-300" />
                    <div className="h-8 w-2/3 rounded bg-gray-300" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="h-16 rounded bg-gray-300" />
                    <div className="h-16 rounded bg-gray-300" />
                    <div className="h-16 rounded bg-gray-300" />
                  </div>
                  <p className="mt-3 text-center text-xs text-gray-500">
                    Multiple tabs, scattered notes, confusion
                  </p>
                </div>

                {/* Steps List */}
                <ul className="space-y-3">
                  {oldWaySteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-100">
                        <X className="h-3 w-3 text-red-600" />
                      </div>
                      <span className="text-sm text-gray-700">{step}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom Badge */}
                <div className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-center">
                  <p className="text-sm font-medium text-red-700">
                    Exhausting, time-consuming, and incomplete
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* The RDTrip Way */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="overflow-hidden rounded-2xl border-2 border-green-200 bg-white shadow-xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">The RDTrip Way</h3>
                  <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                    <Zap className="h-4 w-4 text-white" />
                    <span className="text-sm font-semibold text-white">2 minutes</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Clean Visual */}
                <div className="mb-6 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-green-500" />
                    <div className="flex-1">
                      <div className="mb-1 h-3 w-24 rounded bg-green-200" />
                      <div className="h-2 w-32 rounded bg-green-200" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-green-500" />
                      <div className="h-2 flex-1 rounded bg-green-200" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-green-400" />
                      <div className="h-2 flex-1 rounded bg-green-200" />
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-green-300" />
                      <div className="h-2 flex-1 rounded bg-green-200" />
                    </div>
                  </div>
                  <p className="mt-3 text-center text-xs text-gray-600">
                    One clean view, everything organized
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3">
                  {newWayFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                        <Check className="h-3 w-3 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom Badge */}
                <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-center">
                  <p className="text-sm font-medium text-green-700">
                    Fast, comprehensive, and ready to go
                  </p>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -right-4 -top-4 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-2 shadow-lg">
              <p className="text-sm font-bold text-white">120x Faster!</p>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="mb-4 text-lg text-gray-700">
            <span className="font-bold">Stop copying from browser tabs.</span>
            <span className="ml-2">Let AI do the research for you.</span>
          </p>
          <button
            onClick={() => document.getElementById('route-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-lg bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:bg-slate-800 hover:shadow-2xl"
          >
            Try It Now - It's Free
          </button>
        </motion.div>
      </div>
    </section>
  )
}
