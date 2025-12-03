/**
 * Error Boundary - Wanderlust Editorial Design
 *
 * Beautiful error handling that maintains the warm, editorial aesthetic
 * even when things go wrong. Errors should feel like a gentle pause,
 * not a roadblock.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Compass, RefreshCw, Home, MapPin, AlertTriangle } from 'lucide-react'
import { getFriendlyError, isRecoverableError } from '../utils/errorMessages'

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

const warmEasing = [0.23, 1, 0.32, 1] as const

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
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
      errorInfo: null,
    })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      const friendlyError = getFriendlyError(this.state.error)
      const canRecover = isRecoverableError(this.state.error)

      // Default Wanderlust Editorial error UI
      return (
        <div
          className="min-h-screen flex items-center justify-center px-4 py-16"
          style={{
            background: 'linear-gradient(180deg, #FFFBF5 0%, #FAF7F2 100%)',
          }}
        >
          {/* Grain texture overlay */}
          <div
            className="fixed inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: warmEasing }}
            className="relative max-w-lg w-full"
          >
            {/* Card */}
            <div
              className="relative rounded-3xl p-8 md:p-10 overflow-hidden"
              style={{
                background: '#FFFFFF',
                boxShadow:
                  '0 4px 40px rgba(44, 36, 23, 0.08), 0 0 0 1px rgba(44, 36, 23, 0.04)',
              }}
            >
              {/* Decorative top accent */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{
                  background: 'linear-gradient(90deg, #C45830 0%, #D4A853 50%, #6B8E7B 100%)',
                }}
              />

              {/* Decorative compass illustration */}
              <motion.div
                initial={{ scale: 0.8, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}
                className="flex justify-center mb-8"
              >
                <div className="relative">
                  {/* Outer ring */}
                  <div
                    className="w-24 h-24 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        'linear-gradient(135deg, rgba(196, 88, 48, 0.1) 0%, rgba(212, 168, 83, 0.15) 100%)',
                    }}
                  >
                    {/* Inner icon */}
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <Compass
                        className="w-12 h-12"
                        style={{ color: '#C45830' }}
                        strokeWidth={1.25}
                      />
                    </motion.div>
                  </div>

                  {/* Floating accent */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="absolute -top-2 -right-2 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #D4A853 0%, #C49A48 100%)',
                    }}
                  >
                    <AlertTriangle className="w-4 h-4 text-white" />
                  </motion.div>

                  {/* Map pin accent */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="absolute -bottom-1 -left-3 w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #6B8E7B 0%, #5A7D6A 100%)',
                    }}
                  >
                    <MapPin className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                </div>
              </motion.div>

              {/* Error Content */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, ease: warmEasing }}
                className="text-center mb-8"
              >
                <h2
                  className="text-2xl md:text-3xl font-semibold mb-3"
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    color: '#2C2417',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {friendlyError.title}
                </h2>
                <p
                  className="text-base leading-relaxed mb-4"
                  style={{ color: '#8B7355' }}
                >
                  {friendlyError.message}
                </p>

                {friendlyError.suggestion && (
                  <p
                    className="text-sm px-4 py-2 rounded-xl inline-block"
                    style={{
                      background: 'rgba(212, 168, 83, 0.1)',
                      color: '#8B7355',
                    }}
                  >
                    {friendlyError.suggestion}
                  </p>
                )}

                {/* Error Details (development only) */}
                {import.meta.env.DEV && this.state.error && (
                  <details
                    className="text-left mt-6 p-4 rounded-xl"
                    style={{ background: '#F5F0E8' }}
                  >
                    <summary
                      className="text-sm font-medium cursor-pointer mb-2"
                      style={{ color: '#5A5347' }}
                    >
                      Technical Details (Dev Only)
                    </summary>
                    <div
                      className="text-xs font-mono overflow-auto"
                      style={{ color: '#8B7355' }}
                    >
                      <p className="font-semibold mb-2">
                        {this.state.error.toString()}
                      </p>
                      {this.state.errorInfo && (
                        <pre className="whitespace-pre-wrap text-[10px] leading-tight opacity-75">
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
                transition={{ delay: 0.4, ease: warmEasing }}
                className="flex flex-col sm:flex-row gap-3"
              >
                {canRecover && (
                  <motion.button
                    onClick={this.handleReset}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-semibold text-white transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
                      boxShadow: '0 4px 20px rgba(196, 88, 48, 0.3)',
                    }}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Try Again
                  </motion.button>
                )}

                <motion.button
                  onClick={this.handleRefresh}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-semibold transition-all"
                  style={{
                    background: canRecover ? '#F5F0E8' : 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
                    color: canRecover ? '#5A5347' : 'white',
                    boxShadow: canRecover ? 'none' : '0 4px 20px rgba(196, 88, 48, 0.3)',
                  }}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh Page
                </motion.button>

                <motion.button
                  onClick={this.handleGoHome}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-semibold transition-all"
                  style={{
                    background: '#F5F0E8',
                    color: '#5A5347',
                  }}
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </motion.button>
              </motion.div>

              {/* Help Text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-center text-xs mt-6"
                style={{ color: '#C4B8A5' }}
              >
                If this keeps happening, please reach out to support
              </motion.p>
            </div>

            {/* Decorative SVG route line behind card */}
            <svg
              className="absolute -z-10 -bottom-8 -right-8 w-48 h-48 opacity-20"
              viewBox="0 0 200 200"
            >
              <path
                d="M 20 180 Q 50 100, 100 120 T 180 20"
                fill="none"
                stroke="#C45830"
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray="8 4"
              />
              <circle cx="20" cy="180" r="6" fill="#C45830" />
              <circle cx="180" cy="20" r="6" fill="#D4A853" />
            </svg>
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

/**
 * Inline Error Display - Wanderlust Editorial
 *
 * For displaying errors within a page context (not full-page takeover)
 */
interface InlineErrorProps {
  error: Error | string
  onRetry?: () => void
  className?: string
}

export function InlineError({ error, onRetry, className = '' }: InlineErrorProps) {
  const friendlyError = getFriendlyError(error)
  const canRecover = isRecoverableError(error)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl p-6 ${className}`}
      style={{
        background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.08) 0%, rgba(196, 88, 48, 0.04) 100%)',
        border: '1px solid rgba(196, 88, 48, 0.15)',
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(196, 88, 48, 0.15) 0%, rgba(196, 88, 48, 0.25) 100%)',
          }}
        >
          <AlertTriangle className="w-5 h-5" style={{ color: '#C45830' }} />
        </div>

        <div className="flex-1 min-w-0">
          <h4
            className="font-semibold mb-1"
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              color: '#2C2417',
              letterSpacing: '-0.01em',
            }}
          >
            {friendlyError.title}
          </h4>
          <p className="text-sm mb-3" style={{ color: '#8B7355' }}>
            {friendlyError.message}
          </p>

          {canRecover && onRetry && (
            <motion.button
              onClick={onRetry}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: 'linear-gradient(135deg, #C45830 0%, #B54A2A 100%)',
                color: 'white',
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try Again
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
