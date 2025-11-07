export type AgentType = 'adventure' | 'culture' | 'food' | 'hidden-gems'
export type BudgetLevel = 'budget' | 'moderate' | 'comfort' | 'luxury'
export type TripPace = 'leisurely' | 'balanced' | 'fast-paced'

export interface RouteFormData {
  origin: string
  destination: string
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
