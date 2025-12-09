/**
 * Haptic Feedback Utilities
 *
 * WI-11.5: Haptic feedback for mobile interactions
 *
 * Provides tactile feedback for key interactions:
 * - Button taps
 * - Toggle switches
 * - Success/error states
 * - Form submissions
 *
 * Browser Support:
 * - Android: Full support via Vibration API
 * - iOS: Limited (web apps don't have vibration access)
 * - Desktop: Graceful degradation (no-op)
 *
 * Design Philosophy:
 * - Subtle and meaningful - never annoying
 * - Enhances interactions without being required
 * - Graceful degradation on unsupported devices
 * - Respects user preferences (can be disabled)
 */

// ============================================================================
// Types
// ============================================================================

export type HapticIntensity = 'light' | 'medium' | 'heavy';

export type HapticPattern =
  | 'tap'           // Quick single tap
  | 'doubleTap'     // Two quick taps
  | 'success'       // Celebratory pattern
  | 'warning'       // Attention-getting
  | 'error'         // Error indication
  | 'selection'     // Item selected
  | 'toggle'        // Toggle state change
  | 'impact'        // Heavy impact
  | 'notification'  // Notification arrival
  | 'drag'          // Drag start/end
  | 'boundary';     // Hit min/max boundary

export interface HapticOptions {
  /** Disable haptics globally */
  disabled?: boolean;
  /** Log haptic events to console (for debugging) */
  debug?: boolean;
}

// ============================================================================
// Pattern Definitions (vibration durations in ms)
// ============================================================================

/**
 * Haptic patterns as vibration sequences
 * Format: [vibrate, pause, vibrate, pause, ...]
 */
const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  // Simple taps
  tap: 10,
  doubleTap: [10, 50, 10],

  // Feedback patterns
  success: [10, 30, 10, 30, 20],      // .- .- --
  warning: [20, 40, 20],               // -- --
  error: [30, 50, 30, 50, 50],         // Distinctive error

  // Interaction patterns
  selection: 15,
  toggle: [15, 30, 15],
  impact: 25,
  notification: [10, 100, 10, 100, 20],

  // Movement patterns
  drag: 8,
  boundary: [5, 20, 5, 20, 5],         // Quick triple pulse
};

/**
 * Intensity multipliers
 */
const INTENSITY_MULTIPLIERS: Record<HapticIntensity, number> = {
  light: 0.6,
  medium: 1.0,
  heavy: 1.5,
};

// ============================================================================
// Feature Detection
// ============================================================================

/**
 * Check if the Vibration API is supported
 */
export function isVibrationSupported(): boolean {
  return typeof navigator !== 'undefined' && 'vibrate' in navigator;
}

/**
 * Check if we're on a mobile device
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if we're on iOS (which doesn't support web vibration)
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

// ============================================================================
// Core Haptic Functions
// ============================================================================

let globalDisabled = false;
let debugMode = false;

/**
 * Configure global haptic options
 */
export function configureHaptics(options: HapticOptions): void {
  if (options.disabled !== undefined) {
    globalDisabled = options.disabled;
  }
  if (options.debug !== undefined) {
    debugMode = options.debug;
  }
}

/**
 * Trigger a vibration pattern
 */
function vibrate(pattern: number | number[]): boolean {
  if (globalDisabled) {
    if (debugMode) {
      console.log('[Haptics] Disabled globally');
    }
    return false;
  }

  if (!isVibrationSupported()) {
    if (debugMode) {
      console.log('[Haptics] Vibration API not supported');
    }
    return false;
  }

  try {
    const result = navigator.vibrate(pattern);
    if (debugMode) {
      console.log('[Haptics] Triggered:', pattern, '→', result);
    }
    return result;
  } catch (error) {
    if (debugMode) {
      console.warn('[Haptics] Error:', error);
    }
    return false;
  }
}

/**
 * Apply intensity multiplier to a pattern
 */
