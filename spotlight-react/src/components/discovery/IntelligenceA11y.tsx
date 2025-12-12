/**
 * IntelligenceA11y
 *
 * Comprehensive accessibility utilities for City Intelligence components.
 * Provides keyboard navigation, focus management, screen reader support,
 * and ARIA helpers for an inclusive experience.
 *
 * Features:
 * - Keyboard navigation hooks
 * - Focus trap for modals
 * - Screen reader announcements
 * - Skip links
 * - Reduced motion detection
 * - High contrast support
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';

// =============================================================================
// Types
// =============================================================================

interface A11yContextValue {
  // Preferences
  reducedMotion: boolean;
  highContrast: boolean;

  // Focus management
  lastFocusedElement: HTMLElement | null;
  setLastFocusedElement: (el: HTMLElement | null) => void;

  // Announcements
  announce: (message: string, priority?: 'polite' | 'assertive') => void;

  // Navigation
  currentSection: string;
  setCurrentSection: (section: string) => void;
}

interface FocusTrapOptions {
  enabled?: boolean;
  autoFocus?: boolean;
  returnFocus?: boolean;
  initialFocus?: React.RefObject<HTMLElement>;
}

// =============================================================================
// Context
// =============================================================================

const A11yContext = createContext<A11yContextValue | null>(null);

export function useA11y() {
  const context = useContext(A11yContext);
  if (!context) {
    throw new Error('useA11y must be used within an A11yProvider');
  }
  return context;
}

// =============================================================================
// Provider
// =============================================================================

interface A11yProviderProps {
  children: ReactNode;
}

export function A11yProvider({ children }: A11yProviderProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [highContrast, setHighContrast] = useState(false);
  const [lastFocusedElement, setLastFocusedElement] = useState<HTMLElement | null>(null);
  const [currentSection, setCurrentSection] = useState('');
  const announcerRef = useRef<HTMLDivElement>(null);

  // Check for high contrast preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    setHighContrast(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setHighContrast(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Announce to screen readers
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority);
      announcerRef.current.textContent = message;

      // Clear after announcement
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);

  const value: A11yContextValue = {
    reducedMotion,
    highContrast,
    lastFocusedElement,
    setLastFocusedElement,
    announce,
    currentSection,
    setCurrentSection,
  };

  return (
    <A11yContext.Provider value={value}>
      {children}
      {/* Screen reader announcer (live region) */}
      <div
        ref={announcerRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          border: 0,
        }}
      />
    </A11yContext.Provider>
  );
}

// =============================================================================
// Focus Trap Hook
// =============================================================================

const FOCUSABLE_ELEMENTS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'textarea:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function useFocusTrap(options: FocusTrapOptions = {}) {
  const {
    enabled = true,
    autoFocus = true,
    returnFocus = true,
    initialFocus,
  } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    // Store currently focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Focus initial element or first focusable
    if (autoFocus) {
      if (initialFocus?.current) {
        initialFocus.current.focus();
      } else {
        const firstFocusable = container.querySelector<HTMLElement>(FOCUSABLE_ELEMENTS);
        firstFocusable?.focus();
      }
    }

    // Handle tab key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const focusableElements = container.querySelectorAll<HTMLElement>(FOCUSABLE_ELEMENTS);
      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);

      // Return focus
      if (returnFocus && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [enabled, autoFocus, returnFocus, initialFocus]);

  return containerRef;
}

// =============================================================================
// Keyboard Navigation Hook
// =============================================================================

interface KeyboardNavOptions {
  items: string[] | (() => NodeListOf<Element>);
  orientation?: 'horizontal' | 'vertical' | 'both';
  loop?: boolean;
  onSelect?: (index: number, element: Element) => void;
  onEscape?: () => void;
}

