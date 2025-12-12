/**
 * IntelligenceErrorBoundary
 *
 * A graceful error boundary for City Intelligence components.
 * Catches errors and provides recovery options with a calming,
 * editorial design that maintains user confidence.
 *
 * Design Philosophy:
 * - Warm, reassuring aesthetic
 * - Clear recovery paths
 * - Detailed error context for debugging
 * - Animated transitions for smooth UX
 */

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// =============================================================================
// Types
// =============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  resetKeys?: unknown[];
  variant?: 'full' | 'card' | 'inline' | 'minimal';
  componentName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
  lastErrorTime: number | null;
}

// =============================================================================
// Error Messages by Type
// =============================================================================

const getErrorMessage = (error: Error): { title: string; description: string; suggestion: string } => {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return {
      title: 'Connection Interrupted',
      description: 'We lost touch with our intelligence agents for a moment.',
      suggestion: 'Check your connection and try again.',
    };
  }

  if (message.includes('timeout')) {
    return {
      title: 'Taking Too Long',
      description: 'Our agents are working hard but need a bit more time.',
      suggestion: 'Try again with fewer cities selected.',
    };
  }

  if (message.includes('permission') || message.includes('unauthorized')) {
    return {
      title: 'Access Required',
      description: 'We need permission to access some features.',
      suggestion: 'Sign in again or check your subscription.',
    };
  }

  if (message.includes('rate') || message.includes('limit')) {
    return {
      title: 'Slow Down',
      description: 'We\'re processing requests a bit too quickly.',
      suggestion: 'Wait a moment, then try again.',
    };
  }

  if (message.includes('render') || message.includes('react')) {
    return {
      title: 'Display Glitch',
      description: 'Something went sideways while showing this view.',
      suggestion: 'Refresh the page to reset everything.',
    };
  }

  return {
    title: 'Something Unexpected',
    description: 'We hit a bump in the road.',
    suggestion: 'Try again, or let us know if it keeps happening.',
  };
};

// =============================================================================
// Error Boundary Class Component
// =============================================================================

export class IntelligenceErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      lastErrorTime: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      lastErrorTime: Date.now(),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState((prev) => ({
      errorInfo,
      errorCount: prev.errorCount + 1,
    }));

    this.props.onError?.(error, errorInfo);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Intelligence Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // Reset when resetKeys change
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      !this.arraysEqual(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.resetError();
    }
  }

  componentWillUnmount(): void {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }
  }

  private arraysEqual(a: unknown[], b: unknown[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, idx) => val === b[idx]);
  }

  resetError = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  handleRetry = (): void => {
    this.resetError();
  };

  handleReport = (): void => {
    const { error, errorInfo } = this.state;
    const { componentName } = this.props;

    const reportData = {
      error: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      component: componentName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy to clipboard for easy reporting
    navigator.clipboard.writeText(JSON.stringify(reportData, null, 2)).then(() => {
      // Could show a toast here
      console.log('Error report copied to clipboard');
    });
  };

  render(): ReactNode {
    const { children, fallback, variant = 'card', componentName } = this.props;
    const { hasError, error, errorCount } = this.state;

    if (hasError && error) {
      // Custom fallback
      if (fallback) {
        return fallback;
      }

      const errorDetails = getErrorMessage(error);

      // Render variant-specific fallback
      switch (variant) {
        case 'minimal':
          return (
            <MinimalErrorFallback
              title={errorDetails.title}
              onRetry={this.handleRetry}
            />
          );
        case 'inline':
          return (
            <InlineErrorFallback
              title={errorDetails.title}
              description={errorDetails.description}
              onRetry={this.handleRetry}
            />
          );
        case 'full':
          return (
            <FullErrorFallback
              title={errorDetails.title}
              description={errorDetails.description}
              suggestion={errorDetails.suggestion}
              error={error}
              errorCount={errorCount}
              componentName={componentName}
              onRetry={this.handleRetry}
              onReport={this.handleReport}
            />
          );
        case 'card':
        default:
          return (
            <CardErrorFallback
              title={errorDetails.title}
              description={errorDetails.description}
              suggestion={errorDetails.suggestion}
              errorCount={errorCount}
              onRetry={this.handleRetry}
              onReport={this.handleReport}
            />
          );
      }
    }

    return children;
  }
}

// =============================================================================
// Minimal Error Fallback
// =============================================================================

interface MinimalErrorFallbackProps {
  title: string;
  onRetry: () => void;
}

function MinimalErrorFallback({ title, onRetry }: MinimalErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 px-3 py-2 text-sm text-amber-700 bg-amber-50 rounded-lg"
    >
      <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <span className="flex-1 truncate">{title}</span>
      <button
        onClick={onRetry}
        className="px-2 py-0.5 text-xs font-medium text-amber-800 bg-amber-200/50 rounded hover:bg-amber-200 transition-colors"
      >
        Retry
      </button>
    </motion.div>
  );
}

