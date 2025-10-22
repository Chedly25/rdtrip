import { useEffect, useRef, useState, useCallback } from 'react'
import Map, { Marker, Source, Layer, NavigationControl } from 'react-map-gl'
import { Eye, EyeOff } from 'lucide-react'
import { useSpotlightStore } from '../../stores/spotlightStore'
import { useRouteDataStore } from '../../stores/routeDataStore'
import { europeanLandmarks } from '../../data/landmarks'
import { getTheme } from '../../config/theme'
import 'mapbox-gl/dist/mapbox-gl.css'

const MAPBOX_TOKEN = 'pk.eyJ1IjoiY2hlZGx5MjUiLCJhIjoiY21lbW1qeHRoMHB5azJsc2VuMWJld2tlYSJ9.0jfOiOXCh0VN5ZjJ5ab7MQ'

export function MapView() {
  const { waypoints } = useSpotlightStore()
  const { routeData } = useRouteDataStore()
  const mapRef = useRef<any>(null)

  // Get theme colors based on agent type
  const agent = routeData?.agent || 'adventure'
  const theme = getTheme(agent)
  const [showLandmarks, setShowLandmarks] = useState(true)
  const [selectedLandmark, setSelectedLandmark] = useState<typeof europeanLandmarks[0] | null>(null)
  const [routeGeometry, setRouteGeometry] = useState<any>(null)
  const [isLoadingRoute, setIsLoadingRoute] = useState(false)

  // Fetch route from Mapbox Directions API
  const fetchRoute = useCallback(async () => {
    if (waypoints.length < 2) {
      console.log('Not enough waypoints to fetch route:', waypoints.length)
      setRouteGeometry(null)
      return
    }

    setIsLoadingRoute(true)
    console.log('Fetching route for waypoints:', waypoints)

    try {
      // Build coordinates string for Mapbox Directions API
      const coordinates = waypoints
        .filter(wp => wp.coordinates)
        .map(wp => `${wp.coordinates!.lng},${wp.coordinates!.lat}`)
        .join(';')

      console.log('Mapbox API coordinates:', coordinates)

      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`
      )

      const data = await response.json()
      console.log('Mapbox API response:', data)

      if (data.routes && data.routes[0]) {
        console.log('Setting route geometry:', data.routes[0].geometry)
        setRouteGeometry(data.routes[0].geometry)
      } else {
        console.warn('No routes found in Mapbox response')
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
                'line-color': theme.primary,
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
                    <div
                      className="absolute inset-0 animate-ping rounded-full opacity-40"
                      style={{ backgroundColor: theme.primary }}
                    />
                  </div>

                  {/* Pin Shape */}
                  <div className="relative z-10">
                    {/* Pin Head */}
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white shadow-2xl"
                      style={{ background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary})` }}
                    >
                      <div className="flex flex-col items-center">
                        <span className="text-2xl">📍</span>
                        <span className="text-xs font-bold text-white">{index + 1}</span>
                      </div>
                    </div>
                    {/* Pin Point */}
                    <div
                      className="mx-auto h-3 w-1"
                      style={{ background: `linear-gradient(to bottom, ${theme.primary}, ${theme.primary})` }}
                    />
                    <div className="mx-auto h-2 w-2 rounded-full shadow-lg" style={{ backgroundColor: theme.primary }} />
                  </div>

                  {/* Tooltip */}
                  <div
                    className="pointer-events-none absolute -top-16 whitespace-nowrap rounded-lg border-2 bg-white px-4 py-2 text-sm font-bold text-gray-900 shadow-2xl opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ borderColor: theme.primary }}
                  >
                    <div className="text-center">
                      <div style={{ color: theme.primary }}>Stop #{index + 1}</div>
                      <div>{waypoint.name}</div>
                    </div>
                    {/* Arrow */}
                    <div
                      className="absolute -bottom-2 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 bg-white"
                      style={{ borderColor: theme.primary }}
                    />
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
              className="group relative cursor-pointer transition-transform hover:scale-110 hover:z-50"
            >
              <div className="flex flex-col items-center">
                {/* Landmark PNG Icon - Direct with transparent background */}
                <img
                  src={landmark.image_url}
                  alt={landmark.name}
                  className="h-12 w-12 object-contain drop-shadow-2xl"
                />
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
                <img
                  src={selectedLandmark.image_url}
                  alt={selectedLandmark.name}
                  className="h-10 w-10 flex-shrink-0 object-contain"
                />
                <div>
                  <h3 className="font-bold text-gray-900">{selectedLandmark.name}</h3>
                  <p className="text-xs text-gray-600 capitalize">{selectedLandmark.type}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLandmark(null)}
                className="w-full rounded px-3 py-1 text-xs font-semibold text-white transition-opacity hover:opacity-80"
                style={{ backgroundColor: theme.primary }}
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
            <div
              className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-4 border-white text-lg shadow-lg"
              style={{ background: `linear-gradient(to bottom right, ${theme.primary}, ${theme.secondary})` }}
            >
              📍
            </div>
            <span className="font-medium text-gray-700">Your Destinations</span>
          </div>
          <div className="flex items-center gap-3">
            <img
              src="/images/landmarks/eiffel_tower.png"
              alt="Landmark example"
              className="h-10 w-10 flex-shrink-0 object-contain"
            />
            <span className="font-medium text-gray-700">Famous Landmarks</span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="h-1 w-10 flex-shrink-0 rounded-full"
              style={{ background: `linear-gradient(to right, ${theme.primary}, ${theme.secondary})` }}
            ></div>
            <span className="font-medium text-gray-700">Driving Route</span>
          </div>
        </div>
      </div>
    </div>
  )
}
