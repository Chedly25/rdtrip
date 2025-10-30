import { motion } from 'framer-motion'
import { useState } from 'react'

const agents = [
  {
    id: 'adventure',
    name: 'Adventure',
    icon: '⛰️',
    color: '#34C759',
    gradient: 'from-green-500 to-emerald-600',
    description: 'Mountain trails, outdoor activities, and nature experiences',
    features: ['Hiking Routes', 'National Parks', 'Outdoor Sports', 'Scenic Drives']
  },
  {
    id: 'culture',
    name: 'Culture',
    icon: '🏛️',
    color: '#FFD60A',
    gradient: 'from-yellow-400 to-amber-500',
    description: 'Museums, historic sites, art galleries, and architecture',
    features: ['UNESCO Sites', 'Museums', 'Historic Centers', 'Art Galleries']
  },
  {
    id: 'food',
    name: 'Food',
    icon: '🍽️',
    color: '#FF3B30',
    gradient: 'from-red-500 to-rose-600',
    description: 'Local cuisine, Michelin restaurants, markets, and tastings',
    features: ['Fine Dining', 'Street Food', 'Local Markets', 'Wine Tastings']
  },
  {
    id: 'hidden-gems',
    name: 'Hidden Gems',
    icon: '💎',
    color: '#9333ea',
    gradient: 'from-purple-600 to-violet-700',
    description: 'Off-the-beaten-path towns, local secrets, authentic experiences',
    features: ['Small Towns', 'Local Favorites', 'Authentic Spots', 'Secret Views']
  }
]

export function AgentShowcase() {
  const [selectedAgent, setSelectedAgent] = useState(0)

  return (
    <section className="relative overflow-hidden bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            4 AI Travel Experts
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-gray-600">
            Pick your vibe. Each agent researches and plans a completely different route tailored to what you love.
          </p>
        </motion.div>

        {/* Agent Cards Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onMouseEnter={() => setSelectedAgent(index)}
              onClick={() => setSelectedAgent(index)}
              className="group relative cursor-pointer"
            >
              {/* Card */}
              <motion.div
                className={`relative h-full overflow-hidden rounded-2xl border-2 bg-white p-6 shadow-lg transition-all duration-300 ${
                  selectedAgent === index
                    ? 'scale-105 border-transparent shadow-2xl'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-xl'
                }`}
                style={{
                  borderColor: selectedAgent === index ? agent.color : undefined
                }}
              >
                {/* Gradient overlay when selected */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${agent.gradient} opacity-0 transition-opacity duration-300`}
                  animate={{ opacity: selectedAgent === index ? 0.05 : 0 }}
                />

                {/* Icon */}
                <motion.div
                  className="relative mb-4 text-6xl"
                  animate={{
                    scale: selectedAgent === index ? 1.1 : 1,
                    rotate: selectedAgent === index ? [0, -5, 5, 0] : 0
                  }}
                  transition={{ duration: 0.5 }}
                >
                  {agent.icon}
                </motion.div>

                {/* Title */}
                <h3
                  className="relative mb-2 text-2xl font-bold transition-colors duration-300"
                  style={{
                    color: selectedAgent === index ? agent.color : '#1f2937'
                  }}
                >
                  {agent.name}
                </h3>

                {/* Description */}
                <p className="relative mb-4 text-sm leading-relaxed text-gray-600">
                  {agent.description}
                </p>

                {/* Features List */}
                <ul className="relative space-y-2">
                  {agent.features.map((feature, i) => (
                    <motion.li
                      key={i}
                      className="flex items-center text-sm text-gray-700"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{
                        opacity: selectedAgent === index ? 1 : 0.7,
                        x: selectedAgent === index ? 0 : -10
                      }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <span
                        className="mr-2 h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: agent.color }}
                      />
                      {feature}
                    </motion.li>
                  ))}
                </ul>

                {/* Selected indicator */}
                {selectedAgent === index && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-1"
                    style={{ backgroundColor: agent.color }}
                    layoutId="activeAgent"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-lg font-medium text-gray-900">
            Get all 4 routes in one search.
            <span className="ml-2 text-gray-600">Compare and choose your favorite.</span>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
