/**
 * Planning Feature Types
 *
 * Type definitions for the proximity-based trip planner.
 * Users build geographic clusters of activities with an AI companion.
 */

// ============================================
// Location Types
// ============================================

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Location extends LatLng {
  address: string;
  area: string; // "Le Panier", "Vieux Port"
}

// ============================================
// Core Types
// ============================================

export type PlanCardType =
  | 'restaurant'
  | 'activity'
  | 'photo_spot'
  | 'hotel'
  | 'bar'
  | 'cafe'
  | 'experience';

// Type groupings for UI tab organization
export const ACTIVITY_TYPES: PlanCardType[] = ['activity', 'photo_spot', 'experience'];
export const RESTAURANT_TYPES: PlanCardType[] = ['restaurant', 'bar', 'cafe'];
export const HOTEL_TYPES: PlanCardType[] = ['hotel'];

// Browse tab definitions
export type BrowseTabId = 'activities' | 'restaurants' | 'hotels';

export interface BrowseTab {
  id: BrowseTabId;
  label: string;
  types: PlanCardType[];
}

export type PlanCardSource =
  | 'ai_generated'
  | 'companion'
  | 'user_search'
  | 'city_intelligence';

export type PriceLevel = 1 | 2 | 3 | 4;

export interface PlanCard {
  id: string;
  type: PlanCardType;
  name: string;
  description: string; // 1-2 sentences max
  whyGreat: string; // Why this matches their trip

  location: Location;

  duration: number; // Minutes
  priceLevel: PriceLevel;
  priceEstimate?: string; // "€25-40 per person"
  bestTime?: string; // "sunset", "morning", "lunch"
  tags: string[]; // ["romantic", "outdoor", "local-favorite"]

  // Optional enrichment
  imageUrl?: string;
  rating?: number; // 1-5
  reviewCount?: number;
  bookingRequired?: boolean;
  bookingUrl?: string;
  openingHours?: string;

  // Source tracking
  source: PlanCardSource;
  generatedAt: Date;
}

export interface Cluster {
  id: string;
  name: string;
  description?: string;
  center: LatLng;
  items: PlanCard[];

  // Computed (calculated on frontend)
  totalDuration: number; // Sum of item durations
  maxWalkingDistance: number; // Max walk between any two items
}

export interface SuggestedCluster {
  id: string;
  name: string;
  description: string;
  center: LatLng;
  // These are suggestions, not started by user yet
}

// ============================================
// City & Trip Types
// ============================================

export interface CityData {
  id: string;
  name: string;
  country: string;
  coordinates: LatLng;
  nights?: number;
  isOrigin?: boolean;
  isDestination?: boolean;
  imageUrl?: string;
}

export interface CityPlan {
  id: string;
  cityId: string;
  city: CityData;
  clusters: Cluster[];
  unclustered: PlanCard[]; // Saved but not in a cluster
  suggestedClusters: SuggestedCluster[]; // AI-suggested areas
  selectedHotel?: PlanCard | null; // Selected hotel for this city
}

export type TripPlanStatus = 'planning' | 'ready' | 'active' | 'completed';

export interface TripPlan {
  id: string;
  routeId: string;
  userId: string;
  status: TripPlanStatus;
  cities: CityPlan[];
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// Companion Types
// ============================================

export type CompanionActionType =
  | 'add_card'
  | 'show_more'
  | 'navigate'
  | 'dismiss'
  | 'custom';

export interface CompanionAction {
  id: string;
  label: string;
  type: CompanionActionType;
  payload?: {
    card?: PlanCard;
    cardType?: PlanCardType;
    clusterId?: string;
    query?: string;
  };
}

export interface CompanionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards?: PlanCard[];
  actions?: CompanionAction[];
  timestamp: Date;
}

export interface CompanionContext {
  cityId: string;
  currentPlan: CityPlan;
  preferences: UserPreferences;
  history?: CompanionMessage[];
  recentAction?: {
    type: 'added_item' | 'removed_item' | 'created_cluster' | 'generated_more';
    item?: PlanCard;
    cluster?: Cluster;
    timestamp: Date;
  };
}

// ============================================
// User Preferences Types
// ============================================

export interface UserPreferences {
  travelerType: 'solo' | 'couple' | 'family' | 'friends' | 'business';
  interests?: string[];
  budget?: 'budget' | 'moderate' | 'luxury';
  pace?: 'relaxed' | 'moderate' | 'packed';
  dietary?: string[];
}

// ============================================
// API Request/Response Types
// ============================================

export interface GenerateCardsRequest {
  cityId: string;
  type: PlanCardType | 'all';
  count: number;
  filters?: {
    priceMax?: PriceLevel;
    nearClusterId?: string;
    tags?: string[];
    cuisine?: string;
    duration?: { min?: number; max?: number };
  };
  excludeIds?: string[];
  preferences?: UserPreferences;
}

export interface GenerateCardsResponse {
  cards: PlanCard[];
  hasMore: boolean;
}

export interface GetPlanResponse {
  tripPlan: TripPlan;
}

export interface SavePlanRequest {
  cities: CityPlan[];
}

export interface SavePlanResponse {
  success: boolean;
  updatedAt: Date;
}

export interface CreateClusterRequest {
  cityId: string;
  name: string;
  center?: LatLng;
  initialItems?: PlanCard[];
}

export interface CreateClusterResponse {
  cluster: Cluster;
}

export interface UpdateClusterRequest {
  name?: string;
  addItems?: PlanCard[];
  removeItemIds?: string[];
  reorderItems?: string[]; // Item IDs in new order
}

export interface CompanionRequest {
  cityId: string;
  message: string;
  context: CompanionContext;
}

