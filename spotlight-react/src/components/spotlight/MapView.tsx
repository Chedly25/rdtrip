import { useEffect, useRef, useState, useCallback } from 'react'
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl'
import { Eye, EyeOff } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStore'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ'

// European landmarks with proper icons
const europeanLandmarks = [
  { id: 1, name: 'Eiffel Tower', lat: 48.8584, lng: 2.2945, icon: '🗼', type: 'monument' },
  { id: 2, name: 'Sagrada Familia', lat: 41.4036, lng: 2.1744, icon: '⛪', type: 'cultural' },
  { id: 3, name: 'Mont Saint-Michel', lat: 48.6361, lng: -1.5115, icon: '🏰', type: 'historic' },
  { id: 4, name: 'Colosseum', lat: 41.8902, lng: 12.4922, icon: '🏛️', type: 'historic' },
  { id: 5, name: 'Arc de Triomphe', lat: 48.8738, lng: 2.2950, icon: '🎭', type: 'monument' },
  { id: 6, name: 'Notre Dame', lat: 48.8530, lng: 2.3499, icon: '⛪', type: 'cultural' },
  { id: 7, name: 'Matterhorn', lat: 45.9763, lng: 7.6586, icon: '⛰️', type: 'natural' },
  { id: 8, name: 'Neuschwanstein Castle', lat: 47.5576, lng: 10.7498, icon: '🏰', type: 'historic' },
  { id: 9, name: 'Leaning Tower of Pisa', lat: 43.7230, lng: 10.3966, icon: '🗼', type: 'monument' },
  { id: 10, name: 'Big Ben', lat: 51.4994, lng: -0.1245, icon: '🕰️', type: 'monument' },
]

