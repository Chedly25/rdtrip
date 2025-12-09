/**
 * Authentication Context
 *
 * WI-12.3: Supabase Auth integration
 *
 * Provides authentication state and methods throughout the app:
 * - Email/password sign up and sign in
 * - OAuth (Google)
 * - Guest mode with upgrade prompts
 * - Password reset
 * - Session management with auto-refresh
 * - Account deletion (GDPR)
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  type AuthUser,
  type AuthError,
  signIn,
  signUp,
  signOut,
  signInWithOAuth,
  signInAsGuest,
  convertGuestToUser,
  getCurrentUser,
  getSession,
  refreshSession,
  onAuthStateChange,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  updateEmail,
  deleteAccount,
  resendVerificationEmail,
} from '../services/auth/authService';

// ============================================================================
// Types
// ============================================================================

export interface AuthContextType {
  // State
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isGuest: boolean;
  error: AuthError | null;

  // Auth methods
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginAsGuest: () => Promise<void>;
  upgradeGuestAccount: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;

  // Password management
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;

  // Profile management
  updateUserProfile: (updates: { displayName?: string; avatarUrl?: string }) => Promise<void>;
  changeEmail: (newEmail: string) => Promise<void>;

  // Account management
  deleteUserAccount: () => Promise<void>;
  resendVerification: () => Promise<void>;

  // Utility
  clearError: () => void;
  refreshAuth: () => Promise<void>;

  // Legacy compatibility
  token: string | null;
}

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider
// ============================================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get current session
        const { session: currentSession, error: sessionError } = await getSession();

        if (sessionError) {
          console.error('Failed to get session:', sessionError);
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (currentSession) {
          // Get user details
          const currentUser = await getCurrentUser();
          if (mounted) {
            setSession(currentSession);
            setUser(currentUser);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Subscribe to auth state changes
    const unsubscribe = onAuthStateChange((authUser, authSession) => {
      if (mounted) {
        setUser(authUser);
        setSession(authSession);
        setIsLoading(false);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // Clear error helper
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Login with email/password
  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn({ email, password });

      if (result.error) {
        setError(result.error);
        throw new Error(result.error.message);
      }

      setUser(result.user);
      setSession(result.session);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register with email/password
  const register = useCallback(async (email: string, password: string, name?: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signUp({ email, password, displayName: name });

      if (result.error) {
        setError(result.error);
        throw new Error(result.error.message);
      }

      setUser(result.user);
      setSession(result.session);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login with Google OAuth
  const loginWithGoogle = useCallback(async () => {
    setError(null);

    const result = await signInWithOAuth('google');

    if (result.error) {
      setError(result.error);
      throw new Error(result.error.message);
    }
    // OAuth redirects, so we don't need to update state here
  }, []);

  // Login as guest (anonymous)
  const loginAsGuest = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await signInAsGuest();

      if (result.error) {
        setError(result.error);
        throw new Error(result.error.message);
      }

      setUser(result.user);
      setSession(result.session);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Upgrade guest account to permanent account
  const upgradeGuestAccount = useCallback(async (email: string, password: string, name?: string) => {
    setError(null);
    setIsLoading(true);

    try {
      const result = await convertGuestToUser({ email, password, displayName: name });

      if (result.error) {
        setError(result.error);
        throw new Error(result.error.message);
      }

      setUser(result.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    setError(null);

    const result = await signOut();

    if (result.error) {
      setError(result.error);
      throw new Error(result.error.message);
    }

    setUser(null);
    setSession(null);
  }, []);

  // Reset password (send email)
  const resetPassword = useCallback(async (email: string) => {
    setError(null);

    const result = await sendPasswordResetEmail(email);

    if (result.error) {
      setError(result.error);
      throw new Error(result.error.message);
    }
  }, []);

  // Change password (while logged in)
  const changePassword = useCallback(async (newPassword: string) => {
    setError(null);

    const result = await updatePassword(newPassword);

    if (result.error) {
      setError(result.error);
      throw new Error(result.error.message);
    }
  }, []);

  // Update user profile
  const updateUserProfile = useCallback(async (updates: { displayName?: string; avatarUrl?: string }) => {
    setError(null);

    const result = await updateProfile(updates);

    if (result.error) {
      setError(result.error);
      throw new Error(result.error.message);
    }

    if (result.user) {
      setUser(result.user);
    }
  }, []);

  // Change email
  const changeEmail = useCallback(async (newEmail: string) => {
    setError(null);

    const result = await updateEmail(newEmail);

    if (result.error) {
      setError(result.error);
      throw new Error(result.error.message);
    }
  }, []);

  // Delete account
  const deleteUserAccount = useCallback(async () => {
    setError(null);

    const result = await deleteAccount();

    if (result.error) {
      setError(result.error);
      throw new Error(result.error.message);
    }

    setUser(null);
    setSession(null);
  }, []);

  // Resend verification email
  const resendVerification = useCallback(async () => {
    if (!user?.email) {
      throw new Error('No email to verify');
    }

    setError(null);

    const result = await resendVerificationEmail(user.email);

    if (result.error) {
      setError(result.error);
      throw new Error(result.error.message);
    }
  }, [user?.email]);

  // Refresh auth state
  const refreshAuth = useCallback(async () => {
    setError(null);

    const result = await refreshSession();

    if (result.error) {
      // Session expired, clear state
      setUser(null);
      setSession(null);
      return;
    }

    setUser(result.user);
    setSession(result.session);
  }, []);

  // Memoized context value
  const value = useMemo<AuthContextType>(() => ({
    // State
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    isGuest: user?.isGuest ?? false,
    error,

    // Auth methods
    login,
    register,
    loginWithGoogle,
    loginAsGuest,
    upgradeGuestAccount,
    logout,

    // Password management
    resetPassword,
    changePassword,

    // Profile management
    updateUserProfile,
    changeEmail,

    // Account management
    deleteUserAccount,
    resendVerification,

    // Utility
    clearError,
    refreshAuth,

    // Legacy compatibility - use session access token
    token: session?.access_token ?? null,
  }), [
    user,
    session,
    isLoading,
    error,
    login,
    register,
    loginWithGoogle,
    loginAsGuest,
    upgradeGuestAccount,
    logout,
    resetPassword,
    changePassword,
    updateUserProfile,
    changeEmail,
    deleteUserAccount,
    resendVerification,
    clearError,
    refreshAuth,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook for checking if user needs to upgrade from guest
 */
export function useGuestUpgradePrompt() {
  const { isGuest, isAuthenticated } = useAuth();
  return isAuthenticated && isGuest;
}

/**
 * Hook for getting auth status for protected routes
 */
export function useAuthStatus() {
  const { isAuthenticated, isLoading, isGuest, user } = useAuth();

  return {
    isAuthenticated,
    isLoading,
    isGuest,
    isVerified: user?.emailVerified ?? false,
    userId: user?.id ?? null,
  };
}

/**
 * Hook for auth error handling
 */
export function useAuthError() {
  const { error, clearError } = useAuth();

  return {
    error,
    hasError: !!error,
    clearError,
    errorMessage: error?.message ?? null,
    errorCode: error?.code ?? null,
  };
}
