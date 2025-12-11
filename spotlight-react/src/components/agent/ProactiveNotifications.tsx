/**
 * ProactiveNotifications - Ambient Travel Companion Notifications
 *
 * Phase 5: Proactive Agent Behavior
 *
 * Renders proactive notifications from the AI agent in a distinctive
 * "Living Compass" aesthetic. Notifications appear as thoughtful hints
 * from a travel companion who anticipates your needs.
 *
 * Design: Warm editorial with priority-based visual hierarchy.
 * Inspired by handwritten travel journal notes with modern glass morphism.
 */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { useAgent, type ProactiveNotification, type NotificationAction, type NotificationPriority } from '../../contexts/AgentProvider';
import { EASING, DURATION } from '../transitions';

// ============================================================================
// Priority Configuration - Visual Hierarchy
// ============================================================================

interface PriorityConfig {
  containerClass: string;
  accentClass: string;
  iconBgClass: string;
  pulseClass?: string;
  glowClass?: string;
}

const priorityConfig: Record<NotificationPriority, PriorityConfig> = {
  urgent: {
    containerClass: 'border-terracotta/40 bg-gradient-to-br from-terracotta/10 via-white/80 to-terracotta/5',
    accentClass: 'text-terracotta',
    iconBgClass: 'bg-terracotta text-white',
    pulseClass: 'animate-pulse',
    glowClass: 'shadow-[0_0_20px_rgba(196,88,48,0.3)]',
  },
  high: {
    containerClass: 'border-gold/40 bg-gradient-to-br from-gold/10 via-white/80 to-gold/5',
    accentClass: 'text-gold',
    iconBgClass: 'bg-gold text-white',
    glowClass: 'shadow-[0_0_16px_rgba(212,168,83,0.25)]',
  },
  medium: {
    containerClass: 'border-rui-grey-20 bg-gradient-to-br from-white/90 via-white/80 to-rui-grey-5/50',
    accentClass: 'text-rui-grey-60',
    iconBgClass: 'bg-rui-grey-50 text-white',
  },
  low: {
    containerClass: 'border-rui-grey-10 bg-white/70',
    accentClass: 'text-rui-grey-40',
    iconBgClass: 'bg-rui-grey-30 text-white',
  },
};

// ============================================================================
// Notification Type Icons
// ============================================================================

type TriggerType = 'upcoming_trip' | 'weather_alert' | 'incomplete_goal' | 'morning_briefing' | 'activity_reminder' | 'local_event' | string;

const typeIcons: Record<TriggerType, React.ReactNode> = {
  upcoming_trip: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14 4L9 6.5V3L10.5 1.5L9 2L8 1L7 2L5.5 1.5L7 3V6.5L2 4L2.5 6L7 7.5V13L5 14V15L8 14L11 15V14L9 13V7.5L13.5 6L14 4Z" fill="currentColor"/>
    </svg>
  ),
  weather_alert: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.5 9.5C14.3284 9.5 15 10.1716 15 11C15 11.8284 14.3284 12.5 13.5 12.5H4.5C3.11929 12.5 2 11.3807 2 10C2 8.61929 3.11929 7.5 4.5 7.5C4.5 5.29086 6.29086 3.5 8.5 3.5C10.433 3.5 12.0466 4.87903 12.4166 6.70832C13.0578 6.88449 13.5 7.48189 13.5 8.1875V9.5Z" fill="currentColor"/>
    </svg>
  ),
  incomplete_goal: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="8" cy="8" r="3" fill="currentColor"/>
      <path d="M8 2V4M8 12V14M14 8H12M4 8H2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  morning_briefing: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="3" fill="currentColor"/>
      <path d="M8 1V3M8 13V15M1 8H3M13 8H15M3 3L4.5 4.5M11.5 11.5L13 13M13 3L11.5 4.5M4.5 11.5L3 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  ),
  activity_reminder: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 3V8L11 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  ),
  local_event: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 6H14M4 2V4M12 2V4M3 3H13C13.5523 3 14 3.44772 14 4V13C14 13.5523 13.5523 14 13 14H3C2.44772 14 2 13.5523 2 13V4C2 3.44772 2.44772 3 3 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="10" r="1.5" fill="currentColor"/>
    </svg>
  ),
};

function getTypeIcon(triggerType: string): React.ReactNode {
  return typeIcons[triggerType as TriggerType] || typeIcons.activity_reminder;
}

// ============================================================================
// Notification Card Component
// ============================================================================

interface NotificationCardProps {
  notification: ProactiveNotification;
  index: number;
  onDismiss: () => void;
  onAction: (action: NotificationAction) => void;
  onMarkRead: () => void;
}

