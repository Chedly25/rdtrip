import { motion } from 'framer-motion'
import { useState } from 'react'
import { Search, MapPin, Calendar, Sparkles, CheckCircle, Route, ArrowRight } from 'lucide-react'

const ruiEasing = [0.15, 0.5, 0.5, 1] as const

const workflowSteps = [
  {
    id: 'research',
    name: 'Research',
    icon: Search,
    color: '#4F55F1',
    description: 'AI analyzes the corridor between your origin and destination',
    details: [
      'Identifies key regions and routes',
      'Considers seasonal factors',
      'Maps driving distances'
    ]
  },
  {
    id: 'discovery',
    name: 'Discovery',
    icon: MapPin,
    color: '#09BE67',
    description: 'Finds the perfect stops based on YOUR specific interests',
    details: [
      'Weighted by your priorities',
      'Considers travel companions',
      'Respects your constraints'
    ]
  },
  {
    id: 'planning',
    name: 'Planning',
    icon: Calendar,
    color: '#EE7A40',
    description: 'Creates the optimal route order and night allocations',
    details: [
      'Optimizes driving distances',
      'Balances activity time',
      'Matches your pace preference'
    ]
  },
  {
    id: 'enrichment',
    name: 'Enrichment',
    icon: Sparkles,
    color: '#805CF5',
    description: 'Adds detailed activities, restaurants, and hotels',
    details: [
      'Hand-picked recommendations',
      'Budget-appropriate options',
      'Local favorites included'
    ]
  },
  {
    id: 'validation',
    name: 'Validation',
    icon: CheckCircle,
    color: '#00BE90',
    description: 'Verifies everything is feasible and high-quality',
    details: [
      'Checks opening hours',
      'Validates drive times',
      'Ensures budget alignment'
    ]
  },
  {
    id: 'optimization',
    name: 'Optimization',
    icon: Route,
    color: '#191C1F',
    description: 'Final refinements for your perfect trip',
    details: [
      'Reorders for efficiency',
      'Adds alternatives',
      'Generates your itinerary'
    ]
  }
]

export function WorkflowShowcase() {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null)

  return (
    <section className="relative overflow-hidden bg-rui-white py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: ruiEasing }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 font-marketing text-[2rem] sm:text-[2.5rem] md:text-[3rem] font-extrabold text-rui-black tracking-[-0.02em]">
            Intelligent Route Planning
          </h2>
          <p className="mx-auto max-w-xl text-lg text-rui-grey-50">
            Our AI doesn't just pick random stops. It runs a sophisticated 6-phase workflow to create YOUR perfect route.
          </p>
        </motion.div>

        {/* Workflow Steps - Desktop */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Connection Line - positioned through icon centers */}
            <div className="absolute top-8 left-0 right-0 h-0.5 bg-rui-grey-10 z-0" />

            {/* Steps */}
            <div className="relative z-10 grid grid-cols-6 gap-4">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon
                const isHovered = hoveredStep === step.id

                return (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: ruiEasing }}
                    onMouseEnter={() => setHoveredStep(step.id)}
                    onMouseLeave={() => setHoveredStep(null)}
                    className="relative"
                  >
                    {/* Step Card */}
                    <motion.div
                      className="relative flex flex-col items-center"
                      animate={{ y: isHovered ? -8 : 0 }}
                      transition={{ duration: 0.3, ease: ruiEasing }}
                    >
                      {/* Icon Circle */}
                      <motion.div
                        className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rui-white shadow-rui-2 border-2 transition-colors duration-300"
                        style={{ borderColor: isHovered ? step.color : '#E2E2E7' }}
                        animate={{
                          scale: isHovered ? 1.1 : 1,
                          boxShadow: isHovered
                            ? '0 0.5rem 2rem rgba(25, 28, 31, 0.15)'
                            : '0 0.125rem 0.1875rem rgba(25, 28, 31, 0.05)'
                        }}
                      >
                        <Icon
                          className="h-7 w-7 transition-colors duration-300"
                          style={{ color: isHovered ? step.color : '#8A8F98' }}
                        />
                      </motion.div>

                      {/* Step Number */}
                      <div
                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                        style={{ backgroundColor: step.color }}
                      >
                        {index + 1}
                      </div>

                      {/* Name */}
                      <h3 className="mb-2 text-sm font-bold text-rui-black text-center">
                        {step.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-rui-grey-50 text-center leading-relaxed px-2">
                        {step.description}
                      </p>

                      {/* Expanded Details on Hover */}
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{
                          opacity: isHovered ? 1 : 0,
                          height: isHovered ? 'auto' : 0
                        }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 overflow-hidden"
                      >
                        <ul className="space-y-1">
                          {step.details.map((detail, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-1.5 text-xs text-rui-grey-50"
                            >
                              <span
                                className="h-1 w-1 rounded-full flex-shrink-0"
                                style={{ backgroundColor: step.color }}
                              />
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    </motion.div>

                    {/* Arrow to next step */}
                    {index < workflowSteps.length - 1 && (
                      <div className="absolute top-8 -right-2 z-20">
                        <ArrowRight className="h-4 w-4 text-rui-grey-20" />
                      </div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Workflow Steps - Mobile */}
        <div className="lg:hidden space-y-4">
          {workflowSteps.map((step, index) => {
            const Icon = step.icon

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.08, ease: ruiEasing }}
                className="flex gap-4 p-4 rounded-rui-16 bg-rui-grey-2"
              >
                {/* Icon */}
                <div
                  className="flex-shrink-0 flex h-12 w-12 items-center justify-center rounded-rui-12"
                  style={{ backgroundColor: `${step.color}15` }}
                >
                  <Icon className="h-6 w-6" style={{ color: step.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white"
                      style={{ backgroundColor: step.color }}
                    >
                      {index + 1}
                    </span>
                    <h3 className="font-bold text-rui-black">{step.name}</h3>
                  </div>
                  <p className="text-sm text-rui-grey-50">{step.description}</p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4, ease: ruiEasing }}
          className="mt-16 text-center"
        >
          <p className="text-lg text-rui-black mb-2">
            All in under 30 seconds.
          </p>
          <p className="text-rui-grey-50">
            One intelligent workflow. One perfect route tailored to you.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
