/**
 * Forgot Password Modal - Editorial Design
 *
 * WI-12.3: Supabase Auth integration
 *
 * A warm modal for password reset requests that matches the
 * "Wanderlust Editorial" design system.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToLogin: () => void;
}

export function ForgotPasswordModal({
  isOpen,
  onClose,
  onBackToLogin,
}: ForgotPasswordModalProps) {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await resetPassword(email);
      setIsSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setEmail('');
      setError('');
      setIsSuccess(false);
    }
  };

  if (!isOpen) return null;

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
            onClick={handleClose}
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
                damping: 30,
              }}
              className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] pointer-events-auto"
              style={{
                background: 'linear-gradient(165deg, #FFFBF5 0%, #FAF7F2 100%)',
                boxShadow:
                  '0 25px 50px -12px rgba(44, 36, 23, 0.25), 0 0 0 1px rgba(44, 36, 23, 0.05)',
              }}
            >
              {/* Decorative top accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: 'linear-gradient(90deg, #C45830 0%, #D4A853 50%, #C45830 100%)',
                }}
              />

              {/* Close button */}
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="absolute right-4 top-4 z-10 p-2 rounded-xl text-[#8B7355] transition-all hover:bg-[#2C2417]/5 hover:text-[#2C2417] disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="p-8">
                {isSuccess ? (
                  // Success state
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                      style={{
                        background:
                          'linear-gradient(135deg, rgba(107, 142, 107, 0.15) 0%, rgba(61, 122, 61, 0.15) 100%)',
                      }}
                    >
                      <CheckCircle className="w-8 h-8" style={{ color: '#3D7A3D' }} />
                    </div>

                    <h2
                      className="text-2xl font-semibold mb-2"
                      style={{
                        fontFamily: "'Fraunces', Georgia, serif",
                        color: '#2C2417',
                      }}
                    >
                      Check Your Email
                    </h2>

                    <p className="text-sm mb-6" style={{ color: '#8B7355' }}>
                      We've sent a password reset link to{' '}
                      <strong style={{ color: '#2C2417' }}>{email}</strong>. Click the link in the
                      email to reset your password.
                    </p>

                    <div
                      className="flex items-start gap-3 rounded-xl p-4 text-sm text-left mb-6"
                      style={{
                        background: 'rgba(212, 168, 83, 0.08)',
                        border: '1px solid rgba(212, 168, 83, 0.2)',
                      }}
                    >
                      <Mail className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#D4A853' }} />
                      <p style={{ color: '#8B6914' }}>
                        Didn't receive the email? Check your spam folder or try again in a few
                        minutes.
                      </p>
                    </div>

                    <motion.button
                      onClick={onBackToLogin}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl py-3.5 font-semibold text-white"
                      style={{
                        background: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
                        boxShadow: '0 4px 14px rgba(196, 88, 48, 0.35)',
                      }}
                    >
                      Back to Sign In
                    </motion.button>
                  </motion.div>
                ) : (
                  // Form state
                  <>
                    {/* Header */}
                    <div className="mb-6">
                      <button
                        onClick={onBackToLogin}
                        className="flex items-center gap-2 text-sm font-medium mb-4 transition-colors hover:opacity-80"
                        style={{ color: '#8B7355' }}
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Sign In
                      </button>

                      <h2
                        className="text-2xl font-semibold mb-2"
                        style={{
                          fontFamily: "'Fraunces', Georgia, serif",
                          color: '#2C2417',
                          letterSpacing: '-0.02em',
                        }}
                      >
                        Reset Your Password
                      </h2>
                      <p className="text-sm" style={{ color: '#8B7355' }}>
                        Enter your email address and we'll send you a link to reset your password.
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                border: '1px solid rgba(181, 74, 74, 0.15)',
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
                          htmlFor="reset-email"
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
                            id="reset-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            className={cn(
                              'w-full rounded-xl py-3 pl-12 pr-4 text-[#2C2417] placeholder-[#C4B8A5]',
                              'transition-all duration-200',
                              'focus:outline-none focus:ring-2 focus:ring-[#C45830]'
                            )}
                            style={{
                              background: '#F5F0E8',
                              border: '1px solid #E5DDD0',
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
                        whileHover={{ scale: isLoading ? 1 : 1.01 }}
                        whileTap={{ scale: isLoading ? 1 : 0.98 }}
                        className={cn(
                          'w-full rounded-xl py-3.5 font-semibold text-white',
                          'transition-all duration-200',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                        style={{
                          background: isLoading
                            ? '#8B7355'
                            : 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
                          boxShadow: isLoading ? 'none' : '0 4px 14px rgba(196, 88, 48, 0.35)',
                        }}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-2">
                            <motion.div
                              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            />
                            Sending...
                          </span>
                        ) : (
                          'Send Reset Link'
                        )}
                      </motion.button>
                    </form>
                  </>
                )}
              </div>

              {/* Bottom accent */}
              <div
                className="h-1"
                style={{
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(212, 168, 83, 0.3) 50%, transparent 100%)',
                }}
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
