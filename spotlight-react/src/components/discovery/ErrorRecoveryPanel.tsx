/**
 * ErrorRecoveryPanel
 *
 * A thoughtful error handling interface that helps users understand
 * what went wrong and provides clear recovery options.
 *
 * Design Philosophy:
 * - Calm, reassuring tone (not alarming red alerts)
 * - Clear explanation of what happened
 * - Actionable recovery options
 * - Transparent about retry attempts
 * - Graceful degradation suggestions
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  RefreshCw,
  WifiOff,
  Clock,
  Server,
  XCircle,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  Zap,
  ArrowRight,
  Copy,
  ExternalLink,
  HelpCircle,
} from 'lucide-react';

// =============================================================================
// Types
// =============================================================================

export type ErrorType =
  | 'network'
  | 'timeout'
  | 'server'
  | 'rate_limit'
  | 'validation'
  | 'unknown';

export interface IntelligenceError {
  type: ErrorType;
  message: string;
  cityId?: string;
  cityName?: string;
  agent?: string;
  code?: string;
  timestamp: Date;
  retryCount?: number;
  recoverable?: boolean;
  details?: string;
}

interface ErrorRecoveryPanelProps {
  errors: IntelligenceError[];
  onRetry: (error: IntelligenceError) => Promise<void>;
  onRetryAll: () => Promise<void>;
  onDismiss: (error: IntelligenceError) => void;
  onDismissAll: () => void;
  maxRetries?: number;
  variant?: 'panel' | 'inline' | 'toast';
}

// =============================================================================
// Configuration
// =============================================================================

const ERROR_CONFIG: Record<ErrorType, {
  icon: typeof AlertCircle;
  title: string;
  color: string;
  bgColor: string;
  suggestion: string;
}> = {
  network: {
    icon: WifiOff,
    title: 'Connection Issue',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    suggestion: 'Check your internet connection and try again',
  },
  timeout: {
    icon: Clock,
    title: 'Request Timed Out',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    suggestion: 'The server took too long to respond. Try again or reduce quality settings',
  },
  server: {
    icon: Server,
    title: 'Server Error',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    suggestion: 'Our servers are having trouble. Please try again in a moment',
  },
  rate_limit: {
    icon: Zap,
    title: 'Rate Limited',
    color: 'text-violet-600',
    bgColor: 'bg-violet-50',
    suggestion: 'Too many requests. Please wait a moment before retrying',
  },
  validation: {
    icon: XCircle,
    title: 'Invalid Request',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    suggestion: 'Something was wrong with the request. Check your inputs',
  },
  unknown: {
    icon: AlertCircle,
    title: 'Something Went Wrong',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    suggestion: 'An unexpected error occurred. Please try again',
  },
};

// =============================================================================
// Main Component
// =============================================================================

export function ErrorRecoveryPanel({
  errors,
  onRetry,
  onRetryAll,
  onDismiss,
  onDismissAll,
  maxRetries = 3,
  variant = 'panel',
}: ErrorRecoveryPanelProps) {
  const [retryingErrors, setRetryingErrors] = useState<Set<string>>(new Set());
  const [isRetryingAll, setIsRetryingAll] = useState(false);
  const [expandedError, setExpandedError] = useState<string | null>(null);
  const [copiedError, setCopiedError] = useState<string | null>(null);

  // Group errors by city
  const errorsByCityId = errors.reduce((acc, error) => {
    const key = error.cityId || 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(error);
    return acc;
  }, {} as Record<string, IntelligenceError[]>);

  // Get error ID for tracking
  const getErrorId = (error: IntelligenceError) =>
    `${error.cityId || 'general'}-${error.agent || 'system'}-${error.timestamp.getTime()}`;

  // Handle single retry
  const handleRetry = useCallback(async (error: IntelligenceError) => {
    const errorId = getErrorId(error);
    if (retryingErrors.has(errorId)) return;
    if ((error.retryCount || 0) >= maxRetries) return;

    setRetryingErrors(prev => new Set(prev).add(errorId));

    try {
      await onRetry(error);
    } finally {
      setRetryingErrors(prev => {
        const next = new Set(prev);
        next.delete(errorId);
        return next;
      });
    }
  }, [onRetry, maxRetries, retryingErrors]);

  // Handle retry all
  const handleRetryAll = useCallback(async () => {
    if (isRetryingAll) return;
    setIsRetryingAll(true);

    try {
      await onRetryAll();
    } finally {
      setIsRetryingAll(false);
    }
  }, [onRetryAll, isRetryingAll]);

  // Copy error details
  const handleCopyError = useCallback((error: IntelligenceError) => {
    const errorText = `
Error: ${error.message}
Type: ${error.type}
City: ${error.cityName || error.cityId || 'N/A'}
Agent: ${error.agent || 'N/A'}
Code: ${error.code || 'N/A'}
Time: ${error.timestamp.toISOString()}
${error.details ? `\nDetails:\n${error.details}` : ''}
    `.trim();

    navigator.clipboard.writeText(errorText);
    setCopiedError(getErrorId(error));
    setTimeout(() => setCopiedError(null), 2000);
  }, []);

  // Empty state
  if (errors.length === 0) {
    return null;
  }

  // Toast variant
  if (variant === 'toast') {
    const latestError = errors[errors.length - 1];
    const config = ERROR_CONFIG[latestError.type];
    const Icon = config.icon;

    return (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 max-w-sm"
      >
        <div className={`${config.bgColor} rounded-2xl shadow-xl border border-gray-200 overflow-hidden`}>
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-5 h-5 ${config.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm">{config.title}</p>
                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{latestError.message}</p>
              </div>
              <button
                onClick={() => onDismiss(latestError)}
                className="p-1 rounded-lg hover:bg-black/5 transition-colors"
              >
                <XCircle className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div className="flex border-t border-gray-200/50">
            <button
              onClick={() => handleRetry(latestError)}
              disabled={retryingErrors.has(getErrorId(latestError))}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 hover:bg-white/50 transition-colors disabled:opacity-50"
            >
              {retryingErrors.has(getErrorId(latestError)) ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Retry
            </button>
            {errors.length > 1 && (
              <button
                onClick={() => onDismissAll()}
                className="flex-1 py-2.5 text-sm font-medium text-gray-500 hover:bg-white/50 transition-colors border-l border-gray-200/50"
              >
                Dismiss All ({errors.length})
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  }

  // Panel/Inline variant
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`
        rounded-2xl border overflow-hidden
        ${variant === 'panel'
          ? 'bg-white shadow-xl border-gray-200'
          : 'bg-rose-50/50 border-rose-200'
        }
      `}
    >
      {/* Header */}
      <div className={`p-4 border-b ${variant === 'panel' ? 'border-gray-100' : 'border-rose-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {errors.length === 1 ? 'An Error Occurred' : `${errors.length} Errors`}
              </h3>
              <p className="text-xs text-gray-500">
                {errors.filter(e => e.recoverable !== false).length} can be retried
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRetryAll}
              disabled={isRetryingAll || errors.filter(e => e.recoverable !== false).length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 text-sm font-medium hover:bg-rose-200 transition-colors disabled:opacity-50"
            >
              {isRetryingAll ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw className="w-4 h-4" />
                </motion.div>
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Retry All
            </button>
            <button
              onClick={onDismissAll}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <XCircle className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Error List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
        {errors.map((error) => {
          const errorId = getErrorId(error);
          const config = ERROR_CONFIG[error.type];
          const Icon = config.icon;
          const isExpanded = expandedError === errorId;
          const isRetrying = retryingErrors.has(errorId);
          const canRetry = error.recoverable !== false && (error.retryCount || 0) < maxRetries;

          return (
            <div key={errorId} className="bg-white">
              {/* Error summary */}
              <div
                onClick={() => setExpandedError(isExpanded ? null : errorId)}
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <div className={`w-9 h-9 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {error.cityName || error.agent || config.title}
                    </p>
                    {error.retryCount && error.retryCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-gray-100 text-[10px] font-medium text-gray-500">
                        Retry {error.retryCount}/{maxRetries}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 truncate mt-0.5">{error.message}</p>
                </div>

                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </motion.div>
              </div>

              {/* Expanded details */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 space-y-3">
                      {/* Suggestion */}
                      <div className={`p-3 rounded-lg ${config.bgColor} flex items-start gap-2`}>
                        <HelpCircle className={`w-4 h-4 ${config.color} flex-shrink-0 mt-0.5`} />
                        <p className="text-sm text-gray-700">{config.suggestion}</p>
                      </div>

                      {/* Error details */}
                      {error.details && (
                        <div className="p-3 rounded-lg bg-gray-50 font-mono text-xs text-gray-600 overflow-x-auto">
                          {error.details}
                        </div>
                      )}

                      {/* Meta info */}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        {error.code && <span>Code: {error.code}</span>}
                        <span>{error.timestamp.toLocaleTimeString()}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {canRetry && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRetry(error);
                            }}
                            disabled={isRetrying}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                            {isRetrying ? (
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </motion.div>
                            ) : (
                              <RefreshCw className="w-4 h-4" />
                            )}
                            Retry
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyError(error);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition-colors"
                        >
                          {copiedError === errorId ? (
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedError === errorId ? 'Copied!' : 'Copy Details'}
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(error);
                          }}
                          className="px-3 py-1.5 rounded-lg text-gray-500 text-sm font-medium hover:bg-gray-100 transition-colors ml-auto"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

// =============================================================================
// Inline Error Message
// =============================================================================

interface InlineErrorProps {
  error: IntelligenceError;
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export function InlineError({ error, onRetry, onDismiss, compact }: InlineErrorProps) {
  const config = ERROR_CONFIG[error.type];
  const Icon = config.icon;

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${config.bgColor}`}>
        <Icon className={`w-4 h-4 ${config.color}`} />
        <span className="text-sm text-gray-700 flex-1 truncate">{error.message}</span>
        {onRetry && (
          <button onClick={onRetry} className="p-1 rounded hover:bg-black/10 transition-colors">
            <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-xl ${config.bgColor} border border-gray-200/50 overflow-hidden`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl bg-white/50 flex items-center justify-center flex-shrink-0`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{config.title}</p>
            <p className="text-sm text-gray-600 mt-1">{error.message}</p>
            <p className="text-xs text-gray-500 mt-2">{config.suggestion}</p>
          </div>
        </div>
      </div>

      {(onRetry || onDismiss) && (
        <div className="flex border-t border-gray-200/50 bg-white/30">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-gray-700 hover:bg-white/50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className={`flex-1 py-2.5 text-sm font-medium text-gray-500 hover:bg-white/50 transition-colors ${onRetry ? 'border-l border-gray-200/50' : ''}`}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ErrorRecoveryPanel;
