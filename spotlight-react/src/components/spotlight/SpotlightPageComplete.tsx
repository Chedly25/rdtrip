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

export function SpotlightPageComplete() {
  const { waypoints } = useSpotlightStore()
  const [activeSection, setActiveSection] = useState('overview')

  const handleBack = () => {
    window.close() // Close the spotlight tab/window
  }

  const handleExportGoogleMaps = () => {
    const origin = 'Aix-en-Provence, France'
    const destination = waypoints[waypoints.length - 1]?.name || 'Destination'
    const waypointsParam = waypoints.slice(0, -1).map(wp => wp.name).join('|')

    const url = `https://www.google.com/maps/dir/${encodeURIComponent(origin)}/${waypointsParam ? encodeURIComponent(waypointsParam) + '/' : ''}${encodeURIComponent(destination)}`
    window.open(url, '_blank')
  }

  const handleExportWaze = () => {
    const destination = waypoints[waypoints.length - 1]
    if (destination && destination.coordinates) {
      const url = `https://waze.com/ul?ll=${destination.coordinates.lat},${destination.coordinates.lng}&navigate=yes`
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
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏔️</span>
                <h1 className="text-2xl font-bold text-gray-900">Adventure Route</h1>
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
              <img src="https://flagcdn.com/24x18/fr.png" alt="France" className="h-4 w-6" />
              Aix-en-Provence
            </span>
            <span>→</span>
            <span className="flex items-center gap-1">
              <img src="https://flagcdn.com/24x18/es.png" alt="Spain" className="h-4 w-6" />
              Barcelona
            </span>
          </p>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Sidebar */}
        <motion.aside
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-[480px] flex-shrink-0 overflow-y-auto border-r border-gray-200 bg-white"
        >
          <div className="p-6">
            {/* Table of Contents */}
            <TableOfContents
              activeSection={activeSection}
              onSectionChange={setActiveSection}
            />

            {/* Content Sections */}
            <div className="mt-6 space-y-8">
              {activeSection === 'overview' && <RouteOverview />}
              {activeSection === 'cities' && <CitiesSection />}
              {activeSection === 'stay-dine' && <StayDineSection />}
              {activeSection === 'itinerary' && <ItinerarySection />}
            </div>
          </div>
        </motion.aside>

        {/* Right Map */}
        <div className="flex-1">
          <MapView />
        </div>
      </div>
    </div>
  )
}
