/**
 * Auth Services Index
 *
 * WI-12.3: Supabase Auth integration
 *
 * Exports all authentication service functions and types.
 */

export {
  // Types
  type AuthUser,
  type SignUpParams,
  type SignInParams,
  type AuthResult,
  type AuthError,

  // Sign Up / Sign In
  signUp,
  signIn,
  signInWithOAuth,
  signInAsGuest,
  convertGuestToUser,
  signOut,

  // Password Management
  sendPasswordResetEmail,
  updatePassword,

  // Session Management
  getSession,
  getCurrentUser,
  refreshSession,
  onAuthStateChange,

  // Profile Management
  updateProfile,
  updateEmail,

  // Account Management
  deleteAccount,
  resendVerificationEmail,

  // Re-exported Types
  type User,
  type Session,
  type Provider,
} from './authService';
