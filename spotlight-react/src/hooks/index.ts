/**
 * Hooks
 *
 * Centralized exports for custom React hooks.
 */

// Haptic Feedback (WI-11.5)
export {
  useHapticFeedback,
  useHapticButton,
  useHapticToggle,
  useHapticSubmit,
  type UseHapticFeedbackOptions,
  type HapticFeedbackAPI,
} from './useHapticFeedback';

// Mobile Responsive (WI-11.7)
export {
  // Core hooks
  useMediaQuery,
  useBreakpoint,
  useMobile,
  useViewport,
  // Mobile-specific
  useKeyboardVisible,
  useSafeArea,
  useTouchDevice,
  usePreferReducedMotion,
  // Utilities
  useScrollLock,
  useInputFocus,
  // Constants
  BREAKPOINTS,
  MIN_TOUCH_TARGET,
  RECOMMENDED_TOUCH_TARGET,
  // Types
  type Breakpoint,
  type ViewportDimensions,
  type SafeAreaInsets,
  type KeyboardState,
} from './useMobile';
