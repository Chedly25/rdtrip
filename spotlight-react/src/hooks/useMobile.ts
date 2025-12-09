/**
 * Mobile Responsive Hooks
 *
 * WI-11.7: Centralized mobile utilities
 *
 * Provides React hooks for responsive behavior:
 * - useMediaQuery: Raw media query matching
 * - useBreakpoint: Tailwind breakpoint detection
 * - useMobile: Simple mobile/desktop detection
 * - useViewport: Viewport dimensions with resize tracking
 * - useKeyboardVisible: Virtual keyboard detection
 * - useSafeArea: Safe area insets for notches/dynamic islands
 * - useTouchDevice: Touch capability detection
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export interface ViewportDimensions {
  width: number;
  height: number;
  isLandscape: boolean;
  isPortrait: boolean;
}

export interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface KeyboardState {
  isVisible: boolean;
  height: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Tailwind default breakpoints in pixels
 */
export const BREAKPOINTS: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

/**
 * Minimum touch target size (Apple HIG recommends 44pt, Material 48dp)
 * We use 44px as the minimum for iOS compatibility
 */
export const MIN_TOUCH_TARGET = 44;

/**
 * Recommended touch target size for optimal usability
 */
export const RECOMMENDED_TOUCH_TARGET = 48;

// ============================================================================
// useMediaQuery
// ============================================================================

/**
 * useMediaQuery
 *
 * Subscribe to a CSS media query and get reactive updates.
 *
 * @example
 * const isWide = useMediaQuery('(min-width: 768px)');
 * const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Legacy browsers
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}

// ============================================================================
// useBreakpoint
// ============================================================================

/**
 * useBreakpoint
 *
 * Get the current Tailwind breakpoint and helpers for responsive logic.
 *
 * @example
 * const { breakpoint, isAbove, isBelow } = useBreakpoint();
 * if (isAbove('md')) { // Desktop layout }
 * if (isBelow('lg')) { // Mobile/tablet layout }
 */
export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('xs');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width >= BREAKPOINTS['2xl']) setBreakpoint('2xl');
      else if (width >= BREAKPOINTS.xl) setBreakpoint('xl');
      else if (width >= BREAKPOINTS.lg) setBreakpoint('lg');
      else if (width >= BREAKPOINTS.md) setBreakpoint('md');
      else if (width >= BREAKPOINTS.sm) setBreakpoint('sm');
      else setBreakpoint('xs');
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  const isAbove = useCallback(
    (bp: Breakpoint): boolean => {
      return BREAKPOINTS[breakpoint] >= BREAKPOINTS[bp];
    },
    [breakpoint]
  );

  const isBelow = useCallback(
    (bp: Breakpoint): boolean => {
      return BREAKPOINTS[breakpoint] < BREAKPOINTS[bp];
    },
    [breakpoint]
  );

  const isExactly = useCallback(
    (bp: Breakpoint): boolean => {
      return breakpoint === bp;
    },
    [breakpoint]
  );

  return useMemo(
    () => ({
      breakpoint,
      isAbove,
      isBelow,
      isExactly,
      isMobile: BREAKPOINTS[breakpoint] < BREAKPOINTS.md,
      isTablet:
        BREAKPOINTS[breakpoint] >= BREAKPOINTS.md &&
        BREAKPOINTS[breakpoint] < BREAKPOINTS.lg,
      isDesktop: BREAKPOINTS[breakpoint] >= BREAKPOINTS.lg,
    }),
    [breakpoint, isAbove, isBelow, isExactly]
  );
}

// ============================================================================
// useMobile
// ============================================================================

/**
 * useMobile
 *
 * Simple mobile detection hook.
 * Returns true for screens smaller than the md breakpoint (768px).
 *
 * @example
 * const isMobile = useMobile();
 * return isMobile ? <MobileNav /> : <DesktopNav />;
 */
export function useMobile(): boolean {
  return useMediaQuery(`(max-width: ${BREAKPOINTS.md - 1}px)`);
}

// ============================================================================
// useViewport
// ============================================================================

/**
 * useViewport
 *
 * Track viewport dimensions with debounced resize updates.
 *
 * @example
 * const { width, height, isLandscape } = useViewport();
 */
export function useViewport(): ViewportDimensions {
  const [viewport, setViewport] = useState<ViewportDimensions>(() => {
    if (typeof window === 'undefined') {
      return { width: 375, height: 812, isLandscape: false, isPortrait: true };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
      isLandscape: window.innerWidth > window.innerHeight,
      isPortrait: window.innerHeight >= window.innerWidth,
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let timeoutId: ReturnType<typeof setTimeout>;

    const updateViewport = () => {
      // Debounce resize events
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setViewport({
          width: window.innerWidth,
          height: window.innerHeight,
          isLandscape: window.innerWidth > window.innerHeight,
          isPortrait: window.innerHeight >= window.innerWidth,
        });
      }, 100);
    };

    // Also listen to visualViewport for mobile keyboard changes
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', updateViewport);
    }
    window.addEventListener('resize', updateViewport);
    window.addEventListener('orientationchange', updateViewport);

    return () => {
      clearTimeout(timeoutId);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', updateViewport);
      }
      window.removeEventListener('resize', updateViewport);
      window.removeEventListener('orientationchange', updateViewport);
    };
  }, []);

  return viewport;
}

// ============================================================================
// useKeyboardVisible
// ============================================================================

