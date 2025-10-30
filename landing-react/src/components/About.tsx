import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export function About() {
  const scrollToForm = () => {
    const formElement = document.getElementById('route-form')
    formElement?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="about" className="relative bg-gradient-to-b from-white to-gray-50 py-24">
      <div className="container mx-auto max-w-4xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Simple CTA */}
          <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
            Ready to Skip the Research?
          </h2>
          <p className="mb-8 text-lg text-gray-600 md:text-xl">
            Start from Aix-en-Provence to any European destination.
            <br />
            Pick your vibe, get your route in 2 minutes.
          </p>

          <motion.button
            onClick={scrollToForm}
            className="group inline-flex items-center gap-2 rounded-lg bg-slate-900 px-8 py-4 text-lg font-semibold text-white shadow-xl transition-all hover:bg-slate-800 hover:shadow-2xl"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            Plan My Trip Now
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </motion.button>

          {/* Subtle note */}
          <p className="mt-8 text-sm text-gray-500">
            Currently available for routes starting from Aix-en-Provence
          </p>
        </motion.div>
      </div>
    </section>
  )
}
