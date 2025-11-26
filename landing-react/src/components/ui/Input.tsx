import { forwardRef, type InputHTMLAttributes, useState } from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  floatingLabel?: boolean
}

/**
 * Input component with Revolut-style design
 */
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
    const [isFocused, setIsFocused] = useState(false)
    const [hasValue, setHasValue] = useState(!!props.value || !!props.defaultValue)

    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    const baseInputStyles = cn(
      // Base styles
      'w-full px-4 py-3',
      'bg-rui-grey-2 border border-transparent',
      'rounded-rui-12',
      'text-rui-black placeholder-rui-grey-50',
      // Transitions - Revolut easing
      'transition-all duration-rui-sm ease-rui-default',
      // Focus states
      'focus:bg-rui-white',
      'focus:border-rui-grey-20',
      'focus:outline-none',
      'focus:ring-2 focus:ring-rui-accent/10',
      // Hover
      'hover:bg-rui-grey-5',
      // Disabled
      'disabled:opacity-50 disabled:cursor-not-allowed',
      // Error state
      error && 'border-danger bg-danger/5 focus:border-danger focus:ring-danger/10',
      // Floating label adjustment
      floatingLabel && 'pt-6 pb-2'
    )

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setHasValue(!!e.target.value)
      if (props.onChange) {
        props.onChange(e)
      }
    }

    // Floating label variant
    if (floatingLabel && label) {
      return (
        <div className="relative w-full">
          <input
            ref={ref}
            id={inputId}
            className={cn(baseInputStyles, className)}
            onFocus={(e) => {
              setIsFocused(true)
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              setIsFocused(false)
              props.onBlur?.(e)
            }}
            onChange={handleChange}
            placeholder=" "
            {...props}
          />
          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-4 pointer-events-none',
              'transition-all duration-rui-sm ease-rui-default',
              'text-rui-grey-50',
              (isFocused || hasValue) ? 'top-2 text-xs font-medium' : 'top-3.5 text-sm',
              (isFocused || hasValue) && 'text-rui-black',
              error && 'text-danger'
            )}
          >
            {label}
          </label>
          {(error || helperText) && (
            <p
              className={cn(
                'mt-2 text-xs',
                error ? 'text-danger' : 'text-rui-grey-50'
              )}
            >
              {error || helperText}
            </p>
          )}
        </div>
      )
    }

    // Standard label variant
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block mb-2 text-sm font-medium',
              'text-rui-black',
              error && 'text-danger'
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
              'mt-2 text-xs',
              error ? 'text-danger' : 'text-rui-grey-50'
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
