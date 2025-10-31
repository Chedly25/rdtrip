import { forwardRef, type ButtonHTMLAttributes, type CSSProperties } from 'react'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
  asChild?: boolean
  themeColors?: { primary: string; secondary: string }
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, disabled, themeColors, style, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

    const variants = {
      default: 'text-white shadow-lg hover:shadow-xl hover:scale-105',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      outline: 'border-2 bg-transparent hover:bg-gray-50',
      ghost: 'hover:bg-gray-100',
      destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30',
    }

    // Build inline style for gradient background
    const gradientStyle: CSSProperties = variant === 'default' && themeColors
      ? {
          background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`,
          ...style
        }
      : variant === 'outline' && themeColors
      ? {
          borderColor: themeColors.primary,
          color: themeColors.primary,
          ...style
        }
      : style || {}

    const sizes = {
      default: 'h-11 px-6 py-2.5 text-sm',
      sm: 'h-9 px-4 py-2 text-xs',
      lg: 'h-14 px-8 py-3 text-base',
      icon: 'h-10 w-10',
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        style={gradientStyle}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
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
