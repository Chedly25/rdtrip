import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion'
import { MapPin, Clock, TrendingUp, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { destinations, getAgentColor, getAgentIconPath, type Destination } from '../data/destinations'
import { useFormStore } from '../stores/formStore'
import type { CityData } from '../types'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

export function DestinationShowcase() {
  const { setDestination } = useFormStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [scrollWidth, setScrollWidth] = useState(0)
  const x = useMotionValue(0)
  const [isDragging, setIsDragging] = useState(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Card width + gap
  const cardWidth = 380
  const gap = 24

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth)
        setScrollWidth(destinations.length * (cardWidth + gap) - gap)
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Update scroll indicators
  useEffect(() => {
    const unsubscribe = x.on('change', (latest) => {
      setCanScrollLeft(latest < -10)
      setCanScrollRight(latest > -(scrollWidth - containerWidth + 10))
    })
    return unsubscribe
  }, [x, scrollWidth, containerWidth])

  const handleCardClick = (destination: Destination) => {
    if (isDragging) return

    const cityData: CityData = {
      name: destination.name,
      country: destination.country,
      coordinates: destination.coordinates,
      displayName: `${destination.name}, ${destination.country}`
    }

    setDestination(cityData)

    setTimeout(() => {
      const formElement = document.getElementById('route-form')
      formElement?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const velocity = info.velocity.x
    const currentX = x.get()

    // Apply momentum
    let targetX = currentX + velocity * 0.3

    // Snap to bounds
    const maxX = 0
    const minX = -(scrollWidth - containerWidth)

    targetX = Math.max(minX, Math.min(maxX, targetX))

    animate(x, targetX, {
      type: 'spring',
      stiffness: 300,
      damping: 30
    })

    setTimeout(() => setIsDragging(false), 100)
  }

  const scroll = (direction: 'left' | 'right') => {
    const currentX = x.get()
    const scrollAmount = cardWidth + gap
    const targetX = direction === 'left'
      ? Math.min(0, currentX + scrollAmount)
      : Math.max(-(scrollWidth - containerWidth), currentX - scrollAmount)

    animate(x, targetX, {
      type: 'spring',
      stiffness: 300,
      damping: 30
    })
  }

  // Progress indicator
  const progress = useTransform(x, [0, -(scrollWidth - containerWidth)], [0, 1])

  return (
    <section className="relative overflow-hidden bg-rui-grey-2 py-24">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: ruiEasing }}
          className="mb-12 text-center"
        >
          <h2 className="mb-4 font-marketing text-[2rem] sm:text-[2.5rem] md:text-[3rem] font-extrabold text-rui-black tracking-[-0.02em]">
            Popular Destinations from Aix-en-Provence
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-rui-grey-50">
            Not sure where to go? Start with one of these favorites. Click any destination to pre-fill your route.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: canScrollLeft ? 1 : 0 }}
            onClick={() => scroll('left')}
            className="absolute -left-4 top-1/2 z-20 -translate-y-1/2 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-rui-white shadow-rui-3 transition-all hover:shadow-rui-4 hover:scale-110"
            style={{ pointerEvents: canScrollLeft ? 'auto' : 'none' }}
          >
            <ChevronLeft className="h-6 w-6 text-rui-black" />
          </motion.button>

          <motion.button
            initial={{ opacity: 1 }}
            animate={{ opacity: canScrollRight ? 1 : 0 }}
            onClick={() => scroll('right')}
            className="absolute -right-4 top-1/2 z-20 -translate-y-1/2 hidden md:flex h-12 w-12 items-center justify-center rounded-full bg-rui-white shadow-rui-3 transition-all hover:shadow-rui-4 hover:scale-110"
            style={{ pointerEvents: canScrollRight ? 'auto' : 'none' }}
          >
            <ChevronRight className="h-6 w-6 text-rui-black" />
          </motion.button>

          {/* Carousel Track */}
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
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
            >
              {destinations.map((destination, index) => (
                <motion.div
                  key={destination.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease: ruiEasing }}
                  className="flex-shrink-0"
                  style={{ width: cardWidth }}
                >
                  <motion.div
                    className="group relative h-full cursor-pointer overflow-hidden rounded-rui-24 bg-rui-white shadow-rui-2"
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.3, ease: ruiEasing }}
                    onClick={() => handleCardClick(destination)}
                  >
                    {/* Image Section */}
                    <div className="relative h-52 overflow-hidden">
                      <motion.div
                        className="absolute inset-0"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.6, ease: ruiEasing }}
                      >
                        <div
                          className="absolute inset-0 bg-gradient-to-br"
                          style={{
                            backgroundImage: `linear-gradient(135deg, ${destination.imageFallback}dd, ${destination.imageFallback})`
                          }}
                        >
                          <img
                            src={destination.imageUrl}
                            alt={destination.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        </div>
                      </motion.div>

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                      {/* Flag badge */}
                      <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 backdrop-blur-sm shadow-rui-1">
                        <span className="text-lg">{destination.flag}</span>
                        <span className="text-sm font-semibold text-rui-black">{destination.country}</span>
                      </div>

                      {/* Drive time */}
                      <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-rui-black/80 px-3 py-1.5 backdrop-blur-sm">
                        <Clock className="h-4 w-4 text-white" />
                        <span className="text-sm font-semibold text-white">{destination.driveTime}</span>
                      </div>

                      {/* City name */}
                      <h3 className="absolute bottom-4 left-4 font-marketing text-2xl font-bold text-white drop-shadow-lg">
                        {destination.name}
                      </h3>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <p className="mb-4 text-sm text-rui-grey-50 leading-relaxed line-clamp-2">
                        {destination.pitch}
                      </p>

                      {/* Stats */}
                      <div className="mb-4 flex items-center gap-4 text-sm text-rui-black">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4 text-rui-grey-50" />
                          <span className="font-medium">{destination.distance} km</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <TrendingUp className="h-4 w-4 text-rui-grey-50" />
                          <span className="font-medium">{destination.recommendedStops} stops</span>
                        </div>
                      </div>

                      {/* Best For */}
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold text-rui-grey-50 uppercase tracking-wider">
                          Best For
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {destination.bestFor.map((item, i) => (
                            <motion.div
                              key={i}
                              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: `${getAgentColor(item.agent)}15`,
                                color: getAgentColor(item.agent)
                              }}
                              whileHover={{ scale: 1.05 }}
                            >
                              <img
                                src={getAgentIconPath(item.agent)}
                                alt={item.agent}
                                className="h-3.5 w-3.5 object-contain"
                              />
                              <span className="capitalize">{item.agent.replace('-', ' ')}</span>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      {/* Highlights */}
                      <div className="mb-4">
                        <p className="mb-2 text-xs font-semibold text-rui-grey-50 uppercase tracking-wider">
                          Highlights
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {destination.highlights.slice(0, 3).map((highlight, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-rui-grey-5 px-2.5 py-1 text-xs text-rui-black"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <motion.button
                        className="group/btn flex w-full items-center justify-center gap-2 rounded-rui-12 bg-rui-black px-4 py-3 font-semibold text-white transition-all"
                        whileHover={{ backgroundColor: '#2a2e33' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleCardClick(destination)
                        }}
                      >
                        <span>Plan Route to {destination.name}</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="mt-8 flex justify-center">
            <div className="h-1 w-32 overflow-hidden rounded-full bg-rui-grey-10">
              <motion.div
                className="h-full bg-rui-black rounded-full"
                style={{ scaleX: progress, transformOrigin: 'left' }}
              />
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3, ease: ruiEasing }}
          className="mt-12 text-center"
        >
          <p className="text-rui-grey-50">
            Don't see your destination?{' '}
            <button
              onClick={() => {
                const formElement = document.getElementById('route-form')
                formElement?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="font-semibold text-rui-black underline decoration-2 underline-offset-4 transition-colors hover:text-rui-accent"
            >
              Enter any European city
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
