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

        {/* Comparison Grid - Perfectly Aligned */}
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          {/* The Old Way */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative flex"
          >
            <div className="flex w-full flex-col overflow-hidden rounded-2xl border-2 border-gray-300 bg-white shadow-xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">The Old Way</h3>
                  <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                    <Clock className="h-4 w-4 text-white" />
                    <span className="text-sm font-semibold text-white">4-6 hours</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-6">
                {/* Browser Mockup - Multiple Chaotic Tabs */}
                <div className="mb-6 overflow-hidden rounded-lg border-2 border-gray-300 bg-white shadow-sm">
                  {/* Browser Chrome */}
                  <div className="border-b border-gray-300 bg-gray-100 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                      </div>
                      <div className="ml-2 flex-1 text-[10px] text-gray-500">browser tabs...</div>
                    </div>
                  </div>

                  {/* Tab Bar - Messy */}
                  <div className="flex overflow-x-auto border-b border-gray-300 bg-gray-50">
                    <div className="flex min-w-max gap-0.5 px-1 py-1">
                      <div className="rounded-t bg-white px-2 py-1 text-[9px] text-gray-700 shadow-sm">Google Maps</div>
                      <div className="rounded-t bg-gray-200 px-2 py-1 text-[9px] text-gray-600">TripAdvisor</div>
                      <div className="rounded-t bg-gray-200 px-2 py-1 text-[9px] text-gray-600">Airbnb</div>
                      <div className="rounded-t bg-gray-200 px-2 py-1 text-[9px] text-gray-600">Booking.com</div>
                      <div className="rounded-t bg-gray-200 px-2 py-1 text-[9px] text-gray-600">Excel Sheet</div>
                      <div className="rounded-t bg-gray-200 px-2 py-1 text-[9px] text-gray-600">Google: things...</div>
                      <div className="rounded-t bg-gray-200 px-2 py-1 text-[9px] text-gray-600">+8 more</div>
                    </div>
                  </div>

                  {/* Content Area - Messy Interface */}
                  <div className="bg-white p-3">
                    <div className="mb-2 space-y-1.5">
                      <div className="h-4 w-3/4 rounded bg-gray-200" />
                      <div className="h-4 w-5/6 rounded bg-gray-200" />
                      <div className="h-4 w-2/3 rounded bg-gray-200" />
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="h-12 rounded bg-gray-200" />
                      <div className="h-12 rounded bg-gray-200" />
                      <div className="h-12 rounded bg-gray-200" />
                    </div>
                  </div>

                  <p className="border-t border-gray-200 bg-gray-50 py-2 text-center text-[10px] text-gray-500">
                    Multiple tabs, scattered notes, confusion
                  </p>
                </div>

                {/* Steps List */}
                <ul className="space-y-3">
                  {oldWaySteps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-gray-200">
                        <X className="h-3 w-3 text-gray-600" />
                      </div>
                      <span className="text-sm text-gray-700">{step}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom Badge */}
                <div className="mt-auto pt-6">
                  <div className="rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-center">
                    <p className="text-sm font-medium text-gray-700">
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
            <div className="flex w-full flex-col overflow-hidden rounded-2xl border-2 border-teal-200 bg-white shadow-xl">
              {/* Header */}
              <div className="bg-gradient-to-r from-teal-700 to-teal-800 px-6 py-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">The RDTrip Way</h3>
                  <div className="flex items-center gap-2 rounded-full bg-white/20 px-3 py-1">
                    <Zap className="h-4 w-4 text-white" />
                    <span className="text-sm font-semibold text-white">2 minutes</span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-6">
                {/* App Mockup - Clean Single Interface */}
                <div className="mb-6 overflow-hidden rounded-lg border-2 border-teal-200 bg-white shadow-sm">
                  {/* App Chrome */}
                  <div className="border-b border-teal-200 bg-gradient-to-r from-teal-50 to-emerald-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                      </div>
                      <div className="ml-2 flex-1 text-[10px] font-medium text-teal-800">rdtrip.com</div>
                    </div>
                  </div>

                  {/* Single Clean Tab */}
                  <div className="border-b border-teal-100 bg-teal-50/50 px-2 py-1">
                    <div className="inline-block rounded-t bg-white px-3 py-1 text-[9px] font-semibold text-teal-800 shadow-sm">
                      Your Complete Route
                    </div>
                  </div>

                  {/* Content Area - Organized with Agent Icons */}
                  <div className="bg-gradient-to-br from-white to-teal-50/30 p-3">
                    {/* Route Header with All Agents */}
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-white p-2 shadow-sm">
                      <div className="flex -space-x-1.5">
                        <img src="/images/icons/adventure_icon.png" alt="" className="h-6 w-6 rounded-full border-2 border-white shadow-sm" />
                        <img src="/images/icons/culture_icon.png" alt="" className="h-6 w-6 rounded-full border-2 border-white shadow-sm" />
                        <img src="/images/icons/food_icon.png" alt="" className="h-6 w-6 rounded-full border-2 border-white shadow-sm" />
                        <img src="/images/icons/hidden_gem_icon.png" alt="" className="h-6 w-6 rounded-full border-2 border-white shadow-sm" />
                      </div>
                      <div className="flex-1">
                        <div className="mb-0.5 h-2 w-24 rounded bg-teal-100" />
                        <div className="h-1.5 w-32 rounded bg-teal-50" />
                      </div>
                    </div>

                    {/* Route Items with Color Coding */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 rounded bg-white p-1.5 shadow-sm">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-green-800" />
                        <div className="h-1.5 flex-1 rounded bg-teal-100" />
                      </div>
                      <div className="flex items-center gap-2 rounded bg-white p-1.5 shadow-sm">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-yellow-600" />
                        <div className="h-1.5 flex-1 rounded bg-teal-100" />
                      </div>
                      <div className="flex items-center gap-2 rounded bg-white p-1.5 shadow-sm">
                        <div className="h-5 w-5 flex-shrink-0 rounded-full bg-red-900" />
                        <div className="h-1.5 flex-1 rounded bg-teal-100" />
                      </div>
                    </div>
                  </div>

                  <p className="border-t border-teal-100 bg-teal-50/50 py-2 text-center text-[10px] font-medium text-teal-800">
                    One clean view, everything organized
                  </p>
                </div>

                {/* Features List */}
                <ul className="space-y-3">
                  {newWayFeatures.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-teal-100">
                        <Check className="h-3 w-3 text-teal-700" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Bottom Badge */}
                <div className="mt-auto pt-6">
                  <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-center">
                    <p className="text-sm font-medium text-teal-800">
                      Fast, comprehensive, and ready to go
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Badge */}
            <div className="absolute -right-4 -top-4 rounded-full bg-gradient-to-r from-teal-700 to-teal-800 px-4 py-2 shadow-lg">
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
