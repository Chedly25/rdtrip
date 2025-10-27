import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, RefreshCw, ArrowRight, MapPin } from 'lucide-react'

interface Activity {
  name?: string
  activity?: string
  difficulty?: number
}

interface City {
  name: string
  activities?: (string | Activity)[]
  image?: string
  imageUrl?: string
  description?: string
  themes?: string[]
}

interface CityActionModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCity: City
  currentRoute: City[]
  agentTheme: { color: string; name: string }
  onAddCity: (position: number) => void
  onReplaceCity: (cityIndexToReplace: number) => void
  origin?: string
  destination?: string
}

type ActionStep = 'choose-action' | 'select-position' | 'select-replacement'

export default function CityActionModal({
  isOpen,
  onClose,
  selectedCity,
  currentRoute,
  agentTheme,
  onAddCity,
  onReplaceCity,
  origin = 'Origin',
  destination = 'Destination'
}: CityActionModalProps) {
  const [step, setStep] = useState<ActionStep>('choose-action')
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null)
  const [selectedReplacement, setSelectedReplacement] = useState<number | null>(null)

  const handleClose = () => {
    setStep('choose-action')
    setSelectedPosition(null)
    setSelectedReplacement(null)
    onClose()
  }

  const handleBack = () => {
    if (step === 'select-position' || step === 'select-replacement') {
      setStep('choose-action')
      setSelectedPosition(null)
      setSelectedReplacement(null)
    }
  }

  const handleConfirmAdd = () => {
    if (selectedPosition !== null) {
      onAddCity(selectedPosition)
      handleClose()
    }
  }

  const handleConfirmReplace = () => {
    if (selectedReplacement !== null) {
      onReplaceCity(selectedReplacement)
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className="relative px-6 py-6 text-white"
                style={{ background: `linear-gradient(135deg, ${agentTheme.color}, ${agentTheme.color}dd)` }}
              >
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 rounded-full p-2 transition-all hover:bg-white/20"
                >
                  <X className="h-5 w-5" />
                </button>

                <h2 className="text-2xl font-bold">Add {selectedCity.name} to Route</h2>
                <p className="mt-1 text-white/90">
                  {step === 'choose-action' && 'Choose how to add this city to your route'}
                  {step === 'select-position' && 'Choose where to insert this city'}
                  {step === 'select-replacement' && 'Choose which city to replace'}
                </p>
              </div>

              {/* Content */}
              <div className="max-h-[calc(90vh-200px)] overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {/* Step 1: Choose Action */}
                  {step === 'choose-action' && (
                    <motion.div
                      key="choose-action"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      {/* City Preview */}
                      <div className="mb-6 rounded-xl border-2 border-gray-200 bg-gray-50 p-4">
                        <div className="flex items-center gap-4">
                          {(selectedCity.image || selectedCity.imageUrl) ? (
                            <img
                              src={selectedCity.image || selectedCity.imageUrl}
                              alt={selectedCity.name}
                              className="h-20 w-20 rounded-lg object-cover"
                            />
                          ) : (
                            <div
                              className="flex h-20 w-20 items-center justify-center rounded-lg"
                              style={{ backgroundColor: `${agentTheme.color}20` }}
                            >
                              <MapPin className="h-8 w-8" style={{ color: agentTheme.color }} />
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900">{selectedCity.name}</h3>
                            {selectedCity.description && (
                              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                                {selectedCity.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Cards */}
                      <button
                        onClick={() => setStep('select-position')}
                        className="group w-full rounded-xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-gray-300 hover:shadow-lg"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="rounded-full p-3"
                            style={{ backgroundColor: `${agentTheme.color}20` }}
                          >
                            <Plus className="h-6 w-6" style={{ color: agentTheme.color }} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900">Add to Route</h4>
                            <p className="mt-1 text-sm text-gray-600">
                              Insert this city at a specific position in your route. Great for adding an extra stop!
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                        </div>
                      </button>

                      <button
                        onClick={() => setStep('select-replacement')}
                        className="group w-full rounded-xl border-2 border-gray-200 bg-white p-6 text-left transition-all hover:border-gray-300 hover:shadow-lg"
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className="rounded-full p-3"
                            style={{ backgroundColor: `${agentTheme.color}20` }}
                          >
                            <RefreshCw className="h-6 w-6" style={{ color: agentTheme.color }} />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-gray-900">Replace a City</h4>
                            <p className="mt-1 text-sm text-gray-600">
                              Swap this city with one currently in your route. The route length stays the same.
                            </p>
                          </div>
                          <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
                        </div>
                      </button>
                    </motion.div>
                  )}

                  {/* Step 2a: Select Position to Add */}
                  {step === 'select-position' && (
                    <motion.div
                      key="select-position"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <p className="mb-4 text-sm text-gray-600">
                        Click on a position to insert <span className="font-semibold">{selectedCity.name}</span>
                      </p>

                      {/* Route Visualization with Insert Positions */}
                      <div className="space-y-3">
                        {/* Origin */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
                            S
                          </div>
                          <div className="flex-1 rounded-lg bg-gray-100 px-4 py-2">
                            <p className="font-semibold text-gray-900">{origin}</p>
                          </div>
                        </div>

                        {/* Insert at beginning button */}
                        <button
                          onClick={() => setSelectedPosition(0)}
                          className={`w-full rounded-lg border-2 p-3 text-center text-sm font-semibold transition-all ${
                            selectedPosition === 0
                              ? 'border-transparent shadow-lg'
                              : 'border-dashed border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                          }`}
                          style={
                            selectedPosition === 0
                              ? { backgroundColor: agentTheme.color, color: 'white' }
                              : {}
                          }
                        >
                          {selectedPosition === 0 ? '✓ ' : '+ '}Insert here (Position 1)
                        </button>

                        {/* Current route cities with insert buttons between */}
                        {currentRoute.map((city, index) => (
                          <div key={index}>
                            {/* City */}
                            <div className="flex items-center gap-3">
                              <div
                                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                                style={{ backgroundColor: agentTheme.color }}
                              >
                                {index + 1}
                              </div>
                              <div className="flex-1 rounded-lg bg-gray-100 px-4 py-2">
                                <p className="font-semibold text-gray-900">{city.name}</p>
                              </div>
                            </div>

                            {/* Insert button after this city */}
                            <button
                              onClick={() => setSelectedPosition(index + 1)}
                              className={`mt-3 w-full rounded-lg border-2 p-3 text-center text-sm font-semibold transition-all ${
                                selectedPosition === index + 1
                                  ? 'border-transparent shadow-lg'
                                  : 'border-dashed border-gray-300 bg-white hover:border-gray-400 hover:bg-gray-50'
                              }`}
                              style={
                                selectedPosition === index + 1
                                  ? { backgroundColor: agentTheme.color, color: 'white' }
                                  : {}
                              }
                            >
                              {selectedPosition === index + 1 ? '✓ ' : '+ '}Insert here (Position {index + 2})
                            </button>
                          </div>
                        ))}

                        {/* Destination */}
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                            E
                          </div>
                          <div className="flex-1 rounded-lg bg-gray-100 px-4 py-2">
                            <p className="font-semibold text-gray-900">{destination}</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2b: Select City to Replace */}
                  {step === 'select-replacement' && (
                    <motion.div
                      key="select-replacement"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-4"
                    >
                      <p className="mb-4 text-sm text-gray-600">
                        Select which city to replace with <span className="font-semibold">{selectedCity.name}</span>
                      </p>

                      {currentRoute.map((city, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedReplacement(index)}
                          className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                            selectedReplacement === index
                              ? 'border-transparent shadow-lg'
                              : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                          }`}
                          style={
                            selectedReplacement === index
                              ? { backgroundColor: `${agentTheme.color}10`, borderColor: agentTheme.color }
                              : {}
                          }
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-full text-white font-bold"
                              style={{ backgroundColor: agentTheme.color }}
                            >
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">{city.name}</p>
                              {city.activities && city.activities.length > 0 && (
                                <p className="mt-1 text-xs text-gray-500">
                                  {city.activities.slice(0, 2).map(a =>
                                    typeof a === 'string' ? a : a.name || a.activity || ''
                                  ).join(' • ')}
                                </p>
                              )}
                            </div>
                            {selectedReplacement === index && (
                              <div className="rounded-full bg-white p-2" style={{ color: agentTheme.color }}>
                                <RefreshCw className="h-5 w-5" />
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer with Actions */}
              <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
                <div className="flex gap-3">
                  {step !== 'choose-action' && (
                    <button
                      onClick={handleBack}
                      className="rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
                    >
                      Back
                    </button>
                  )}
                  <button
                    onClick={handleClose}
                    className="rounded-lg border-2 border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <div className="flex-1" />
                  {step === 'select-position' && (
                    <button
                      onClick={handleConfirmAdd}
                      disabled={selectedPosition === null}
                      className="rounded-lg px-8 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: agentTheme.color }}
                    >
                      Add City to Route
                    </button>
                  )}
                  {step === 'select-replacement' && (
                    <button
                      onClick={handleConfirmReplace}
                      disabled={selectedReplacement === null}
                      className="rounded-lg px-8 py-3 font-semibold text-white shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: agentTheme.color }}
                    >
                      Replace City
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