/**
 * useKeyboardVisible
 *
 * Detect when the virtual keyboard is visible on mobile.
 * Uses visualViewport API for accurate detection.
 *
 * @example
 * const { isVisible, height } = useKeyboardVisible();
 * if (isVisible) {
 *   // Adjust layout for keyboard
 * }
 */
export function useKeyboardVisible(): KeyboardState {
  const [keyboardState, setKeyboardState] = useState<KeyboardState>({
    isVisible: false,
    height: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const visualViewport = window.visualViewport;
    if (!visualViewport) return;

    const initialHeight = window.innerHeight;

    const handleResize = () => {
      const currentHeight = visualViewport.height;
      const heightDiff = initialHeight - currentHeight;

      // Keyboard is likely visible if viewport shrunk significantly (> 150px)
      const isVisible = heightDiff > 150;

      setKeyboardState({
        isVisible,
        height: isVisible ? heightDiff : 0,
      });
    };

    visualViewport.addEventListener('resize', handleResize);
    return () => visualViewport.removeEventListener('resize', handleResize);
  }, []);

  return keyboardState;
}

// ============================================================================
// useSafeArea
// ============================================================================

/**
 * useSafeArea
 *
 * Get safe area insets for devices with notches, dynamic islands, etc.
 * Falls back to 0 if env() is not supported.
 *
 * @example
 * const safeArea = useSafeArea();
 * <div style={{ paddingTop: safeArea.top, paddingBottom: safeArea.bottom }}>
 */
export function useSafeArea(): SafeAreaInsets {
  const [safeArea, setSafeArea] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const computeSafeArea = () => {
      const style = getComputedStyle(document.documentElement);

      // Try to read CSS env() values via computed style
      // This requires CSS variables to be set in the stylesheet
      const top = parseInt(style.getPropertyValue('--safe-area-top') || '0', 10);
      const right = parseInt(style.getPropertyValue('--safe-area-right') || '0', 10);
      const bottom = parseInt(style.getPropertyValue('--safe-area-bottom') || '0', 10);
      const left = parseInt(style.getPropertyValue('--safe-area-left') || '0', 10);

      setSafeArea({ top, right, bottom, left });
    };

    // Compute on mount and orientation change
    computeSafeArea();
    window.addEventListener('orientationchange', computeSafeArea);
    window.addEventListener('resize', computeSafeArea);

    return () => {
      window.removeEventListener('orientationchange', computeSafeArea);
      window.removeEventListener('resize', computeSafeArea);
    };
  }, []);

  return safeArea;
}

// ============================================================================
// useTouchDevice
// ============================================================================

/**
 * useTouchDevice
 *
 * Detect if the device has touch capability.
 * Note: Many laptops have touch screens, so this doesn't mean "mobile".
 *
 * @example
 * const isTouch = useTouchDevice();
 * if (isTouch) {
 *   // Show touch-friendly controls
 * }
 */
export function useTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect on first touch event (for hybrid devices)
    const handleTouch = () => {
      setIsTouch(true);
      window.removeEventListener('touchstart', handleTouch);
    };

    if (!isTouch) {
      window.addEventListener('touchstart', handleTouch, { once: true });
    }

    return () => window.removeEventListener('touchstart', handleTouch);
  }, [isTouch]);

  return isTouch;
}

// ============================================================================
// usePreferReducedMotion
// ============================================================================

/**
 * usePreferReducedMotion
 *
 * Respect user's motion preferences for accessibility.
 *
 * @example
 * const prefersReducedMotion = usePreferReducedMotion();
 * const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.3 };
 */
export function usePreferReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

// ============================================================================
// useScrollLock
// ============================================================================

/**
 * useScrollLock
 *
 * Lock body scroll when a modal/sheet is open.
 * Properly handles iOS Safari scroll issues.
 *
 * @example
 * const { lock, unlock } = useScrollLock();
 * useEffect(() => {
 *   if (isOpen) lock();
 *   else unlock();
 * }, [isOpen]);
 */
export function useScrollLock() {
  const lock = useCallback(() => {
    if (typeof document === 'undefined') return;

    const scrollY = window.scrollY;
    const body = document.body;

    // Save current scroll position
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.overflow = 'hidden';
    body.dataset.scrollLockY = String(scrollY);
  }, []);

  const unlock = useCallback(() => {
    if (typeof document === 'undefined') return;

    const body = document.body;
    const scrollY = parseInt(body.dataset.scrollLockY || '0', 10);

    // Restore scroll position
    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.overflow = '';
    delete body.dataset.scrollLockY;

    window.scrollTo(0, scrollY);
  }, []);

  return { lock, unlock };
}

// ============================================================================
// useInputFocus
// ============================================================================

/**
 * useInputFocus
 *
 * Handle input focus with scroll-into-view on mobile.
 * Prevents content from being hidden behind keyboard.
 *
 * @example
 * const inputRef = useInputFocus<HTMLInputElement>();
 * <input ref={inputRef} />
 */
export function useInputFocus<T extends HTMLElement>() {
  const [ref, setRef] = useState<T | null>(null);

  useEffect(() => {
    if (!ref) return;

    const handleFocus = () => {
      // Delay to allow keyboard to appear
      setTimeout(() => {
        ref.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 300);
    };

    ref.addEventListener('focus', handleFocus);
    return () => ref.removeEventListener('focus', handleFocus);
  }, [ref]);

  return setRef;
}

// ============================================================================
// Exports
// ============================================================================

export default useMobile;
