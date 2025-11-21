import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo
    })

    // Call optional error handler
    this.props.onError?.(error, errorInfo)

    // Log to error reporting service in production
    if (import.meta.env.PROD) {
      // Example: logErrorToService(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-200 p-8"
          >
            {/* Error Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 20 }}
              className="flex justify-center mb-6"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-gray-900" strokeWidth={2} />
              </div>
            </motion.div>

            {/* Error Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8"
            >
              <h2 className="text-2xl font-bold text-gray-900 mb-3 tracking-tight">
                Oops! Something went wrong
              </h2>
              <p className="text-base text-gray-600 mb-4">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>

              {/* Error Details (only in development) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="text-left mt-4 p-4 bg-gray-50 rounded-lg">
                  <summary className="text-sm font-semibold text-gray-700 cursor-pointer mb-2">
                    Error Details (Development Only)
                  </summary>
                  <div className="text-xs text-gray-600 font-mono overflow-auto">
                    <p className="font-bold mb-2">{this.state.error.toString()}</p>
                    {this.state.errorInfo && (
                      <pre className="whitespace-pre-wrap text-[10px] leading-tight">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    )}
                  </div>
                </details>
              )}
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex gap-3"
            >
              <motion.button
                onClick={this.handleReset}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </motion.button>

              <motion.button
                onClick={this.handleGoHome}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-900 font-semibold rounded-xl hover:bg-gray-200 transition-all duration-200"
              >
                <Home className="w-4 h-4" />
                Go Home
              </motion.button>
            </motion.div>

            {/* Help Text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center text-sm text-gray-500 mt-6"
            >
              If this problem persists, please contact support
            </motion.p>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}
