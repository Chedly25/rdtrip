// Theme configuration for all agent types including best-overall
export type AgentType = 'best-overall' | 'adventure' | 'culture' | 'food' | 'hidden-gems'

export interface ThemeConfig {
  primary: string
  secondary: string
  gradient: string
  tailwind: {
    bg: string
    text: string
    border: string
    hover: string
  }
}

export const agentThemes: Record<AgentType, ThemeConfig> = {
  'best-overall': {
    primary: '#064d51', // turquoise (logo color)
    secondary: '#0a6b70',
    gradient: 'from-teal-800 to-teal-600',
    tailwind: {
      bg: 'bg-teal-800',
      text: 'text-teal-800',
      border: 'border-teal-800',
      hover: 'hover:bg-teal-700',
    },
  },
  adventure: {
    primary: '#0f5132', // dark green
    secondary: '#198754',
    gradient: 'from-green-800 to-green-600',
    tailwind: {
      bg: 'bg-green-800',
      text: 'text-green-800',
      border: 'border-green-800',
      hover: 'hover:bg-green-700',
    },
  },
  culture: {
    primary: '#d4a017', // yellow/gold
    secondary: '#ffc107',
    gradient: 'from-yellow-600 to-yellow-500',
    tailwind: {
      bg: 'bg-yellow-600',
      text: 'text-yellow-600',
      border: 'border-yellow-600',
      hover: 'hover:bg-yellow-500',
    },
  },
  food: {
    primary: '#8b0000', // dark red
    secondary: '#dc143c',
    gradient: 'from-red-900 to-red-700',
    tailwind: {
      bg: 'bg-red-900',
      text: 'text-red-900',
      border: 'border-red-900',
      hover: 'hover:bg-red-800',
    },
  },
  'hidden-gems': {
    primary: '#1e3a8a', // dark blue
    secondary: '#3b82f6',
    gradient: 'from-blue-900 to-blue-700',
    tailwind: {
      bg: 'bg-blue-900',
      text: 'text-blue-900',
      border: 'border-blue-900',
      hover: 'hover:bg-blue-800',
    },
  },
}

export function getTheme(agent: AgentType): ThemeConfig {
  return agentThemes[agent] || agentThemes['best-overall'] // fallback to best-overall
}
