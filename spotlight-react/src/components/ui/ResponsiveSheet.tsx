/**
 * ResponsiveSheet
 *
 * WI-11.7: Adaptive modal/bottom sheet component
 *
 * Automatically switches between:
 * - Desktop: Centered modal with backdrop blur
 * - Mobile: Draggable bottom sheet with safe area handling
 *
 * Features:
 * - Smooth animations with Framer Motion
 * - Keyboard avoidance on mobile
 * - Safe area insets for notches
 * - Haptic feedback on interactions
 * - Scroll lock when open
 * - Accessible with proper ARIA attributes
 */

import { type ReactNode, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useDragControls, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useMobile, useScrollLock, useKeyboardVisible } from '../../hooks';
import { hapticTap, hapticImpact } from '../../utils/haptics';
import { EASING, DURATION } from '../transitions/CardAnimations';

// ============================================================================
// Types
// ============================================================================

export type SheetSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface ResponsiveSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Sheet title */
  title?: string;
  /** Sheet subtitle/description */
  subtitle?: string;
  /** Sheet content */
  children: ReactNode;
  /** Size on desktop (ignored on mobile) */
  size?: SheetSize;
  /** Show close button */
  showClose?: boolean;
  /** Show drag handle on mobile */
  showDragHandle?: boolean;
  /** Allow closing by dragging down */
  dragToClose?: boolean;
  /** Allow closing by clicking backdrop */
  backdropClose?: boolean;
  /** Custom footer content */
  footer?: ReactNode;
  /** Custom className for content area */
  className?: string;
  /** Enable haptic feedback */
  haptic?: boolean;
  /** Force mobile layout (for testing) */
  forceMobile?: boolean;
  /** Force desktop layout (for testing) */
  forceDesktop?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DRAG_CLOSE_THRESHOLD = 100; // px to drag before closing

const sizeClasses: Record<SheetSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-4xl',
};

// ============================================================================
// ResponsiveSheet Component
// ============================================================================

export function ResponsiveSheet({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  showClose = true,
  showDragHandle = true,
  dragToClose = true,
  backdropClose = true,
  footer,
  className = '',
  haptic = true,
  forceMobile,
  forceDesktop,
}: ResponsiveSheetProps) {
  const isMobileDevice = useMobile();
  const isMobile = forceMobile ?? (forceDesktop ? false : isMobileDevice);
  const { lock, unlock } = useScrollLock();
  const { isVisible: isKeyboardVisible, height: keyboardHeight } = useKeyboardVisible();
  const dragControls = useDragControls();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      lock();
    } else {
      unlock();
    }
    return () => unlock();
  }, [isOpen, lock, unlock]);

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

  // Handle backdrop click
  const handleBackdropClick = useCallback(() => {
    if (backdropClose) {
      if (haptic) hapticTap('light');
      onClose();
    }
  }, [backdropClose, haptic, onClose]);

  // Handle close button
  const handleCloseClick = useCallback(() => {
    if (haptic) hapticTap('light');
    onClose();
  }, [haptic, onClose]);

  // Handle drag end (mobile)
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      if (dragToClose && info.offset.y > DRAG_CLOSE_THRESHOLD) {
        if (haptic) hapticImpact('medium');
        onClose();
      }
    },
    [dragToClose, haptic, onClose]
  );

  // Don't render if not open and no exit animation
  if (!isOpen && typeof document === 'undefined') return null;

  const content = (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'sheet-title' : undefined}
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
            className="absolute inset-0 bg-rui-black/40 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          {/* Sheet */}
          {isMobile ? (
            // Mobile: Bottom Sheet
            <motion.div
              ref={sheetRef}
              initial={{ y: '100%' }}
              animate={{
                y: 0,
                paddingBottom: isKeyboardVisible ? keyboardHeight : undefined,
              }}
              exit={{ y: '100%' }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 300,
              }}
              drag={dragToClose ? 'y' : false}
              dragControls={dragControls}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.5 }}
              onDragEnd={handleDragEnd}
              className={cn(
                'relative w-full max-h-[90vh]',
                'bg-white rounded-t-rui-24',
                'shadow-rui-4',
                'flex flex-col',
                // Safe area padding
                'pb-safe-bottom',
                className
              )}
              style={{
                paddingBottom: `max(env(safe-area-inset-bottom, 0px), 16px)`,
              }}
            >
              {/* Drag Handle */}
              {showDragHandle && (
                <div
                  className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none"
                  onPointerDown={(e) => dragControls.start(e)}
                >
                  <div className="w-10 h-1 rounded-full bg-rui-grey-20" />
                </div>
              )}

              {/* Header */}
              {(title || showClose) && (
                <div className="flex items-start justify-between px-rui-20 py-rui-12 border-b border-rui-grey-10">
                  <div className="flex-1 min-w-0">
                    {title && (
                      <h2
                        id="sheet-title"
                        className="font-display text-heading-3 text-rui-black truncate"
                      >
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-body-3 text-rui-grey-50 mt-0.5 truncate">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  {showClose && (
                    <button
                      onClick={handleCloseClick}
                      className={cn(
                        'p-2 -mr-2 rounded-full',
                        'text-rui-grey-40 hover:text-rui-grey-60',
                        'hover:bg-rui-grey-5 active:bg-rui-grey-10',
                        'transition-colors duration-rui-sm',
                        // Minimum touch target
                        'min-w-[44px] min-h-[44px] flex items-center justify-center'
                      )}
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-rui-20 py-rui-16">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div
                  className="px-rui-20 py-rui-16 border-t border-rui-grey-10 bg-white"
                  style={{
                    paddingBottom: `max(env(safe-area-inset-bottom, 0px), 16px)`,
                  }}
                >
                  {footer}
                </div>
              )}
            </motion.div>
          ) : (
            // Desktop: Centered Modal
            <motion.div
              ref={sheetRef}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{
                duration: DURATION.normal,
                ease: EASING.smooth,
              }}
              className={cn(
                'relative w-full mx-4',
                sizeClasses[size],
                'max-h-[85vh]',
                'bg-white rounded-rui-16',
                'shadow-rui-4',
                'flex flex-col',
                className
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              {(title || showClose) && (
                <div className="flex items-start justify-between px-rui-24 py-rui-20 border-b border-rui-grey-10">
                  <div className="flex-1 min-w-0">
                    {title && (
                      <h2
                        id="sheet-title"
                        className="font-display text-heading-2 text-rui-black"
                      >
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <p className="text-body-2 text-rui-grey-50 mt-1">
                        {subtitle}
                      </p>
                    )}
                  </div>
                  {showClose && (
                    <button
                      onClick={handleCloseClick}
                      className={cn(
                        'p-2 -mr-2 -mt-1 rounded-full',
                        'text-rui-grey-40 hover:text-rui-grey-60',
                        'hover:bg-rui-grey-5 active:bg-rui-grey-10',
                        'transition-colors duration-rui-sm'
                      )}
                      aria-label="Close"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain px-rui-24 py-rui-20">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="px-rui-24 py-rui-20 border-t border-rui-grey-10 bg-white rounded-b-rui-16">
                  {footer}
                </div>
              )}
            </motion.div>
          )}
        </div>
      )}
    </AnimatePresence>
  );

  // Render in portal
  if (typeof document === 'undefined') return null;
  return createPortal(content, document.body);
}

