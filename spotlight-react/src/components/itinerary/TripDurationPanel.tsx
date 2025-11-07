import { useState } from 'react'
import { Calendar, RefreshCw } from 'lucide-react'
import { CityNightEditor } from './CityNightEditor'

interface CityNight {
  name: string
  nights: number
  country?: string
}

interface TripDurationPanelProps {
  cities: CityNight[]
  onRegenerateItinerary: (nightAllocations: Record<string, number>) => Promise<void>
  themeColor?: string
}

export function TripDurationPanel({
  cities: initialCities,
  onRegenerateItinerary,
  themeColor = '#064d51'
}: TripDurationPanelProps) {
  const [cities, setCities] = useState(initialCities)
  const [regenerating, setRegenerating] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleNightChange = async (cityName: string, newNights: number) => {
    // Update local state
    setCities(prev =>
      prev.map(city =>
        city.name === cityName ? { ...city, nights: newNights } : city
      )
    )
    setHasChanges(true)
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      const nightAllocations = cities.reduce((acc, city) => {
        acc[city.name] = city.nights
        return acc
      }, {} as Record<string, number>)

      await onRegenerateItinerary(nightAllocations)
      setHasChanges(false)
    } catch (error) {
      console.error('Failed to regenerate itinerary:', error)
    } finally {
      setRegenerating(false)
    }
  }

  const totalNights = cities.reduce((sum, city) => sum + city.nights, 0)

  return (
    <div className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-6 shadow-lg">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="h-6 w-6 text-purple-600" />
          <div>
            <h3 className="text-xl font-bold text-gray-900">Trip Duration</h3>
            <p className="text-sm text-gray-600">
              {totalNights} {totalNights === 1 ? 'night' : 'nights'} total • {cities.length} {cities.length === 1 ? 'city' : 'cities'}
            </p>
          </div>
        </div>

        {hasChanges && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-purple-700 hover:shadow-lg disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
            {regenerating ? 'Regenerating...' : 'Regenerate Itinerary'}
          </button>
        )}
      </div>

      {/* Cities Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cities.map((city) => (
          <div
            key={city.name}
            className="rounded-lg border border-purple-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3">
              <h4 className="font-bold text-gray-900">{city.name}</h4>
              {city.country && (
                <p className="text-xs text-gray-500">{city.country}</p>
              )}
            </div>
            <CityNightEditor
              cityName={city.name}
              currentNights={city.nights}
              onNightsChange={(newNights) => handleNightChange(city.name, newNights)}
              themeColor={themeColor}
              label="Edit duration"
              minNights={1}
              maxNights={14}
            />
          </div>
        ))}
      </div>

      {/* Info Message */}
      {hasChanges && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-3">
          <p className="text-sm text-amber-800">
            ⚠️ You've changed the trip duration. Click <strong>"Regenerate Itinerary"</strong> to update your full schedule with the new durations.
          </p>
        </div>
      )}

      {regenerating && (
        <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-sm text-blue-800">
            🔄 Regenerating your itinerary... This may take 30-60 seconds.
          </p>
        </div>
      )}
    </div>
  )
}
