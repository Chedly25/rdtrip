import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

export function About() {
  const scrollToForm = () => {
    const formElement = document.getElementById('route-form')
    formElement?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section id="about" className="relative bg-rui-grey-2 py-24">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: ruiEasing }}
          className="text-center"
        >
          {/* Simple CTA */}
          <h2 className="mb-4 font-marketing text-display-2 text-rui-black md:text-display-1">
            Ready to Skip the Research?
          </h2>
          <p className="mb-8 text-body-1 text-rui-grey-50 md:text-lg">
            Start from Aix-en-Provence to any European destination.
            <br />
            Pick your vibe, get your route in 2 minutes.
          </p>

          <motion.button
            onClick={scrollToForm}
            className="group relative inline-flex items-center gap-3 rounded-full bg-rui-black px-8 py-4 text-base font-semibold text-rui-white overflow-hidden transition-all duration-rui-sm ease-rui-default hover:shadow-rui-3 active:scale-[0.98]"
            whileTap={{ scale: 0.98 }}
          >
            {/* State layer */}
            <span className="absolute inset-0 bg-white opacity-0 transition-opacity duration-rui-sm group-hover:opacity-10" />
            <span className="relative">Plan My Trip Now</span>
            <ArrowRight className="relative h-5 w-5 transition-transform duration-rui-sm group-hover:translate-x-1" />
          </motion.button>

          {/* Subtle note */}
          <p className="mt-8 text-sm text-rui-grey-50">
            Currently available for routes starting from Aix-en-Provence
          </p>
        </motion.div>
      </div>
    </section>
  )
}
