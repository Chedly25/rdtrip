/**
 * ErrorState - Error State Components with Animations
 * Phase 6.3: Shake animations, red border pulse, inline error messages
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, XCircle } from 'lucide-react';
import { Button } from '../design-system';

/**
 * Shake animation for form errors
 */
export const shakeAnimation = {
  x: [0, -10, 10, -10, 10, -5, 5, 0],
  transition: {
    duration: 0.5,
  },
};

/**
 * Red border pulse animation
 */
export const pulseBorderAnimation = {
  boxShadow: [
    '0 0 0 0 rgba(239, 68, 68, 0)',
    '0 0 0 4px rgba(239, 68, 68, 0.2)',
    '0 0 0 0 rgba(239, 68, 68, 0)',
  ],
  transition: {
    duration: 1.5,
    repeat: Infinity,
  },
};

/**
 * Inline error message with slide-down animation
 */
interface InlineErrorProps {
  message: string;
  className?: string;
}

export const InlineError = ({ message, className = '' }: InlineErrorProps) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className={`flex items-center gap-2 text-sm text-red-600 mt-2 ${className}`}
        >
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Error input wrapper with shake and border pulse
 */
interface ErrorInputProps {
  error?: string;
  children: React.ReactNode;
  className?: string;
}

export const ErrorInput = ({ error, children, className = '' }: ErrorInputProps) => {
  return (
    <div className={className}>
      <motion.div
        animate={error ? shakeAnimation : {}}
        className={error ? 'error-input' : ''}
      >
        {children}
      </motion.div>
      {error && <InlineError message={error} />}
    </div>
  );
};

/**
 * Full page error state with retry button
 */
interface ErrorPageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  isRetrying?: boolean;
}

export const ErrorPage = ({
  title = 'Oops! Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  isRetrying = false,
}: ErrorPageProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center px-8 py-12"
    >
      {/* Error Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
        className="mb-6"
      >
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-red-600" strokeWidth={2} />
        </div>
      </motion.div>

      {/* Title */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold text-gray-900 mb-2"
      >
        {title}
      </motion.h3>

      {/* Error Message */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-gray-600 max-w-md mb-6"
      >
        {message}
      </motion.p>

      {/* Retry Button */}
      {onRetry && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            variant="primary"
            size="md"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? (
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                />
                <span>Retrying...</span>
              </div>
            ) : (
              retryLabel
            )}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * Network error state
 */
export const NetworkError = ({ onRetry }: { onRetry?: () => void }) => (
  <ErrorPage
    title="Connection Lost"
    message="We're having trouble connecting to the server. Please check your internet connection and try again."
    onRetry={onRetry}
    retryLabel="Reconnect"
  />
);

/**
 * Not found error state
 */
export const NotFoundError = ({ onGoBack }: { onGoBack?: () => void }) => (
  <ErrorPage
    title="Page Not Found"
    message="The page you're looking for doesn't exist or may have been moved."
    onRetry={onGoBack}
    retryLabel="Go Back"
  />
);

/**
 * Permission error state
 */
export const PermissionError = () => (
  <ErrorPage
    title="Access Denied"
    message="You don't have permission to view this content. Please contact the trip owner if you think this is a mistake."
  />
);
