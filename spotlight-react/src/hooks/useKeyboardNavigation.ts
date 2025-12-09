import { useEffect, useCallback, useRef } from 'react'

interface UseKeyboardNavigationOptions {
  onEscape?: () => void
  onEnter?: () => void
  onArrowUp?: () => void
  onArrowDown?: () => void
  onArrowLeft?: () => void
  onArrowRight?: () => void
  onTab?: () => void
  onShiftTab?: () => void
  enabled?: boolean
}

export function useKeyboardNavigation({
  onEscape,
  onEnter,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onTab,
  onShiftTab,
  enabled = true
}: UseKeyboardNavigationOptions) {
  const handlersRef = useRef({
    onEscape,
    onEnter,
    onArrowUp,
    onArrowDown,
    onArrowLeft,
    onArrowRight,
    onTab,
    onShiftTab
  })

  // Update handlers ref
  useEffect(() => {
    handlersRef.current = {
      onEscape,
      onEnter,
      onArrowUp,
      onArrowDown,
      onArrowLeft,
      onArrowRight,
      onTab,
      onShiftTab
    }
  }, [onEscape, onEnter, onArrowUp, onArrowDown, onArrowLeft, onArrowRight, onTab, onShiftTab])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const handlers = handlersRef.current

    switch (event.key) {
      case 'Escape':
        handlers.onEscape?.()
        break
      case 'Enter':
        handlers.onEnter?.()
        break
      case 'ArrowUp':
        event.preventDefault()
        handlers.onArrowUp?.()
        break
      case 'ArrowDown':
        event.preventDefault()
        handlers.onArrowDown?.()
        break
      case 'ArrowLeft':
        handlers.onArrowLeft?.()
        break
      case 'ArrowRight':
        handlers.onArrowRight?.()
        break
      case 'Tab':
        if (event.shiftKey) {
          handlers.onShiftTab?.()
        } else {
          handlers.onTab?.()
        }
        break
    }
  }, [])

  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [enabled, handleKeyDown])
}

// Hook for managing focus trap in modals
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    // Focus first element on mount
    firstElement?.focus()

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement?.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTabKey as EventListener)
    return () => container.removeEventListener('keydown', handleTabKey as EventListener)
  }, [isActive])

  return containerRef
}

// Hook for arrow key navigation in lists
export function useListNavigation<T>(
  items: T[],
  onSelect?: (item: T, index: number) => void
) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleArrowUp = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev > 0 ? prev - 1 : items.length - 1
      return newIndex
    })
  }, [items.length])

  const handleArrowDown = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev < items.length - 1 ? prev + 1 : 0
      return newIndex
    })
  }, [items.length])

  const handleEnter = useCallback(() => {
    if (items[selectedIndex]) {
      onSelect?.(items[selectedIndex], selectedIndex)
    }
  }, [items, selectedIndex, onSelect])

  useKeyboardNavigation({
    onArrowUp: handleArrowUp,
    onArrowDown: handleArrowDown,
    onEnter: handleEnter
  })

  return {
    selectedIndex,
    setSelectedIndex,
    selectedItem: items[selectedIndex]
  }
}

// Import useState for useListNavigation
import { useState } from 'react'
