import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { CityData } from '../../types'

// Revolut easing
const ruiEasing = [0.15, 0.5, 0.5, 1] as const

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

    if (selectedCity && input === selectedCity.displayName) {
      return
    }

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
    if (selectedCity && value !== selectedCity.displayName) {
      setSelectedCity(null)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <label className="block text-sm font-semibold text-rui-black mb-2">
        {label}
      </label>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rui-grey-50 pointer-events-none z-10" />
        <input
          type="text"
          value={input}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setIsOpen(true)}
          placeholder={placeholder}
          className={`
            w-full rounded-rui-12 border-2 pl-12 pr-12 py-3.5 text-base
            bg-rui-grey-2 text-rui-black placeholder-rui-grey-50
            transition-all duration-rui-sm ease-rui-default
            focus:bg-rui-white focus:outline-none
            ${error
              ? 'border-danger focus:border-danger'
              : selectedCity
              ? 'border-success focus:border-success'
              : 'border-transparent focus:border-rui-grey-20'
            }
          `}
        />
        {isLoading && (
          <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-rui-accent" />
        )}
        {selectedCity && !isLoading && (
          <MapPin className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-success" />
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-danger">{error}</p>
      )}

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {isOpen && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: ruiEasing }}
            className="absolute z-50 mt-2 w-full rounded-rui-16 border border-rui-grey-10 bg-rui-white shadow-rui-3 overflow-hidden"
          >
            <div className="max-h-64 overflow-y-auto p-1.5">
              {suggestions.map((city, index) => (
                <button
                  type="button"
                  key={`${city.name}-${city.country}-${index}`}
                  onClick={() => handleCitySelect(city)}
                  className="w-full rounded-rui-12 px-4 py-3 text-left transition-colors duration-rui-sm hover:bg-rui-grey-2 focus:bg-rui-grey-2 focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-rui-8 bg-rui-grey-5 flex-shrink-0">
                      <MapPin className="h-4 w-4 text-rui-grey-50" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-rui-black truncate">{city.name}</p>
                      <p className="text-sm text-rui-grey-50 truncate">{city.country}</p>
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
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: ruiEasing }}
          className="absolute z-50 mt-2 w-full rounded-rui-16 border border-rui-grey-10 bg-rui-white shadow-rui-3 p-4"
        >
          <p className="text-sm text-rui-grey-50 text-center">
            No cities found. Try a different spelling.
          </p>
        </motion.div>
      )}
    </div>
  )
}
