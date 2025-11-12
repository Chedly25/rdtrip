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
  duration?: string
  image?: string
  themes?: string[]
  themesDisplay?: string
  currentEvents?: string
  country?: string
  // New format from RouteDiscoveryAgentV2 uses 'city' instead of 'name'
  city?: string
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

// Collaboration types (Phase 2)
export interface Collaborator {
  id: string
  userId: string
  name: string
  email: string
  avatar?: string
  role: 'owner' | 'editor' | 'viewer'
  status: 'pending' | 'accepted' | 'rejected'
  invitedAt: string
  invitedBy?: string
  presence?: PresenceStatus
}

export interface PresenceStatus {
  userId: string
  status: 'viewing' | 'editing' | 'idle' | 'offline'
  currentSection?: string
  lastSeenAt: string
}

export interface TripMessage {
  id: string
  routeId: string
  userId: string
  userName: string
  userAvatar?: string
  message: string
  messageType: 'text' | 'system' | 'notification'
  reactions?: Array<{ emoji: string; userId: string }>
  createdAt: string
  updatedAt?: string
}

export interface RouteActivity {
  id: string
  routeId: string
  userId: string
  userName: string
  userAvatar?: string
  action: string
  description: string
  metadata?: Record<string, any>
  createdAt: string
}
