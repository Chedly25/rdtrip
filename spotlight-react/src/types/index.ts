export interface City {
  id: string
  name: string
  description?: string
  activities: string[]
  imageUrl?: string
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface Waypoint extends City {
  order: number
  isLandmark?: boolean
}

export interface Route {
  origin: string
  destination: string
  waypoints: Waypoint[]
  tripStyle?: string
  totalDistance?: number
  totalDuration?: number
}

export interface SpotlightData {
  route: Route
  cities: City[]
  landmarks: City[]
  hotels?: Hotel[]
  restaurants?: Restaurant[]
}

export interface Hotel {
  id: string
  name: string
  address: string
  rating?: number
  priceRange?: string
  imageUrl?: string
}

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  rating?: number
  priceRange?: string
  imageUrl?: string
}
