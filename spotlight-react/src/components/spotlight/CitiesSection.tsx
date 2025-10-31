import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, MapPin, RefreshCw } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStore'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { SortableCityCard } from './SortableCityCard'
import { AddDestinationModal } from './AddDestinationModal'
import CityDetailModal from './CityDetailModal'
import { AddStopButton } from './AddStopButton'
import { Button } from '../ui/Button'
import { SkeletonCard } from '../ui/Skeleton'
import { getTheme } from '../../config/theme'
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

  const handleCityClick = (waypointId: string) => {
    const waypoint = waypoints.find(wp => wp.id === waypointId)
    if (waypoint) {
      setSelectedCityName(waypoint.name)
      setShowCityDetailModal(true)
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
            <div className="space-y-4">
              <AnimatePresence mode="popLayout">
                {waypoints.map((waypoint, index) => (
                  <div key={waypoint.id}>
                    {/* City Card */}
                    <SortableCityCard
                      waypoint={waypoint}
                      onRemove={removeWaypoint}
                      onClick={() => handleCityClick(waypoint.id)}
                      index={index}
                    />

                    {/* Add Stop Button - appears between cities on hover */}
                    {index < waypoints.length - 1 && (
                      <div className="py-3">
                        <AddStopButton
                          onAdd={() => {
                            setInsertIndex(index + 1)
                            setShowAddModal(true)
                          }}
                          position="after"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Alternatives Section */}
      {alternatives.length > 0 && waypoints.length > 0 && (
        <div className="mt-12 space-y-6">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6" style={{ color: theme.primary }} />
            <h3 className="text-2xl font-bold text-gray-900">
              Alternative Cities ({alternatives.length})
            </h3>
          </div>
          <p className="text-gray-600">
            These cities were also considered for your route. Click a city card and select which city to replace.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {alternatives.map((altCity: any, altIndex: number) => (
              <motion.div
                key={altIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: altIndex * 0.1 }}
                className="group relative overflow-hidden rounded-xl bg-white shadow-lg transition-all hover:shadow-xl"
              >
                {/* City Image */}
                {altCity.image && (
                  <div className="relative h-48 overflow-hidden">
                    <img
                      src={altCity.image}
                      alt={altCity.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-110"
                    />
                    {/* Theme Badges */}
                    {altCity.themes && altCity.themes.length > 0 && (
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        {altCity.themes.map((themeName: string) => (
                          <span
                            key={themeName}
                            className="rounded-full bg-black/50 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
                          >
                            {themeName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* City Content */}
                <div className="p-6">
                  <h4 className="mb-2 text-xl font-bold text-gray-900">{altCity.name}</h4>
                  {altCity.description && (
                    <p className="mb-4 line-clamp-3 text-sm text-gray-600">{altCity.description}</p>
                  )}

                  {/* Activities */}
                  {altCity.activities && altCity.activities.length > 0 && (
                    <div className="mb-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Highlights
                      </p>
                      <ul className="space-y-1">
                        {altCity.activities.slice(0, 3).map((activity: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full" style={{ backgroundColor: theme.primary }}></span>
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Swap Dropdown and Button */}
                  <div className="space-y-2">
                    <select
                      className="w-full rounded-lg border-2 border-gray-300 p-3 text-sm font-semibold text-gray-700 transition-all hover:border-gray-400 focus:border-indigo-500 focus:outline-none"
                      onChange={(e) => {
                        const waypointIndex = parseInt(e.target.value)
                        if (!isNaN(waypointIndex)) {
                          handleSwapCity(waypointIndex, altCity)
                          e.target.value = '' // Reset selection
                        }
                      }}
                      defaultValue=""
                    >
                      <option value="" disabled>
                        Replace which city?
                      </option>
                      {waypoints.map((wp, wpIndex) => (
                        <option key={wp.id} value={wpIndex}>
                          Replace {wp.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            ))}
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
