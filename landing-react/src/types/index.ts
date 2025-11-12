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
