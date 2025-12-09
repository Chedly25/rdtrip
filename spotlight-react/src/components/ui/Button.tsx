/**
 * Button
 *
 * WI-11.5: Added haptic feedback support
 *
 * Primary button component with variants, sizes, and loading state.
 */

import { forwardRef, type ButtonHTMLAttributes, type MouseEvent } from 'react'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'
import { hapticTap, hapticImpact, type HapticIntensity } from '../../utils/haptics'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  loading?: boolean
  /** Enable haptic feedback on click */
  haptic?: boolean | HapticIntensity
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, haptic = true, children, disabled, onClick, ...props }, ref) => {
    // Handle click with haptic feedback
    const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
      if (haptic && !disabled && !loading) {
        const intensity = typeof haptic === 'string' ? haptic : (variant === 'danger' ? 'heavy' : 'light');
        if (variant === 'danger') {
          hapticImpact(intensity);
        } else {
          hapticTap(intensity);
        }
      }
      onClick?.(e);
    };
    const baseStyles = `
      inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold
      rounded-rui-12 transition-all duration-rui-sm ease-rui-default
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rui-black focus-visible:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50
      active:scale-[0.98]
    `

    const variants = {
      primary: 'bg-rui-accent text-white hover:bg-rui-accent/90 shadow-accent hover:shadow-lg',
      secondary: 'bg-rui-grey-5 text-rui-black hover:bg-rui-grey-10 border border-rui-grey-10',
      ghost: 'bg-transparent text-rui-black hover:bg-rui-grey-5',
      danger: 'bg-danger text-white hover:bg-danger/90 shadow-rui-1',
    }

    const sizes = {
      sm: 'h-8 px-3 text-body-3',
      md: 'h-10 px-4 text-body-2',
      lg: 'h-12 px-6 text-body-1',
      icon: 'h-10 w-10 p-0',
    }

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

export { Button }
