import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Navigation, Map as MapIcon, ArrowRight, Sparkles } from 'lucide-react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import { Button } from '../ui/Button'
import { RouteOverview } from './RouteOverview'
import { CitiesSection } from './CitiesSection'
import { StayDineSection } from './StayDineSection'
import { ItinerarySection } from './ItinerarySection'
import { MapView } from './MapView'
import { WazeCitySelector } from './WazeCitySelector'
import { ExportMenu } from '../ExportMenu'
import { SmoothSection } from '../ui/SmoothSection'
import { LayoutProvider, useLayout } from '../../contexts/LayoutContext'
import { LayoutSwitcher } from './LayoutSwitcher'
import { SidebarToggle } from './SidebarToggle'
import { StickyTabNav } from './StickyTabNav'
import { useSpotlightStore } from '../../stores/spotlightStore'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { getTheme } from '../../config/theme'
import { extractCountry, getCountryFromGeocoding, formatCityWithCountry } from '../../utils/countryFlags'
import { ItineraryGenerator } from '../itinerary/ItineraryGenerator'

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

// Inner component that uses layout context
function SpotlightContent() {
  const { waypoints } = useSpotlightStore()
  const { routeData } = useRouteDataStore()
  const { isSidebarCollapsed } = useLayout()
  const [showWazeModal, setShowWazeModal] = useState(false)
  const [showItineraryGenerator, setShowItineraryGenerator] = useState(false)

  // Country data state
  const [originData, setOriginData] = useState<{ display: string; flag: string }>({ display: '', flag: '' })
  const [destinationData, setDestinationData] = useState<{ display: string; flag: string }>({ display: '', flag: '' })

  // Check URL params on mount - auto-show itinerary if present
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const itineraryId = urlParams.get('itinerary')
    if (itineraryId) {
      console.log(`📌 Detected itinerary ID in URL: ${itineraryId}, auto-showing generator`)
      setShowItineraryGenerator(true)
    }
  }, [])

  // Get agent details and theme
  const agent = routeData?.agent || 'adventure'
  const config = agentConfig[agent]
  const theme = getTheme(agent)

  // Get the agent index for export menu
  const agentIndex = routeData?.agentResults?.findIndex((result: any) => result.agent === agent) ?? 0

  // Get origin and destination from waypoints (they have full city names with countries)
  // Waypoints are ordered, first is origin, last is destination
  const originWaypoint = waypoints[0]
  const destinationWaypoint = waypoints[waypoints.length - 1]

  const origin = originWaypoint?.name || routeData?.origin || 'Your Starting Point'
  const destination = destinationWaypoint?.name || routeData?.destination || 'Your Destination'

  // Load country data for origin and destination
  useEffect(() => {
    const loadCountryData = async () => {
      // Process origin
      let originCountry = extractCountry(origin)
      if (!originCountry && originWaypoint?.coordinates) {
        // Try reverse geocoding with coordinates if available
        originCountry = await getCountryFromGeocoding(origin)
      }
      const originFormatted = formatCityWithCountry(origin, originCountry)
      setOriginData({ display: originFormatted.display, flag: originFormatted.flag })

      // Process destination
      let destCountry = extractCountry(destination)
      if (!destCountry && destinationWaypoint?.coordinates) {
        // Try reverse geocoding with coordinates if available
        destCountry = await getCountryFromGeocoding(destination)
      }
      const destFormatted = formatCityWithCountry(destination, destCountry)
      setDestinationData({ display: destFormatted.display, flag: destFormatted.flag })
    }

    if (origin && destination && waypoints.length > 0) {
      loadCountryData()
    }
  }, [origin, destination, waypoints.length, originWaypoint, destinationWaypoint])

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
    // Open modal to let user choose which city to navigate to
    // Since Waze doesn't support multi-stop routes, we let them pick one destination
    setShowWazeModal(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-full px-6 py-6 relative">
          {/* Back Button - Absolute positioned on left */}
          <div className="absolute left-6 top-1/2 -translate-y-1/2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Overview
            </Button>
          </div>

          {/* Export Buttons - Absolute positioned on right */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowItineraryGenerator(true)}
              className="gap-2"
              style={{
                background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})`,
                color: 'white'
              }}
            >
              <Sparkles className="h-4 w-4" />
              Generate Detailed Itinerary
            </Button>
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
            {routeData && (
              <ExportMenu spotlightData={routeData} agentIndex={agentIndex} />
            )}
          </div>

          {/* Centered Theme and Route Info */}
          <div className="flex flex-col items-center justify-center text-center py-2">
            {/* Theme Title with Icon */}
            <div className="flex items-center gap-3 mb-3">
              <img
                src={config.icon}
                alt={config.name}
                className="h-10 w-10 object-contain"
              />
              <h1 className="text-2xl font-bold" style={{ color: theme.primary }}>
                {config.name}
              </h1>
            </div>

            {/* Route: Origin → Destination with flags */}
            <div className="flex items-center gap-3 text-base">
              <span className="flex items-center gap-2">
                <span className="text-xl">{originData.flag}</span>
                <span className="font-semibold text-gray-800">
                  {originData.display || origin}
                </span>
              </span>
              <ArrowRight className="h-5 w-5 text-gray-400" style={{ strokeWidth: 2.5 }} />
              <span className="flex items-center gap-2">
                <span className="text-xl">{destinationData.flag}</span>
                <span className="font-semibold text-gray-800">
                  {destinationData.display || destination}
                </span>
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout with Resizable Panels */}
      <div className="flex h-[calc(100vh-120px)]">
        <PanelGroup direction="horizontal">
          {/* Sidebar Panel */}
          <AnimatePresence>
            {!isSidebarCollapsed && (
              <Panel
                defaultSize={40}
                minSize={25}
                maxSize={70}
                className="border-r"
                style={{ borderColor: theme.primary, borderRightWidth: '3px' }}
              >
                <motion.aside
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  className="spotlight-sidebar h-full overflow-y-auto bg-gradient-to-b from-gray-50 to-white shadow-lg"
                >
                  {/* Sticky Tab Navigation */}
                  <StickyTabNav />

                  <div className="px-8 py-6">
                    {/* Content Sections */}
                    <div className="space-y-10">
                      <div id="section-overview">
                        <SmoothSection>
                          <RouteOverview />
                        </SmoothSection>
                      </div>

                      <div id="section-cities">
                        <SmoothSection delay={0.1}>
                          <CitiesSection />
                        </SmoothSection>
                      </div>

                      <div id="section-stay-dine">
                        <SmoothSection delay={0.2}>
                          <StayDineSection />
                        </SmoothSection>
                      </div>

                      <div id="section-itinerary">
                        <SmoothSection delay={0.3}>
                          <ItinerarySection />
                        </SmoothSection>
                      </div>
                    </div>
                  </div>
                </motion.aside>
              </Panel>
            )}
          </AnimatePresence>

          {/* Resize Handle */}
          {!isSidebarCollapsed && (
            <PanelResizeHandle className="w-1 hover:w-2 bg-gray-200 hover:bg-blue-500 transition-all cursor-col-resize" />
          )}

          {/* Map Panel */}
          <Panel className="relative flex-1">
            <MapView />

            {/* Gradient overlay for better visual integration */}
            {!isSidebarCollapsed && (
              <div
                className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none"
                style={{
                  background: `linear-gradient(to right, ${theme.primary}15, transparent)`
                }}
              />
            )}

            {/* Layout Switcher */}
            <LayoutSwitcher />

            {/* Sidebar Toggle */}
            <SidebarToggle />
          </Panel>
        </PanelGroup>
      </div>

      {/* Waze City Selector Modal */}
      <WazeCitySelector
        waypoints={waypoints}
        isOpen={showWazeModal}
        onClose={() => setShowWazeModal(false)}
      />

      {/* Detailed Itinerary Generator */}
      {showItineraryGenerator && (
        <div className="fixed inset-0 z-50 bg-white overflow-y-auto">
          <ItineraryGenerator
            routeData={{
              waypoints: waypoints.map(wp => ({
                city: wp.name,
                country: wp.country || 'France',
                coordinates: wp.coordinates
              })),
              startDate: new Date().toISOString().split('T')[0],
              endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            }}
            agentType={agent}
            preferences={{
              budget: 'mid',
              travelers: 2
            }}
            onBack={() => setShowItineraryGenerator(false)}
          />
        </div>
      )}
    </div>
  )
}

// Main export wrapped with LayoutProvider
export function SpotlightPageComplete() {
  return (
    <LayoutProvider>
      <SpotlightContent />
    </LayoutProvider>
  )
}
