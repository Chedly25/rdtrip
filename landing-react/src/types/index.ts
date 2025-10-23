export type AgentType = 'adventure' | 'culture' | 'food' | 'hidden-gems'
export type BudgetLevel = 'budget' | 'moderate' | 'comfort' | 'luxury'

export interface RouteFormData {
  origin: string
  destination: string
  stops: number
  budget: BudgetLevel
  agents: AgentType[]
}

export interface RouteResult {
  id: string
  route: any
  spotlightData: any
}
