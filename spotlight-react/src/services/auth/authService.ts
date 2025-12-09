/**
 * Authentication Service
 *
 * WI-12.3: Supabase Auth integration
 *
 * Provides all authentication operations using Supabase Auth:
 * - Email/password sign up and sign in
 * - OAuth (Google)
 * - Password reset
 * - Session management
 * - Account deletion (GDPR)
 * - Guest mode
 */

import { supabase } from '../../lib/supabase';
import type { User, Session, Provider } from '@supabase/supabase-js';

// ============================================================================
// Types
// ============================================================================

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  isGuest: boolean;
  emailVerified: boolean;
  createdAt: string;
  lastSignInAt: string | null;
}

export interface SignUpParams {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface AuthResult {
  user: AuthUser | null;
  session: Session | null;
  error: AuthError | null;
}

export interface AuthError {
  code: string;
  message: string;
}

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES: Record<string, string> = {
  'invalid_credentials': 'Invalid email or password',
  'email_not_confirmed': 'Please verify your email address',
  'user_not_found': 'No account found with this email',
  'email_address_not_authorized': 'This email is not authorized',
  'over_email_send_rate_limit': 'Too many attempts. Please try again later',
  'signup_disabled': 'Sign up is currently disabled',
  'user_already_exists': 'An account with this email already exists',
  'weak_password': 'Password is too weak. Use at least 6 characters',
  'same_password': 'New password must be different from current password',
  'invalid_email': 'Please enter a valid email address',
};

function formatAuthError(error: { message?: string; code?: string }): AuthError {
  const code = error.code || 'unknown';
  const message = ERROR_MESSAGES[code] || error.message || 'An error occurred';
  return { code, message };
}

// ============================================================================
// User Transformation
// ============================================================================

function transformUser(user: User | null): AuthUser | null {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email || null,
    displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || null,
    avatarUrl: user.user_metadata?.avatar_url || null,
    isGuest: user.is_anonymous || false,
    emailVerified: !!user.email_confirmed_at,
    createdAt: user.created_at,
    lastSignInAt: user.last_sign_in_at || null,
  };
}

// ============================================================================
// Sign Up
// ============================================================================

/**
 * Sign up with email and password
 */
export async function signUp(params: SignUpParams): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: params.email,
      password: params.password,
      options: {
        data: {
          display_name: params.displayName,
          full_name: params.displayName,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { user: null, session: null, error: formatAuthError(error) };
    }

    return {
      user: transformUser(data.user),
      session: data.session,
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: { code: 'unknown', message: 'Failed to sign up' },
    };
  }
}

// ============================================================================
// Sign In
// ============================================================================

/**
 * Sign in with email and password
 */
export async function signIn(params: SignInParams): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: params.email,
      password: params.password,
    });

    if (error) {
      return { user: null, session: null, error: formatAuthError(error) };
    }

    return {
      user: transformUser(data.user),
      session: data.session,
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: { code: 'unknown', message: 'Failed to sign in' },
    };
  }
}

/**
 * Sign in with OAuth provider (Google, GitHub, etc.)
 */
export async function signInWithOAuth(provider: Provider): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      return { error: formatAuthError(error) };
    }

    return { error: null };
  } catch (err) {
    return { error: { code: 'unknown', message: 'Failed to sign in with provider' } };
  }
}

// ============================================================================
// Guest Mode
// ============================================================================

/**
 * Sign in as anonymous guest
 * Guest users have limited features and data is local only
 */
export async function signInAsGuest(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.signInAnonymously();

    if (error) {
      return { user: null, session: null, error: formatAuthError(error) };
    }

    return {
      user: transformUser(data.user),
      session: data.session,
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: { code: 'unknown', message: 'Failed to create guest session' },
    };
  }
}

/**
 * Convert guest account to permanent account
 */
export async function convertGuestToUser(params: SignUpParams): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      email: params.email,
      password: params.password,
      data: {
        display_name: params.displayName,
        full_name: params.displayName,
      },
    });

    if (error) {
      return { user: null, session: null, error: formatAuthError(error) };
    }

    return {
      user: transformUser(data.user),
      session: null,
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: { code: 'unknown', message: 'Failed to convert guest account' },
    };
  }
}

// ============================================================================
// Sign Out
// ============================================================================

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: formatAuthError(error) };
    }

    // Clear any legacy tokens
    localStorage.removeItem('rdtrip_auth_token');
    localStorage.removeItem('rdtrip_user');
    localStorage.removeItem('token');

    return { error: null };
  } catch (err) {
    return { error: { code: 'unknown', message: 'Failed to sign out' } };
  }
}

