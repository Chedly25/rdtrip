import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, LogOut, Map } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { LoginModal } from './LoginModal'
import { RegisterModal } from './RegisterModal'

interface AuthButtonProps {
  isScrolled?: boolean
}

export function AuthButton({ isScrolled = true }: AuthButtonProps) {
  const navigate = useNavigate()
  const { user, logout, isLoading } = useAuth()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  if (isLoading) {
    return (
      <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200" />
    )
  }

  if (user) {
    return (
      <>
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name || user.email}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <User className="h-4 w-4" />
              )}
            </div>
            <span className="hidden sm:inline">
              {user.name || user.email.split('@')[0]}
            </span>
          </button>

          {/* Dropdown menu */}
          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowUserMenu(false)}
              />
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute right-0 top-full z-20 mt-2 w-56 overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5"
              >
                <div className="border-b border-gray-100 px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900">
                    {user.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>

                <button
                  onClick={() => {
                    navigate('/my-routes')
                    setShowUserMenu(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <Map className="h-4 w-4" />
                  <span>My Routes</span>
                </button>

                <button
                  onClick={() => {
                    logout()
                    setShowUserMenu(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </motion.div>
            </>
          )}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowLoginModal(true)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:bg-gray-100 ${
            isScrolled
              ? 'text-slate-900'
              : 'text-white shadow-[0_2px_8px_rgba(0,0,0,0.8)] hover:bg-white/10'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setShowRegisterModal(true)}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-slate-800"
        >
          Get Started
        </button>
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