// =============================================================================
// Inline Error Fallback
// =============================================================================

interface InlineErrorFallbackProps {
  title: string;
  description: string;
  onRetry: () => void;
}

function InlineErrorFallback({ title, description, onRetry }: InlineErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-amber-900">{title}</h3>
          <p className="text-sm text-amber-700 mt-0.5">{description}</p>
        </div>
        <button
          onClick={onRetry}
          className="px-3 py-1.5 text-sm font-medium text-amber-800 bg-amber-200/60 rounded-lg hover:bg-amber-200 transition-colors flex-shrink-0"
        >
          Try Again
        </button>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Card Error Fallback
// =============================================================================

interface CardErrorFallbackProps {
  title: string;
  description: string;
  suggestion: string;
  errorCount: number;
  onRetry: () => void;
  onReport: () => void;
}

function CardErrorFallback({
  title,
  description,
  suggestion,
  errorCount,
  onRetry,
  onReport,
}: CardErrorFallbackProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-lg"
    >
      {/* Decorative pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.5" fill="currentColor" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>

      <div className="relative p-6">
        {/* Icon */}
        <div className="mb-4">
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-lg shadow-amber-200"
          >
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </motion.div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-gray-600 text-sm mb-2">{description}</p>
        <p className="text-amber-700 text-sm font-medium">{suggestion}</p>

        {/* Error count badge */}
        {errorCount > 1 && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 bg-amber-100 text-amber-800 text-xs rounded-full">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Happened {errorCount} times
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 mt-5">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-md shadow-amber-200"
          >
            Try Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReport}
            className="px-4 py-2.5 border-2 border-amber-200 text-amber-700 font-medium rounded-xl hover:bg-amber-50 transition-colors"
          >
            Report
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// Full Error Fallback (Page-level)
// =============================================================================

interface FullErrorFallbackProps {
  title: string;
  description: string;
  suggestion: string;
  error: Error;
  errorCount: number;
  componentName?: string;
  onRetry: () => void;
  onReport: () => void;
}

function FullErrorFallback({
  title,
  description,
  suggestion,
  error,
  errorCount,
  componentName,
  onRetry,
  onReport,
}: FullErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[400px] flex items-center justify-center p-8 bg-gradient-to-br from-amber-50 via-white to-orange-50"
    >
      <div className="max-w-lg w-full">
        {/* Animated illustration */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 shadow-2xl shadow-amber-200/50"
          >
            <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 mb-2">{description}</p>
          <p className="text-amber-700 font-medium">{suggestion}</p>
        </motion.div>

        {/* Error count */}
        {errorCount > 1 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex justify-center mt-4"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 text-sm rounded-full">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              This has happened {errorCount} times
            </span>
          </motion.div>
        )}

        {/* Actions */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-3 mt-8"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-200"
          >
            Try Again
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onReport}
            className="px-6 py-3 border-2 border-amber-200 text-amber-700 font-semibold rounded-xl hover:bg-amber-50 transition-colors"
          >
            Copy Report
          </motion.button>
        </motion.div>

        {/* Technical details toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <span>Technical Details</span>
            <motion.svg
              animate={{ rotate: showDetails ? 180 : 0 }}
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </motion.svg>
          </button>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 p-4 bg-gray-900 rounded-xl text-left">
                  {componentName && (
                    <div className="mb-2 text-xs text-gray-500">
                      Component: <span className="text-amber-400">{componentName}</span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mb-1">Error Message:</div>
                  <div className="text-sm text-red-400 font-mono mb-3">{error.message}</div>
                  {error.stack && (
                    <>
                      <div className="text-xs text-gray-500 mb-1">Stack Trace:</div>
                      <pre className="text-xs text-gray-400 font-mono overflow-x-auto whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {error.stack}
                      </pre>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}

// =============================================================================
// HOC for Easy Wrapping
// =============================================================================

export function withIntelligenceErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: Omit<ErrorBoundaryProps, 'children'>
) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const WithErrorBoundary: React.FC<P> = (props) => (
    <IntelligenceErrorBoundary {...options} componentName={displayName}>
      <WrappedComponent {...props} />
    </IntelligenceErrorBoundary>
  );

  WithErrorBoundary.displayName = `WithIntelligenceErrorBoundary(${displayName})`;

  return WithErrorBoundary;
}

// =============================================================================
// Error Trigger for Testing
// =============================================================================

export function ErrorTrigger({ message = 'Test error triggered' }: { message?: string }) {
  const [shouldError, setShouldError] = React.useState(false);

  if (shouldError) {
    throw new Error(message);
  }

  return (
    <button
      onClick={() => setShouldError(true)}
      className="px-3 py-1.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
    >
      Trigger Error
    </button>
  );
}

// =============================================================================
// Default Export
// =============================================================================

export default IntelligenceErrorBoundary;
