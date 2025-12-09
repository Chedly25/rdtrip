/**
 * ErrorBoundary
 *
 * WI-11.6: Updated with RUI design tokens
 *
 * React Error Boundary component for catching and displaying runtime errors.
 * Uses the RUI design system for consistent styling.
 */

import React, { Component, type ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { hapticError } from '../utils/haptics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
    // Haptic feedback for error
    hapticError();
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });

    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-rui-32">
          <div className="max-w-md w-full">
            <div className="bg-danger/5 border border-danger/20 rounded-rui-16 p-rui-32 text-center">
              {/* Icon */}
              <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-rui-16">
                <AlertCircle className="w-8 h-8 text-danger" />
              </div>

              {/* Title */}
              <h2 className="font-display text-heading-2 text-rui-black mb-rui-8">
                Something went wrong
              </h2>

              {/* Message */}
              <p className="text-body-2 text-rui-grey-50 mb-rui-24">
                We encountered an error while loading this component. Please try refreshing the page.
              </p>

              {/* Error details (dev mode) */}
              {import.meta.env.DEV && this.state.error && (
                <details className="mb-rui-24 text-left">
                  <summary className="cursor-pointer text-body-3 font-medium text-rui-grey-40 hover:text-rui-grey-60">
                    Error Details
                  </summary>
                  <pre className="mt-rui-8 p-rui-16 bg-rui-grey-5 rounded-rui-8 text-body-3 text-rui-grey-60 overflow-auto max-h-40">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              {/* Retry button */}
              <button
                onClick={this.handleReset}
                className="
                  inline-flex items-center justify-center gap-2
                  px-6 py-3 rounded-rui-12
                  bg-danger text-white
                  hover:bg-danger/90
                  active:scale-[0.98]
                  transition-all duration-rui-sm ease-rui-default
                  text-body-2 font-semibold
                "
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier use
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
