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
  reactions?: Array<{ emoji: string; userId: string; createdAt: string }>
  parentMessageId?: string
  mentionedUsers?: string[]
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

// Expense tracking types (Phase 3)
export type ExpenseCategory =
  | 'accommodation'
  | 'food'
  | 'transportation'
  | 'activities'
  | 'shopping'
  | 'fuel'
  | 'tolls'
  | 'parking'
  | 'other'

export type SplitMethod = 'equal' | 'percentage' | 'shares' | 'custom'

export interface ReceiptData {
  merchant: string
  amount: number
  currency: string
  date: string
  items?: Array<{ name: string; price: number }>
  paymentMethod?: string
  location?: string
  taxAmount?: number
  tipAmount?: number
  description?: string
  aiCategory?: ExpenseCategory
  aiConfidence?: number
  rawData?: any
}

export interface SplitData {
  [userId: string]: number
}

export interface Expense {
  id: string
  routeId: string
  paidBy: string
  paidByName: string
  paidByAvatar?: string
  description: string
  category: ExpenseCategory
  amount: number
  currency: string
  amountEur: number
  expenseDate: string
  location?: string
  cityName?: string
  receiptUrl?: string
  receiptData?: ReceiptData
  splitMethod: SplitMethod
  splitData?: SplitData
  participants: string[]
  aiSuggestedCategory?: ExpenseCategory
  aiConfidence?: number
  isAiCategorized?: boolean
  notes?: string
  tags?: string[]
  isReimbursed?: boolean
  reimbursementStatus?: any
  createdAt: string
  updatedAt?: string
}

export interface ExpenseSummary {
  totalCount: number
  totalEur: number
  category: ExpenseCategory
}

export interface Balance {
  userId: string
  userName: string
  userEmail: string
  userAvatar?: string
  balance: number // Positive = owed to them, Negative = they owe
}

export interface Settlement {
  id: string
  routeId: string
  debtor: string
  debtorName: string
  debtorAvatar?: string
  creditor: string
  creditorName: string
  creditorAvatar?: string
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'cancelled'
  settledAt?: string
  paymentMethod?: string
  paymentReference?: string
  createdAt: string
  updatedAt?: string
}

export interface SimplifiedSettlement {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
  currency: string
}

export interface Budget {
  id: string
  routeId: string
  category: ExpenseCategory
  budgetedAmount: number
  currency: string
  actualSpent?: number
  remaining?: number
  spendPercentage?: number
  alertThreshold: number
  alertSent: boolean
  createdAt?: string
  updatedAt?: string
}

// API response types
export interface ExpensesResponse {
  expenses: Expense[]
  summary: ExpenseSummary[]
}

export interface BalancesResponse {
  balances: Balance[]
  settlements: SimplifiedSettlement[]
}

export interface SettlementsResponse {
  settlements: Settlement[]
}

export interface BudgetsResponse {
  budgets: Budget[]
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
  // Populated from joins
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
  // Populated from joins
  userName?: string
  userAvatar?: string
}

export interface RouteClone {
  id: string
  publishedRouteId: string
  originalRouteId: string
  clonedRouteId: string
  userId: string
  modifications?: Record<string, any>
  hasModified: boolean
  tripCompleted: boolean
  tripCompletedAt?: string
  createdAt: string
}

export interface RouteCollection {
  id: string
  userId: string
  title: string
  description?: string
  coverImageUrl?: string
  isPublic: boolean
  routeCount: number
  followerCount: number
  createdAt: string
  updatedAt: string
}

export interface CollectionRoute {
  collectionId: string
  publishedRouteId: string
  position: number
  addedAt: string
}

export interface ReviewHelpfulVote {
  reviewId: string
  userId: string
  isHelpful: boolean
  createdAt: string
}

export interface MarketplaceFilters {
  style: string // 'all' or specific style
  duration: string // 'any', 'weekend', 'week', '2-weeks', 'month'
  difficulty: string // 'any', 'easy', 'moderate', 'challenging'
  season: string // 'any' or specific season
  sortBy: 'popular' | 'recent' | 'rating' | 'clones'
}

// API response types
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

export interface CloneRouteResponse {
  clonedRouteId: string
  success: boolean
}

export interface PublishRouteResponse {
  publishedRoute: PublishedRoute
  success: boolean
}
