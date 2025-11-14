/**
 * useNotifications - Hook for managing proactive AI notifications
 *
 * STEP 4 Phase 1: Frontend notification management
 *
 * Features:
 * - Fetch notifications from API
 * - Auto-refresh at intervals
 * - Mark as read/dismissed
 * - Real-time unread count
 * - Loading and error states
 */

import { useState, useEffect, useCallback } from 'react';

export interface ProactiveNotification {
  id: string;
  type: 'weather' | 'event' | 'budget' | 'traffic';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  action_url?: string | null;
  action_label?: string | null;
  metadata: Record<string, any>;
  is_read: boolean;
  is_dismissed: boolean;
  created_at: string;
  expires_at?: string | null;
}

export interface NotificationStats {
  unread_count: number;
  weather_count: number;
  event_count: number;
  budget_count: number;
  traffic_count: number;
  urgent_count: number;
  high_count: number;
}

interface UseNotificationsOptions {
  itineraryId: string | null;
  autoRefresh?: boolean;
  refreshInterval?: number; // milliseconds
  includeRead?: boolean;
}

interface UseNotificationsReturn {
  notifications: ProactiveNotification[];
  unreadCount: number;
  stats: NotificationStats | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
}

export function useNotifications(options: UseNotificationsOptions): UseNotificationsReturn {
  const {
    itineraryId,
    autoRefresh = true,
    refreshInterval = 60000, // 1 minute default
    includeRead = false
  } = options;

  const [notifications, setNotifications] = useState<ProactiveNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch notifications from API
   */
  const fetchNotifications = useCallback(async () => {
    if (!itineraryId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        includeRead: includeRead.toString(),
        includeDismissed: 'false'
      });

      const response = await fetch(`/api/notifications/${itineraryId}?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications || []);

    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setIsLoading(false);
    }
  }, [itineraryId, includeRead]);

  /**
   * Fetch unread count
   */
  const fetchUnreadCount = useCallback(async () => {
    if (!itineraryId) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${itineraryId}/unread-count`);

      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }

      const data = await response.json();
      setUnreadCount(data.count || 0);

    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  }, [itineraryId]);

  /**
   * Fetch notification statistics
   */
  const fetchStats = useCallback(async () => {
    if (!itineraryId) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${itineraryId}/stats`);

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      const data = await response.json();
      setStats(data);

    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [itineraryId]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchNotifications(),
      fetchUnreadCount(),
      fetchStats()
    ]);
  }, [fetchNotifications, fetchUnreadCount, fetchStats]);

  /**
   * Mark notification as read
   */
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to mark as read');
      }

      // Update local state optimistically
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );

      // Refresh count
      await fetchUnreadCount();

    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }, [fetchUnreadCount]);

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = useCallback(async () => {
    if (!itineraryId) {
      return;
    }

    try {
      const response = await fetch(`/api/notifications/${itineraryId}/read-all`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      // Update local state
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );

      setUnreadCount(0);

    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [itineraryId]);

  /**
   * Dismiss notification
   */
  const dismissNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/dismiss`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Failed to dismiss notification');
      }

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      // Refresh count
      await fetchUnreadCount();

    } catch (err) {
      console.error('Error dismissing notification:', err);
    }
  }, [fetchUnreadCount]);

  // Initial load
  useEffect(() => {
    if (itineraryId) {
      refresh();
    }
  }, [itineraryId]); // Only run on itineraryId change

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !itineraryId) {
      return;
    }

    const intervalId = setInterval(() => {
      refresh();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, itineraryId, refresh]);

  return {
    notifications,
    unreadCount,
    stats,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
    dismissNotification
  };
}
