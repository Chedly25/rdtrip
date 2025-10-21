import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import { X, Search, MapPin, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { useSearchCities } from '../../hooks/useApi'
import type { City } from '../../types'

interface AddDestinationModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (city: City) => void
  insertIndex: number
}

export function AddDestinationModal({ isOpen, onClose, onAdd, insertIndex }: AddDestinationModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  const { data: searchResults = [], isLoading: isSearching } = useSearchCities(
    debouncedQuery,
    isOpen && debouncedQuery.length > 2
  )

  const handleSearch = () => {
    // Trigger immediate search
    setDebouncedQuery(searchQuery)
  }

  const handleAddCity = (city: City) => {
    onAdd(city)
    setSearchQuery('')
    setDebouncedQuery('')
    onClose()
  }

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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-8 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
              <div>
                <Dialog.Title className="text-2xl font-bold text-gray-900">
                  Add Destination
                </Dialog.Title>
                <Dialog.Description className="mt-1 text-sm text-gray-500">
                  {insertIndex === 0
                    ? 'Add a new starting point'
                    : `Insert after stop #${insertIndex}`}
                </Dialog.Description>
              </div>

              <Dialog.Close asChild>
                <button className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                  <X className="h-5 w-5" />
                </button>
              </Dialog.Close>
            </div>

            {/* Search Input */}
            <div className="mb-6">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search for a city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full rounded-xl border-2 border-gray-200 py-3 pl-12 pr-4 text-sm transition-colors focus:border-primary-500 focus:outline-none"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  isLoading={isSearching}
                  disabled={!searchQuery.trim()}
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Search Results */}
            <AnimatePresence mode="wait">
              {isSearching ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                  <p className="mt-4 text-sm text-gray-500">Searching destinations...</p>
                </motion.div>
              ) : searchResults.length > 0 ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {searchResults.map((city) => (
                    <motion.button
                      key={city.id}
                      onClick={() => handleAddCity(city)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl border-2 border-gray-200 p-4 text-left transition-colors hover:border-primary-500 hover:bg-primary-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500">
                          <MapPin className="h-8 w-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{city.name}</h4>
                          <p className="text-sm text-gray-500">
                            {city.activities.length} activities available
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              ) : searchQuery && !isSearching ? (
                <motion.div
                  key="no-results"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="mb-4 rounded-full bg-gray-100 p-6">
                    <MapPin className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">No destinations found</p>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center py-12"
                >
                  <div className="mb-4 rounded-full bg-gray-100 p-6">
                    <Search className="h-12 w-12 text-gray-400" />
                  </div>
                  <p className="text-sm text-gray-500">Search for a destination to get started</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
