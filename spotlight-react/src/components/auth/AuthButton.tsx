/**
 * Auth Button Component - Editorial Design
 *
 * Shows user profile dropdown when authenticated,
 * or Sign In / Get Started buttons when not.
 * Designed for the spotlight header.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, LogOut, Map, ChevronDown, Bookmark } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { LoginModal } from './LoginModal'
import { RegisterModal } from './RegisterModal'
import { cn } from '../../lib/utils'

interface AuthButtonProps {
  variant?: 'full' | 'compact'
  className?: string
}

export function AuthButton({ variant = 'full', className }: AuthButtonProps) {
  const { user, logout, isLoading } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  if (isLoading) {
    return (
      <div
        className={cn("h-10 w-24 animate-pulse rounded-xl", className)}
        style={{ background: '#F5F0E8' }}
      />
    )
  }

  if (user) {
    return (
      <>
        <div className={cn("relative", className)}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2",
              "transition-all duration-200 hover:bg-[#F5F0E8]",
              "border border-transparent hover:border-[#E5DDD0]"
            )}
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.15) 0%, rgba(212, 168, 83, 0.15) 100%)'
              }}
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || user.email}
                  className="h-full w-full rounded-lg object-cover"
                />
              ) : (
                <User className="h-4 w-4" style={{ color: '#C45830' }} />
              )}
            </div>
            {variant === 'full' && (
              <>
                <span
                  className="hidden sm:inline text-sm font-medium max-w-[120px] truncate"
                  style={{ color: '#2C2417' }}
                >
                  {user.name || user.email.split('@')[0]}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    showUserMenu && "rotate-180"
                  )}
                  style={{ color: '#8B7355' }}
                />
              </>
            )}
          </button>

          {/* Dropdown menu */}
          <AnimatePresence>
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl"
                  style={{
                    background: '#FFFBF5',
                    boxShadow: '0 10px 40px rgba(44, 36, 23, 0.15), 0 0 0 1px rgba(44, 36, 23, 0.05)'
                  }}
                >
                  {/* User info header */}
                  <div
                    className="px-4 py-3 border-b"
                    style={{ borderColor: '#E5DDD0' }}
                  >
                    <p
                      className="text-sm font-semibold truncate"
                      style={{ color: '#2C2417' }}
                    >
                      {user.name || 'Traveler'}
                    </p>
                    <p
                      className="text-xs truncate"
                      style={{ color: '#8B7355' }}
                    >
                      {user.email}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <a
                      href="/my-routes"
                      onClick={() => setShowUserMenu(false)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-sm",
                        "transition-colors hover:bg-[#F5F0E8]"
                      )}
                      style={{ color: '#2C2417' }}
                    >
                      <Map className="h-4 w-4" style={{ color: '#8B7355' }} />
                      <span>My Routes</span>
                    </a>

                    <a
                      href="/"
                      onClick={() => setShowUserMenu(false)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-sm",
                        "transition-colors hover:bg-[#F5F0E8]"
                      )}
                      style={{ color: '#2C2417' }}
                    >
                      <Bookmark className="h-4 w-4" style={{ color: '#8B7355' }} />
                      <span>Plan New Trip</span>
                    </a>
                  </div>

                  {/* Logout */}
                  <div
                    className="border-t py-1"
                    style={{ borderColor: '#E5DDD0' }}
                  >
                    <button
                      onClick={() => {
                        logout()
                        setShowUserMenu(false)
                      }}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2.5 text-sm",
                        "transition-colors hover:bg-[#FEF3EE]"
                      )}
                      style={{ color: '#B54A4A' }}
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </>
    )
  }

  // Not authenticated - show sign in buttons
  return (
    <>
      <div className={cn("flex items-center gap-2", className)}>
        <button
          onClick={() => setShowLoginModal(true)}
          className={cn(
            "rounded-xl px-4 py-2 text-sm font-medium",
            "transition-all duration-200 hover:bg-[#F5F0E8]"
          )}
          style={{ color: '#2C2417' }}
        >
          Sign In
        </button>
        <motion.button
          onClick={() => setShowRegisterModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{
            background: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
            boxShadow: '0 2px 8px rgba(196, 88, 48, 0.25)'
          }}
        >
          Get Started
        </motion.button>
      </div>

      {/* Modals */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSwitchToRegister={() => {
          setShowLoginModal(false)
          setShowRegisterModal(true)
        }}
      />
      <RegisterModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onSwitchToLogin={() => {
          setShowRegisterModal(false)
          setShowLoginModal(true)
        }}
      />
    </>
  )
}
