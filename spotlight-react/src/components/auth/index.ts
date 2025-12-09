/**
 * Auth Components Index
 *
 * WI-12.3: Supabase Auth integration
 *
 * Exports all authentication-related components.
 */

// Existing components
export { AuthButton } from './AuthButton';
export { LoginModal } from './LoginModal';
export { RegisterModal } from './RegisterModal';

// Password Reset
export { ForgotPasswordModal } from './ForgotPasswordModal';
export { ResetPasswordPage } from './ResetPasswordPage';

// Account Management
export { AccountSettings } from './AccountSettings';

// Guest Mode
export {
  GuestUpgradePrompt,
  GuestUpgradeBanner,
  GuestFeatureGate,
} from './GuestUpgradePrompt';

// Route Protection
export {
  ProtectedRoute,
  withProtectedRoute,
  useRequireAuth,
} from './ProtectedRoute';
