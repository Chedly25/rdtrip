import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, MapPin, RefreshCw } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStore'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { CityCardNew } from './CityCardNew'
import { AddDestinationModal } from './AddDestinationModal'
import CityDetailModal from './CityDetailModal'
import { Button } from '../ui/Button'
import { SkeletonCard } from '../ui/Skeleton'
import { getTheme } from '../../config/theme'
import Masonry from 'react-masonry-css'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import type { Waypoint } from '../../types'

// Define masonry breakpoints
const breakpointColumns = {
  default: 2,  // 2 columns by default
  1400: 2,     // 2 columns on medium screens
  1100: 1      // 1 column on small screens
}

export function CitiesSection() {
  const { waypoints, addWaypoint, removeWaypoint, setWaypoints } = useSpotlightStore()
  const { routeData } = useRouteDataStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [insertIndex, setInsertIndex] = useState<number>(0)
  const [selectedCityName, setSelectedCityName] = useState<string | null>(null)
  const [showCityDetailModal, setShowCityDetailModal] = useState(false)

  // Get alternatives from route data
  const alternatives = routeData?.alternatives || []
  const agent = routeData?.agent || 'adventure'
  const theme = getTheme(agent)

  // Loading state (waypoints are being fetched)
  const [isLoading] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      const oldIndex = waypoints.findIndex((wp) => wp.id === active.id)
      const newIndex = waypoints.findIndex((wp) => wp.id === over.id)

      const reorderedWaypoints = arrayMove(waypoints, oldIndex, newIndex).map((wp, idx) => ({
        ...wp,
        order: idx + 1,
      }))

      setWaypoints(reorderedWaypoints)
    }
  }

  const handleSwapCity = (waypointIndex: number, alternativeCity: any) => {
    // Convert alternative city to waypoint format
    const newWaypoint: Waypoint = {
      id: `waypoint-${Date.now()}`,
      order: waypointIndex + 1,
      name: alternativeCity.name,
      description: alternativeCity.description || '',
      activities: alternativeCity.activities || [],
      duration: alternativeCity.duration || '1-2 days',
      coordinates: alternativeCity.latitude && alternativeCity.longitude
        ? { lat: alternativeCity.latitude, lng: alternativeCity.longitude }
        : undefined,
      image: alternativeCity.image || alternativeCity.imageUrl,
      themes: alternativeCity.themes,
      themesDisplay: alternativeCity.themesDisplay,
      currentEvents: alternativeCity.currentEvents
    }

    // Replace the waypoint at the specified index
    const updatedWaypoints = [...waypoints]
    updatedWaypoints[waypointIndex] = newWaypoint
    setWaypoints(updatedWaypoints)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Cities & Highlights</h2>
        <Button
          onClick={() => {
            setInsertIndex(waypoints.length)
            setShowAddModal(true)
          }}
          size="sm"
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Destination
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : waypoints.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center"
        >
          <MapPin className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">No destinations yet</h3>
          <p className="mb-4 text-sm text-gray-600">
            Start planning your route by adding your first destination
          </p>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add First Destination
          </Button>
        </motion.div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={waypoints.map(wp => wp.id)}
            strategy={verticalListSortingStrategy}
          >
            <Masonry
              breakpointCols={breakpointColumns}
              className="flex -ml-4 w-auto"
              columnClassName="pl-4 bg-clip-padding"
            >
              {waypoints.map((waypoint, index) => (
                <div key={waypoint.id} className="mb-4">
                  {/* New City Card with Masonry Layout */}
                  <CityCardNew
                    city={waypoint}
                    index={index}
                    onDelete={() => removeWaypoint(waypoint.id)}
                  />

                  {/* Add Stop Button Between Cards */}
                  {index < waypoints.length - 1 && (
                    <motion.button
                      className="w-full mt-4 py-3 rounded-xl border-2 border-dashed border-gray-300 hover:border-purple-400 hover:bg-purple-50 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setInsertIndex(index + 1)
                        setShowAddModal(true)
                      }}
                    >
                      <span className="text-gray-500 hover:text-purple-600">
                        + Add stop here
                      </span>
                    </motion.button>
                  )}
                </div>
              ))}
            </Masonry>
          </SortableContext>
        </DndContext>
      )}

      {/* Alternatives Section */}
      {alternatives.length > 0 && waypoints.length > 0 && (
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6" style={{ color: theme.primary }} />
            <h3 className="text-2xl font-bold text-gray-900">
              Alternative Suggestions
            </h3>
          </div>
          <p className="text-gray-600">
            These cities were also considered for your route. Click swap to replace a city in your route.
          </p>

          <div className="grid grid-cols-3 gap-4">
            {alternatives.slice(0, 3).map((altCity: any, altIndex: number) => {
              // Convert alternative to Waypoint format for CityCardNew
              const altWaypoint = {
                id: `alt-${altIndex}`,
                order: altIndex + 1,
                name: altCity.name,
                description: altCity.description || '',
                activities: altCity.activities || [],
                duration: altCity.duration || '1-2 days',
                coordinates: altCity.latitude && altCity.longitude
                  ? { lat: altCity.latitude, lng: altCity.longitude }
                  : undefined,
                imageUrl: altCity.image || altCity.imageUrl,
                themes: altCity.themes,
                themesDisplay: altCity.themesDisplay,
                currentEvents: altCity.currentEvents
              }

              return (
                <CityCardNew
                  key={altIndex}
                  city={altWaypoint}
                  index={altIndex}
                  isAlternative
                  onSwap={() => {
                    // Show modal or dropdown to select which city to replace
                    const cityToReplace = window.prompt(
                      `Enter the number of the city to replace with ${altCity.name}:\n` +
                      waypoints.map((wp, idx) => `${idx + 1}. ${wp.name}`).join('\n')
                    )
                    const waypointIndex = parseInt(cityToReplace || '') - 1
                    if (!isNaN(waypointIndex) && waypointIndex >= 0 && waypointIndex < waypoints.length) {
                      handleSwapCity(waypointIndex, altCity)
                    }
                  }}
                />
              )
            })}
          </div>
        </div>
      )}

      <AddDestinationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(city) => addWaypoint(city, insertIndex)}
        insertIndex={insertIndex}
      />

      {selectedCityName && (
        <CityDetailModal
          isOpen={showCityDetailModal}
          onClose={() => {
            setShowCityDetailModal(false)
            setSelectedCityName(null)
          }}
          cityName={selectedCityName}
          themeColor={theme.primary}
        />
      )}
    </div>
  )
}
