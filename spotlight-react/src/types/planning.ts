/**
 * Planning Mode Types
 *
 * Slot-based planning system: Morning, Afternoon, Evening, Night
 * Philosophy: "Chill over precise" - users shouldn't feel like building a train schedule
 */

// ============================================================================
// Core Types
// ============================================================================

export type Slot = 'morning' | 'afternoon' | 'evening' | 'night';

export type PlaceCategory =
  | 'cafe'
  | 'restaurant'
  | 'bar'
  | 'museum'
  | 'gallery'
  | 'landmark'
  | 'park'
  | 'beach'
  | 'viewpoint'
  | 'shopping'
  | 'activity'
  | 'nightlife'
  | 'accommodation'
  | 'market'
  | 'church'
  | 'other';

export type VibeTags =
  | 'romantic'
  | 'chill'
  | 'lively'
  | 'family-friendly'
  | 'local-favourite'
  | 'instagrammable'
  | 'off-beaten-path'
  | 'historic'
  | 'scenic'
  | 'foodie';

// ============================================================================
// Slot Definitions
// ============================================================================

export const SLOT_CONFIG: Record<Slot, {
  label: string;
  icon: string;
  roughHours: string;
  typicalActivities: string[];
  colorClass: string;
  bgClass: string;
  borderClass: string;
}> = {
  morning: {
    label: 'Morning',
    icon: '☀️',
    roughHours: '08:00 - 12:00',
    typicalActivities: ['Cafe', 'Museum', 'Market', 'Church', 'Park', 'Walking tour'],
    colorClass: 'text-amber-700',
    bgClass: 'bg-amber-50/60',
    borderClass: 'border-amber-200/60',
  },
  afternoon: {
    label: 'Afternoon',
    icon: '🌤️',
    roughHours: '12:00 - 18:00',
    typicalActivities: ['Restaurant (lunch)', 'Activity', 'Beach', 'Shopping', 'Gallery'],
    colorClass: 'text-orange-700',
    bgClass: 'bg-orange-50/50',
    borderClass: 'border-orange-200/50',
  },
  evening: {
    label: 'Evening',
    icon: '🌅',
    roughHours: '18:00 - 22:00',
    typicalActivities: ['Restaurant (dinner)', 'Bar', 'Viewpoint', 'Sunset spot', 'Show'],
    colorClass: 'text-rose-700',
    bgClass: 'bg-rose-50/40',
    borderClass: 'border-rose-200/40',
  },
  night: {
    label: 'Night',
    icon: '🌙',
    roughHours: '22:00 - 02:00',
    typicalActivities: ['Bar', 'Club', 'Late-night restaurant', 'Concert'],
    colorClass: 'text-indigo-700',
    bgClass: 'bg-indigo-50/30',
    borderClass: 'border-indigo-200/30',
  },
};

export const SLOT_ORDER: Slot[] = ['morning', 'afternoon', 'evening', 'night'];

// ============================================================================
// Place Types
// ============================================================================

export interface OpeningPeriod {
  open: { day: number; time: string };
  close: { day: number; time: string };
}

export interface PlacePhoto {
  url: string;
  width?: number;
  height?: number;
  attributions?: string[];
}

/**
 * Enriched Place - Google Places data + computed enrichments
 */
export interface EnrichedPlace {
  // From Google Places
  place_id: string;
  name: string;
  types: string[];
  geometry: {
    location: { lat: number; lng: number };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number; // 0-4
  opening_hours?: {
    periods?: OpeningPeriod[];
    weekday_text?: string[];
    open_now?: boolean;
  };
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
  photos?: PlacePhoto[];

  // Enriched fields (computed at fetch time)
  cluster_id: string | null;
  valid_slots: Slot[];           // ['morning', 'afternoon']
  best_slot: Slot | null;        // 'morning' if it's optimal
  estimated_duration_mins: number;
  category: PlaceCategory;
  vibe_tags: VibeTags[];
  is_hidden_gem: boolean;        // high rating + low review count

  // Optional editorial content
  description?: string;
  tip?: string;
}

// ============================================================================
// Planned Item Types
// ============================================================================

/**
 * Planned Item - A place added to the trip plan
 */
export interface PlannedItem {
  id: string;                    // UUID
  place: EnrichedPlace;
  day_index: number;             // 0, 1, 2...
  slot: Slot;
  order_in_slot: number;         // For ordering within slot
  user_notes?: string;
  is_locked: boolean;            // User explicitly placed, don't auto-move
  added_at: Date;
  added_by: 'user' | 'ai';