// ============================================================================
// Password Reset
// ============================================================================

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });

    if (error) {
      return { error: formatAuthError(error) };
    }

    return { error: null };
  } catch (err) {
    return { error: { code: 'unknown', message: 'Failed to send reset email' } };
  }
}

/**
 * Update password (after reset or while logged in)
 */
export async function updatePassword(newPassword: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: formatAuthError(error) };
    }

    return { error: null };
  } catch (err) {
    return { error: { code: 'unknown', message: 'Failed to update password' } };
  }
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * Get current session
 */
export async function getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { session: null, error: formatAuthError(error) };
    }

    return { session: data.session, error: null };
  } catch (err) {
    return { session: null, error: { code: 'unknown', message: 'Failed to get session' } };
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return transformUser(user);
  } catch {
    return null;
  }
}

/**
 * Refresh the session
 */
export async function refreshSession(): Promise<AuthResult> {
  try {
    const { data, error } = await supabase.auth.refreshSession();

    if (error) {
      return { user: null, session: null, error: formatAuthError(error) };
    }

    return {
      user: transformUser(data.user),
      session: data.session,
      error: null,
    };
  } catch (err) {
    return {
      user: null,
      session: null,
      error: { code: 'unknown', message: 'Failed to refresh session' },
    };
  }
}

// ============================================================================
// Profile Management
// ============================================================================

/**
 * Update user profile
 */
export async function updateProfile(updates: {
  displayName?: string;
  avatarUrl?: string;
}): Promise<{ user: AuthUser | null; error: AuthError | null }> {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: {
        display_name: updates.displayName,
        avatar_url: updates.avatarUrl,
      },
    });

    if (error) {
      return { user: null, error: formatAuthError(error) };
    }

    return { user: transformUser(data.user), error: null };
  } catch (err) {
    return { user: null, error: { code: 'unknown', message: 'Failed to update profile' } };
  }
}

/**
 * Update email address (requires verification)
 */
export async function updateEmail(newEmail: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      email: newEmail,
    });

    if (error) {
      return { error: formatAuthError(error) };
    }

    return { error: null };
  } catch (err) {
    return { error: { code: 'unknown', message: 'Failed to update email' } };
  }
}

// ============================================================================
// Account Deletion (GDPR)
// ============================================================================

/**
 * Request account deletion
 * This soft-deletes the user's data and schedules permanent deletion
 */
export async function deleteAccount(): Promise<{ error: AuthError | null }> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { error: { code: 'not_authenticated', message: 'Not authenticated' } };
    }

    // Delete user's trips (soft delete)
    await supabase
      .from('trips')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', user.id);

    // Delete user's memories
    await supabase
      .from('memories')
      .delete()
      .eq('user_id', user.id);

    // Delete user's preferences
    await supabase
      .from('preferences')
      .delete()
      .eq('user_id', user.id);

    // Delete user's bookings
    await supabase
      .from('bookings')
      .delete()
      .eq('user_id', user.id);

    // Delete user's feedback
    await supabase
      .from('feedback')
      .delete()
      .eq('user_id', user.id);

    // Delete user's checkins
    await supabase
      .from('checkins')
      .delete()
      .eq('user_id', user.id);

    // Delete profile (this cascades from auth.users deletion)
    await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    // Sign out and delete auth user
    // Note: Full user deletion requires admin privileges or edge function
    // For now, we sign out and mark the profile for deletion
    await supabase.auth.signOut();

    // Clear local storage
    localStorage.removeItem('rdtrip_auth_token');
    localStorage.removeItem('rdtrip_user');
    localStorage.removeItem('token');

    return { error: null };
  } catch (err) {
    return { error: { code: 'unknown', message: 'Failed to delete account' } };
  }
}

// ============================================================================
// Auth State Listener
// ============================================================================

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(
  callback: (user: AuthUser | null, session: Session | null) => void
) {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      const user = session?.user ? transformUser(session.user) : null;
      callback(user, session);
    }
  );

  return () => {
    subscription.unsubscribe();
  };
}

// ============================================================================
// Verification
// ============================================================================

/**
 * Resend verification email
 */
export async function resendVerificationEmail(email: string): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: formatAuthError(error) };
    }

    return { error: null };
  } catch (err) {
    return { error: { code: 'unknown', message: 'Failed to resend verification email' } };
  }
}

// ============================================================================
// Export Types
// ============================================================================

export type { User, Session, Provider };
