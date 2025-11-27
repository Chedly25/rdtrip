import { motion } from 'framer-motion'
import { X, Check, Clock, Zap, MapPin, ArrowRight } from 'lucide-react'

export function BeforeAfterComparison() {
  const oldWaySteps = [
    "Open 15+ browser tabs for research",
    "Google 'things to do in [city]' for each stop",
    "Manually calculate driving distances",
    "Copy-paste into a messy spreadsheet",
    "Spend hours second-guessing choices"
  ]

  const newWayFeatures = [
    "Enter origin, destination & preferences",
    "AI researches 100+ sources instantly",
    "Get optimized route with real distances",
    "Day-by-day itinerary with activities",
    "Export to GPS or calendar in 1 click"
  ]

  // Sample route for the mockup
  const sampleRoute = [
    { city: "Paris", nights: 2, type: "origin" },
    { city: "Lyon", nights: 1, type: "waypoint" },
    { city: "Nice", nights: 2, type: "waypoint" },
    { city: "Monaco", nights: 0, type: "destination" }
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
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          {/* The Old Way */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative flex"
          >
            <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">The Old Way</h3>
                  <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5">
                    <Clock className="h-4 w-4 text-white/90" />
                    <span className="text-sm font-medium text-white/90">4-6 hours</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-6">
                {/* Browser Mockup */}
                <div className="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                  {/* Browser Chrome */}
                  <div className="border-b border-gray-200 bg-gray-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                      </div>
                      <div className="ml-2 flex-1 text-[10px] text-gray-400">15 tabs open...</div>
                    </div>
                  </div>

                  {/* Tab Bar - Messy */}
                  <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50">
                    <div className="flex min-w-max gap-0.5 px-1 py-1">
                      <div className="rounded-t bg-white px-2 py-1 text-[9px] font-medium text-gray-700 shadow-sm">Google Maps</div>
                      <div className="rounded-t bg-gray-200/80 px-2 py-1 text-[9px] text-gray-500">TripAdvisor</div>
                      <div className="rounded-t bg-gray-200/80 px-2 py-1 text-[9px] text-gray-500">Airbnb</div>
                      <div className="rounded-t bg-gray-200/80 px-2 py-1 text-[9px] text-gray-500">Booking</div>
                      <div className="rounded-t bg-gray-200/80 px-2 py-1 text-[9px] text-gray-500">Excel</div>
                      <div className="rounded-t bg-gray-200/80 px-2 py-1 text-[9px] text-gray-500">+10 more</div>
                    </div>
                  </div>

                  {/* Content Area - Chaotic */}
                  <div className="bg-white p-3">
                    <div className="mb-2 space-y-1.5">
                      <div className="h-3 w-3/4 rounded bg-gray-100" />
                      <div className="h-3 w-5/6 rounded bg-gray-100" />
                      <div className="h-3 w-2/3 rounded bg-gray-100" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="h-10 rounded bg-gray-100" />
                      <div className="h-10 rounded bg-gray-100" />
                      <div className="h-10 rounded bg-gray-100" />
                    </div>
                  </div>

                  <p className="border-t border-gray-100 bg-gray-50 py-2 text-center text-[10px] text-gray-400">
                    Multiple tabs, scattered notes, confusion
                  </p>
                </div>

                {/* Steps List */}
                <ul className="space-y-3">
                  {oldWaySteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
                        <X className="h-3 w-3 text-gray-400" />
                      </div>
                      <span className="text-sm text-gray-600">{step}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom Badge */}
                <div className="mt-auto pt-6">
                  <div className="rounded-xl bg-gray-50 px-4 py-3 text-center">
                    <p className="text-sm text-gray-500">
                      Exhausting, time-consuming, and incomplete
                    </p>
                  </div>
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
            className="relative flex"
          >
            <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-teal-200 bg-white shadow-lg">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">The RDTrip Way</h3>
                  <div className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5">
                    <Zap className="h-4 w-4 text-white/90" />
                    <span className="text-sm font-medium text-white/90">2 minutes</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-6">
                {/* App Mockup - Clean Route View */}
                <div className="mb-6 overflow-hidden rounded-xl border border-teal-100 bg-white shadow-sm">
                  {/* App Chrome */}
                  <div className="border-b border-teal-100 bg-gradient-to-r from-teal-50 to-emerald-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                      </div>
                      <div className="ml-2 flex-1 text-[10px] font-medium text-teal-700">rdtrip.com</div>
                    </div>
                  </div>

                  {/* Route Preview - Realistic */}
                  <div className="bg-gradient-to-br from-white to-teal-50/30 p-4">
                    {/* Route Header */}
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-teal-800">
                        <span>Paris</span>
                        <ArrowRight className="h-3 w-3 text-teal-400" />
                        <span>Monaco</span>
                      </div>
                      <span className="text-[10px] text-teal-600">5 nights • 3 stops</span>
                    </div>

                    {/* Route Cities - Clear visual */}
                    <div className="space-y-2">
                      {sampleRoute.map((stop, index) => (
                        <div key={index} className="flex items-center gap-3">
                          {/* Connection line & dot */}
                          <div className="flex flex-col items-center">
                            <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                              stop.type === 'origin' ? 'border-teal-500 bg-teal-500' :
                              stop.type === 'destination' ? 'border-teal-500 bg-teal-500' :
                              'border-teal-300 bg-white'
                            }`}>
                              {(stop.type === 'origin' || stop.type === 'destination') && (
                                <MapPin className="h-2 w-2 text-white" />
                              )}
                            </div>
                            {index < sampleRoute.length - 1 && (
                              <div className="h-4 w-0.5 bg-teal-200" />
                            )}
                          </div>

                          {/* City info */}
                          <div className="flex flex-1 items-center justify-between rounded-lg bg-white px-2.5 py-1.5 shadow-sm">
                            <span className="text-[11px] font-medium text-gray-800">{stop.city}</span>
                            {stop.nights > 0 && (
                              <span className="text-[10px] text-teal-600">{stop.nights} nights</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <p className="border-t border-teal-100 bg-teal-50/50 py-2 text-center text-[10px] font-medium text-teal-700">
                    Complete route with activities & hotels
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3">
                  {newWayFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                        <Check className="h-3 w-3 text-teal-600" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom Badge */}
                <div className="mt-auto pt-6">
                  <div className="rounded-xl bg-teal-50 px-4 py-3 text-center">
                    <p className="text-sm font-medium text-teal-700">
                      Fast, comprehensive, and ready to go
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subtle Speed Badge - Smaller */}
            <div className="absolute -right-2 -top-2 rounded-full bg-teal-600 px-3 py-1 shadow-md">
              <p className="text-xs font-semibold text-white">120x faster</p>
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
            <span className="font-semibold">Stop copying from browser tabs.</span>
            <span className="ml-2 text-gray-500">Let AI do the research for you.</span>
          </p>
          <button
            onClick={() => document.getElementById('route-form')?.scrollIntoView({ behavior: 'smooth' })}
            className="rounded-xl bg-gray-900 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl"
          >
            Try It Now - It's Free
          </button>
        </motion.div>
      </div>
    </section>
  )
}