function NotificationCard({
  notification,
  index,
  onDismiss,
  onAction,
  onMarkRead,
}: NotificationCardProps) {
  const config = priorityConfig[notification.priority];
  const isUnread = notification.status === 'pending' || notification.status === 'sent';

  // Mark as read on first view
  const handleMouseEnter = useCallback(() => {
    if (isUnread) {
      onMarkRead();
    }
  }, [isUnread, onMarkRead]);

  // Format time ago
  const timeAgo = useCallback(() => {
    const created = new Date(notification.created_at);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }, [notification.created_at]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100, scale: 0.9 }}
      transition={{
        duration: DURATION.normal,
        ease: EASING.smooth,
        delay: index * 0.05,
      }}
      onMouseEnter={handleMouseEnter}
      className={cn(
        'relative overflow-hidden rounded-rui-12',
        'backdrop-blur-md border',
        'transition-all duration-rui-sm',
        config.containerClass,
        config.glowClass,
        isUnread && 'ring-2 ring-terracotta/20 ring-offset-1'
      )}
    >
      {/* Urgent pulse indicator */}
      {notification.priority === 'urgent' && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-terracotta/10 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <div className="relative p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          {/* Type icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.05 + 0.1, type: 'spring', stiffness: 400 }}
            className={cn(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
              config.iconBgClass,
              notification.priority === 'urgent' && config.pulseClass
            )}
          >
            {getTypeIcon(notification.trigger_type)}
          </motion.div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title & time */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className={cn(
                'text-emphasis-2 font-display leading-tight',
                isUnread ? 'text-rui-black font-semibold' : 'text-rui-grey-70'
              )}>
                {notification.title}
              </h4>

              <span className="flex-shrink-0 text-body-3 text-rui-grey-40">
                {timeAgo()}
              </span>
            </div>

            {/* Body text */}
            <p className="text-body-2 text-rui-grey-60 leading-relaxed mb-3">
              {notification.body}
            </p>

            {/* Action buttons */}
            {notification.actions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {notification.actions.map((action, actionIndex) => (
                  <motion.button
                    key={action.action}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 + 0.2 + actionIndex * 0.05 }}
                    onClick={() => onAction(action)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-body-3 font-medium',
                      'transition-all duration-rui-sm',
                      actionIndex === 0
                        ? cn(
                            'bg-gradient-to-r from-terracotta to-terracotta/90 text-white',
                            'hover:shadow-accent hover:-translate-y-0.5 active:translate-y-0'
                          )
                        : cn(
                            'bg-rui-grey-8 text-rui-grey-60 border border-rui-grey-15',
                            'hover:bg-rui-grey-10 hover:text-rui-grey-70'
                          )
                    )}
                  >
                    {action.label}
                  </motion.button>
                ))}
              </div>
            )}
          </div>

          {/* Dismiss button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 + 0.15 }}
            onClick={onDismiss}
            className={cn(
              'flex-shrink-0 p-1.5 rounded-full',
              'text-rui-grey-40 hover:text-rui-grey-60',
              'hover:bg-rui-grey-10 transition-colors'
            )}
            aria-label="Dismiss notification"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </motion.button>
        </div>

        {/* Priority indicator line */}
        <div
          className={cn(
            'absolute left-0 top-4 bottom-4 w-0.5 rounded-full',
            notification.priority === 'urgent' && 'bg-terracotta',
            notification.priority === 'high' && 'bg-gold',
            notification.priority === 'medium' && 'bg-rui-grey-30',
            notification.priority === 'low' && 'bg-rui-grey-20'
          )}
        />
      </div>

      {/* Texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
    </motion.div>
  );
}

// ============================================================================
// Notification Bell Button
// ============================================================================

interface NotificationBellProps {
  count: number;
  onClick: () => void;
  isOpen: boolean;
}

export function NotificationBell({ count, onClick, isOpen }: NotificationBellProps) {
  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'relative p-2 rounded-full',
        'bg-white/80 backdrop-blur-sm border border-rui-grey-10',
        'hover:bg-white hover:border-rui-grey-20',
        'transition-all duration-rui-sm',
        'shadow-rui-1 hover:shadow-rui-2',
        isOpen && 'bg-white border-terracotta/30'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Notifications${count > 0 ? ` (${count} unread)` : ''}`}
    >
      {/* Bell icon */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className={cn(
          'transition-colors',
          count > 0 ? 'text-terracotta' : 'text-rui-grey-50'
        )}
      >
        <path
          d="M10 2C7.24 2 5 4.24 5 7V10L3 13V14H17V13L15 10V7C15 4.24 12.76 2 10 2ZM10 18C11.1 18 12 17.1 12 16H8C8 17.1 8.9 18 10 18Z"
          fill="currentColor"
        />
      </svg>

      {/* Count badge */}
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
            className={cn(
              'absolute -top-1 -right-1',
              'min-w-[18px] h-[18px] px-1',
              'flex items-center justify-center',
              'bg-terracotta text-white text-[10px] font-bold',
              'rounded-full',
              'border-2 border-white'
            )}
          >
            {count > 9 ? '9+' : count}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Pulsing ring for unread */}
      {count > 0 && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-terracotta/30"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      )}
    </motion.button>
  );
}

