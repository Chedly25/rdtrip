import { motion, useMotionValue, animate, type PanInfo } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const x = useMotionValue(0)
  const [isMobile, setIsMobile] = useState(false)

  const cardWidth = 280
  const gap = 16
  const scrollWidth = agents.length * (cardWidth + gap) - gap

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.x
    const currentX = x.get()
    let targetX = currentX + velocity * 0.3

    const maxX = 0
    const minX = -(scrollWidth - containerWidth)
    targetX = Math.max(minX, Math.min(maxX, targetX))

    animate(x, targetX, {
      type: 'spring',
      stiffness: 300,
      damping: 30
    })
  }

  const scrollTo = (index: number) => {
    const targetX = -(index * (cardWidth + gap))
    animate(x, Math.max(-(scrollWidth - containerWidth), targetX), {
      type: 'spring',
      stiffness: 300,
      damping: 30
    })
    setSelectedAgent(index)
  }

  return (
    <>
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
              4 AI Travel Experts
            </h2>
            <p className="mx-auto max-w-xl text-lg text-rui-grey-50">
              Pick your vibe. Each agent researches and plans a completely different route tailored to what you love.
            </p>
          </motion.div>

          {/* Mobile Carousel */}
          {isMobile ? (
            <div className="relative">
              <div ref={containerRef} className="overflow-hidden">
                <motion.div
                  className="flex cursor-grab active:cursor-grabbing"
                  style={{ x, gap: `${gap}px` }}
                  drag="x"
                  dragConstraints={{
                    left: -(scrollWidth - containerWidth),
                    right: 0
                  }}
                  dragElastic={0.1}
                  onDragEnd={handleDragEnd}
                >
                  {agents.map((agent, index) => (
                    <AgentCard
                      key={agent.id}
                      agent={agent}
                      index={index}
                      isSelected={selectedAgent === index}
                      onSelect={() => setSelectedAgent(index)}
                      cardWidth={cardWidth}
                    />
                  ))}
                </motion.div>
              </div>

              {/* Dots indicator */}
              <div className="mt-6 flex justify-center gap-2">
                {agents.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => scrollTo(index)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      selectedAgent === index ? 'w-6 bg-rui-black' : 'w-2 bg-rui-grey-20'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Desktop Grid */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {agents.map((agent, index) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  index={index}
                  isSelected={selectedAgent === index}
                  onSelect={() => setSelectedAgent(index)}
                />
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4, ease: ruiEasing }}
            className="mt-12 text-center"
          >
            <p className="mb-6 text-lg text-rui-black">
              Get all 4 routes in one search.
              <span className="ml-1 text-rui-grey-50">Compare and choose your favorite.</span>
            </p>
            <motion.button
              onClick={() => setShowSampleModal(true)}
              className="group relative inline-flex items-center gap-2 rounded-full border-2 border-rui-black bg-rui-white px-8 py-4 font-semibold text-rui-black overflow-hidden transition-all duration-300"
              whileHover={{
                backgroundColor: '#191C1F',
                color: '#FFFFFF',
                scale: 1.02
              }}
              whileTap={{ scale: 0.98 }}
            >
              <Eye className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
              <span>See Sample Route</span>
            </motion.button>
          </motion.div>
        </div>
      </section>

      <SampleRouteModal isOpen={showSampleModal} onClose={() => setShowSampleModal(false)} />
    </>
  )
}

function AgentCard({
  agent,
  index,
  isSelected,
  onSelect,
  cardWidth
}: {
  agent: typeof agents[0]
  index: number
  isSelected: boolean
  onSelect: () => void
  cardWidth?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: ruiEasing }}
      onMouseEnter={onSelect}
      onClick={onSelect}
      className="group cursor-pointer flex-shrink-0"
      style={cardWidth ? { width: cardWidth } : undefined}
    >
      <motion.div
        className={`relative h-full overflow-hidden rounded-rui-24 border-2 bg-rui-white p-6 transition-colors duration-300`}
        style={{
          borderColor: isSelected ? agent.color : '#E2E2E7'
        }}
        whileHover={{ y: -8, scale: 1.02 }}
        animate={{
          boxShadow: isSelected
            ? '0 0.1875rem 1.875rem rgba(25, 28, 31, 0.12)'
            : '0 0.125rem 0.1875rem rgba(25, 28, 31, 0.05)'
        }}
        transition={{ duration: 0.3, ease: ruiEasing }}
      >
        {/* Colored background glow when selected */}
        <motion.div
          className="absolute inset-0 opacity-0 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${agent.color}20, transparent 70%)`
          }}
          animate={{ opacity: isSelected ? 1 : 0 }}
        />

        {/* Icon */}
        <motion.div
          className="relative mb-4 flex items-center justify-center"
          animate={{
            scale: isSelected ? 1.15 : 1,
            y: isSelected ? -4 : 0
          }}
          transition={{ duration: 0.3, ease: ruiEasing }}
        >
          <motion.div
            className="p-3 rounded-rui-16"
            style={{ backgroundColor: `${agent.color}15` }}
            animate={{
              backgroundColor: isSelected ? `${agent.color}25` : `${agent.color}15`
            }}
          >
            <img
              src={agent.icon}
              alt={`${agent.name} icon`}
              className="h-10 w-10 object-contain"
            />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h3
          className="relative mb-2 text-xl font-bold transition-colors duration-300"
          animate={{ color: isSelected ? agent.color : '#191C1F' }}
        >
          {agent.name}
        </motion.h3>

        {/* Description */}
        <p className="relative mb-4 text-sm text-rui-grey-50 leading-relaxed">
          {agent.description}
        </p>

        {/* Features List */}
        <ul className="relative space-y-2">
          {agent.features.map((feature, i) => (
            <motion.li
              key={i}
              className="flex items-center text-sm text-rui-black"
              initial={{ opacity: 0.6, x: 0 }}
              animate={{
                opacity: isSelected ? 1 : 0.6,
                x: isSelected ? 4 : 0
              }}
              transition={{ duration: 0.2, delay: i * 0.05 }}
            >
              <motion.span
                className="mr-2 h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: agent.color }}
                animate={{
                  scale: isSelected ? 1.3 : 1
                }}
                transition={{ duration: 0.2 }}
              />
              {feature}
            </motion.li>
          ))}
        </ul>

        {/* Bottom accent bar */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: agent.color }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isSelected ? 1 : 0 }}
          transition={{ duration: 0.3, ease: ruiEasing }}
        />
      </motion.div>
    </motion.div>
  )
}
