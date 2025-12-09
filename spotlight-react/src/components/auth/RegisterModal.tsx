/**
 * Register Modal - Editorial Design
 *
 * WI-12.3: Supabase Auth integration
 *
 * A warm, welcoming registration modal that matches the
 * "Wanderlust Editorial" design system.
 *
 * Features:
 * - Email/password registration
 * - Google OAuth
 * - Password strength indicator
 * - Email verification notice
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  Mail,
  Lock,
  User,
  AlertCircle,
  MapPin,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  Info,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn } from '../../lib/utils';

// Google icon as SVG
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
}

export function RegisterModal({ isOpen, onClose, onSwitchToLogin }: RegisterModalProps) {
  const { register, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'email' | 'google' | null>(null);
  const [showVerificationNotice, setShowVerificationNotice] = useState(false);

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, label: '', color: '' };

    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { score, label: 'Weak', color: '#B54A4A' };
    if (score <= 3) return { score, label: 'Fair', color: '#D4A853' };
    if (score <= 4) return { score, label: 'Good', color: '#6B8E6B' };
    return { score, label: 'Strong', color: '#3D7A3D' };
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setLoadingType('email');

    try {
      await register(email, password, name || undefined);
      // Show verification notice if email confirmation is required
      setShowVerificationNotice(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setIsLoading(true);
    setLoadingType('google');

    try {
      await loginWithGoogle();
      // OAuth redirects
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign up failed');
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setName('');
      setEmail('');
      setPassword('');
      setError('');
      setShowVerificationNotice(false);
    }
  };

  if (!isOpen) return null;

  // Verification notice screen
  if (showVerificationNotice) {
    return createPortal(
      <AnimatePresence>
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            className="fixed inset-0 z-[100] bg-[#2C2417]/40 backdrop-blur-sm"
          />

          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] pointer-events-auto p-8"
              style={{
                background: 'linear-gradient(165deg, #FFFBF5 0%, #FAF7F2 100%)',
                boxShadow:
                  '0 25px 50px -12px rgba(44, 36, 23, 0.25), 0 0 0 1px rgba(44, 36, 23, 0.05)',
              }}
            >
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(107, 142, 107, 0.15) 0%, rgba(61, 122, 61, 0.15) 100%)',
                  }}
                >
                  <Mail className="w-8 h-8" style={{ color: '#3D7A3D' }} />
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
                  We've sent a verification link to{' '}
                  <strong style={{ color: '#2C2417' }}>{email}</strong>. Please click the link to
                  verify your account.
                </p>

                <div
                  className="flex items-start gap-3 rounded-xl p-4 text-sm text-left mb-6"
                  style={{
                    background: 'rgba(212, 168, 83, 0.08)',
                    border: '1px solid rgba(212, 168, 83, 0.2)',
                  }}
                >
                  <Info className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#D4A853' }} />
                  <p style={{ color: '#8B6914' }}>
                    Didn't receive the email? Check your spam folder or try again in a few minutes.
                  </p>
                </div>

                <motion.button
                  onClick={handleClose}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full rounded-xl py-3.5 font-semibold text-white"
                  style={{
                    background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
                    boxShadow: '0 4px 14px rgba(196, 88, 48, 0.35)',
                  }}
                >
                  Got it
                </motion.button>
              </div>
            </motion.div>
          </div>
        </>
      </AnimatePresence>,
      document.body
    );
  }

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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 30,
              }}
              className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] pointer-events-auto my-8"
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
                  background: 'linear-gradient(90deg, #D4A853 0%, #C45830 50%, #D4A853 100%)',
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

              {/* Header */}
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(212, 168, 83, 0.15) 0%, rgba(196, 88, 48, 0.15) 100%)',
                    }}
                  >
                    <MapPin className="w-6 h-6" style={{ color: '#D4A853' }} />
                    <Sparkles className="w-3 h-3 absolute top-1 right-1" style={{ color: '#C45830' }} />
                  </div>
                  <div>
                    <h2
                      className="text-2xl font-semibold"
                      style={{
                        fontFamily: "'Fraunces', Georgia, serif",
                        color: '#2C2417',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      Start Your Journey
                    </h2>
                    <p className="text-sm" style={{ color: '#8B7355' }}>
                      Create an account to save your trips
                    </p>
                  </div>
                </div>

                {/* Benefits pills */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {['Save routes', 'Collaborate', 'Sync devices'].map((benefit, i) => (
                    <motion.span
                      key={benefit}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.05 }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        background: 'rgba(212, 168, 83, 0.12)',
                        color: '#8B6914',
                      }}
                    >
                      <span style={{ color: '#D4A853' }}>+</span>
                      {benefit}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div
                className="mx-8 border-t border-dashed"
                style={{ borderColor: 'rgba(139, 115, 85, 0.2)' }}
              />

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-8 pt-6 space-y-4">
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

                {/* Google Sign Up */}
                <motion.button
                  type="button"
                  onClick={handleGoogleRegister}
                  disabled={isLoading}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className={cn(
                    'w-full flex items-center justify-center gap-3 rounded-xl py-3 font-medium',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E5DDD0',
                    color: '#2C2417',
                  }}
                >
                  {loadingType === 'google' ? (
                    <motion.div
                      className="w-5 h-5 border-2 border-[#C45830]/30 border-t-[#C45830] rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <GoogleIcon className="w-5 h-5" />
                  )}
                  Continue with Google
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
                      or sign up with email
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="register-name"
                    className="block text-sm font-medium"
                    style={{ color: '#2C2417' }}
                  >
                    Name <span style={{ color: '#8B7355' }}>(optional)</span>
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 pointer-events-none"
                      style={{ color: '#8B7355' }}
                    />
                    <input
                      id="register-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your name"
                      className={cn(
                        'w-full rounded-xl py-3 pl-12 pr-4 text-[#2C2417] placeholder-[#C4B8A5]',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-[#C45830]'
                      )}
                      style={{
                        background: '#F5F0E8',
                        border: '1px solid #E5DDD0',
                      }}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label
                    htmlFor="register-email"
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
                      id="register-email"
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

                {/* Password */}
                <div className="space-y-2">
                  <label
                    htmlFor="register-password"
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
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Choose a password"
                      className={cn(
                        'w-full rounded-xl py-3 pl-12 pr-12 text-[#2C2417] placeholder-[#C4B8A5]',
                        'transition-all duration-200',
                        'focus:outline-none focus:ring-2 focus:ring-[#C45830]'
                      )}
                      style={{
                        background: '#F5F0E8',
                        border: '1px solid #E5DDD0',
                      }}
                      required
                      minLength={6}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8B7355] hover:text-[#2C2417] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>

                  {/* Password strength indicator */}
                  {password && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-2"
                    >
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className="h-1 flex-1 rounded-full transition-colors"
                            style={{
                              background:
                                level <= passwordStrength.score
                                  ? passwordStrength.color
                                  : 'rgba(139, 115, 85, 0.2)',
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: passwordStrength.color }}>
                          {passwordStrength.label}
                        </span>
                        <span style={{ color: '#8B7355' }}>Min 6 characters</span>
                      </div>
                    </motion.div>
                  )}

                  {/* Password requirements */}
                  <div className="space-y-1 pt-1">
                    {[
                      { check: password.length >= 6, text: '6+ characters' },
                      { check: /[A-Z]/.test(password), text: 'Uppercase letter' },
                      { check: /[0-9]/.test(password), text: 'Number' },
                    ].map(({ check, text }) => (
                      <div
                        key={text}
                        className="flex items-center gap-2 text-xs"
                        style={{ color: check ? '#3D7A3D' : '#8B7355' }}
                      >
                        <Check
                          className={cn('h-3 w-3 transition-opacity', check ? 'opacity-100' : 'opacity-30')}
                        />
                        {text}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || password.length < 6}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className={cn(
                    'w-full rounded-xl py-3.5 font-semibold text-white mt-2',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  style={{
                    background:
                      loadingType === 'email'
                        ? '#8B7355'
                        : 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
                    boxShadow: loadingType === 'email' ? 'none' : '0 4px 14px rgba(196, 88, 48, 0.35)',
                  }}
                >
                  {loadingType === 'email' ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </motion.button>

                {/* Terms notice */}
                <p className="text-xs text-center pt-2" style={{ color: '#8B7355' }}>
                  By creating an account, you agree to our{' '}
                  <a href="/terms" className="underline hover:opacity-80">
                    Terms
                  </a>{' '}
                  and{' '}
                  <a href="/privacy" className="underline hover:opacity-80">
                    Privacy Policy
                  </a>
                </p>

                {/* Switch to login */}
                <p className="text-center text-sm pt-2" style={{ color: '#8B7355' }}>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    disabled={isLoading}
                    className="font-semibold hover:underline disabled:opacity-50"
                    style={{ color: '#C45830' }}
                  >
                    Sign in
                  </button>
                </p>
              </form>

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
