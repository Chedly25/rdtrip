import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CityData } from '../types'

interface CitySelectorProps {
  value: CityData | null
  placeholder: string
  onCitySelect: (city: CityData) => void
  error?: string | null
  label: string
}

export function CitySelector({ value, placeholder, onCitySelect, error, label }: CitySelectorProps) {
  const [input, setInput] = useState(value?.displayName || '')
  const [suggestions, setSuggestions] = useState<CityData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState<CityData | null>(value)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Update input when value changes externally
    if (value) {
      setInput(value.displayName)
      setSelectedCity(value)
    }
  }, [value])

  useEffect(() => {
    if (input.length < 2) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    // Don't search if we already have this city selected
    if (selectedCity && input === selectedCity.displayName) {
      return
    }

    // Debounce geocoding requests
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    debounceTimer.current = setTimeout(() => {
      fetchCitySuggestions(input)
    }, 300)

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [input, selectedCity])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const fetchCitySuggestions = async (query: string) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/geocode/autocomplete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      })

      const data = await response.json()

      if (data.cities) {
        setSuggestions(data.cities)
        setIsOpen(true)
      }
    } catch (error) {
      console.error('Failed to fetch city suggestions:', error)
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  const handleCitySelect = (city: CityData) => {
    setSelectedCity(city)
    setInput(city.displayName)
    setIsOpen(false)
    setSuggestions([])
    onCitySelect(city)
  }

  const handleInputChange = (value: string) => {
    setInput(value)
    // Clear selected city if input changes
    if (selectedCity && value !== selectedCity.displayName) {
      setSelectedCity(null)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={`
            w-full rounded-xl border-2 pl-12 pr-12 py-4 text-lg
            transition-all duration-200
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
              : selectedCity
              ? 'border-green-300 focus:border-green-500 focus:ring-green-100'
              : 'border-gray-200 focus:border-blue-500 focus:ring-blue-100'
            }
            focus:outline-none focus:ring-4
          `}
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-blue-500" />
        )}
        {selectedCity && !isLoading && (
          <MapPin className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-green-500" />
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl"
          >
            <div className="max-h-64 overflow-y-auto p-2">
              {suggestions.map((city, index) => (
                <button
                  key={`${city.name}-${city.country}-${index}`}
                  onClick={() => handleCitySelect(city)}
                  className="w-full rounded-lg px-4 py-3 text-left transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{city.name}</p>
                      <p className="text-sm text-gray-500 truncate">{city.country}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No results message */}
      {!isLoading && input.length >= 2 && suggestions.length === 0 && isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute z-50 mt-2 w-full rounded-xl border border-gray-200 bg-white shadow-xl p-4"
        >
          <p className="text-sm text-gray-500 text-center">
            No cities found. Try a different spelling.
          </p>
        </motion.div>
      )}
    </div>
  )
}
