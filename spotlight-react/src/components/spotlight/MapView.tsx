import { useEffect, useRef, useState } from 'react'
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl'
import { Landmark } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStore'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ'

// Mock landmarks data
const mockLandmarks = [
  {
    id: 1,
    name: 'Eiffel Tower',
    coordinates: { lat: 48.8584, lng: 2.2945 },
    type: 'monument',
    icon: '🗼',
  },
  {
    id: 2,
    name: 'Sagrada Familia',
    coordinates: { lat: 41.4036, lng: 2.1744 },
    type: 'cultural',
    icon: '⛪',
  },
  {
    id: 3,
    name: 'Mont Saint-Michel',
    coordinates: { lat: 48.6361, lng: -1.5115 },
    type: 'historic',
    icon: '🏰',
  },
]

export function MapView() {
  const { waypoints } = useSpotlightStore()
  const mapRef = useRef<any>(null)
  const [showLandmarks, setShowLandmarks] = useState(true)
  const [selectedLandmark, setSelectedLandmark] = useState<typeof mockLandmarks[0] | null>(null)

  // Calculate bounds to fit all waypoints
  useEffect(() => {
    if (waypoints.length > 0 && mapRef.current) {
      const bounds: [[number, number], [number, number]] = [
        [
          Math.min(...waypoints.map(wp => wp.coordinates?.lng || 0)),
          Math.min(...waypoints.map(wp => wp.coordinates?.lat || 0))
        ],
        [
          Math.max(...waypoints.map(wp => wp.coordinates?.lng || 0)),
          Math.max(...waypoints.map(wp => wp.coordinates?.lat || 0))
        ]
      ]

      mapRef.current.fitBounds(bounds, {
        padding: 100,
        duration: 1000,
      })
    }
  }, [waypoints])

  // Create route line GeoJSON
  const routeGeoJSON = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: waypoints
        .filter(wp => wp.coordinates)
        .map(wp => [wp.coordinates!.lng, wp.coordinates!.lat])
    }
  }

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: 2.3522,
          latitude: 48.8566,
          zoom: 6
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {/* Route Line */}
        {waypoints.length > 1 && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#667eea',
                'line-width': 4,
                'line-opacity': 0.8,
              }}
            />
          </Source>
        )}

        {/* Waypoint Markers */}
        {waypoints.map((waypoint, index) => {
          if (!waypoint.coordinates) return null

          return (
            <Marker
              key={waypoint.id}
              longitude={waypoint.coordinates.lng}
              latitude={waypoint.coordinates.lat}
              anchor="bottom"
            >
              <div className="group relative cursor-pointer">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="absolute -inset-2 animate-ping rounded-full bg-primary-400 opacity-75" />
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary-500 to-purple-500 text-lg font-bold text-white shadow-lg">
                      {index + 1}
                    </div>
                  </div>
                  <div className="mt-2 max-w-[200px] rounded-lg border border-gray-200 bg-white px-3 py-2 text-center text-sm font-semibold text-gray-900 shadow-lg opacity-0 transition-opacity group-hover:opacity-100">
                    {waypoint.name}
                  </div>
                </div>
              </div>
            </Marker>
          )
        })}

        {/* Landmark Markers */}
        {showLandmarks && mockLandmarks.map((landmark) => (
          <Marker
            key={landmark.id}
            longitude={landmark.coordinates.lng}
            latitude={landmark.coordinates.lat}
            anchor="bottom"
          >
            <button
              onClick={() => setSelectedLandmark(landmark)}
              className="group relative cursor-pointer transition-transform hover:scale-110"
            >
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-lg border-2 border-orange-400 text-xl">
                  {landmark.icon}
                </div>
                {selectedLandmark?.id === landmark.id && (
                  <div className="mt-2 max-w-[160px] rounded-lg border border-orange-200 bg-white px-3 py-2 text-center text-xs font-semibold text-gray-900 shadow-lg">
                    {landmark.name}
                  </div>
                )}
              </div>
            </button>
          </Marker>
        ))}
      </Map>

      {/* Map Controls */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-3">
        <button
          onClick={() => setShowLandmarks(!showLandmarks)}
          className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium shadow-lg transition-colors ${
            showLandmarks
              ? 'border-orange-400 bg-white text-gray-900'
              : 'border-gray-300 bg-white text-gray-600 hover:border-orange-400'
          }`}
        >
          <Landmark className="h-4 w-4" />
          {showLandmarks ? 'Hide' : 'Show'} Landmarks
        </button>
      </div>

      {/* Legend */}
      <div className="absolute right-6 top-6 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
        <h3 className="mb-3 text-sm font-semibold text-gray-900">Map Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
              1
            </div>
            <span className="text-gray-600">Your Route</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-white border-2 border-orange-400 flex items-center justify-center text-base">
              🏰
            </div>
            <span className="text-gray-600">Landmarks</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-0.5 w-6 bg-primary-500"></div>
            <span className="text-gray-600">Route Path</span>
          </div>
        </div>
      </div>
    </div>
  )
}
