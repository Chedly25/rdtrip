/**
 * NightStepper
 *
 * WI-11.5: Added haptic feedback
 *
 * Numeric stepper for selecting number of nights.
 */

import { Minus, Plus, Moon } from 'lucide-react'
import { cn } from '../../lib/utils'
import { hapticTap, hapticBoundary } from '../../utils/haptics'

interface NightStepperProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
  className?: string
  showIcon?: boolean
  /** Enable haptic feedback */
  haptic?: boolean
}

const NightStepper = ({
  value,
  onChange,
  min = 0,
  max = 14,
  disabled = false,
  className,
  showIcon = true,
  haptic = true,
}: NightStepperProps) => {
  const handleDecrement = () => {
    if (disabled) return;

    if (value > min) {
      if (haptic) hapticTap('light');
      onChange(value - 1);
    } else {
      // At boundary
      if (haptic) hapticBoundary();
    }
  }

  const handleIncrement = () => {
    if (disabled) return;

    if (value < max) {
      if (haptic) hapticTap('light');
      onChange(value + 1);
    } else {
      // At boundary
      if (haptic) hapticBoundary();
    }
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 bg-rui-grey-5 rounded-full p-1',
        disabled && 'opacity-50',
        className
      )}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={disabled || value <= min}
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center',
          'transition-all duration-rui-sm ease-rui-default',
          'hover:bg-rui-grey-10 active:scale-95',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100'
        )}
        aria-label="Decrease nights"
      >
        <Minus className="w-3.5 h-3.5 text-rui-black" />
      </button>

      <div className="flex items-center gap-1.5 px-2 min-w-[60px] justify-center">
        {showIcon && <Moon className="w-3.5 h-3.5 text-rui-grey-50" />}
        <span className="text-emphasis-2 text-rui-black tabular-nums">
          {value}
        </span>
      </div>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={disabled || value >= max}
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center',
          'transition-all duration-rui-sm ease-rui-default',
          'hover:bg-rui-grey-10 active:scale-95',
          'disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100'
        )}
        aria-label="Increase nights"
      >
        <Plus className="w-3.5 h-3.5 text-rui-black" />
      </button>
    </div>
  )
}

export { NightStepper }
export type { NightStepperProps }
