import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'flat' | 'elevated' | 'glass' | 'gradient';
  interactive?: boolean;
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'flat',
      interactive = false,
      hover = true,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      'rounded-2xl p-6',
      'transition-all duration-300 ease-smooth',
      interactive && 'cursor-pointer',
      hover && interactive && [
        'hover:shadow-xl hover:-translate-y-1',
        // Subtle border glow on hover
        'relative before:absolute before:inset-0',
        'before:rounded-2xl before:p-[1px]',
        'before:bg-gradient-to-br before:from-gray-200 before:to-transparent',
        'before:opacity-0 hover:before:opacity-100',
        'before:transition-opacity before:duration-300',
        'before:-z-10',
      ]
    );

    const variants = {
      flat: cn(
        'bg-white border border-gray-200',
        'dark:bg-gray-900 dark:border-gray-800'
      ),
      elevated: cn(
        'bg-white shadow-lg',
        'dark:bg-gray-900 dark:shadow-2xl dark:shadow-black/20'
      ),
      glass: cn(
        'glass'
      ),
      gradient: cn(
        'bg-gradient-to-br from-gray-50 to-white border border-gray-200',
        'dark:from-gray-900 dark:to-gray-800 dark:border-gray-700'
      ),
    };

    return (
      <div
        ref={ref}
        className={cn(baseStyles, variants[variant], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card subcomponents
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mb-4', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold text-gray-900 dark:text-white', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-gray-600 dark:text-gray-400', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('', className)}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('mt-4 flex items-center gap-2', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export default Card;
