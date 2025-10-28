import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Navigation, Map as MapIcon } from 'lucide-react'
import { Button } from '../ui/Button'
import { TableOfContents } from './TableOfContents'
import { RouteOverview } from './RouteOverview'
import { CitiesSection } from './CitiesSection'
import { StayDineSection } from './StayDineSection'
import { ItinerarySection } from './ItinerarySection'
import { MapView } from './MapView'
import { useSpotlightStore } from '../../stores/spotlightStore'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { getTheme } from '../../config/theme'

// Agent configuration
const agentConfig = {
  'best-overall': {
    name: 'Best Overall Route',
    icon: '/images/icons/best_icon.png',
  },
  adventure: {
    name: 'Adventure Route',
    icon: '/images/icons/adventure_icon.png',
  },
  culture: {
    name: 'Culture Route',
    icon: '/images/icons/culture_icon.png',
  },
  food: {
    name: 'Food Route',
    icon: '/images/icons/food_icon.png',
  },
  'hidden-gems': {
    name: 'Hidden Gems Route',
    icon: '/images/icons/hidden_gem_icon.png',
  },
}

export function SpotlightPageComplete() {
  const { waypoints } = useSpotlightStore()
  const { routeData } = useRouteDataStore()
  const [activeSection, setActiveSection] = useState('overview')

  // Get agent details and theme
  const agent = routeData?.agent || 'adventure'
  const config = agentConfig[agent]
  const theme = getTheme(agent)
  const origin = routeData?.origin || 'Your Starting Point'
  const destination = routeData?.destination || waypoints[waypoints.length - 1]?.name || 'Your Destination'

  const handleBack = () => {
    window.location.href = '/index.html'
  }

  const handleExportGoogleMaps = () => {
    // waypoints array includes: origin, all middle cities (added from results/spotlight), landmarks, and destination
    // Each waypoint needs to be a separate URL segment for Google Maps to recognize them
    const segments = waypoints.map(wp => encodeURIComponent(wp.name)).join('/')
    const url = `https://www.google.com/maps/dir/${segments}`
    window.open(url, '_blank')
  }

  const handleExportWaze = () => {
    const lastWaypoint = waypoints[waypoints.length - 1]
    if (lastWaypoint?.coordinates) {
      const url = `https://waze.com/ul?ll=${lastWaypoint.coordinates.lat},${lastWaypoint.coordinates.lng}&navigate=yes`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-full px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Overview
              </Button>
              <div className="flex items-center gap-3">
                {/* Agent Icon - Using actual PNG from /images/icons/ */}
                <img
                  src={config.icon}
                  alt={config.name}
                  className="h-12 w-12 object-contain"
                />
                <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>{config.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportGoogleMaps}
                className="gap-2"
              >
                <MapIcon className="h-4 w-4" />
                Google Maps
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportWaze}
                className="gap-2"
              >
                <Navigation className="h-4 w-4" />
                Waze
              </Button>
            </div>
          </div>
          <p className="mt-2 flex items-center gap-2 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <span className="font-semibold">{origin}</span>
            </span>
            <span>→</span>
            <span className="flex items-center gap-1">
              <span className="font-semibold">{destination}</span>
            </span>
          </p>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Content Panel - Wider for better readability */}
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-[600px] flex-shrink-0 overflow-y-auto bg-white shadow-lg"
          style={{ borderRight: `3px solid ${theme.primary}` }}
        >
          <div className="p-8">
            {/* Table of Contents */}
            <TableOfContents
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />

            {/* Content Sections */}
            <div className="mt-8 space-y-8">
              {activeSection === 'overview' && <RouteOverview />}
              {activeSection === 'cities' && <CitiesSection />}
              {activeSection === 'stay-dine' && <StayDineSection />}
              {activeSection === 'itinerary' && <ItinerarySection />}
            </div>
          </div>
        </motion.aside>

        {/* Right Map - Seamlessly integrated */}
        <div className="flex-1 relative">
          <MapView />
          {/* Gradient overlay for better visual integration */}
          <div
            className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none"
            style={{
              background: `linear-gradient(to right, ${theme.primary}15, transparent)`
            }}
          />
        </div>
      </div>
    </div>
  )
}
