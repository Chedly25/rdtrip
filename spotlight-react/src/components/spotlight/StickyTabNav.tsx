import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { MapPin, Building2, UtensilsCrossed, Calendar } from 'lucide-react'

interface TabSection {
  id: string
  label: string
  icon: React.ElementType
}

const sections: TabSection[] = [
  { id: 'overview', label: 'Overview', icon: MapPin },
  { id: 'cities', label: 'Cities', icon: Building2 },
  { id: 'stay-dine', label: 'Stay & Dine', icon: UtensilsCrossed },
  { id: 'itinerary', label: 'Itinerary', icon: Calendar }
]

export function StickyTabNav() {
  const [activeSection, setActiveSection] = useState('overview')

  // Scroll spy - detect which section is currently visible
  useEffect(() => {
    const handleScroll = () => {
      const sidebar = document.querySelector('.spotlight-sidebar')
      if (!sidebar) return

      // Check each section to see which one is in view
      for (const section of sections) {
        const element = document.getElementById(`section-${section.id}`)
        if (!element) continue

        const rect = element.getBoundingClientRect()
        const sidebarRect = sidebar.getBoundingClientRect()

        // If section's top is within the top portion of viewport, it's active
        if (rect.top <= sidebarRect.top + 120 && rect.bottom >= sidebarRect.top + 120) {
          setActiveSection(section.id)
          break
        }
      }
    }

    const sidebar = document.querySelector('.spotlight-sidebar')
    if (sidebar) {
      sidebar.addEventListener('scroll', handleScroll)
      handleScroll() // Initial check
      return () => sidebar.removeEventListener('scroll', handleScroll)
    }
  }, [])

  // Scroll to section when tab is clicked
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(`section-${sectionId}`)
    const sidebar = document.querySelector('.spotlight-sidebar')

    if (element && sidebar) {
      const elementTop = element.offsetTop
      sidebar.scrollTo({
        top: elementTop - 80, // Offset for the sticky nav height
        behavior: 'smooth'
      })
    }
  }

  return (
    <nav className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="flex items-center">
        {sections.map((section) => {
          const Icon = section.icon
          const isActive = activeSection === section.id

          return (
            <button
              key={section.id}
              onClick={() => scrollToSection(section.id)}
              className={`
                relative flex-1 flex items-center justify-center gap-2 px-4 py-4
                text-sm font-medium transition-colors
                ${isActive
                  ? 'text-indigo-600'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              <span className="hidden sm:inline">{section.label}</span>

              {/* Active indicator line */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
