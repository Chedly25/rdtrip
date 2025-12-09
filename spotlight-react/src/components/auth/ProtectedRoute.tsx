/**
 * Protected Route Component
 *
 * WI-12.3: Supabase Auth integration
 *
 * Wraps routes that require authentication:
 * - Redirects to login if not authenticated
 * - Shows loading state while checking auth
 * - Supports guest mode with optional upgrade prompts
 * - Can require verified email
 */

import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass, Lock, Mail } from 'lucide-react';
import { useAuthStatus } from '../../contexts/AuthContext';
import { GuestUpgradePrompt } from './GuestUpgradePrompt';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Require non-guest account */
  requireAccount?: boolean;
  /** Require verified email */
  requireVerified?: boolean;
  /** Custom fallback component */
  fallback?: React.ReactNode;
  /** Redirect path when not authenticated (default: '/') */
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAccount = false,
  requireVerified = false,
  fallback,
  redirectTo = '/',
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, isGuest, isVerified } = useAuthStatus();
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  // Show loading state
  if (isLoading) {
    return fallback || <LoadingScreen />;
  }

  // Not authenticated at all - redirect
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Guest user but account required
  if (requireAccount && isGuest) {
    return (
      <>
        <GuestRequiredScreen onUpgrade={() => setShowUpgradePrompt(true)} />
        <GuestUpgradePrompt
          isOpen={showUpgradePrompt}
          onClose={() => setShowUpgradePrompt(false)}
          trigger="premium"
        />
      </>
    );
  }

  // Email verification required
  if (requireVerified && !isVerified && !isGuest) {
    return <VerificationRequiredScreen />;
  }

  return <>{children}</>;
}

/**
 * Loading Screen Component
 */
function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(165deg, #FFFBF5 0%, #FAF7F2 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{
            background:
              'linear-gradient(135deg, rgba(196, 88, 48, 0.12) 0%, rgba(212, 168, 83, 0.12) 100%)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Compass className="w-8 h-8" style={{ color: '#C45830' }} />
        </motion.div>
        <p className="text-sm" style={{ color: '#8B7355' }}>
          Loading...
        </p>
      </motion.div>
    </div>
  );
}

/**
 * Guest Required Screen (shown when account is needed)
 */
function GuestRequiredScreen({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(165deg, #FFFBF5 0%, #FAF7F2 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div
          className="rounded-[1.5rem] p-8"
          style={{
            background: '#FFFFFF',
            boxShadow:
              '0 25px 50px -12px rgba(44, 36, 23, 0.15), 0 0 0 1px rgba(44, 36, 23, 0.05)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background:
                'linear-gradient(135deg, rgba(196, 88, 48, 0.12) 0%, rgba(212, 168, 83, 0.12) 100%)',
            }}
          >
            <Lock className="w-8 h-8" style={{ color: '#C45830' }} />
          </div>

          <h1
            className="text-2xl font-semibold mb-2"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              color: '#2C2417',
            }}
          >
            Account Required
          </h1>

          <p className="text-sm mb-6" style={{ color: '#8B7355' }}>
            Create an account to access this feature. Your trips and data will be saved.
          </p>

          <motion.button
            onClick={onUpgrade}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full rounded-xl py-3.5 font-semibold text-white"
            style={{
              background: 'linear-gradient(135deg, #C45830 0%, #D4A853 100%)',
              boxShadow: '0 4px 14px rgba(196, 88, 48, 0.35)',
            }}
          >
            Create Account
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Verification Required Screen
 */
function VerificationRequiredScreen() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(165deg, #FFFBF5 0%, #FAF7F2 100%)' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md text-center"
      >
        <div
          className="rounded-[1.5rem] p-8"
          style={{
            background: '#FFFFFF',
            boxShadow:
              '0 25px 50px -12px rgba(44, 36, 23, 0.15), 0 0 0 1px rgba(44, 36, 23, 0.05)',
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{
              background:
                'linear-gradient(135deg, rgba(212, 168, 83, 0.12) 0%, rgba(139, 105, 20, 0.12) 100%)',
            }}
          >
            <Mail className="w-8 h-8" style={{ color: '#D4A853' }} />
          </div>

          <h1
            className="text-2xl font-semibold mb-2"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              color: '#2C2417',
            }}
          >
            Verify Your Email
          </h1>

          <p className="text-sm mb-6" style={{ color: '#8B7355' }}>
            Please check your email and click the verification link to access this feature.
          </p>

          <div
            className="rounded-xl p-4 text-sm"
            style={{
              background: 'rgba(212, 168, 83, 0.08)',
              border: '1px solid rgba(212, 168, 83, 0.2)',
              color: '#8B6914',
            }}
          >
            Didn't receive the email? Check your spam folder or request a new verification link from
            your account settings.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * Higher-order component for protected routes
 */
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<ProtectedRouteProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}

/**
 * Hook to check if current route should show auth UI
 */
export function useRequireAuth(options?: {
  requireAccount?: boolean;
  requireVerified?: boolean;
}) {
  const { isAuthenticated, isLoading, isGuest, isVerified } = useAuthStatus();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireAuth = () => {
    if (!isAuthenticated) {
      setShowAuthModal(true);
      return false;
    }

    if (options?.requireAccount && isGuest) {
      setShowAuthModal(true);
      return false;
    }

    if (options?.requireVerified && !isVerified && !isGuest) {
      return false;
    }

    return true;
  };

  return {
    isAuthenticated,
    isLoading,
    isGuest,
    isVerified,
    requireAuth,
    showAuthModal,
    setShowAuthModal,
  };
}