export function useKeyboardNav({
  items,
  orientation = 'vertical',
  loop = true,
  onSelect,
  onEscape,
}: KeyboardNavOptions) {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const getItems = useCallback(() => {
    if (typeof items === 'function') {
      return Array.from(items());
    }
    if (!containerRef.current) return [];
    return items.flatMap((selector) =>
      Array.from(containerRef.current!.querySelectorAll(selector))
    );
  }, [items]);

  const focusItem = useCallback((index: number) => {
    const itemList = getItems();
    if (itemList[index]) {
      (itemList[index] as HTMLElement).focus();
      setActiveIndex(index);
    }
  }, [getItems]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const itemList = getItems();
    const count = itemList.length;
    if (count === 0) return;

    const nextIndex = (delta: number) => {
      const next = activeIndex + delta;
      if (loop) {
        return ((next % count) + count) % count;
      }
      return Math.max(0, Math.min(count - 1, next));
    };

    switch (e.key) {
      case 'ArrowDown':
        if (orientation !== 'horizontal') {
          e.preventDefault();
          focusItem(nextIndex(1));
        }
        break;
      case 'ArrowUp':
        if (orientation !== 'horizontal') {
          e.preventDefault();
          focusItem(nextIndex(-1));
        }
        break;
      case 'ArrowRight':
        if (orientation !== 'vertical') {
          e.preventDefault();
          focusItem(nextIndex(1));
        }
        break;
      case 'ArrowLeft':
        if (orientation !== 'vertical') {
          e.preventDefault();
          focusItem(nextIndex(-1));
        }
        break;
      case 'Home':
        e.preventDefault();
        focusItem(0);
        break;
      case 'End':
        e.preventDefault();
        focusItem(count - 1);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect?.(activeIndex, itemList[activeIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        onEscape?.();
        break;
    }
  }, [activeIndex, focusItem, getItems, loop, onEscape, onSelect, orientation]);

  return {
    containerRef,
    activeIndex,
    setActiveIndex,
    handleKeyDown,
    focusItem,
  };
}

// =============================================================================
// Skip Link Component
// =============================================================================

interface SkipLinkProps {
  targetId: string;
  children?: ReactNode;
}

export function SkipLink({ targetId, children = 'Skip to main content' }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-white focus:rounded-lg focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-amber-600 focus:ring-offset-2"
    >
      {children}
    </a>
  );
}

// =============================================================================
// Focus Visible Ring
// =============================================================================

export function FocusRing({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`focus-within:ring-2 focus-within:ring-amber-500 focus-within:ring-offset-2 rounded-lg ${className}`}>
      {children}
    </div>
  );
}

// =============================================================================
// Screen Reader Only Text
// =============================================================================

export function ScreenReaderOnly({ children }: { children: ReactNode }) {
  return (
    <span
      className="sr-only"
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: 0,
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: 0,
      }}
    >
      {children}
    </span>
  );
}

// =============================================================================
// Accessible Loading Indicator
// =============================================================================

interface LoadingAnnouncerProps {
  loading: boolean;
  loadingMessage?: string;
  completeMessage?: string;
}

export function LoadingAnnouncer({
  loading,
  loadingMessage = 'Loading...',
  completeMessage = 'Content loaded',
}: LoadingAnnouncerProps) {
  const prevLoading = useRef(loading);

  useEffect(() => {
    if (prevLoading.current && !loading) {
      // Just finished loading
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.className = 'sr-only';
      announcer.textContent = completeMessage;
      document.body.appendChild(announcer);

      setTimeout(() => {
        document.body.removeChild(announcer);
      }, 1000);
    }
    prevLoading.current = loading;
  }, [loading, completeMessage]);

  return loading ? (
    <ScreenReaderOnly>{loadingMessage}</ScreenReaderOnly>
  ) : null;
}

// =============================================================================
// Roving Tab Index Hook
// =============================================================================

export function useRovingTabIndex<T extends HTMLElement>(itemCount: number) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef<(T | null)[]>([]);

  const setRef = useCallback((index: number) => (el: T | null) => {
    itemRefs.current[index] = el;
  }, []);

  const getTabIndex = useCallback((index: number) => {
    return index === focusedIndex ? 0 : -1;
  }, [focusedIndex]);

  const handleKeyDown = useCallback((index: number) => (e: React.KeyboardEvent) => {
    let nextIndex = index;

    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        e.preventDefault();
        nextIndex = (index + 1) % itemCount;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        e.preventDefault();
        nextIndex = (index - 1 + itemCount) % itemCount;
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        nextIndex = itemCount - 1;
        break;
      default:
        return;
    }

    setFocusedIndex(nextIndex);
    itemRefs.current[nextIndex]?.focus();
  }, [itemCount]);

  return {
    setRef,
    getTabIndex,
    handleKeyDown,
    focusedIndex,
    setFocusedIndex,
  };
}

