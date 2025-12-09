/**
 * Guest Upgrade Prompt
 *
 * WI-12.3: Supabase Auth integration
 *
 * Prompts guest users to create an account to:
 * - Save their trips permanently
 * - Sync across devices
 * - Access premium features
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  X,
  Mail,
  Lock,
  User,
  AlertCircle,
  Sparkles,
  Cloud,
  Share2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth, useGuestUpgradePrompt } from '../../contexts/AuthContext';
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

interface GuestUpgradePromptProps {
  isOpen: boolean;
  onClose: () => void;
  trigger?: 'save' | 'sync' | 'share' | 'premium' | 'general';
}

const TRIGGER_MESSAGES: Record<string, { title: string; subtitle: string }> = {
  save: {
    title: 'Save Your Trip',
    subtitle: 'Create an account to keep your trips forever',
  },
  sync: {
    title: 'Sync Across Devices',
    subtitle: 'Access your trips from any device',
  },
  share: {
    title: 'Share Your Journey',
    subtitle: 'Create an account to share trips with others',
  },
  premium: {
    title: 'Unlock Premium Features',
    subtitle: 'Create an account to access all features',
  },
  general: {
    title: 'Upgrade Your Account',
    subtitle: 'Keep your trips and unlock more features',
  },
};

export function GuestUpgradePrompt({
  isOpen,
  onClose,
  trigger = 'general',
}: GuestUpgradePromptProps) {
  const { upgradeGuestAccount, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingType, setLoadingType] = useState<'email' | 'google' | null>(null);

  const { title, subtitle } = TRIGGER_MESSAGES[trigger];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setLoadingType('email');

    try {
      await upgradeGuestAccount(email, password, name || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upgrade account');
    } finally {
      setIsLoading(false);
      setLoadingType(null);
    }
  };

  const handleGoogleUpgrade = async () => {
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
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
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
                    className="w-12 h-12 rounded-2xl flex items-center justify-center relative"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(212, 168, 83, 0.15) 0%, rgba(196, 88, 48, 0.15) 100%)',
                    }}
                  >
                    <Sparkles className="w-6 h-6" style={{ color: '#D4A853' }} />
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
                      {title}
                    </h2>
                    <p className="text-sm" style={{ color: '#8B7355' }}>
                      {subtitle}
                    </p>
                  </div>
                </div>

                {/* Benefits */}
                <div className="space-y-2 mt-4">
                  {[
                    { icon: Cloud, text: 'Save trips permanently' },
                    { icon: Share2, text: 'Share with friends & family' },
                    { icon: Sparkles, text: 'Access premium features' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(61, 122, 61, 0.1)' }}
                      >
                        <Icon className="w-4 h-4" style={{ color: '#3D7A3D' }} />
                      </div>
                      <span className="text-sm" style={{ color: '#2C2417' }}>
                        {text}
                      </span>
                    </div>
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
                  onClick={handleGoogleUpgrade}
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

                {/* Divider */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" style={{ borderColor: '#E5DDD0' }} />
                  </div>
                  <div className="relative flex justify-center">
                    <span
                      className="px-4 text-sm"
                      style={{ background: '#FAF7F2', color: '#8B7355' }}
                    >
                      or with email
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div className="space-y-2">
                  <label
                    htmlFor="upgrade-name"
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
                      id="upgrade-name"
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
                    htmlFor="upgrade-email"
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
                      id="upgrade-email"
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
                    htmlFor="upgrade-password"
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
                      id="upgrade-password"
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
                  <p className="text-xs" style={{ color: '#8B7355' }}>
                    At least 6 characters
                  </p>
                </div>

                {/* Submit button */}
                <motion.button
                  type="submit"
                  disabled={isLoading || password.length < 6}
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.98 }}
                  className={cn(
                    'w-full rounded-xl py-3.5 font-semibold text-white',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                  style={{
                    background:
                      loadingType === 'email'
                        ? '#8B7355'
                        : 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
                    boxShadow:
                      loadingType === 'email' ? 'none' : '0 4px 14px rgba(196, 88, 48, 0.35)',
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

                {/* Keep as guest */}
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isLoading}
                  className="w-full text-center text-sm font-medium py-2 transition-colors hover:opacity-80 disabled:opacity-50"
                  style={{ color: '#8B7355' }}
                >
                  Continue as guest
                </button>
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

/**
 * Banner version of upgrade prompt (non-modal)
 */
export function GuestUpgradeBanner({ onUpgrade }: { onUpgrade: () => void }) {
  const showPrompt = useGuestUpgradePrompt();

  if (!showPrompt) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 flex items-center gap-4"
      style={{
        background: 'linear-gradient(135deg, rgba(212, 168, 83, 0.1) 0%, rgba(196, 88, 48, 0.1) 100%)',
        border: '1px solid rgba(212, 168, 83, 0.2)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(212, 168, 83, 0.15)' }}
      >
        <Sparkles className="w-5 h-5" style={{ color: '#D4A853' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium" style={{ color: '#2C2417' }}>
          You're in guest mode
        </p>
        <p className="text-sm" style={{ color: '#8B7355' }}>
          Create an account to save your trips
        </p>
      </div>
      <button
        onClick={onUpgrade}
        className="flex-shrink-0 px-4 py-2 rounded-xl font-medium text-white transition-transform hover:scale-105"
        style={{
          background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
        }}
      >
        Upgrade
      </button>
    </motion.div>
  );
}

/**
 * Inline upgrade CTA for specific features
 */
export function GuestFeatureGate({
  feature,
  children,
  onUpgrade,
}: {
  feature: string;
  children: React.ReactNode;
  onUpgrade: () => void;
}) {
  const showPrompt = useGuestUpgradePrompt();

  if (!showPrompt) return <>{children}</>;

  return (
    <div className="relative">
      <div className="opacity-50 pointer-events-none">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center">
        <button
          onClick={onUpgrade}
          className="flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-white transition-transform hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
            boxShadow: '0 4px 14px rgba(196, 88, 48, 0.35)',
          }}
        >
          <Lock className="w-4 h-4" />
          Create account to {feature}
        </button>
      </div>
    </div>
  );
}
