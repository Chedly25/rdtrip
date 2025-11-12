export type AgentType = 'adventure' | 'culture' | 'food' | 'hidden-gems'
export type BudgetLevel = 'budget' | 'moderate' | 'comfort' | 'luxury'
export type TripPace = 'leisurely' | 'balanced' | 'fast-paced'

// City data with coordinates for flexible origin/destination
export interface CityData {
  name: string
  country: string
  coordinates: [number, number] // [latitude, longitude]
  displayName: string // e.g., "Berlin, Germany"
}

export interface RouteFormData {
  origin: CityData | null
  destination: CityData | null
  budget: BudgetLevel
  agents: AgentType[]
  totalNights: number
  tripPace: TripPace
}

export interface RouteResult {
  id: string
  route: any
  spotlightData: any
}

// Marketplace types (Phase 4)
export type DifficultyLevel = 'easy' | 'moderate' | 'challenging'
export type RouteSeason = 'spring' | 'summer' | 'fall' | 'winter' | 'year-round'
export type PublishedRouteStatus = 'draft' | 'published' | 'unlisted' | 'archived'
export type TraveledWith = 'solo' | 'couple' | 'family' | 'friends' | 'group'

export interface PublishedRoute {
  id: string
  routeId: string
  userId: string
  title: string
  description: string
  coverImageUrl?: string
  difficultyLevel: DifficultyLevel
  durationDays: number
  totalDistanceKm: number
  citiesVisited: string[]
  countriesVisited: string[]
  primaryStyle: string
  tags: string[]
  bestSeason: RouteSeason
  isPremium: boolean
  price?: number
  currency: string
  viewCount: number
  cloneCount: number
  rating: number
  reviewCount: number
  status: PublishedRouteStatus
  featured: boolean
  slug: string
  metaDescription?: string
  isModerated: boolean
  moderatedAt?: string
  moderatedBy?: string
  createdAt: string
  updatedAt: string
  authorName?: string
  authorEmail?: string
  authorAvatar?: string
}

export interface RouteReview {
  id: string
  publishedRouteId: string
  userId: string
  rating: number
  title?: string
  comment: string
  helpfulCount: number
  notHelpfulCount: number
  tripCompletedAt?: string
  traveledWith?: TraveledWith
  isVerified: boolean
  isFlagged: boolean
  flaggedReason?: string
  createdAt: string
  updatedAt: string
  userName?: string
  userAvatar?: string
}

export interface MarketplaceFilters {
  style: string
  duration: string
  difficulty: string
  season: string
  sortBy: 'popular' | 'recent' | 'rating' | 'clones'
}

export interface MarketplaceRoutesResponse {
  routes: PublishedRoute[]
  total: number
  page: number
  pageSize: number
}

export interface RouteDetailResponse {
  route: PublishedRoute
  reviews: RouteReview[]
  isClonedByUser: boolean
  userReview?: RouteReview
}
