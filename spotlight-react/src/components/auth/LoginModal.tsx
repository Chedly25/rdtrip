/**
 * Login Modal - Editorial Design
 *
 * A warm, inviting authentication modal that matches the
 * "Wanderlust Editorial" design system - cream backgrounds,
 * Fraunces display type, terracotta accents.
 */

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { X, Mail, Lock, AlertCircle, Compass } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSwitchToRegister: () => void
}

export function LoginModal({ isOpen, onClose, onSwitchToRegister }: LoginModalProps) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      onClose()
      setEmail('')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with warm blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-[#2C2417]/40 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30
              }}
              className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] pointer-events-auto"
              style={{
                background: 'linear-gradient(165deg, #FFFBF5 0%, #FAF7F2 100%)',
                boxShadow: '0 25px 50px -12px rgba(44, 36, 23, 0.25), 0 0 0 1px rgba(44, 36, 23, 0.05)'
              }}
            >
              {/* Decorative top accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: 'linear-gradient(90deg, #C45830 0%, #D4A853 50%, #C45830 100%)'
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute right-4 top-4 z-10 p-2 rounded-xl text-[#8B7355] transition-all hover:bg-[#2C2417]/5 hover:text-[#2C2417]"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.12) 0%, rgba(212, 168, 83, 0.12) 100%)'
                    }}
                  >
                    <Compass className="w-6 h-6" style={{ color: '#C45830' }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-semibold"
                      style={{
                        fontFamily: "'Fraunces', Georgia, serif",
                        color: '#2C2417',
                        letterSpacing: '-0.02em'
                      }}
                    >
                      Welcome Back
                    </h2>
                    <p className="text-sm" style={{ color: '#8B7355' }}>
                      Sign in to access your journeys
                    </p>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div
                className="mx-8 border-t border-dashed"
                style={{ borderColor: 'rgba(139, 115, 85, 0.2)' }}
              />

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-5">
                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="flex items-start gap-3 rounded-xl p-4 text-sm"
                        style={{
                          background: 'rgba(181, 74, 74, 0.08)',
                          color: '#B54A4A',
                          border: '1px solid rgba(181, 74, 74, 0.15)'
                        }}
                      >
                        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <p>{error}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="login-email"
                    className="block text-sm font-medium"
                    style={{ color: '#2C2417' }}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#8B7355' }}
                    />
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className={cn(
                        "w-full rounded-xl py-3 pl-12 pr-4 text-[#2C2417] placeholder-[#C4B8A5]",
                        "transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-[#C45830]"
                      )}
                      style={{
                        background: '#F5F0E8',
                        border: '1px solid #E5DDD0'
                      }}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="login-password"
                    className="block text-sm font-medium"
                    style={{ color: '#2C2417' }}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#8B7355' }}
                    />
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className={cn(
                        "w-full rounded-xl py-3 pl-12 pr-4 text-[#2C2417] placeholder-[#C4B8A5]",
                        "transition-all duration-200",
                        "focus:outline-none focus:ring-2 focus:ring-[#C45830]"
                      )}
                      style={{
                        background: '#F5F0E8',
                        border: '1px solid #E5DDD0'
                      }}
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "w-full rounded-xl py-3.5 font-semibold text-white",
                    "transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                  style={{
                    background: isLoading
                      ? '#8B7355'
                      : 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
                    boxShadow: isLoading
                      ? 'none'
                      : '0 4px 14px rgba(196, 88, 48, 0.35)'
                  }}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Signing in...
                    </span>
                  ) : (
                    'Sign In'
                  )}
                </motion.button>

                {/* Divider with text */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: '#E5DDD0' }} />
                  </div>
                  <div className="relative flex justify-center">
                    <span
                      className="px-4 text-sm"
                      style={{ background: '#FAF7F2', color: '#8B7355' }}
                    >
                      New to rdtrip?
                    </span>
                  </div>
                </div>

                {/* Switch to register */}
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className={cn(
                    "w-full rounded-xl py-3 font-medium",
                    "transition-all duration-200 hover:bg-[#F5F0E8]"
                  )}
                  style={{
                    color: '#C45830',
                    border: '1px solid #E5DDD0'
                  }}
                >
                  Create an account
                </button>
              </form>

              {/* Bottom accent */}
              <div
                className="h-1"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(212, 168, 83, 0.3) 50%, transparent 100%)'
                }}
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