function applyIntensity(
  pattern: number | number[],
  intensity: HapticIntensity
): number | number[] {
  const multiplier = INTENSITY_MULTIPLIERS[intensity];

  if (typeof pattern === 'number') {
    return Math.round(pattern * multiplier);
  }

  return pattern.map((value, index) => {
    // Only multiply vibration durations (even indices), not pauses
    if (index % 2 === 0) {
      return Math.round(value * multiplier);
    }
    return value;
  });
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Trigger a haptic pattern
 */
export function triggerHaptic(
  pattern: HapticPattern,
  intensity: HapticIntensity = 'medium'
): boolean {
  const basePattern = HAPTIC_PATTERNS[pattern];
  const adjustedPattern = applyIntensity(basePattern, intensity);
  return vibrate(adjustedPattern);
}

/**
 * Simple tap feedback
 */
export function hapticTap(intensity: HapticIntensity = 'light'): boolean {
  return triggerHaptic('tap', intensity);
}

/**
 * Double tap feedback
 */
export function hapticDoubleTap(intensity: HapticIntensity = 'medium'): boolean {
  return triggerHaptic('doubleTap', intensity);
}

/**
 * Success feedback
 */
export function hapticSuccess(): boolean {
  return triggerHaptic('success', 'medium');
}

/**
 * Warning feedback
 */
export function hapticWarning(): boolean {
  return triggerHaptic('warning', 'medium');
}

/**
 * Error feedback
 */
export function hapticError(): boolean {
  return triggerHaptic('error', 'heavy');
}

/**
 * Selection feedback (for picking items)
 */
export function hapticSelection(): boolean {
  return triggerHaptic('selection', 'light');
}

/**
 * Toggle feedback (for switches)
 */
export function hapticToggle(): boolean {
  return triggerHaptic('toggle', 'medium');
}

/**
 * Impact feedback (for heavy actions)
 */
export function hapticImpact(intensity: HapticIntensity = 'heavy'): boolean {
  return triggerHaptic('impact', intensity);
}

/**
 * Notification feedback
 */
export function hapticNotification(): boolean {
  return triggerHaptic('notification', 'medium');
}

/**
 * Drag feedback
 */
export function hapticDrag(): boolean {
  return triggerHaptic('drag', 'light');
}

/**
 * Boundary reached feedback
 */
export function hapticBoundary(): boolean {
  return triggerHaptic('boundary', 'light');
}

/**
 * Stop any ongoing vibration
 */
export function stopHaptic(): boolean {
  if (!isVibrationSupported()) return false;

  try {
    return navigator.vibrate(0);
  } catch {
    return false;
  }
}

/**
 * Custom vibration pattern
 */
export function customHaptic(pattern: number | number[]): boolean {
  return vibrate(pattern);
}

// ============================================================================
// Convenience Wrappers for Event Handlers
// ============================================================================

/**
 * Create an onClick handler with haptic feedback
 */
export function withHapticTap<T extends (...args: any[]) => any>(
  handler: T,
  intensity: HapticIntensity = 'light'
): T {
  return ((...args: Parameters<T>) => {
    hapticTap(intensity);
    return handler(...args);
  }) as T;
}

/**
 * Create an onClick handler with haptic feedback (async safe)
 */
export function withHapticAsync<T extends (...args: any[]) => Promise<any>>(
  handler: T,
  options: {
    onStart?: HapticPattern;
    onSuccess?: HapticPattern;
    onError?: HapticPattern;
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    if (options.onStart) {
      triggerHaptic(options.onStart);
    }

    try {
      const result = await handler(...args);
      if (options.onSuccess) {
        triggerHaptic(options.onSuccess);
      }
      return result;
    } catch (error) {
      if (options.onError) {
        triggerHaptic(options.onError);
      }
      throw error;
    }
  }) as T;
}

export default {
  // Configuration
  configure: configureHaptics,
  isSupported: isVibrationSupported,
  isMobile: isMobileDevice,

  // Main API
  trigger: triggerHaptic,
  tap: hapticTap,
  doubleTap: hapticDoubleTap,
  success: hapticSuccess,
  warning: hapticWarning,
  error: hapticError,
  selection: hapticSelection,
  toggle: hapticToggle,
  impact: hapticImpact,
  notification: hapticNotification,
  drag: hapticDrag,
  boundary: hapticBoundary,
  stop: stopHaptic,
  custom: customHaptic,

  // Wrappers
  withTap: withHapticTap,
  withAsync: withHapticAsync,
};