// ============================================================================
// Notification Panel (Dropdown)
// ============================================================================

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationPanel({ isOpen, onClose }: NotificationPanelProps) {
  const {
    notifications,
    notificationCount,
    dismissNotification,
    markNotificationRead,
    handleNotificationAction,
  } = useAgent();

  const handleDismiss = useCallback(
    (id: string) => {
      dismissNotification(id);
    },
    [dismissNotification]
  );

  const handleAction = useCallback(
    (id: string, action: NotificationAction) => {
      handleNotificationAction(id, action);
      onClose();
    },
    [handleNotificationAction, onClose]
  );

  const handleMarkRead = useCallback(
    (id: string) => {
      markNotificationRead(id);
    },
    [markNotificationRead]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/10 backdrop-blur-[2px] z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{ duration: DURATION.normal, ease: EASING.smooth }}
            className={cn(
              'fixed top-16 right-4 z-50',
              'w-[min(380px,calc(100vw-2rem))]',
              'max-h-[70vh] overflow-hidden',
              'rounded-rui-16',
              'bg-white/95 backdrop-blur-xl',
              'border border-rui-grey-15',
              'shadow-rui-4'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-rui-grey-10">
              <div className="flex items-center gap-2">
                <h3 className="text-heading-3 font-display text-rui-black">
                  Notifications
                </h3>
                {notificationCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-terracotta/10 text-terracotta text-body-3 font-medium">
                    {notificationCount} new
                  </span>
                )}
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-rui-grey-8 transition-colors"
                aria-label="Close notifications"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-rui-grey-50">
                  <path d="M4 4L12 12M12 4L4 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* Notifications list */}
            <div className="overflow-y-auto max-h-[calc(70vh-60px)] p-3 space-y-2">
              <AnimatePresence mode="popLayout">
                {notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      index={index}
                      onDismiss={() => handleDismiss(notification.id)}
                      onAction={(action) => handleAction(notification.id, action)}
                      onMarkRead={() => handleMarkRead(notification.id)}
                    />
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-12 text-center"
                  >
                    {/* Empty state illustration */}
                    <motion.div
                      className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-rui-grey-8 to-rui-grey-5 flex items-center justify-center"
                      animate={{
                        y: [0, -4, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-rui-grey-30">
                        <path
                          d="M14 3C9.03 3 5 7.03 5 12V17L3 20V21H25V20L23 17V12C23 7.03 18.97 3 14 3ZM14 26C15.66 26 17 24.66 17 23H11C11 24.66 12.34 26 14 26Z"
                          fill="currentColor"
                        />
                      </svg>
                    </motion.div>

                    <p className="text-emphasis-2 font-display text-rui-grey-60 mb-1">
                      All caught up!
                    </p>
                    <p className="text-body-2 text-rui-grey-40">
                      We&apos;ll let you know when something needs your attention.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Decorative gradient */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-terracotta/5 to-transparent pointer-events-none" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Combined Notification Widget (Bell + Panel)
// ============================================================================

export function NotificationWidget({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const { notificationCount } = useAgent();

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <div className={cn('relative', className)}>
      <NotificationBell count={notificationCount} onClick={toggleOpen} isOpen={isOpen} />
      <NotificationPanel isOpen={isOpen} onClose={handleClose} />
    </div>
  );
}

// ============================================================================
// Toast Notification (For New Arrivals)
// ============================================================================

interface NotificationToastProps {
  notification: ProactiveNotification;
  onDismiss: () => void;
  onAction: (action: NotificationAction) => void;
}

export function NotificationToast({ notification, onDismiss, onAction }: NotificationToastProps) {
  const config = priorityConfig[notification.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      className={cn(
        'fixed top-4 right-4 z-50',
        'w-[min(360px,calc(100vw-2rem))]',
        'rounded-rui-12 overflow-hidden',
        'backdrop-blur-xl border',
        'shadow-rui-3',
        config.containerClass,
        config.glowClass
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
              config.iconBgClass
            )}
          >
            {getTypeIcon(notification.trigger_type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="text-emphasis-2 font-display text-rui-black mb-0.5">
              {notification.title}
            </h4>
            <p className="text-body-3 text-rui-grey-60 line-clamp-2">
              {notification.body}
            </p>

            {/* Quick action */}
            {notification.actions.length > 0 && (
              <button
                onClick={() => onAction(notification.actions[0])}
                className="mt-2 text-body-3 font-medium text-terracotta hover:underline"
              >
                {notification.actions[0].label} &rarr;
              </button>
            )}
          </div>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="flex-shrink-0 p-1 rounded-full hover:bg-rui-grey-10 text-rui-grey-40"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3.5 3.5L10.5 10.5M10.5 3.5L3.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className="h-0.5 bg-gradient-to-r from-terracotta to-gold"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 5, ease: 'linear' }}
        onAnimationComplete={onDismiss}
      />
    </motion.div>
  );
}

export default NotificationWidget;
