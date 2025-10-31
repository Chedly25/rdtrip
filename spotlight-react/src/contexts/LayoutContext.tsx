import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

export type LayoutMode = 'focus' | 'planning' | 'presentation'

interface LayoutContextType {
  mode: LayoutMode
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  switchMode: (mode: LayoutMode) => void
  toggleSidebar: () => void
  isSidebarCollapsed: boolean
}

const LayoutContext = createContext<LayoutContextType | null>(null)

interface LayoutProviderProps {
  children: ReactNode
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const [mode, setMode] = useState<LayoutMode>('focus')
  const [sidebarWidth, setSidebarWidth] = useState(700)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('spotlight-layout-prefs')
    if (saved) {
      try {
        const { mode: savedMode, sidebarWidth: savedWidth } = JSON.parse(saved)
        if (savedMode) setMode(savedMode)
        if (savedWidth) setSidebarWidth(savedWidth)
      } catch (e) {
        console.error('Failed to parse layout preferences:', e)
      }
    }
  }, [])

  // Save preferences to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(
      'spotlight-layout-prefs',
      JSON.stringify({ mode, sidebarWidth })
    )
  }, [mode, sidebarWidth])

  const switchMode = (newMode: LayoutMode) => {
    setMode(newMode)

    // Adjust sidebar based on mode
    if (newMode === 'focus') {
      setSidebarWidth(700)
      setIsSidebarCollapsed(false)
    } else if (newMode === 'planning') {
      // 60% of window width for planning mode
      const newWidth = Math.floor(window.innerWidth * 0.6)
      setSidebarWidth(Math.min(Math.max(newWidth, 600), 1200)) // Between 600-1200px
      setIsSidebarCollapsed(false)
    } else if (newMode === 'presentation') {
      // Hide sidebar in presentation mode
      setIsSidebarCollapsed(true)
    }
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <LayoutContext.Provider
      value={{
        mode,
        sidebarWidth,
        setSidebarWidth,
        switchMode,
        toggleSidebar,
        isSidebarCollapsed,
      }}
    >
      {children}
    </LayoutContext.Provider>
  )
}

export const useLayout = () => {
  const context = useContext(LayoutContext)
  if (!context) {
    throw new Error('useLayout must be used within LayoutProvider')
  }
  return context
}