  // Collaboration-ready fields
  created_by?: string;
  updated_by?: string;
  version?: number;
}

// ============================================================================
// Day Plan Types
// ============================================================================

export interface FlowScore {
  total_travel_mins: number;
  total_walking_km: number;
  pacing: 'relaxed' | 'balanced' | 'packed';
  warnings: string[];
}

export interface DayPlan {
  day_index: number;
  date: Date;
  city: {
    id: string;
    name: string;
    country: string;
    coordinates: { lat: number; lng: number };
  };
  slots: {
    morning: PlannedItem[];
    afternoon: PlannedItem[];
    evening: PlannedItem[];
    night: PlannedItem[];
  };
  flow_score?: FlowScore;
  accommodation?: EnrichedPlace;
}

// ============================================================================
// Trip Plan Types
// ============================================================================

export interface TripPlan {
  id: string;
  route_id: string;
  days: DayPlan[];
  unassigned: EnrichedPlace[];   // Saved but not yet placed
  filters: FilterState;          // Persisted filter preferences
  created_at: Date;
  updated_at: Date;
}

// ============================================================================
// Filter Types
// ============================================================================

export interface FilterState {
  types: PlaceCategory[];
  price_levels: number[];        // [0, 1, 2, 3, 4]
  min_rating: number;
  max_duration: number | null;
  vibes: VibeTags[];
  show_hidden_gems_only: boolean;
}

export const DEFAULT_FILTER_STATE: FilterState = {
  types: [],
  price_levels: [],
  min_rating: 0,
  max_duration: null,
  vibes: [],
  show_hidden_gems_only: false,
};

// ============================================================================
// UI State Types
// ============================================================================

export interface AddPanelState {
  isOpen: boolean;
  targetSlot: Slot | null;
  targetDayIndex: number;
  anchor: { lat: number; lng: number } | null;
  anchorName: string | null;
}

export interface ConflictWarning {
  type: 'opening_hours' | 'distance' | 'overpacked' | 'duplicate';
  message: string;
  severity: 'info' | 'warning' | 'error';
  place_id?: string;
  suggested_action?: {
    label: string;
    action: () => void;
  };
}

// ============================================================================
// Action Types for Undo/Redo
// ============================================================================

export type PlanActionType = 'add' | 'remove' | 'move' | 'reorder' | 'update_notes';

export interface PlanAction {
  id: string;
  type: PlanActionType;
  timestamp: Date;
  payload: {
    item_id?: string;
    place?: EnrichedPlace;
    from_day?: number;
    to_day?: number;
    from_slot?: Slot;
    to_slot?: Slot;
    from_order?: number;
    to_order?: number;
    notes?: string;
  };
  description: string; // Human readable description for toast
}

// ============================================================================
// Companion Types
// ============================================================================

export interface CompanionSuggestion {
  id: string;
  trigger: string;
  message: string;
  quick_actions?: QuickAction[];
  dismissed?: boolean;
}

export interface QuickAction {
  label: string;
  action: string;
  data?: Record<string, unknown>;
}

// ============================================================================
// AI Pick Types
// ============================================================================

export interface AIPick {
  place: EnrichedPlace;
  reason: string;
  caveat?: string;
}

// ============================================================================
// Travel Indicator Types
// ============================================================================

export interface TravelInfo {
  duration_mins: number;
  distance_km: number;
  mode: 'walk' | 'drive' | 'transit';
  has_parking?: boolean;
}

// ============================================================================
// Analytics Event Types
// ============================================================================

export type PlanningEvent =
  | 'planning_mode_entered'
  | 'item_added'
  | 'item_removed'
  | 'item_moved'
  | 'filter_applied'
  | 'ai_pick_shown'
  | 'ai_pick_accepted'
  | 'ai_pick_rejected'
  | 'conflict_warning_shown'
  | 'conflict_resolved'
  | 'companion_message_sent'
  | 'companion_action_taken'
  | 'undo_used'
  | 'plan_completed';