// =============================================================================
// Accessible Modal Wrapper
// =============================================================================

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
}: AccessibleModalProps) {
  const focusTrapRef = useFocusTrap({ enabled: isOpen });
  const titleId = `modal-title-${React.useId()}`;
  const { reducedMotion } = useA11y();

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full mx-4',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal content */}
          <motion.div
            ref={focusTrapRef}
            initial={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reducedMotion ? {} : { opacity: 0, scale: 0.95 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', duration: 0.3 }}
            className={`relative bg-white rounded-2xl shadow-2xl ${sizeClasses[size]} w-full overflow-hidden`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 id={titleId} className="text-lg font-semibold text-gray-900">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-4">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// Accessible Tabs
// =============================================================================

interface AccessibleTabsProps {
  tabs: { id: string; label: string; content: ReactNode }[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export function AccessibleTabs({ tabs, defaultTab, onChange }: AccessibleTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);
  const { reducedMotion } = useA11y();
  const { handleKeyDown, getTabIndex, setRef } = useRovingTabIndex<HTMLButtonElement>(tabs.length);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onChange?.(tabId);
  };

  const tabListId = React.useId();
  const tabPanelId = React.useId();

  return (
    <div>
      {/* Tab list */}
      <div
        role="tablist"
        aria-label="City intelligence sections"
        className="flex gap-1 p-1 bg-gray-100 rounded-xl"
      >
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            ref={setRef(index)}
            role="tab"
            id={`${tabListId}-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`${tabPanelId}-${tab.id}`}
            tabIndex={getTabIndex(index)}
            onClick={() => handleTabClick(tab.id)}
            onKeyDown={handleKeyDown(index)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-inset ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tabs.map((tab) => (
        <motion.div
          key={tab.id}
          role="tabpanel"
          id={`${tabPanelId}-${tab.id}`}
          aria-labelledby={`${tabListId}-${tab.id}`}
          hidden={activeTab !== tab.id}
          initial={false}
          animate={reducedMotion ? {} : { opacity: 1, y: 0 }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.2 }}
          className="mt-4"
          tabIndex={0}
        >
          {activeTab === tab.id && tab.content}
        </motion.div>
      ))}
    </div>
  );
}

// =============================================================================
// Progress Announcer for Long Operations
// =============================================================================

interface ProgressAnnouncerProps {
  progress: number;
  total: number;
  itemLabel?: string;
  announceEvery?: number;
}

export function ProgressAnnouncer({
  progress,
  total,
  itemLabel = 'items',
  announceEvery = 25,
}: ProgressAnnouncerProps) {
  const lastAnnouncedRef = useRef(0);

  useEffect(() => {
    const percentage = Math.round((progress / total) * 100);
    const shouldAnnounce =
      percentage >= lastAnnouncedRef.current + announceEvery ||
      progress === total;

    if (shouldAnnounce && percentage !== lastAnnouncedRef.current) {
      lastAnnouncedRef.current = percentage;

      // Create live region announcement
      const announcer = document.createElement('div');
      announcer.setAttribute('role', 'status');
      announcer.setAttribute('aria-live', 'polite');
      announcer.className = 'sr-only';
      announcer.textContent =
        progress === total
          ? `Complete. ${total} ${itemLabel} processed.`
          : `${percentage}% complete. ${progress} of ${total} ${itemLabel} processed.`;
      document.body.appendChild(announcer);

      setTimeout(() => {
        document.body.removeChild(announcer);
      }, 1000);
    }
  }, [progress, total, itemLabel, announceEvery]);

  return (
    <div
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-label={`Processing ${itemLabel}`}
      className="sr-only"
    />
  );
}

// =============================================================================
// High Contrast Mode Support
// =============================================================================

export function HighContrastStyles() {
  return (
    <style>{`
      @media (prefers-contrast: more) {
        .intelligence-card {
          border-width: 2px !important;
          border-color: currentColor !important;
        }

        .intelligence-button {
          border: 2px solid currentColor !important;
        }

        .intelligence-badge {
          outline: 2px solid currentColor !important;
        }

        .shimmer-animation {
          animation: none !important;
          opacity: 0.8 !important;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
    `}</style>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default {
  A11yProvider,
  useA11y,
  useFocusTrap,
  useKeyboardNav,
  useRovingTabIndex,
  SkipLink,
  FocusRing,
  ScreenReaderOnly,
  LoadingAnnouncer,
  AccessibleModal,
  AccessibleTabs,
  ProgressAnnouncer,
  HighContrastStyles,
};
