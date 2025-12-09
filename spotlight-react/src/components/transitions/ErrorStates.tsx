/**
 * ErrorStates
 *
 * WI-11.6: Unified error state components
 *
 * Provides consistent, polished error experiences:
 * - Full-page errors (404, 500, offline)
 * - Inline errors (form validation)
 * - Error banners (dismissible alerts)
 * - Empty states (no data with CTA)
 *
 * Design Philosophy:
 * - Helpful, not alarming - guide users to solutions
 * - RUI design system colors and typography
 * - Animated entrances for smooth appearance
 * - Accessible with proper ARIA attributes
 */

import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  WifiOff,
  RefreshCw,
  Home,
  ArrowLeft,
  Search,
  FileQuestion,
  ServerCrash,
  Lock,
  X,
  Info,
} from 'lucide-react';
import { EASING, DURATION } from './CardAnimations';
import { hapticError, hapticWarning } from '../../utils/haptics';

// ============================================================================
// Types
// ============================================================================

export type ErrorVariant =
  | 'error'     // Critical error (red)
  | 'warning'   // Warning state (amber)
  | 'info'      // Informational (blue)
  | 'offline';  // Network offline (gray)

export type ErrorSize = 'sm' | 'md' | 'lg' | 'full';

// ============================================================================
// Color Configuration
// ============================================================================

const variantColors: Record<ErrorVariant, {
  bg: string;
  border: string;
  icon: string;
  iconBg: string;
  button: string;
  buttonHover: string;
}> = {
  error: {
    bg: 'bg-danger/5',
    border: 'border-danger/20',
    icon: 'text-danger',
    iconBg: 'bg-danger/10',
    button: 'bg-danger text-white',
    buttonHover: 'hover:bg-danger/90',
  },
  warning: {
    bg: 'bg-warning/5',
    border: 'border-warning/20',
    icon: 'text-warning',
    iconBg: 'bg-warning/10',
    button: 'bg-warning text-white',
    buttonHover: 'hover:bg-warning/90',
  },
  info: {
    bg: 'bg-rui-accent/5',
    border: 'border-rui-accent/20',
    icon: 'text-rui-accent',
    iconBg: 'bg-rui-accent/10',
    button: 'bg-rui-accent text-white',
    buttonHover: 'hover:bg-rui-accent/90',
  },
  offline: {
    bg: 'bg-rui-grey-5',
    border: 'border-rui-grey-20',
    icon: 'text-rui-grey-50',
    iconBg: 'bg-rui-grey-10',
    button: 'bg-rui-grey-70 text-white',
    buttonHover: 'hover:bg-rui-grey-60',
  },
};

const variantIcons: Record<ErrorVariant, typeof AlertCircle> = {
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  offline: WifiOff,
};

// ============================================================================
// ErrorDisplay - Full section/page error
// ============================================================================

export interface ErrorDisplayProps {
  /** Error variant */
  variant?: ErrorVariant;
  /** Size of the display */
  size?: ErrorSize;
  /** Error title */
  title?: string;
  /** Error message */
  message?: string;
  /** Custom icon */
  icon?: ReactNode;
  /** Primary action */
  onRetry?: () => void;
  /** Primary action label */
  retryLabel?: string;
  /** Secondary action */
  onSecondary?: () => void;
  /** Secondary action label */
  secondaryLabel?: string;
  /** Show error details (dev mode) */
  errorDetails?: string;
  /** Custom className */
  className?: string;
  /** Enable haptic feedback */
  haptic?: boolean;
}

/**
 * ErrorDisplay
 *
 * Full section or page error display with actions.
 */