// ============================================================================
// Convenience Components
// ============================================================================

/**
 * SheetHeader
 *
 * Standard header layout for sheet content.
 */
export interface SheetHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
}

export function SheetHeader({ title, subtitle, icon, className = '' }: SheetHeaderProps) {
  return (
    <div className={cn('flex items-start gap-3 mb-rui-16', className)}>
      {icon && (
        <div className="w-10 h-10 rounded-full bg-rui-accent/10 flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-heading-4 text-rui-black">{title}</h3>
        {subtitle && (
          <p className="text-body-2 text-rui-grey-50 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

/**
 * SheetFooter
 *
 * Standard footer layout with primary and secondary actions.
 */
export interface SheetFooterProps {
  primaryLabel: string;
  onPrimary: () => void;
  primaryLoading?: boolean;
  primaryDisabled?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

export function SheetFooter({
  primaryLabel,
  onPrimary,
  primaryLoading,
  primaryDisabled,
  secondaryLabel,
  onSecondary,
  className = '',
}: SheetFooterProps) {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row gap-3', className)}>
      {secondaryLabel && onSecondary && (
        <button
          onClick={onSecondary}
          className={cn(
            'flex-1 sm:flex-none',
            'px-5 py-3 rounded-rui-12',
            'text-body-2 font-medium',
            'bg-rui-grey-5 text-rui-grey-70',
            'hover:bg-rui-grey-10 active:scale-[0.98]',
            'transition-all duration-rui-sm',
            // Touch target
            'min-h-[44px]'
          )}
        >
          {secondaryLabel}
        </button>
      )}
      <button
        onClick={onPrimary}
        disabled={primaryLoading || primaryDisabled}
        className={cn(
          'flex-1 sm:flex-none',
          'px-5 py-3 rounded-rui-12',
          'text-body-2 font-medium',
          'bg-rui-accent text-white',
          'hover:bg-rui-accent/90 active:scale-[0.98]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'transition-all duration-rui-sm',
          // Touch target
          'min-h-[44px]'
        )}
      >
        {primaryLoading ? 'Loading...' : primaryLabel}
      </button>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export default ResponsiveSheet;
