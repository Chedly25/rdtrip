import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useSpotlightStore } from '../../stores/spotlightStore'
import { SortableCityCard } from './SortableCityCard'
import { AddStopButton } from './AddStopButton'
import { AddDestinationModal } from './AddDestinationModal'
import { CityDetailsModal } from './CityDetailsModal'
import { Button } from '../ui/Button'
import { MapPin, Plus, Download } from 'lucide-react'
import type { Waypoint } from '../../types'

export function SpotlightPage() {
  const { waypoints, addWaypoint, removeWaypoint, setWaypoints } = useSpotlightStore()
  const [showAddModal, setShowAddModal] = useState(false)
  const [insertIndex, setInsertIndex] = useState<number>(0)
  const [selectedWaypoint, setSelectedWaypoint] = useState<Waypoint | null>(null)

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

  const handleAddStop = (index: number) => {
    setInsertIndex(index)
    setShowAddModal(true)
  }

  const handleCityClick = (waypointId: string) => {
    const waypoint = waypoints.find(wp => wp.id === waypointId)
    if (waypoint) {
      setSelectedWaypoint(waypoint)
    }
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 p-2">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Road Trip Spotlight</h1>
                <p className="text-sm text-gray-500">Plan your perfect journey</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex gap-3"
            >
              <Button variant="outline" size="default">
                <Download className="h-4 w-4" />
                Export
              </Button>
              <Button variant="default" onClick={() => handleAddStop(waypoints.length)}>
                <Plus className="h-4 w-4" />
                Add Destination
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="mb-2 text-3xl font-bold text-gray-900">Cities & Highlights</h2>
          <p className="text-gray-600">
            {waypoints.length} {waypoints.length === 1 ? 'stop' : 'stops'} on your journey
          </p>
        </motion.div>

        {/* Cities Grid */}
        <div className="space-y-6">
          {/* Add stop button at the beginning */}
          <AddStopButton onAdd={() => handleAddStop(0)} position="before" />

          {waypoints.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-white p-16 text-center"
            >
              <div className="mb-4 rounded-full bg-gray-100 p-6">
                <MapPin className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="mb-2 text-xl font-semibold text-gray-900">No destinations yet</h3>
              <p className="mb-6 text-gray-500">Add your first stop to start planning your trip</p>
              <Button onClick={() => handleAddStop(0)}>
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
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {waypoints.map((waypoint, index) => (
                      <div key={waypoint.id} className="space-y-6">
                        <SortableCityCard
                          waypoint={waypoint}
                          onRemove={removeWaypoint}
                          onClick={() => handleCityClick(waypoint.id)}
                        />

                        {/* Add stop button after each city (except last) */}
                        {index < waypoints.length - 1 && (
                          <AddStopButton
                            onAdd={() => handleAddStop(index + 1)}
                            position="after"
                          />
                        )}
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          )}

          {/* Add stop button at the end (if there are waypoints) */}
          {waypoints.length > 0 && (
            <AddStopButton
              onAdd={() => handleAddStop(waypoints.length)}
              position="after"
            />
          )}
        </div>
      </main>

      {/* Add Destination Modal */}
      <AddDestinationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(city) => addWaypoint(city, insertIndex)}
        insertIndex={insertIndex}
      />

      {/* City Details Modal */}
      <CityDetailsModal
        isOpen={selectedWaypoint !== null}
        onClose={() => setSelectedWaypoint(null)}
        waypoint={selectedWaypoint}
      />
    </div>
  )
}