export function ErrorDisplay({
  variant = 'error',
  size = 'md',
  title = 'Something went wrong',
  message = 'We encountered an error. Please try again.',
  icon,
  onRetry,
  retryLabel = 'Try Again',
  onSecondary,
  secondaryLabel = 'Go Back',
  errorDetails,
  className = '',
  haptic = true,
}: ErrorDisplayProps) {
  const colors = variantColors[variant];
  const DefaultIcon = variantIcons[variant];

  // Trigger haptic on mount for errors
  if (haptic && variant === 'error') {
    hapticError();
  } else if (haptic && variant === 'warning') {
    hapticWarning();
  }

  const sizeClasses = {
    sm: 'p-4 min-h-[200px]',
    md: 'p-6 min-h-[300px]',
    lg: 'p-8 min-h-[400px]',
    full: 'p-8 min-h-screen',
  };

  const iconSizes = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-16 h-16',
    full: 'w-20 h-20',
  };

  const innerIconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-8 h-8',
    full: 'w-10 h-10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.normal, ease: EASING.smooth }}
      className={`
        flex flex-col items-center justify-center text-center
        ${sizeClasses[size]}
        ${className}
      `}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: DURATION.normal }}
        className={`
          ${iconSizes[size]} rounded-full
          ${colors.iconBg}
          flex items-center justify-center mb-4
        `}
      >
        {icon || <DefaultIcon className={`${innerIconSizes[size]} ${colors.icon}`} />}
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="font-display text-heading-3 text-rui-black mb-2"
      >
        {title}
      </motion.h3>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-body-2 text-rui-grey-50 max-w-md mb-6"
      >
        {message}
      </motion.p>

      {/* Error details (dev mode) */}
      {import.meta.env.DEV && errorDetails && (
        <motion.details
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mb-6 text-left w-full max-w-md"
        >
          <summary className="cursor-pointer text-body-3 font-medium text-rui-grey-40 hover:text-rui-grey-60">
            Error Details
          </summary>
          <pre className="mt-2 p-3 bg-rui-grey-5 rounded-rui-8 text-body-3 text-rui-grey-60 overflow-auto max-h-32">
            {errorDetails}
          </pre>
        </motion.details>
      )}

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {onRetry && (
          <motion.button
            onClick={onRetry}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              inline-flex items-center justify-center gap-2
              px-5 py-2.5 rounded-rui-12
              text-body-2 font-medium
              ${colors.button} ${colors.buttonHover}
              transition-colors duration-rui-sm
            `}
          >
            <RefreshCw className="w-4 h-4" />
            {retryLabel}
          </motion.button>
        )}

        {onSecondary && (
          <motion.button
            onClick={onSecondary}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              inline-flex items-center justify-center gap-2
              px-5 py-2.5 rounded-rui-12
              text-body-2 font-medium
              bg-rui-grey-5 text-rui-grey-70
              hover:bg-rui-grey-10
              transition-colors duration-rui-sm
            "
          >
            <ArrowLeft className="w-4 h-4" />
            {secondaryLabel}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// NotFoundError - 404 Style
// ============================================================================

export interface NotFoundErrorProps {
  /** What wasn't found */
  resourceName?: string;
  /** Custom message */
  message?: string;
  /** Go home action */
  onGoHome?: () => void;
  /** Go back action */
  onGoBack?: () => void;
  /** Search action */
  onSearch?: () => void;
  /** Custom className */
  className?: string;
}

/**
 * NotFoundError
 *
 * 404-style error for missing resources.
 */
export function NotFoundError({
  resourceName = 'Page',
  message,
  onGoHome,
  onGoBack,
  onSearch,
  className = '',
}: NotFoundErrorProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`
        flex flex-col items-center justify-center text-center
        p-8 min-h-[400px]
        ${className}
      `}
      role="alert"
    >
      {/* Large 404 */}
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="relative mb-6"
      >
        <span className="text-[120px] font-display font-bold text-rui-grey-10 leading-none">
          404
        </span>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-rui-accent/10 flex items-center justify-center">
            <FileQuestion className="w-8 h-8 text-rui-accent" />
          </div>
        </motion.div>
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="font-display text-heading-2 text-rui-black mb-2"
      >
        {resourceName} Not Found
      </motion.h2>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-body-1 text-rui-grey-50 max-w-md mb-8"
      >
        {message || `The ${resourceName.toLowerCase()} you're looking for doesn't exist or has been moved.`}
      </motion.p>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row gap-3"
      >
        {onGoHome && (
          <motion.button
            onClick={onGoHome}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              inline-flex items-center justify-center gap-2
              px-5 py-2.5 rounded-rui-12
              text-body-2 font-medium
              bg-rui-accent text-white hover:bg-rui-accent/90
              transition-colors duration-rui-sm
            "
          >
            <Home className="w-4 h-4" />
            Go Home
          </motion.button>
        )}

        {onGoBack && (
          <motion.button
            onClick={onGoBack}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              inline-flex items-center justify-center gap-2
              px-5 py-2.5 rounded-rui-12
              text-body-2 font-medium
              bg-rui-grey-5 text-rui-grey-70 hover:bg-rui-grey-10
              transition-colors duration-rui-sm
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </motion.button>
        )}

        {onSearch && (
          <motion.button
            onClick={onSearch}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              inline-flex items-center justify-center gap-2
              px-5 py-2.5 rounded-rui-12
              text-body-2 font-medium
              border border-rui-grey-20 text-rui-grey-60 hover:bg-rui-grey-5
              transition-colors duration-rui-sm
            "
          >
            <Search className="w-4 h-4" />
            Search
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// NetworkError - Offline/Connection issues
// ============================================================================

export interface NetworkErrorProps {
  /** Custom title */
  title?: string;
  /** Custom message */
  message?: string;
  /** Retry action */
  onRetry?: () => void;
  /** Whether we're currently checking connection */
  isRetrying?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * NetworkError
 *
 * Offline or network connection error display.
 */
export function NetworkError({
  title = "You're Offline",
  message = "Please check your internet connection and try again.",
  onRetry,
  isRetrying = false,
  className = '',
}: NetworkErrorProps) {
  return (
    <ErrorDisplay
      variant="offline"
      title={title}
      message={message}
      icon={<WifiOff className="w-8 h-8 text-rui-grey-50" />}
      onRetry={onRetry}
      retryLabel={isRetrying ? 'Checking...' : 'Retry Connection'}
      className={className}
      haptic={false}
    />
  );
}

// ============================================================================
// ServerError - 500 style
// ============================================================================

export interface ServerErrorProps {
  /** Custom message */
  message?: string;
  /** Retry action */
  onRetry?: () => void;
  /** Error ID for support */
  errorId?: string;
  /** Custom className */
  className?: string;
}

/**
 * ServerError
 *
 * Server error (500) display with support info.
 */
export function ServerError({
  message = "Our servers are having trouble. We're working on it.",
  onRetry,
  errorId,
  className = '',
}: ServerErrorProps) {
  return (
    <ErrorDisplay
      variant="error"
      title="Server Error"
      message={message}
      icon={<ServerCrash className="w-8 h-8 text-danger" />}
      onRetry={onRetry}
      errorDetails={errorId ? `Error ID: ${errorId}` : undefined}
      className={className}
    />
  );
}

// ============================================================================
// PermissionError - 401/403 style
// ============================================================================

export interface PermissionErrorProps {
  /** Error type */
  type?: 'unauthorized' | 'forbidden';
  /** Custom message */
  message?: string;
  /** Login action */
  onLogin?: () => void;
  /** Go back action */
  onGoBack?: () => void;
  /** Custom className */
  className?: string;
}

/**
 * PermissionError
 *
 * Permission denied or authentication required error.
 */
export function PermissionError({
  type = 'unauthorized',
  message,
  onLogin,
  onGoBack,
  className = '',
}: PermissionErrorProps) {
  const isUnauthorized = type === 'unauthorized';

  return (
    <ErrorDisplay
      variant="warning"
      title={isUnauthorized ? 'Login Required' : 'Access Denied'}
      message={
        message ||
        (isUnauthorized
          ? 'Please log in to access this content.'
          : "You don't have permission to view this content.")
      }
      icon={<Lock className="w-8 h-8 text-warning" />}
      onRetry={isUnauthorized ? onLogin : undefined}
      retryLabel="Log In"
      onSecondary={onGoBack}
      secondaryLabel="Go Back"
      className={className}
    />
  );
}

// ============================================================================
// InlineError - Form field errors
// ============================================================================

export interface InlineErrorProps {
  /** Error message */
  message: string;
  /** Whether to show */
  show?: boolean;
  /** Custom className */
  className?: string;
}

/**
 * InlineError
 *
 * Inline error message for form fields.
 */
export function InlineError({
  message,
  show = true,
  className = '',
}: InlineErrorProps) {
  return (
    <AnimatePresence>
      {show && message && (
        <motion.p
          initial={{ opacity: 0, y: -4, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -4, height: 0 }}
          transition={{ duration: DURATION.fast }}
          className={`
            flex items-center gap-1.5
            text-body-3 text-danger
            mt-1.5
            ${className}
          `}
          role="alert"
        >
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// ErrorBanner - Dismissible error banner
// ============================================================================

export interface ErrorBannerProps {
  /** Error variant */
  variant?: ErrorVariant;
  /** Banner title */
  title?: string;
  /** Banner message */
  message: string;
  /** Whether to show */
  show?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Retry handler */
  onRetry?: () => void;
  /** Custom className */
  className?: string;
}

/**
 * ErrorBanner
 *
 * Dismissible error banner for page-level messages.
 */
export function ErrorBanner({
  variant = 'error',
  title,
  message,
  show = true,
  onDismiss,
  onRetry,
  className = '',
}: ErrorBannerProps) {
  const colors = variantColors[variant];
  const Icon = variantIcons[variant];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -8, height: 0 }}
          transition={{ duration: DURATION.normal, ease: EASING.smooth }}
          className={`
            ${colors.bg} ${colors.border}
            border rounded-rui-12 p-rui-16
            ${className}
          `}
          role="alert"
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`${colors.iconBg} rounded-full p-2 flex-shrink-0`}>
              <Icon className={`w-4 h-4 ${colors.icon}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {title && (
                <p className="text-body-2 font-semibold text-rui-black mb-0.5">
                  {title}
                </p>
              )}
              <p className="text-body-2 text-rui-grey-60">{message}</p>

              {/* Actions */}
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={`
                    mt-2 text-body-3 font-medium
                    ${colors.icon} hover:underline
                  `}
                >
                  Try again
                </button>
              )}
            </div>

            {/* Dismiss */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="
                  p-1 rounded-full
                  text-rui-grey-40 hover:text-rui-grey-60
                  hover:bg-rui-grey-10
                  transition-colors duration-rui-sm
                "
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// EmptyState - No data with CTA
// ============================================================================

export interface EmptyStateProps {
  /** Empty state icon */
  icon?: ReactNode;
  /** Title */
  title: string;
  /** Description */
  description?: string;
  /** Primary action */
  onAction?: () => void;
  /** Primary action label */
  actionLabel?: string;
  /** Secondary action */
  onSecondary?: () => void;
  /** Secondary action label */
  secondaryLabel?: string;
  /** Custom className */
  className?: string;
}

/**
 * EmptyState
 *
 * Empty state display with call to action.
 */
export function EmptyState({
  icon,
  title,
  description,
  onAction,
  actionLabel = 'Get Started',
  onSecondary,
  secondaryLabel,
  className = '',
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DURATION.normal }}
      className={`
        flex flex-col items-center justify-center text-center
        p-8 min-h-[300px]
        ${className}
      `}
    >
      {/* Icon */}
      {icon && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          {icon}
        </motion.div>
      )}

      {/* Title */}
      <h3 className="font-display text-heading-3 text-rui-black mb-2">
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className="text-body-2 text-rui-grey-50 max-w-sm mb-6">
          {description}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        {onAction && (
          <motion.button
            onClick={onAction}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              px-5 py-2.5 rounded-rui-12
              text-body-2 font-medium
              bg-rui-accent text-white hover:bg-rui-accent/90
              transition-colors duration-rui-sm
            "
          >
            {actionLabel}
          </motion.button>
        )}

        {onSecondary && secondaryLabel && (
          <motion.button
            onClick={onSecondary}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="
              px-5 py-2.5 rounded-rui-12
              text-body-2 font-medium
              bg-rui-grey-5 text-rui-grey-70 hover:bg-rui-grey-10
              transition-colors duration-rui-sm
            "
          >
            {secondaryLabel}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default ErrorDisplay;
