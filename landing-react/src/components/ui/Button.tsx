import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'accent'
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  isLoading?: boolean
  rounded?: boolean
}

/**
 * Button component with Revolut-style state layer hover effect
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      rounded = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      // Base
      'group relative inline-flex items-center justify-center gap-2',
      'font-semibold',
      'overflow-hidden',
      // Transitions - Revolut easing
      'transition-all duration-rui-sm ease-rui-default',
      // Active state
      'active:scale-[0.98]',
      // Focus
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-rui-accent focus-visible:ring-offset-2',
      // Disabled
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
      // Border radius
      rounded ? 'rounded-full' : 'rounded-rui-12'
    )

    const variants = {
      primary: cn(
        'bg-rui-black text-rui-white',
        'hover:shadow-rui-2',
        // State layer
        '[&>.state-layer]:bg-white [&>.state-layer]:group-hover:opacity-10'
      ),
      secondary: cn(
        'bg-rui-grey-5 text-rui-black',
        'hover:bg-rui-grey-8',
        // State layer
        '[&>.state-layer]:bg-rui-black [&>.state-layer]:group-hover:opacity-[0.04]'
      ),
      ghost: cn(
        'bg-transparent text-rui-grey-50',
        'hover:text-rui-black',
        // State layer
        '[&>.state-layer]:bg-rui-black [&>.state-layer]:group-hover:opacity-[0.04]'
      ),
      outline: cn(
        'border border-rui-grey-20 bg-transparent text-rui-black',
        'hover:border-rui-grey-50',
        // State layer
        '[&>.state-layer]:bg-rui-black [&>.state-layer]:group-hover:opacity-[0.04]'
      ),
      accent: cn(
        'bg-rui-accent text-white',
        'hover:shadow-accent',
        // State layer
        '[&>.state-layer]:bg-white [&>.state-layer]:group-hover:opacity-10'
      ),
    }

    const sizes = {
      xs: 'px-3 py-1.5 text-xs',
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-3.5 text-base',
      xl: 'px-10 py-4 text-base',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {/* State layer - Revolut's hover effect */}
        <span
          className="state-layer absolute inset-0 opacity-0 transition-opacity duration-rui-sm pointer-events-none"
          aria-hidden="true"
        />

        {/* Content */}
        {isLoading ? (
          <span className="relative flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </span>
        ) : (
          <span className="relative">{children}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button
