import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
import Map, { Marker, NavigationControl, ScaleControl, Source, Layer } from 'react-map-gl/mapbox'
import type { LayerProps } from 'react-map-gl/mapbox'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X } from 'lucide-react'
import 'mapbox-gl/dist/mapbox-gl.css'
import { CityMarker } from './CityMarker'
import { LandmarkMarker } from './LandmarkMarker'

interface City {
  name: string
  country?: string
  coordinates: [number, number] // [lng, lat]
  nights?: number
  image?: string
  description?: string
  highlights?: string[]
}

interface Landmark {
  name: string
  type: 'restaurant' | 'activity' | 'scenic'
  coordinates: [number, number]
  image?: string
  description?: string
}

interface MapViewProps {
  cities: City[]
  landmarks?: Landmark[]
  selectedCity?: City | null
  onCitySelect?: (city: City | null) => void
  className?: string
}

// Monochrome Mapbox style - clean and minimal
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiY2hlZGx5YnBzIiwiYSI6ImNsZGh5MWZ3azA4OTgzb3Vqc2xrYjRobWYifQ.KN4yYZLHLMo5Hv5jRGxv6w'

const MAP_STYLE = 'mapbox://styles/mapbox/light-v11' // Clean monochrome style

export function MapView({
  cities,
  landmarks = [],
  selectedCity,
  onCitySelect,
  className = ''
}: MapViewProps) {
  const mapRef = useRef<any>(null)
  const [viewState, setViewState] = useState({
    longitude: cities[0]?.coordinates[0] || 0,
    latitude: cities[0]?.coordinates[1] || 0,
    zoom: 5,
    pitch: 0,
    bearing: 0
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleMove = (evt: any) => setViewState(evt.viewState)

  // Calculate bounds to fit all cities
  useEffect(() => {
    if (cities.length > 0 && mapRef.current) {
      const bounds = cities.reduce(
        (acc, city) => {
          return {
            minLng: Math.min(acc.minLng, city.coordinates[0]),
            maxLng: Math.max(acc.maxLng, city.coordinates[0]),
            minLat: Math.min(acc.minLat, city.coordinates[1]),
            maxLat: Math.max(acc.maxLat, city.coordinates[1])
          }
        },
        {
          minLng: cities[0].coordinates[0],
          maxLng: cities[0].coordinates[0],
          minLat: cities[0].coordinates[1],
          maxLat: cities[0].coordinates[1]
        }
      )

      mapRef.current?.fitBounds(
        [
          [bounds.minLng, bounds.minLat],
          [bounds.maxLng, bounds.maxLat]
        ],
        {
          padding: 100,
          duration: 1000
        }
      )
    }
  }, [cities])

  const handleCityClick = useCallback(
    (city: City) => {
      onCitySelect?.(city)
      // Fly to city
      mapRef.current?.flyTo({
        center: city.coordinates,
        zoom: 12,
        duration: 1500,
        essential: true
      })
    },
    [onCitySelect]
  )

  // Create GeoJSON for route line connecting all cities
  const routeGeoJSON = useMemo(() => {
    if (cities.length < 2) return null

    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: cities.map(city => city.coordinates)
      }
    }
  }, [cities])

  // Route line layer style
  const routeLayerStyle: LayerProps = {
    id: 'route-line',
    type: 'line',
    paint: {
      'line-color': '#191C1F',
      'line-width': 3,
      'line-opacity': 0.8
    },
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    }
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        mapStyle={MAP_STYLE}
        mapboxAccessToken={MAPBOX_TOKEN}
        style={{ width: '100%', height: '100%' }}
        maxZoom={16}
        minZoom={3}
        attributionControl={false}
        logoPosition="bottom-right"
      >
        {/* Route Line */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer {...routeLayerStyle} />
          </Source>
        )}

        {/* City Markers */}
        {cities.map((city, index) => (
          <Marker
            key={`city-${city.name}-${index}`}
            longitude={city.coordinates[0]}
            latitude={city.coordinates[1]}
            anchor="bottom"
          >
            <CityMarker
              city={city}
              index={index + 1}
              isSelected={selectedCity?.name === city.name}
              onClick={() => handleCityClick(city)}
            />
          </Marker>
        ))}

        {/* Landmark Markers */}
        {landmarks.map((landmark, index) => (
          <Marker
            key={`landmark-${landmark.name}-${index}`}
            longitude={landmark.coordinates[0]}
            latitude={landmark.coordinates[1]}
            anchor="center"
          >
            <LandmarkMarker landmark={landmark} />
          </Marker>
        ))}

        {/* Map Controls */}
        <NavigationControl position="top-right" showCompass={false} />
        <ScaleControl position="bottom-right" />
      </Map>

      {/* Selected City Info Card */}
      <AnimatePresence>
        {selectedCity && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 w-96 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 p-6 z-10"
          >
            <button
              onClick={() => onCitySelect?.(null)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            {selectedCity.image && (
              <div className="w-full h-40 rounded-xl overflow-hidden mb-4">
                <img
                  src={selectedCity.image}
                  alt={selectedCity.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-1">
                  {selectedCity.name}
                </h3>
                {selectedCity.country && (
                  <p className="text-sm text-gray-500">{selectedCity.country}</p>
                )}
                {selectedCity.nights !== undefined && (
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedCity.nights} {selectedCity.nights === 1 ? 'night' : 'nights'}
                  </p>
                )}
              </div>
            </div>

            {selectedCity.description && (
              <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                {selectedCity.description}
              </p>
            )}

            {selectedCity.highlights && selectedCity.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedCity.highlights.map((highlight, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
