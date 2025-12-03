/**
 * Authentication Context for Spotlight
 *
 * Provides authentication state and methods throughout the spotlight app.
 * Shares localStorage keys with landing-react for seamless auth across apps.
 */

import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'

interface User {
  id: string
  email: string
  name?: string
  avatarUrl?: string
  createdAt: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Shared with landing-react
const TOKEN_KEY = 'rdtrip_auth_token'
const USER_KEY = 'rdtrip_user'
// Legacy key used by existing SpotlightV2 code for API calls
const LEGACY_TOKEN_KEY = 'token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        // Try new key first, then fall back to legacy
        const storedToken = localStorage.getItem(TOKEN_KEY) || localStorage.getItem(LEGACY_TOKEN_KEY)
        const storedUser = localStorage.getItem(USER_KEY)

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))
          // Ensure both keys are set for compatibility
          localStorage.setItem(TOKEN_KEY, storedToken)
          localStorage.setItem(LEGACY_TOKEN_KEY, storedToken)

          // Verify token is still valid by fetching current user
          const response = await fetch('/api/auth/me', {
            headers: {
              Authorization: `Bearer ${storedToken}`
            }
          })

          if (response.ok) {
            const data = await response.json()
            setUser(data.user)
            localStorage.setItem(USER_KEY, JSON.stringify(data.user))
          } else {
            // Token expired or invalid, clear auth
            localStorage.removeItem(TOKEN_KEY)
            localStorage.removeItem(USER_KEY)
            localStorage.removeItem(LEGACY_TOKEN_KEY)
            setToken(null)
            setUser(null)
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error)
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(LEGACY_TOKEN_KEY)
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
  }, [])

  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Login failed')
    }

    const data = await response.json()

    setUser(data.user)
    setToken(data.token)

    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    // Also set legacy token for SpotlightV2 API calls
    localStorage.setItem(LEGACY_TOKEN_KEY, data.token)
  }

  const register = async (email: string, password: string, name?: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password, name })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Registration failed')
    }

    const data = await response.json()

    setUser(data.user)
    setToken(data.token)

    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(USER_KEY, JSON.stringify(data.user))
    // Also set legacy token for SpotlightV2 API calls
    localStorage.setItem(LEGACY_TOKEN_KEY, data.token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    // Also clear legacy token
    localStorage.removeItem(LEGACY_TOKEN_KEY)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
