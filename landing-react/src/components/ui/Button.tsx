import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      // Base styles
      'relative overflow-hidden',
      'font-medium tracking-wide',
      'rounded-xl',
      'transition-all duration-200 ease-smooth',
      'transform active:scale-[0.98]',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      // Ripple effect
      'before:absolute before:inset-0',
      'before:bg-white before:opacity-0',
      'hover:before:opacity-10',
      'before:transition-opacity before:duration-300'
    );

    const variants = {
      primary: cn(
        'bg-gray-900 text-white hover:bg-gray-800',
        'focus:ring-gray-900',
        'dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
      ),
      secondary: cn(
        'bg-gray-100 text-gray-900 hover:bg-gray-200',
        'focus:ring-gray-500',
        'dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700'
      ),
      ghost: cn(
        'bg-transparent text-gray-700 hover:bg-gray-100',
        'focus:ring-gray-500',
        'dark:text-gray-300 dark:hover:bg-gray-800'
      ),
      outline: cn(
        'border border-gray-200 bg-transparent text-gray-900 hover:bg-gray-50',
        'focus:ring-gray-500',
        'dark:border-gray-700 dark:text-white dark:hover:bg-gray-900'
      ),
    };

    const sizes = {
      xs: 'px-3 py-1.5 text-xs',
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-2.5 text-base',
      lg: 'px-8 py-3 text-lg',
      xl: 'px-10 py-4 text-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
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
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
