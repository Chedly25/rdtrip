import { useState } from 'react'
import { X, Mail, UserPlus, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface InviteCollaboratorModalProps {
  isOpen: boolean
  onClose: () => void
  routeId: string
  onSuccess: () => void
}

type RoleType = 'editor' | 'viewer'

export function InviteCollaboratorModal({
  isOpen,
  onClose,
  routeId,
  onSuccess,
}: InviteCollaboratorModalProps) {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<RoleType>('editor')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validate email format
  function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    // Validate email
    if (!email.trim()) {
      setError('Email address is required')
      return
    }

    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address')
      return
    }

    setIsSubmitting(true)

    try {
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`/api/routes/${routeId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: email.trim(),
          role,
          message: message.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Show success message
        setSuccess(true)

        // Call success callback after a brief delay
        setTimeout(() => {
          onSuccess()
          handleClose()
        }, 1500)
      } else {
        // Handle error responses
        setError(data.error || 'Failed to send invitation')
      }
    } catch (error) {
      console.error('Error inviting collaborator:', error)
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Reset form and close modal
  function handleClose() {
    setEmail('')
    setRole('editor')
    setMessage('')
    setError(null)
    setSuccess(false)
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Invite Collaborator</h2>
                <p className="text-xs text-gray-600">Add someone to help plan this trip</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-white/50 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Success message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Invitation sent!</p>
                  <p className="text-xs text-green-700 mt-0.5">
                    They'll receive an email invitation to collaborate.
                  </p>
                </div>
              </motion.div>
            )}

            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-900">{error}</p>
              </motion.div>
            )}

            {/* Email input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError(null)
                  }}
                  placeholder="friend@example.com"
                  disabled={isSubmitting || success}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 transition-shadow"
                  required
                />
              </div>
              <p className="text-xs text-gray-500">
                They'll need to have an account to accept the invitation
              </p>
            </div>

            {/* Role selector */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('editor')}
                  disabled={isSubmitting || success}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    role === 'editor'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        role === 'editor' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                    >
                      <svg
                        className={`h-5 w-5 ${role === 'editor' ? 'text-blue-600' : 'text-gray-600'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-sm font-medium ${
                          role === 'editor' ? 'text-blue-900' : 'text-gray-900'
                        }`}
                      >
                        Editor
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Can make changes</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('viewer')}
                  disabled={isSubmitting || success}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    role === 'viewer'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`p-2 rounded-lg ${
                        role === 'viewer' ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                    >
                      <svg
                        className={`h-5 w-5 ${role === 'viewer' ? 'text-blue-600' : 'text-gray-600'}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    </div>
                    <div className="text-center">
                      <p
                        className={`text-sm font-medium ${
                          role === 'viewer' ? 'text-blue-900' : 'text-gray-900'
                        }`}
                      >
                        Viewer
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Can only view</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Optional message */}
            <div className="space-y-2">
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Personal Message <span className="text-gray-400 text-xs">(Optional)</span>
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hey! Want to help plan this trip together?"
                disabled={isSubmitting || success}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 resize-none transition-shadow"
                maxLength={500}
              />
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Add a personal note to the invitation</p>
                <p className="text-xs text-gray-400">{message.length}/500</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || success || !email.trim()}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Sent!</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Send Invitation</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
