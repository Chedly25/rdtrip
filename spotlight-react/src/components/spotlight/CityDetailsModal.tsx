import { motion } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { X, MapPin, Calendar, Clock, Star } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Waypoint } from '../../types'

interface CityDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  waypoint: Waypoint | null
}

export function CityDetailsModal({ isOpen, onClose, waypoint }: CityDetailsModalProps) {
  if (!waypoint) return null

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
        </Dialog.Overlay>

        <Dialog.Content asChild>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            {/* Hero Image */}
            <div className="relative h-64 w-full overflow-hidden">
              {waypoint.imageUrl ? (
                <img
                  src={waypoint.imageUrl}
                  alt={waypoint.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-500 to-secondary-500">
                  <MapPin className="h-24 w-24 text-white" />
                </div>
              )}

              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

              {/* Title overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <div className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
                      Stop #{waypoint.order}
                    </div>
                    {waypoint.isLandmark && (
                      <div className="rounded-full bg-yellow-400/90 px-3 py-1 text-sm font-medium text-gray-900 backdrop-blur-sm">
                        <Star className="inline h-4 w-4 mr-1" />
                        Landmark
                      </div>
                    )}
                  </div>
                  <h2 className="text-4xl font-bold text-white">{waypoint.name}</h2>
                  {waypoint.description && (
                    <p className="mt-2 text-lg text-white/90">{waypoint.description}</p>
                  )}
                </motion.div>
              </div>

              {/* Close button */}
              <Dialog.Close asChild>
                <button className="absolute right-4 top-4 rounded-lg bg-white/20 p-2 text-white backdrop-blur-sm transition-colors hover:bg-white/30">
                  <X className="h-6 w-6" />
                </button>
              </Dialog.Close>
            </div>

            {/* Content */}
            <div className="max-h-[calc(90vh-16rem)] overflow-y-auto p-8">
              {/* Activities Section */}
              <section className="mb-8">
                <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900">
                  <Calendar className="h-6 w-6 text-primary-500" />
                  Things to Do
                </h3>
                <div className="space-y-3">
                  {waypoint.activities.map((activity, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 rounded-lg border-2 border-gray-100 bg-gray-50 p-4 transition-colors hover:border-primary-200 hover:bg-primary-50"
                    >
                      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-500">
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                      <p className="flex-1 text-gray-700">{activity}</p>
                    </motion.div>
                  ))}
                </div>
              </section>

              {/* Placeholder sections for future features */}
              <section className="mb-8">
                <h3 className="mb-4 flex items-center gap-2 text-2xl font-bold text-gray-900">
                  <Clock className="h-6 w-6 text-primary-500" />
                  Suggested Duration
                </h3>
                <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                  <p className="text-gray-500">Duration information coming soon</p>
                </div>
              </section>

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button className="flex-1" onClick={onClose}>
                  Close
                </Button>
                <Button variant="outline" className="flex-1">
                  Edit Details
                </Button>
              </div>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
