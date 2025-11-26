import { forwardRef, type HTMLAttributes } from 'react'
import { cn } from '../../lib/utils'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'elevated' | 'glass' | 'outlined'
  interactive?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

/**
 * Card component with Revolut-style design
 */
const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'flat',
      interactive = false,
      padding = 'md',
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'rounded-rui-16',
      'transition-all duration-rui-sm ease-rui-default',
      interactive && 'cursor-pointer'
    )

    const variants = {
      flat: cn(
        'bg-rui-white border border-rui-grey-10',
        interactive && 'hover:border-rui-grey-20 hover:shadow-rui-1'
      ),
      elevated: cn(
        'bg-rui-white shadow-rui-2',
        interactive && 'hover:shadow-rui-3 hover:-translate-y-0.5'
      ),
      glass: cn(
        'bg-rui-white/80 backdrop-blur-xl border border-rui-grey-10/50',
        interactive && 'hover:bg-rui-white/90 hover:shadow-rui-2'
      ),
      outlined: cn(
        'bg-transparent border border-rui-grey-20',
        interactive && 'hover:border-rui-grey-50 hover:bg-rui-grey-2'
      ),
    }

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    }

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card subcomponents with Revolut typography
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-heading-3 text-rui-black', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-body-2 text-rui-grey-50 mt-1', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('', className)}
      {...props}
    />
  )
)
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 pt-4 border-t border-rui-grey-10 flex items-center gap-3', className)}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export default Card