// SSE event types
export type CompanionStreamEvent =
  | { type: 'thinking'; content: string }
  | { type: 'message'; content: string }
  | { type: 'cards'; cards: PlanCard[] }
  | { type: 'actions'; actions: CompanionAction[] }
  | { type: 'tool_call'; tool: string; args: Record<string, unknown> }
  | { type: 'tool_result'; tool: string; result: unknown }
  | { type: 'done' }
  | { type: 'error'; error: string };

// ============================================
// Component Props Types
// ============================================

export interface CityTabData {
  id: string;
  name: string;
  nights: number;
  isOrigin?: boolean;
  isDestination?: boolean;
  itemCount: number;
  isComplete?: boolean;
}

export interface CityTabsProps {
  cities: CityTabData[];
  currentCityId: string;
  onCityChange: (cityId: string) => void;
}

export interface PlanningLayoutProps {
  leftPanel: React.ReactNode;
  rightPanel: React.ReactNode;
  companionPanel?: React.ReactNode; // Now optional (replaced by inline tips)
  showCompanion?: boolean; // Control visibility, defaults to false
}

export interface YourPlanProps {
  cityId: string;
  clusters: Cluster[];
  unclustered: PlanCard[];
  suggestedClusters?: SuggestedCluster[];
  onCreateCluster?: (name: string, center?: LatLng) => void;
}

export interface ClusterCardProps {
  cluster: Cluster;
  onAddItem?: (card: PlanCard) => void;
  onRemoveItem?: (itemId: string) => void;
  onRename?: (name: string) => void;
  onDelete?: () => void;
  isExpanded?: boolean;
}

export interface PlanItemProps {
  item: PlanCard;
  onRemove?: () => void;
  onMove?: (targetClusterId: string) => void;
}

export interface EmptyClusterSuggestionProps {
  area: SuggestedCluster;
  onStart: () => void;
  onDismiss?: () => void;
}

// ============================================
// Store Types
// ============================================

export interface PlanningFilters {
  priceRange?: PriceLevel[];
  sortBy: 'proximity' | 'rating' | 'price';
}

export interface PlanningState {
  // Core data
  routeId: string | null;
  tripPlan: TripPlan | null;
  currentCityId: string | null;

  // City plans indexed by cityId
  cityPlans: Record<string, CityPlan>;

  // Suggestions indexed by cityId, then by type
  suggestions: Record<string, Record<string, PlanCard[]>>;

  // Companion messages indexed by cityId
  companionMessages: Record<string, CompanionMessage[]>;

  // UI state
  filters: PlanningFilters;
  isLoading: boolean;
  isSaving: boolean;
  companionLoading: boolean;
  companionExpanded: boolean;
  error: string | null;

  // Generation loading state by type
  isGenerating: Record<string, boolean>;

  // Initialization flag
  isInitialized: boolean;
}

export interface PlanningActions {
  // Initialization
  initializePlan: (tripPlan: TripPlan) => void;
  loadPlan: (routeId: string, token?: string) => Promise<void>;
  savePlan: (routeId: string, token?: string) => Promise<void>;
  reset: () => void;

  // City navigation
  setCurrentCity: (cityId: string) => void;

  // Cluster operations
  createCluster: (cityId: string, name: string, center?: LatLng) => string;
  updateCluster: (cityId: string, clusterId: string, updates: Partial<Cluster>) => void;
  deleteCluster: (cityId: string, clusterId: string) => void;
  renameCluster: (cityId: string, clusterId: string, name: string) => void;

  // Item operations
  addItemToCluster: (cityId: string, clusterId: string, card: PlanCard) => void;
  removeItemFromCluster: (cityId: string, clusterId: string, itemId: string) => void;
  moveItemToCluster: (cityId: string, fromClusterId: string, toClusterId: string, itemId: string) => void;
  reorderItemsInCluster: (cityId: string, clusterId: string, reorderedItems: PlanCard[]) => void;
  addToUnclustered: (cityId: string, card: PlanCard) => void;
  removeFromUnclustered: (cityId: string, itemId: string) => void;
  addItemAutoClustered: (cityId: string, card: PlanCard, cityCenter?: LatLng) => void;

  // Hotel operations
  selectHotel: (cityId: string, hotel: PlanCard) => void;
  removeHotel: (cityId: string) => void;
  getSelectedHotel: (cityId: string) => PlanCard | null;

  // Suggestions
  setSuggestions: (cityId: string, type: string, cards: PlanCard[]) => void;
  addSuggestions: (cityId: string, type: string, cards: PlanCard[]) => void;
  generateSuggestions: (type: PlanCardType | 'all', count: number) => Promise<void>;

  // Companion
  addCompanionMessage: (cityId: string, message: CompanionMessage) => void;
  sendToCompanion: (message: string) => Promise<void>;
  toggleCompanion: () => void;
  setCompanionExpanded: (expanded: boolean) => void;

  // Filters
  setFilters: (filters: Partial<PlanningFilters>) => void;

  // Error handling
  setError: (error: string | null) => void;

  // Selectors
  getCurrentCityPlan: () => CityPlan | null;
  getClusterById: (cityId: string, clusterId: string) => Cluster | null;
  getTotalItemCount: (cityId: string) => number;
  getAllItemIds: (cityId: string) => string[];
}

export type PlanningStore = PlanningState & PlanningActions;

// ============================================
// Utility Types
// ============================================

export interface ProximityInfo {
  clusterName: string;
  walkingMinutes: number;
  isNear: boolean; // < 10 minutes
}

export interface CardWithProximity {
  card: PlanCard;
  nearestCluster: ProximityInfo | null;
  isNearPlan: boolean;
}
