import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface RouteData {
  origin: string | { name: string; country?: string; coordinates?: [number, number] }
  destination: string | { name: string; country?: string; coordinates?: [number, number] }
  totalStops?: number
  budget?: string
}

interface SaveRouteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (name: string) => Promise<void>
  routeData: RouteData | null
}

// Helper function to extract location name (handles both string and object formats)
const getLocationName = (location: any): string => {
  if (!location) return 'Unknown'
  if (typeof location === 'string') return location
  return location.name || location.city || 'Unknown'
}

export default function SaveRouteModal({ isOpen, onClose, onSave, routeData }: SaveRouteModalProps) {
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await onSave(name || getDefaultName())
      setName('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save route')
    } finally {
      setIsLoading(false)
    }
  }

  const getDefaultName = () => {
    if (!routeData) return 'My Route'
    const origin = getLocationName(routeData.origin) || 'Start'
    const destination = getLocationName(routeData.destination) || 'End'
    return `${origin} to ${destination}`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-700"
          >
            {/* Header */}
            <div className="border-b border-slate-700 px-6 py-4">
              <h2 className="text-xl font-semibold text-white">Save Route</h2>
              <p className="text-sm text-slate-400 mt-1">
                Give your route a memorable name
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                {/* Route Name Input */}
                <div>
                  <label htmlFor="routeName" className="block text-sm font-medium text-slate-300 mb-2">
                    Route Name
                  </label>
                  <input
                    id="routeName"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={getDefaultName()}
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Leave blank to use default: "{getDefaultName()}"
                  </p>
                </div>

                {/* Route Info */}
                {routeData && (
                  <div className="bg-slate-800/50 rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Origin:</span>
                      <span className="text-white font-medium">{getLocationName(routeData.origin)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Destination:</span>
                      <span className="text-white font-medium">{getLocationName(routeData.destination)}</span>
                    </div>
                    {routeData.totalStops && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Stops:</span>
                        <span className="text-white font-medium">{routeData.totalStops}</span>
                      </div>
                    )}
                    {routeData.budget && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-400">Budget:</span>
                        <span className="text-white font-medium capitalize">{routeData.budget}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Saving...
                    </>
                  ) : (
                    'Save Route'
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
