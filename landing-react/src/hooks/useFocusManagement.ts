import { useEffect, useRef } from 'react'

/**
 * Hook to manage focus state and return focus to previous element
 */
export function useFocusReturn(isActive: boolean) {
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (isActive) {
      // Store the currently focused element
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement
    } else if (previouslyFocusedElementRef.current) {
      // Return focus when component becomes inactive
      previouslyFocusedElementRef.current.focus()
      previouslyFocusedElementRef.current = null
    }
  }, [isActive])
}

/**
 * Hook to auto-focus an element when component mounts
 */
export function useAutoFocus<T extends HTMLElement>() {
  const elementRef = useRef<T>(null)

  useEffect(() => {
    if (elementRef.current) {
      elementRef.current.focus()
    }
  }, [])

  return elementRef
}

/**
 * Hook to prevent body scroll when modal is open
 */
export function usePreventScroll(isActive: boolean) {
  useEffect(() => {
    if (isActive) {
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight

      // Get scrollbar width
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

      // Prevent scroll
      document.body.style.overflow = 'hidden'

      // Compensate for scrollbar width to prevent layout shift
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }

      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
      }
    }
  }, [isActive])
}