export function MapView() {
  const { waypoints } = useSpotlightStore()
  const mapRef = useRef<any>(null)
  const [showLandmarks, setShowLandmarks] = useState(true)
  const [selectedLandmark, setSelectedLandmark] = useState<typeof europeanLandmarks[0] | null>(null)
  const [routeGeometry, setRouteGeometry] = useState<any>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)

  // Fetch route from Mapbox Directions API
  const fetchRoute = useCallback(async () => {
    if (waypoints.length < 2) {
      setRouteGeometry(null)
      return
    }

    setIsLoadingRoute(true)

    try {
      // Build coordinates string for Mapbox Directions API
      const coordinates = waypoints
        .filter(wp => wp.coordinates)
        .map(wp => `${wp.coordinates!.lng},${wp.coordinates!.lat}`)
        .join(';')

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
      )

      const data = await response.json()

      if (data.routes && data.routes[0]) {
        setRouteGeometry(data.routes[0].geometry)
      }
    } catch (error) {
      console.error('Error fetching route:', error)
      // Fallback to straight line if API fails
      setRouteGeometry({
        type: 'LineString',
        coordinates: waypoints
          .filter(wp => wp.coordinates)
          .map(wp => [wp.coordinates!.lng, wp.coordinates!.lat])
      })
    } finally {
      setIsLoadingRoute(false)
    }
  }, [waypoints])

  // Fetch route when waypoints change
  useEffect(() => {
    fetchRoute()
  }, [fetchRoute])

  // Fit map to show all waypoints
  useEffect(() => {
    if (waypoints.length > 0 && mapRef.current) {
      const coords = waypoints
        .filter(wp => wp.coordinates)
        .map(wp => [wp.coordinates!.lng, wp.coordinates!.lat])

      if (coords.length > 0) {
        const bounds: [[number, number], [number, number]] = [
          [
            Math.min(...coords.map(c => c[0])),
            Math.min(...coords.map(c => c[1]))
          ],
          [
            Math.max(...coords.map(c => c[0])),
            Math.max(...coords.map(c => c[1]))
          ]
        ]

        mapRef.current.fitBounds(bounds, {
          padding: 100,
          duration: 1000,
        })
      }
    }
  }, [waypoints])

  // Route GeoJSON
  const routeGeoJSON = routeGeometry ? {
    type: 'Feature' as const,
    properties: {},
    geometry: routeGeometry
  } : null

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
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />

        {/* Route Line with Road Routing */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-line-casing"
              type="line"
              paint={{
                'line-color': '#000',
                'line-width': 8,
                'line-opacity': 0.2,
              }}
            />
            <Layer
              id="route-line"
              type="line"
              paint={{
                'line-color': '#667eea',
                'line-width': 5,
                'line-opacity': 0.9,
              }}
            />
          </Source>
        )}

        {/* City Waypoint Markers - Beautiful Design */}
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
                {/* Main Marker Pin */}
                <div className="relative flex flex-col items-center">
                  {/* Animated Pulse Ring */}
                  <div className="absolute top-0 h-12 w-12">
                    <div className="absolute inset-0 animate-ping rounded-full bg-primary-500 opacity-40" />
                  </div>

                  {/* Pin Shape */}
                  <div className="relative z-10">
                    {/* Pin Head */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary-500 to-purple-600 shadow-2xl">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl">📍</span>
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                    </div>
                    {/* Pin Point */}
                    <div className="mx-auto h-3 w-1 bg-gradient-to-b from-purple-600 to-purple-800" />
                    <div className="mx-auto h-2 w-2 rounded-full bg-purple-900 shadow-lg" />
                  </div>

                  {/* Tooltip */}
                  <div className="pointer-events-none absolute -top-16 whitespace-nowrap rounded-lg border-2 border-primary-500 bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-2xl opacity-0 transition-opacity group-hover:opacity-100">
                    <div className="text-center">
                      <div className="text-primary-600">Stop #{index + 1}</div>
                      <div>{waypoint.name}</div>
                    </div>
                    {/* Arrow */}
                    <div className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-primary-500 bg-white" />
                  </div>
                </div>
              </div>
            </Marker>
          )
        })}

        {/* Landmark Markers - Large and Visible */}
        {showLandmarks && europeanLandmarks.map((landmark) => (
          <Marker
            key={landmark.id}
            longitude={landmark.lng}
            latitude={landmark.lat}
            anchor="bottom"
          >
            <button
              onClick={() => setSelectedLandmark(landmark)}
              className="group relative cursor-pointer transition-transform hover:scale-125 hover:z-50"
            >
              <div className="flex flex-col items-center">
                {/* Large Icon Background */}
                <div className="flex h-12 w-12 items-center justify-center rounded-full border-3 border-white bg-gradient-to-br from-orange-400 to-red-500 shadow-2xl">
                  <span className="text-3xl drop-shadow-lg">{landmark.icon}</span>
                </div>
                {/* Small indicator dot */}
                <div className="mt-1 h-2 w-2 rounded-full bg-orange-500 shadow-lg" />

                {/* Mini Label */}
                <div className="pointer-events-none absolute -bottom-8 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {landmark.name}
                </div>
              </div>
            </button>
          </Marker>
        ))}

        {/* Landmark Info Card (shown when landmark selected) */}
        {selectedLandmark && (
          <Marker
            longitude={selectedLandmark.lng}
            latitude={selectedLandmark.lat}
            anchor="bottom"
            
          >
            <div className="rounded-lg border-2 border-orange-500 bg-white p-3 shadow-2xl">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-2xl">{selectedLandmark.icon}</span>
                <div>
                  <h3 className="font-bold text-gray-900">{selectedLandmark.name}</h3>
                  <p className="text-xs text-gray-600 capitalize">{selectedLandmark.type}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLandmark(null)}
                className="w-full rounded bg-primary-500 px-3 py-1 text-xs font-semibold text-white hover:bg-primary-600"
              >
                Close
              </button>
            </div>
          </Marker>
        )}
      </Map>

      {/* Map Controls */}
      <div className="absolute bottom-6 left-6 flex flex-col gap-3">
        <button
          onClick={() => setShowLandmarks(!showLandmarks)}
          className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-bold shadow-2xl transition-all ${
            showLandmarks
              ? 'border-orange-500 bg-white text-gray-900 hover:bg-orange-50'
              : 'border-gray-300 bg-white text-gray-500 hover:border-orange-500'
          }`}
        >
          {showLandmarks ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          <span>{showLandmarks ? 'Hide' : 'Show'} Landmarks</span>
          <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">
            {europeanLandmarks.length}
          </span>
        </button>

        {isLoadingRoute && (
          <div className="flex items-center gap-2 rounded-xl border-2 border-blue-500 bg-white px-4 py-2 text-sm font-semibold text-blue-600 shadow-xl">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            Loading route...
          </div>
        )}
      </div>

      {/* Enhanced Legend */}
      <div className="absolute right-6 top-6 rounded-xl border-2 border-gray-200 bg-white p-5 shadow-2xl">
        <h3 className="mb-4 text-base font-bold text-gray-900">Map Legend</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-primary-500 to-purple-600 text-lg shadow-lg">
              📍
            </div>
            <span className="font-medium text-gray-700">Your Destinations</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-3 border-white bg-gradient-to-br from-orange-400 to-red-500 text-2xl shadow-lg">
              🏰
            </div>
            <span className="font-medium text-gray-700">Famous Landmarks</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-1 w-10 flex-shrink-0 rounded-full bg-gradient-to-r from-primary-500 to-purple-600"></div>
            <span className="font-medium text-gray-700">Driving Route</span>
          </div>
        </div>
      </div>
    </div>
  )
}
