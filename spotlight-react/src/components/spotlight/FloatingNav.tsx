import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { MapPin, Building, Hotel, Calendar } from 'lucide-react'

interface NavSection {
  id: string
  icon: React.ElementType
  label: string
  color: string
}

const sections: NavSection[] = [
  { id: 'overview', icon: MapPin, label: 'Overview', color: 'from-blue-500 to-cyan-500' },
  { id: 'cities', icon: Building, label: 'Cities', color: 'from-purple-500 to-pink-500' },
  { id: 'stay-dine', icon: Hotel, label: 'Stay & Dine', color: 'from-orange-500 to-red-500' },
  { id: 'itinerary', icon: Calendar, label: 'Itinerary', color: 'from-green-500 to-emerald-500' }
]

export function FloatingNav() {
  const [activeSection, setActiveSection] = useState('overview')
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [hoveredOrb, setHoveredOrb] = useState<string | null>(null)

  // Scroll spy - watches sidebar scroll, not window scroll
  useEffect(() => {
    const handleScroll = () => {
      // Find the sidebar element
      const sidebar = document.querySelector('.spotlight-sidebar')
      if (!sidebar) return

      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(`section-${s.id}`)
      }))

      for (const { id, element } of sectionElements) {
        if (element) {
          const rect = element.getBoundingClientRect()
          const sidebarRect = sidebar.getBoundingClientRect()

          // Check if section is in view within the sidebar
          if (rect.top <= sidebarRect.top + 100 && rect.bottom >= sidebarRect.top + 100) {
            setActiveSection(id)

            // Calculate progress
            const totalHeight = element.offsetHeight
            const visibleTop = Math.max(rect.top, sidebarRect.top)
            const visibleBottom = Math.min(rect.bottom, sidebarRect.bottom)
            const visibleHeight = visibleBottom - visibleTop
            const progressPercent = (visibleHeight / totalHeight) * 100

            setProgress(prev => ({
              ...prev,
              [id]: Math.min(100, Math.max(0, progressPercent))
            }))
          }
        }
      }
    }

    const sidebar = document.querySelector('.spotlight-sidebar')
    if (sidebar) {
      sidebar.addEventListener('scroll', handleScroll)
      handleScroll()

      return () => sidebar.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`)
    const sidebar = document.querySelector('.spotlight-sidebar')

    if (element && sidebar) {
      const elementTop = element.offsetTop
      sidebar.scrollTo({ top: elementTop - 20, behavior: 'smooth' })
    }
  }

  return (
    <>
      {/* Floating Orbs */}
      <motion.div
        className="fixed left-8 top-1/2 z-50 -translate-y-1/2"
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        transition={{ type: "spring", stiffness: 100 }}
      >
        <div className="relative">
          {/* Glass background */}
          <motion.div
            className="absolute inset-0 rounded-full bg-white/20 backdrop-blur-xl"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          />

          {/* Orbs */}
          <div className="relative space-y-6 p-3">
            {sections.map((section, index) => (
              <NavOrb
                key={section.id}
                section={section}
                isActive={activeSection === section.id}
                progress={progress[section.id] || 0}
                onClick={() => scrollToSection(section.id)}
                onHover={setHoveredOrb}
                index={index}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredOrb && (
          <motion.div
            className="fixed left-24 z-50"
            style={{ top: `calc(50vh + ${sections.findIndex(s => s.id === hoveredOrb) * 72 - 144}px)` }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
          >
            <div className="rounded-lg bg-black/90 backdrop-blur px-3 py-2">
              <p className="text-sm font-medium text-white">
                {sections.find(s => s.id === hoveredOrb)?.label}
              </p>
              {progress[hoveredOrb] > 0 && (
                <p className="text-xs text-gray-300">
                  {Math.round(progress[hoveredOrb])}% viewed
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function NavOrb({
  section,
  isActive,
  progress,
  onClick,
  onHover,
  index
}: {
  section: NavSection
  isActive: boolean
  progress: number
  onClick: () => void
  onHover: (id: string | null) => void
  index: number
}) {
  const Icon = section.icon

  return (
    <motion.button
      className="relative h-14 w-14 rounded-full"
      onClick={onClick}
      onMouseEnter={() => onHover(section.id)}
      onMouseLeave={() => onHover(null)}
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{
        delay: index * 0.1,
        type: "spring",
        stiffness: 200
      }}
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
    >
      {/* Progress ring */}
      <svg className="absolute inset-0 -rotate-90">
        <circle
          cx="28"
          cy="28"
          r="26"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="text-gray-300"
        />
        <motion.circle
          cx="28"
          cy="28"
          r="26"
          stroke="url(#gradient)"
          strokeWidth="3"
          fill="none"
          strokeDasharray={`${2 * Math.PI * 26}`}
          initial={{ strokeDashoffset: 2 * Math.PI * 26 }}
          animate={{
            strokeDashoffset: 2 * Math.PI * 26 * (1 - progress / 100)
          }}
          transition={{ duration: 0.5 }}
        />
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" className="text-blue-500" />
            <stop offset="100%" className="text-purple-500" />
          </linearGradient>
        </defs>
      </svg>

      {/* Orb content */}
      <motion.div
        className={`
          absolute inset-1 rounded-full flex items-center justify-center
          ${isActive
            ? `bg-gradient-to-br ${section.color}`
            : 'bg-gray-200 hover:bg-gray-300'
          }
        `}
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
        }}
        transition={{
          duration: 2,
          repeat: isActive ? Infinity : 0,
        }}
      >
        <Icon
          className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-700'}`}
        />
      </motion.div>

      {/* Active indicator */}
      {isActive && (
        <motion.div
          className="absolute inset-0 rounded-full"
          initial={{ scale: 1.5, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          <div className={`h-full w-full rounded-full bg-gradient-to-br ${section.color} opacity-50`} />
        </motion.div>
      )}
    </motion.button>
  )
}
