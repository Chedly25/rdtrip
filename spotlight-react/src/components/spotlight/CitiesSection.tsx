import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, MapPin } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStore'
import { SortableCityCard } from './SortableCityCard'
import { AddDestinationModal } from './AddDestinationModal'
import { CityDetailsModal } from './CityDetailsModal'
import { Button } from '../ui/Button'
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
      setSelectedWaypoint(waypoint)
    }
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

      {waypoints.length === 0 ? (
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
                {waypoints.map((waypoint) => (
                  <SortableCityCard
                    key={waypoint.id}
                    waypoint={waypoint}
                    onRemove={removeWaypoint}
                    onClick={() => handleCityClick(waypoint.id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      )}

      <AddDestinationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={(city) => addWaypoint(city, insertIndex)}
        insertIndex={insertIndex}
      />

      <CityDetailsModal
        isOpen={selectedWaypoint !== null}
        onClose={() => setSelectedWaypoint(null)}
        waypoint={selectedWaypoint}
      />
    </div>
  )
}
