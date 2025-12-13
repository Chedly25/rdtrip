/**
 * Planning Error Boundary
 *
 * Error boundary and recovery UI for the planning feature.
 * Catches React errors and provides user-friendly recovery options.
 */

import { Component, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Home, MessageCircle } from 'lucide-react';

// ============================================
// Error Boundary Component
// ============================================

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
  onNavigateHome?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class PlanningErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[PlanningErrorBoundary] Caught error:', error, errorInfo);
    this.setState({ errorInfo });

    // Log to error tracking service if available
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, { extra: errorInfo });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onReset?.();
  };

  handleNavigateHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    this.props.onNavigateHome?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorRecoveryUI
          error={this.state.error}
          onRetry={this.handleReset}
          onGoHome={this.handleNavigateHome}
        />
      );
    }

    return this.props.children;
  }
}

// ============================================
// Error Recovery UI Component
// ============================================

interface ErrorRecoveryUIProps {
  error?: Error | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showContactSupport?: boolean;
}

export function ErrorRecoveryUI({
  error,
  title = 'Something went wrong',
  message,
  onRetry,
  onGoHome,
  showContactSupport = false,
}: ErrorRecoveryUIProps) {
  const errorMessage =
    message ||
    error?.message ||
    'We encountered an unexpected error while loading your plan. Your data is safe.';

  return (
    <div className="min-h-screen bg-[#FAF7F2] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#FEF3EE] to-[#FCE8DE] flex items-center justify-center"
        >
          <AlertTriangle className="w-10 h-10 text-[#C45830]" strokeWidth={1.5} />
        </motion.div>

        {/* Title */}
        <h1 className="font-['Fraunces',serif] text-2xl text-[#2C2417] font-semibold mb-3">
          {title}
        </h1>

        {/* Message */}
        <p className="text-[#8B7355] font-['Satoshi',sans-serif] leading-relaxed mb-8">
          {errorMessage}
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          {onRetry && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onRetry}
              className="
                flex items-center gap-2 px-6 py-3
                bg-gradient-to-r from-[#C45830] to-[#D4724A]
                text-white font-['Satoshi',sans-serif] font-semibold
                rounded-xl shadow-lg shadow-[#C45830]/20
                hover:shadow-xl hover:shadow-[#C45830]/30
                transition-shadow
              "
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </motion.button>
          )}

          {onGoHome && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onGoHome}
              className="
                flex items-center gap-2 px-6 py-3
                bg-[#FFFBF5] border border-[#E5DDD0]
                text-[#2C2417] font-['Satoshi',sans-serif] font-medium
                rounded-xl hover:bg-[#F5F0E8]
                transition-colors
              "
            >
              <Home className="w-4 h-4" />
              Go to dashboard
            </motion.button>
          )}
        </div>

        {/* Contact support */}
        {showContactSupport && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 pt-6 border-t border-[#E5DDD0]"
          >
            <button
              onClick={() => window.open('mailto:support@waycraft.io', '_blank')}
              className="
                inline-flex items-center gap-2
                text-sm text-[#8B7355] font-['Satoshi',sans-serif]
                hover:text-[#C45830] transition-colors
              "
            >
              <MessageCircle className="w-4 h-4" />
              Contact support
            </button>
          </motion.div>
        )}

        {/* Technical details (dev mode) */}
        {import.meta.env.DEV && error && (
          <motion.details
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-left bg-[#FFFBF5] rounded-xl border border-[#E5DDD0] p-4"
          >
            <summary className="text-xs text-[#8B7355] cursor-pointer font-['Satoshi',sans-serif]">
              Technical details (dev only)
            </summary>
            <pre className="mt-2 text-xs text-[#C45830] overflow-auto max-h-40 font-mono">
              {error.stack || error.message}
            </pre>
          </motion.details>
        )}
      </motion.div>
    </div>
  );
}

// ============================================
// Inline Error Component (for sections)
// ============================================

interface InlineErrorProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function InlineError({
  message = 'Failed to load this section',
  onRetry,
  compact = false,
}: InlineErrorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-[#FEF3EE] rounded-lg border border-[#F5E6DC]">
        <AlertTriangle className="w-4 h-4 text-[#C45830] flex-shrink-0" />
        <span className="text-sm text-[#C45830] font-['Satoshi',sans-serif] flex-1">{message}</span>
        {onRetry && (
          <button
            onClick={onRetry}
            className="
              p-1.5 rounded-lg bg-[#C45830] text-white
              hover:bg-[#A84828] transition-colors
            "
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 bg-[#FFFBF5] rounded-xl border border-[#E5DDD0] text-center"
    >
      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#FEF3EE] flex items-center justify-center">
        <AlertTriangle className="w-6 h-6 text-[#C45830]" />
      </div>
      <p className="text-sm text-[#8B7355] font-['Satoshi',sans-serif] mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="
            inline-flex items-center gap-2 px-4 py-2
            bg-[#C45830] text-white text-sm font-['Satoshi',sans-serif] font-medium
            rounded-lg hover:bg-[#A84828] transition-colors
          "
        >
          <RefreshCw className="w-3 h-3" />
          Retry
        </button>
      )}
    </motion.div>
  );
}

// ============================================
// Network Error Component
// ============================================

interface NetworkErrorProps {
  onRetry?: () => void;
}

export function NetworkError({ onRetry }: NetworkErrorProps) {
  return (
    <ErrorRecoveryUI
      title="Connection lost"
      message="We couldn't connect to our servers. Please check your internet connection and try again."
      onRetry={onRetry}
    />
  );
}

// ============================================
// Not Found Error Component
// ============================================

interface NotFoundErrorProps {
  type?: 'plan' | 'route' | 'city';
  onGoHome?: () => void;
}

export function NotFoundError({ type = 'plan', onGoHome }: NotFoundErrorProps) {
  const titles = {
    plan: 'Plan not found',
    route: 'Route not found',
    city: 'City not found',
  };

  const messages = {
    plan: 'We couldn\'t find this trip plan. It may have been deleted or you may not have access.',
    route: 'We couldn\'t find this route. It may have been deleted or moved.',
    city: 'We couldn\'t find information for this city. Please try selecting a different city.',
  };

  return (
    <ErrorRecoveryUI
      title={titles[type]}
      message={messages[type]}
      onGoHome={onGoHome}
    />
  );
}

export default PlanningErrorBoundary;
