// Legacy type - kept for backward compatibility with saved routes
export type AgentType = 'adventure' | 'culture' | 'food' | 'hidden-gems'

export type BudgetLevel = 'budget' | 'moderate' | 'comfort' | 'luxury'
export type TripPace = 'leisurely' | 'balanced' | 'fast-paced'

// New unified workflow types
export type TravelCompanion =
  | 'solo'
  | 'couple'
  | 'family-young-kids'
  | 'family-teens'
  | 'friends'
  | 'group'

export interface Interest {
  id: string
  label: string
  category: 'nature' | 'culture' | 'food' | 'experience'
  icon?: string
}

export interface SelectedInterest {
  id: string
  weight: number // 1-5, higher = more important
}

// Available interests for selection
export const AVAILABLE_INTERESTS: Interest[] = [
  // Nature & Adventure
  { id: 'hiking', label: 'Hiking & Trails', category: 'nature' },
  { id: 'beaches', label: 'Beaches & Coast', category: 'nature' },
  { id: 'mountains', label: 'Mountains & Views', category: 'nature' },
  { id: 'national-parks', label: 'National Parks', category: 'nature' },
  { id: 'water-sports', label: 'Water Sports', category: 'nature' },

  // Culture & History
  { id: 'museums', label: 'Museums', category: 'culture' },
  { id: 'architecture', label: 'Architecture', category: 'culture' },
  { id: 'ancient-history', label: 'Ancient History', category: 'culture' },
  { id: 'medieval', label: 'Medieval Towns', category: 'culture' },
  { id: 'art-galleries', label: 'Art Galleries', category: 'culture' },

  // Food & Drink
  { id: 'fine-dining', label: 'Fine Dining', category: 'food' },
  { id: 'local-cuisine', label: 'Local Cuisine', category: 'food' },
  { id: 'street-food', label: 'Street Food & Markets', category: 'food' },
  { id: 'wine', label: 'Wine & Vineyards', category: 'food' },
  { id: 'coffee-culture', label: 'Coffee Culture', category: 'food' },

  // Experience
  { id: 'nightlife', label: 'Nightlife & Bars', category: 'experience' },
  { id: 'shopping', label: 'Shopping', category: 'experience' },
  { id: 'photography', label: 'Photography Spots', category: 'experience' },
  { id: 'off-beaten-path', label: 'Off the Beaten Path', category: 'experience' },
  { id: 'local-experiences', label: 'Local Experiences', category: 'experience' }
]

export interface TripPreferences {
  companions: TravelCompanion
  interests: SelectedInterest[]
  tripStyle: number // 0-100 (0 = relaxation-focused, 100 = exploration-focused)
  constraints?: {
    mustSee?: string[]
    avoid?: string[]
    dietary?: string[]
    accessibility?: string[]
  }
}

// Travel style options for personalization
export type TravelStyle = 'explorer' | 'relaxer' | 'culture' | 'adventurer' | 'foodie'

// Dining style options
export type DiningStyle = 'street' | 'casual' | 'mix' | 'fine'

// Accommodation preference options
export type AccommodationStyle = 'budget' | 'mid' | 'luxury' | 'unique'

// Budget level for personalization (distinct from trip BudgetLevel)
export type PersonalizationBudget = 'budget' | 'mid' | 'luxury'

// Trip occasion options
export type TripOccasion =
  | 'honeymoon'
  | 'anniversary'
  | 'birthday'
  | 'graduation'
  | 'retirement'
  | 'babymoon'
  | 'reunion'
  | 'solo-adventure'
  | 'girls-trip'
  | 'guys-trip'
  | 'family-vacation'
  | 'just-because'

// Interest categories for trip personalization
export type PersonalizationInterest =
  | 'history'
  | 'art'
  | 'architecture'
  | 'nature'
  | 'food'
  | 'wine'
  | 'nightlife'
  | 'shopping'
  | 'photography'
  | 'adventure'
  | 'wellness'
  | 'local-culture'
  | 'beaches'
  | 'mountains'
  | 'museums'

// Personalization data for deeply customized routes
export interface TripPersonalization {
  // Free-form context from user
  tripStory: string

  // Travel style (single select)
  travelStyle?: TravelStyle

  // Pace (1-5 scale: 1 = very relaxed, 5 = packed)
  pace?: number

  // Interests (multi-select)
  interests?: PersonalizationInterest[]

  // Dining preferences
  diningStyle?: DiningStyle
  dietary?: string[]

  // Accommodation preference
  accommodation?: AccommodationStyle

  // Budget level
  budget?: PersonalizationBudget

  // Accessibility needs (multi-select)
  accessibility?: string[]

  // Trip occasion
  occasion?: TripOccasion

  // Additional preferences
  avoidCrowds?: boolean
  preferOutdoor?: boolean
}

// City data with coordinates for flexible origin/destination
export interface CityData {
  name: string
  country: string
  coordinates: [number, number] // [latitude, longitude]
  displayName: string // e.g., "Berlin, Germany"
}

// New unified form data
export interface RouteFormData {
  origin: CityData | null
  destination: CityData | null
  budget: BudgetLevel
  totalNights: number
  tripPace: TripPace
  preferences: TripPreferences
}

// Legacy form data - kept for backward compatibility
export interface LegacyRouteFormData {
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
