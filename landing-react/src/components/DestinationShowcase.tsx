import { motion, useMotionValue, useTransform, animate, type PanInfo } from 'framer-motion'
import { Clock, ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import { useRef, useState, useEffect } from 'react'
import { destinations, type Destination } from '../data/destinations'
import { useFormStore } from '../stores/formStore'
import type { CityData } from '../types'

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

  // Smaller card dimensions
  const cardWidth = 260
  const gap = 16

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

    let targetX = currentX + velocity * 0.3

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
    const scrollAmount = (cardWidth + gap) * 2 // Scroll 2 cards at a time
    const targetX = direction === 'left'
      ? Math.min(0, currentX + scrollAmount)
      : Math.max(-(scrollWidth - containerWidth), currentX - scrollAmount)

    animate(x, targetX, {
      type: 'spring',
      stiffness: 300,
      damping: 30
    })
  }

  const progress = useTransform(x, [0, -(scrollWidth - containerWidth)], [0, 1])

  return (
    <section className="relative overflow-hidden bg-rui-grey-2 py-20">
      <div className="mx-auto max-w-[90rem] px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: ruiEasing }}
          className="mb-10 text-center"
        >
          <h2 className="mb-3 font-marketing text-[1.75rem] sm:text-[2rem] md:text-[2.5rem] font-extrabold text-rui-black tracking-[-0.02em]">
            Popular Destinations
          </h2>
          <p className="mx-auto max-w-xl text-base text-rui-grey-50">
            Click any destination to start planning your route
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Arrows */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: canScrollLeft ? 1 : 0 }}
            onClick={() => scroll('left')}
            className="absolute -left-3 top-1/2 z-20 -translate-y-1/2 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-rui-white shadow-rui-2 transition-all hover:shadow-rui-3 hover:scale-105"
            style={{ pointerEvents: canScrollLeft ? 'auto' : 'none' }}
          >
            <ChevronLeft className="h-5 w-5 text-rui-black" />
          </motion.button>

          <motion.button
            initial={{ opacity: 1 }}
            animate={{ opacity: canScrollRight ? 1 : 0 }}
            onClick={() => scroll('right')}
            className="absolute -right-3 top-1/2 z-20 -translate-y-1/2 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-rui-white shadow-rui-2 transition-all hover:shadow-rui-3 hover:scale-105"
            style={{ pointerEvents: canScrollRight ? 'auto' : 'none' }}
          >
            <ChevronRight className="h-5 w-5 text-rui-black" />
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
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-50px' }}
                  transition={{ duration: 0.4, delay: index * 0.05, ease: ruiEasing }}
                  className="flex-shrink-0"
                  style={{ width: cardWidth }}
                >
                  <motion.div
                    className="group relative h-[320px] cursor-pointer overflow-hidden rounded-2xl bg-rui-white shadow-sm"
                    whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.12)' }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.25, ease: ruiEasing }}
                    onClick={() => handleCardClick(destination)}
                  >
                    {/* Image Section - Fixed Height */}
                    <div className="relative h-36 overflow-hidden">
                      <motion.div
                        className="absolute inset-0"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.5, ease: ruiEasing }}
                      >
                        <div
                          className="absolute inset-0"
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Flag badge - smaller */}
                      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/95 px-2 py-1 backdrop-blur-sm">
                        <span className="text-sm">{destination.flag}</span>
                        <span className="text-xs font-semibold text-rui-black">{destination.country}</span>
                      </div>

                      {/* Drive time - smaller */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-rui-black/70 px-2 py-1 backdrop-blur-sm">
                        <Clock className="h-3 w-3 text-white" />
                        <span className="text-xs font-medium text-white">{destination.driveTime}</span>
                      </div>

                      {/* City name */}
                      <h3 className="absolute bottom-3 left-3 font-marketing text-xl font-bold text-white drop-shadow-md">
                        {destination.name}
                      </h3>
                    </div>

                    {/* Content - Compact */}
                    <div className="flex h-[184px] flex-col p-4">
                      {/* Short pitch - 2 lines max */}
                      <p className="mb-3 text-sm text-rui-grey-50 leading-snug line-clamp-2">
                        {destination.pitch}
                      </p>

                      {/* Highlights - Compact */}
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-1.5">
                          {destination.highlights.slice(0, 3).map((highlight, i) => (
                            <span
                              key={i}
                              className="rounded-full bg-rui-grey-5 px-2 py-0.5 text-[11px] text-rui-black font-medium"
                            >
                              {highlight}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* CTA - Simple link style */}
                      <div className="mt-auto pt-3 border-t border-rui-grey-5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-rui-grey-50">
                            {destination.distance} km · {destination.recommendedStops} stops
                          </span>
                          <span className="flex items-center gap-1 text-xs font-semibold text-rui-black group-hover:text-rui-accent transition-colors">
                            Plan route
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 flex justify-center">
            <div className="h-1 w-24 overflow-hidden rounded-full bg-rui-grey-10">
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
          transition={{ duration: 0.6, delay: 0.2, ease: ruiEasing }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-rui-grey-50">
            Don't see your destination?{' '}
            <button
              onClick={() => {
                const formElement = document.getElementById('route-form')
                formElement?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="font-semibold text-rui-black underline decoration-1 underline-offset-2 transition-colors hover:text-rui-accent"
            >
              Enter any European city
            </button>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
