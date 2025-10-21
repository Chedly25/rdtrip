import { forwardRef, type ButtonHTMLAttributes } from 'react'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  isLoading?: boolean
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

    const variants = {
      default: 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
      outline: 'border-2 border-gray-200 bg-transparent hover:bg-gray-50',
      ghost: 'hover:bg-gray-100',
      destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30',
    }

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
