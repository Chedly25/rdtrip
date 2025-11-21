import { forwardRef, type InputHTMLAttributes, useState } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  floatingLabel?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      floatingLabel = false,
      id,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue);

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

    const baseInputStyles = cn(
      'w-full px-4 py-3',
      'bg-gray-50 border border-gray-200',
      'rounded-xl',
      'text-gray-900 placeholder-gray-400',
      'transition-all duration-200 ease-smooth',
      'focus:bg-white',
      'focus:border-gray-900',
      'focus:outline-none',
      'focus:ring-2 focus:ring-gray-900/10',
      'hover:border-gray-300',
      'shadow-inner shadow-gray-100/50',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      'dark:bg-gray-800 dark:border-gray-700',
      'dark:text-white dark:placeholder-gray-500',
      'dark:focus:bg-gray-900 dark:focus:border-white',
      error && 'border-error focus:border-error focus:ring-error/10',
      floatingLabel && 'pt-6 pb-2'
    );

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value);
      if (props.onChange) {
        props.onChange(e);
      }
    };

    if (floatingLabel && label) {
      return (
        <div className="relative w-full">
          <input
            ref={ref}
            id={inputId}
            className={cn(baseInputStyles, className)}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            onChange={handleChange}
            placeholder=" "
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-4 transition-all duration-200',
              'text-gray-500 pointer-events-none',
              'peer-placeholder-shown:top-4 peer-placeholder-shown:text-base',
              (isFocused || hasValue) && 'top-2 text-xs',
              (isFocused || hasValue) && 'text-gray-900 dark:text-white',
              !isFocused && !hasValue && 'top-4 text-base',
              error && 'text-error'
            )}
          >
            {label}
          </label>
          {(error || helperText) && (
            <p
              className={cn(
                'mt-1.5 text-xs',
                error ? 'text-error' : 'text-gray-500 dark:text-gray-400'
              )}
            >
              {error || helperText}
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block mb-2 text-sm font-medium',
              'text-gray-700 dark:text-gray-300',
              error && 'text-error'
            )}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(baseInputStyles, className)}
          {...props}
        />
        {(error || helperText) && (
          <p
            className={cn(
              'mt-1.5 text-xs',
              error ? 'text-error' : 'text-gray-500 dark:text-gray-400'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
