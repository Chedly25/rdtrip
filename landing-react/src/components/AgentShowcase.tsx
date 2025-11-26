import { motion } from 'framer-motion'
import { useState } from 'react'
import { Eye } from 'lucide-react'
import { SampleRouteModal } from './SampleRouteModal'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

const agents = [
  {
    id: 'adventure',
    name: 'Adventure',
    icon: '/images/icons/adventure_icon.png',
    color: '#09BE67',
    bgLight: 'bg-adventure-light',
    description: 'Mountain trails, outdoor activities, and nature experiences',
    features: ['Hiking Routes', 'National Parks', 'Outdoor Sports', 'Scenic Drives']
  },
  {
    id: 'culture',
    name: 'Culture',
    icon: '/images/icons/culture_icon.png',
    color: '#805CF5',
    bgLight: 'bg-culture-light',
    description: 'Museums, historic sites, art galleries, and architecture',
    features: ['UNESCO Sites', 'Museums', 'Historic Centers', 'Art Galleries']
  },
  {
    id: 'food',
    name: 'Food',
    icon: '/images/icons/food_icon.png',
    color: '#EE7A40',
    bgLight: 'bg-food-light',
    description: 'Local cuisine, Michelin restaurants, markets, and tastings',
    features: ['Fine Dining', 'Street Food', 'Local Markets', 'Wine Tastings']
  },
  {
    id: 'hidden-gems',
    name: 'Hidden Gems',
    icon: '/images/icons/hidden_gem_icon.png',
    color: '#00BE90',
    bgLight: 'bg-hidden-gems-light',
    description: 'Off-the-beaten-path towns, local secrets, authentic experiences',
    features: ['Small Towns', 'Local Favorites', 'Authentic Spots', 'Secret Views']
  }
]

export function AgentShowcase() {
  const [selectedAgent, setSelectedAgent] = useState(0)
  const [showSampleModal, setShowSampleModal] = useState(false)

  return (
    <>
      <section className="relative overflow-hidden bg-rui-white py-24">
        <div className="mx-auto max-w-7xl px-6">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: ruiEasing }}
            className="mb-16 text-center"
          >
            <h2 className="mb-4 font-marketing text-display-2 text-rui-black md:text-display-1">
              4 AI Travel Experts
            </h2>
            <p className="mx-auto max-w-xl text-body-1 text-rui-grey-50">
              Pick your vibe. Each agent researches and plans a completely different route tailored to what you love.
            </p>
          </motion.div>

          {/* Agent Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {agents.map((agent, index) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1, ease: ruiEasing }}
                onMouseEnter={() => setSelectedAgent(index)}
                onClick={() => setSelectedAgent(index)}
                className="group cursor-pointer"
              >
                <motion.div
                  className={`relative h-full overflow-hidden rounded-rui-24 border-2 bg-rui-white p-6 transition-all duration-rui-md ease-rui-default ${
                    selectedAgent === index
                      ? 'shadow-rui-3 scale-[1.02]'
                      : 'border-rui-grey-10 hover:border-rui-grey-20 hover:shadow-rui-2'
                  }`}
                  style={{
                    borderColor: selectedAgent === index ? agent.color : undefined
                  }}
                >
                  {/* Subtle background when selected */}
                  <motion.div
                    className="absolute inset-0 opacity-0 transition-opacity duration-rui-md"
                    style={{ backgroundColor: agent.color }}
                    animate={{ opacity: selectedAgent === index ? 0.03 : 0 }}
                  />

                  {/* Icon */}
                  <motion.div
                    className="relative mb-4 flex items-center justify-center"
                    animate={{
                      scale: selectedAgent === index ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.3, ease: ruiEasing }}
                  >
                    <img
                      src={agent.icon}
                      alt={`${agent.name} icon`}
                      className="h-14 w-14 object-contain"
                    />
                  </motion.div>

                  {/* Title */}
                  <h3
                    className="relative mb-2 text-heading-2 transition-colors duration-rui-sm"
                    style={{
                      color: selectedAgent === index ? agent.color : '#191C1F'
                    }}
                  >
                    {agent.name}
                  </h3>

                  {/* Description */}
                  <p className="relative mb-4 text-body-2 text-rui-grey-50">
                    {agent.description}
                  </p>

                  {/* Features List */}
                  <ul className="relative space-y-2">
                    {agent.features.map((feature, i) => (
                      <motion.li
                        key={i}
                        className="flex items-center text-sm text-rui-black"
                        initial={{ opacity: 0.6 }}
                        animate={{
                          opacity: selectedAgent === index ? 1 : 0.6,
                        }}
                        transition={{ duration: 0.2, delay: i * 0.03 }}
                      >
                        <span
                          className="mr-2 h-1.5 w-1.5 rounded-full transition-transform duration-rui-sm"
                          style={{
                            backgroundColor: agent.color,
                            transform: selectedAgent === index ? 'scale(1.2)' : 'scale(1)'
                          }}
                        />
                        {feature}
                      </motion.li>
                    ))}
                  </ul>

                  {/* Selected indicator bar */}
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 rounded-b-rui-24"
                    style={{ backgroundColor: agent.color }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: selectedAgent === index ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: ruiEasing }}
                  />
                </motion.div>
              </motion.div>
            ))}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4, ease: ruiEasing }}
            className="mt-12 text-center"
          >
            <p className="mb-6 text-body-1 text-rui-black">
              Get all 4 routes in one search.
              <span className="ml-1 text-rui-grey-50">Compare and choose your favorite.</span>
            </p>
            <button
              onClick={() => setShowSampleModal(true)}
              className="group relative inline-flex items-center gap-2 rounded-full border-2 border-rui-black bg-rui-white px-6 py-3 font-semibold text-rui-black overflow-hidden transition-all duration-rui-sm ease-rui-default hover:bg-rui-black hover:text-rui-white"
            >
              <Eye className="h-5 w-5 transition-transform duration-rui-sm group-hover:scale-110" />
              <span>See Sample Route</span>
            </button>
          </motion.div>
        </div>
      </section>

      <SampleRouteModal isOpen={showSampleModal} onClose={() => setShowSampleModal(false)} />
    </>
  )
}
