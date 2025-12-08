/**
 * useProactiveNotifications Hook
 *
 * WI-7.8: Enhanced hook for proactive notification management
 *
 * Features:
 * - Rate limiting (configurable, default 15 min between notifications)
 * - Dismissal tracking (learns from user behavior)
 * - Type-based suppression (if user dismisses many of same type)
 * - Integration with ActiveCompanion context
 * - Local state fallback if outside provider
 */

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { useActiveCompanionContextSafe } from '../../../services/tripBrain/companion';
import type { ProactiveMessage } from '../../../services/tripBrain/companion/types';

// ============================================================================
// Types
// ============================================================================

export interface UseProactiveNotificationsOptions {
  /** Rate limit in seconds between notifications */
  rateLimitSeconds?: number;
  /** Max notifications to queue */
  maxQueue?: number;
  /** Dismissal threshold to suppress type (0-1) */
  suppressionThreshold?: number;
  /** Auto-dismiss timeout in ms */
  autoDismissMs?: number;
  /** Whether notifications are enabled */
  enabled?: boolean;
}

export interface UseProactiveNotificationsReturn {
  /** Current visible notifications */
  notifications: ProactiveMessage[];
  /** Dismiss a notification */
  dismiss: (id: string) => void;
  /** Act on a notification */
  actOn: (id: string) => void;
  /** Clear all notifications */
  clearAll: () => void;
  /** Add a notification (respects rate limiting) */
  addNotification: (notification: Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'>) => boolean;
  /** Whether notifications are rate-limited right now */
  isRateLimited: boolean;
  /** Time until next notification allowed (ms) */
  rateLimitRemaining: number;
  /** Suppressed message types */
  suppressedTypes: Set<ProactiveMessage['type']>;
  /** Stats for analytics */
  stats: {
    totalShown: number;
    totalDismissed: number;
    totalActedOn: number;
    dismissalsByType: Record<string, number>;
  };
  /** Whether the hook is ready */
  isReady: boolean;
}

// ============================================================================
// Local Storage Keys
// ============================================================================

const STORAGE_KEY_STATS = 'proactive_notification_stats';
const STORAGE_KEY_LAST_NOTIFICATION = 'proactive_last_notification_time';

// ============================================================================
// Generate ID
// ============================================================================

function generateId(): string {
  return `pn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// Hook
// ============================================================================

export function useProactiveNotifications(
  options: UseProactiveNotificationsOptions = {}
): UseProactiveNotificationsReturn {
  const {
    rateLimitSeconds = 900, // 15 minutes
    maxQueue = 5,
    suppressionThreshold = 0.7, // Suppress if 70%+ dismissed
    // autoDismissMs is passed to the UI component, not used in hook
    enabled = true,
  } = options;

  // Try to use context
  const companion = useActiveCompanionContextSafe();

  // Local state
  const [localNotifications, setLocalNotifications] = useState<ProactiveMessage[]>([]);
  const [lastNotificationTime, setLastNotificationTime] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_LAST_NOTIFICATION);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  // Stats type
  interface NotificationStats {
    totalShown: number;
    totalDismissed: number;
    totalActedOn: number;
    dismissalsByType: Record<string, number>;
  }

  const defaultStats: NotificationStats = {
    totalShown: 0,
    totalDismissed: 0,
    totalActedOn: 0,
    dismissalsByType: {},
  };

  // Stats tracking
  const [stats, setStats] = useState<NotificationStats>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_STATS);
      return stored ? JSON.parse(stored) : defaultStats;
    } catch {
      return defaultStats;
    }
  });

  const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [rateLimitRemaining, setRateLimitRemaining] = useState(0);

  // Get notifications from context or local
  const notifications = useMemo(() => {
    const contextNotifications = companion?.proactiveMessages ?? [];
    return contextNotifications.length > 0 ? contextNotifications : localNotifications;
  }, [companion?.proactiveMessages, localNotifications]);

  // Calculate suppressed types based on dismissal rate
  const suppressedTypes = useMemo(() => {
    const suppressed = new Set<ProactiveMessage['type']>();

    Object.entries(stats.dismissalsByType).forEach(([type, dismissals]) => {
      const total = stats.totalShown || 1;
      if ((dismissals as number) / total >= suppressionThreshold) {
        suppressed.add(type as ProactiveMessage['type']);
      }
    });

    return suppressed;
  }, [stats, suppressionThreshold]);

  // Rate limit check
  const isRateLimited = useMemo(() => {
    if (!enabled) return true;
    const now = Date.now();
    const elapsed = now - lastNotificationTime;
    return elapsed < rateLimitSeconds * 1000;
  }, [enabled, lastNotificationTime, rateLimitSeconds]);

  // Update rate limit remaining
  useEffect(() => {
    if (!isRateLimited) {
      setRateLimitRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const now = Date.now();
      const elapsed = now - lastNotificationTime;
      const remaining = Math.max(0, rateLimitSeconds * 1000 - elapsed);
      setRateLimitRemaining(remaining);

      if (remaining <= 0 && rateLimitTimerRef.current) {
        clearInterval(rateLimitTimerRef.current);
        rateLimitTimerRef.current = null;
      }
    };

    updateRemaining();
    rateLimitTimerRef.current = setInterval(updateRemaining, 1000);

    return () => {
      if (rateLimitTimerRef.current) {
        clearInterval(rateLimitTimerRef.current);
      }
    };
  }, [isRateLimited, lastNotificationTime, rateLimitSeconds]);

  // Persist stats
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
    } catch {
      // Ignore storage errors
    }
  }, [stats]);

  // Persist last notification time
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LAST_NOTIFICATION, lastNotificationTime.toString());
    } catch {
      // Ignore storage errors
    }
  }, [lastNotificationTime]);

  // ==================== Actions ====================

  const dismiss = useCallback(
    (id: string) => {
      // Find the notification to track its type
      const notification = notifications.find((n) => n.id === id);

      if (companion) {
        companion.dismissMessage(id);
      } else {
        setLocalNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isDismissed: true } : n))
        );
      }

      // Update stats
      if (notification) {
        setStats((prev) => ({
          ...prev,
          totalDismissed: prev.totalDismissed + 1,
          dismissalsByType: {
            ...prev.dismissalsByType,
            [notification.type]: (prev.dismissalsByType[notification.type] || 0) + 1,
          },
        }));
      }
    },
    [companion, notifications]
  );

  const actOn = useCallback(
    (id: string) => {
      if (companion) {
        companion.actOnMessage(id);
      } else {
        // For local, just dismiss
        setLocalNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isDismissed: true } : n))
        );
      }

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalActedOn: prev.totalActedOn + 1,
      }));
    },
    [companion]
  );

  const clearAll = useCallback(() => {
    if (companion) {
      companion.clearMessages();
    } else {
      setLocalNotifications([]);
    }
  }, [companion]);

  const addNotification = useCallback(
    (notification: Omit<ProactiveMessage, 'id' | 'createdAt' | 'isDismissed'>): boolean => {
      // Check if enabled
      if (!enabled) return false;

      // Check rate limit
      if (isRateLimited) return false;

      // Check if type is suppressed
      if (suppressedTypes.has(notification.type)) return false;

      const newNotification: ProactiveMessage = {
        ...notification,
        id: generateId(),
        createdAt: new Date(),
        isDismissed: false,
      };

      // Add notification
      setLocalNotifications((prev) => {
        const filtered = prev.filter((n) => !n.isDismissed).slice(0, maxQueue - 1);
        return [newNotification, ...filtered];
      });

      // Update rate limit time
      setLastNotificationTime(Date.now());

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalShown: prev.totalShown + 1,
      }));

      return true;
    },
    [enabled, isRateLimited, suppressedTypes, maxQueue]
  );

  // ==================== Return ====================

  return useMemo(
    () => ({
      notifications: notifications.filter((n) => !n.isDismissed),
      dismiss,
      actOn,
      clearAll,
      addNotification,
      isRateLimited,
      rateLimitRemaining,
      suppressedTypes,
      stats,
      isReady: enabled,
    }),
    [
      notifications,
      dismiss,
      actOn,
      clearAll,
      addNotification,
      isRateLimited,
      rateLimitRemaining,
      suppressedTypes,
      stats,
      enabled,
    ]
  );
}

export default useProactiveNotifications;
