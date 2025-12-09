/**
 * useHapticFeedback Hook
 *
 * WI-11.5: React hook for haptic feedback
 *
 * Provides a convenient React API for triggering haptic feedback
 * on user interactions like button taps, toggles, and form submissions.
 *
 * @example
 * function MyButton() {
 *   const haptic = useHapticFeedback();
 *
 *   return (
 *     <button onClick={() => {
 *       haptic.tap();
 *       handleClick();
 *     }}>
 *       Click me
 *     </button>
 *   );
 * }
 *
 * @example
 * // With success/error feedback
 * async function handleSubmit() {
 *   haptic.tap();
 *   try {
 *     await saveData();
 *     haptic.success();
 *   } catch {
 *     haptic.error();
 *   }
 * }
 */

import { useCallback, useMemo } from 'react';
import {
  hapticTap,
  hapticDoubleTap,
  hapticSuccess,
  hapticWarning,
  hapticError,
  hapticSelection,
  hapticToggle,
  hapticImpact,
  hapticNotification,
  hapticDrag,
  hapticBoundary,
  triggerHaptic,
  isVibrationSupported,
  isMobileDevice,
  type HapticIntensity,
  type HapticPattern,
} from '../utils/haptics';

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseHapticFeedbackOptions {
  /** Disable all haptics for this hook instance */
  disabled?: boolean;
}

export interface HapticFeedbackAPI {
  /** Whether haptics are supported on this device */
  isSupported: boolean;
  /** Whether this is a mobile device */
  isMobile: boolean;
  /** Whether haptics are enabled for this hook */
  isEnabled: boolean;

  /** Light tap feedback */
  tap: (intensity?: HapticIntensity) => void;
  /** Double tap feedback */
  doubleTap: (intensity?: HapticIntensity) => void;
  /** Success feedback (task completed, form saved) */
  success: () => void;
  /** Warning feedback (approaching limit, confirmation needed) */
  warning: () => void;
  /** Error feedback (validation failed, action blocked) */
  error: () => void;
  /** Selection feedback (item picked from list) */
  selection: () => void;
  /** Toggle feedback (switch flipped) */
  toggle: () => void;
  /** Impact feedback (heavy action, deletion) */
  impact: (intensity?: HapticIntensity) => void;
  /** Notification feedback (new message, alert) */
  notification: () => void;
  /** Drag feedback (drag start/end) */
  drag: () => void;
  /** Boundary feedback (min/max reached) */
  boundary: () => void;
  /** Trigger a specific pattern */
  trigger: (pattern: HapticPattern, intensity?: HapticIntensity) => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * useHapticFeedback
 *
 * React hook providing haptic feedback methods for interactions.
 * Gracefully degrades on unsupported devices.
 */
export function useHapticFeedback(
  options: UseHapticFeedbackOptions = {}
): HapticFeedbackAPI {
  const { disabled = false } = options;

  const isSupported = isVibrationSupported();
  const isMobile = isMobileDevice();
  const isEnabled = !disabled && isSupported;

  // Memoized callbacks to prevent unnecessary re-renders
  const tap = useCallback(
    (intensity: HapticIntensity = 'light') => {
      if (isEnabled) hapticTap(intensity);
    },
    [isEnabled]
  );

  const doubleTap = useCallback(
    (intensity: HapticIntensity = 'medium') => {
      if (isEnabled) hapticDoubleTap(intensity);
    },
    [isEnabled]
  );

  const success = useCallback(() => {
    if (isEnabled) hapticSuccess();
  }, [isEnabled]);

  const warning = useCallback(() => {
    if (isEnabled) hapticWarning();
  }, [isEnabled]);

  const error = useCallback(() => {
    if (isEnabled) hapticError();
  }, [isEnabled]);

  const selection = useCallback(() => {
    if (isEnabled) hapticSelection();
  }, [isEnabled]);

  const toggle = useCallback(() => {
    if (isEnabled) hapticToggle();
  }, [isEnabled]);

  const impact = useCallback(
    (intensity: HapticIntensity = 'heavy') => {
      if (isEnabled) hapticImpact(intensity);
    },
    [isEnabled]
  );

  const notification = useCallback(() => {
    if (isEnabled) hapticNotification();
  }, [isEnabled]);

  const drag = useCallback(() => {
    if (isEnabled) hapticDrag();
  }, [isEnabled]);

  const boundary = useCallback(() => {
    if (isEnabled) hapticBoundary();
  }, [isEnabled]);

  const trigger = useCallback(
    (pattern: HapticPattern, intensity: HapticIntensity = 'medium') => {
      if (isEnabled) triggerHaptic(pattern, intensity);
    },
    [isEnabled]
  );

  // Return stable object reference
  return useMemo(
    () => ({
      isSupported,
      isMobile,
      isEnabled,
      tap,
      doubleTap,
      success,
      warning,
      error,
      selection,
      toggle,
      impact,
      notification,
      drag,
      boundary,
      trigger,
    }),
    [
      isSupported,
      isMobile,
      isEnabled,
      tap,
      doubleTap,
      success,
      warning,
      error,
      selection,
      toggle,
      impact,
      notification,
      drag,
      boundary,
      trigger,
    ]
  );
}

// ============================================================================
// Convenience Hooks
// ============================================================================

/**
 * useHapticButton
 *
 * Returns an onClick handler that triggers haptic feedback.
 *
 * @example
 * const handleClick = useHapticButton(() => doSomething());
 * <button onClick={handleClick}>Click</button>
 */
export function useHapticButton<T extends (...args: any[]) => any>(
  handler: T,
  intensity: HapticIntensity = 'light'
): T {
  const haptic = useHapticFeedback();

  return useCallback(
    ((...args: Parameters<T>) => {
      haptic.tap(intensity);
      return handler(...args);
    }) as T,
    [handler, haptic, intensity]
  );
}

/**
 * useHapticToggle
 *
 * Returns an onChange handler for toggles with haptic feedback.
 *
 * @example
 * const handleToggle = useHapticToggle(setEnabled);
 * <Switch onChange={handleToggle} />
 */
export function useHapticToggle<T extends (value: boolean) => void>(
  handler: T
): T {
  const haptic = useHapticFeedback();

  return useCallback(
    ((value: boolean) => {
      haptic.toggle();
      return handler(value);
    }) as T,
    [handler, haptic]
  );
}

/**
 * useHapticSubmit
 *
 * Returns an async handler with success/error haptic feedback.
 *
 * @example
 * const handleSubmit = useHapticSubmit(async () => {
 *   await saveForm();
 * });
 */
export function useHapticSubmit<T extends (...args: any[]) => Promise<any>>(
  handler: T
): T {
  const haptic = useHapticFeedback();

  return useCallback(
    (async (...args: Parameters<T>) => {
      haptic.tap();
      try {
        const result = await handler(...args);
        haptic.success();
        return result;
      } catch (error) {
        haptic.error();
        throw error;
      }
    }) as T,
    [handler, haptic]
  );
}

export default useHapticFeedback;
