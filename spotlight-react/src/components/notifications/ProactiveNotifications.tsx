/**
 * ProactiveNotifications - Display proactive AI notifications
 *
 * STEP 4 Phase 1: Weather alerts UI
 *
 * Features:
 * - Displays notifications in elegant cards
 * - Priority-based styling
 * - Mark as read/dismiss actions
 * - Empty state
 * - Beautiful animations
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, AlertCircle, CloudRain, Calendar, DollarSign, Navigation2, Loader2 } from 'lucide-react';
import { useNotifications, type ProactiveNotification } from '../../hooks/useNotifications';

interface ProactiveNotificationsProps {
  itineraryId: string | null;
}

export function ProactiveNotifications({ itineraryId }: ProactiveNotificationsProps) {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    dismissNotification
  } = useNotifications({
    itineraryId,
    autoRefresh: true,
    refreshInterval: 60000, // Refresh every minute
    includeRead: false // Only show unread
  });

  // Icon mapping by notification type
  const getIcon = (type: ProactiveNotification['type']) => {
    switch (type) {
      case 'weather':
        return CloudRain;
      case 'event':
        return Calendar;
      case 'budget':
        return DollarSign;
      case 'traffic':
        return Navigation2;
      default:
        return Bell;
    }
  };

  // Color styling by priority
  const getPriorityStyles = (priority: ProactiveNotification['priority']) => {
    switch (priority) {
      case 'urgent':
        return {
          border: 'border-red-300',
          bg: 'bg-red-50',
          icon: 'text-red-600',
          badge: 'bg-red-100 text-red-700'
        };
      case 'high':
        return {
          border: 'border-orange-300',
          bg: 'bg-orange-50',
          icon: 'text-orange-600',
          badge: 'bg-orange-100 text-orange-700'
        };
      case 'medium':
        return {
          border: 'border-yellow-300',
          bg: 'bg-yellow-50',
          icon: 'text-yellow-600',
          badge: 'bg-yellow-100 text-yellow-700'
        };
      case 'low':
      default:
        return {
          border: 'border-blue-300',
          bg: 'bg-blue-50',
          icon: 'text-blue-600',
          badge: 'bg-blue-100 text-blue-700'
        };
    }
  };

  // Loading state
  if (isLoading && notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-teal-600" />
        <p className="text-sm text-gray-600">Loading notifications...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-900">Failed to load notifications</p>
            <p className="text-xs text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (notifications.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Bell className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-900 font-medium mb-1">All caught up!</p>
        <p className="text-sm text-gray-600">No new notifications at the moment.</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header with unread count and mark all as read */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-gray-700" />
          <h3 className="text-lg font-bold text-gray-900">Alerts</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications list */}
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => {
          const Icon = getIcon(notification.type);
          const styles = getPriorityStyles(notification.priority);

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ delay: index * 0.05 }}
              className={`${styles.bg} ${styles.border} border-2 rounded-xl p-4 relative`}
            >
              {/* Dismiss button */}
              <button
                onClick={() => dismissNotification(notification.id)}
                className="absolute top-3 right-3 p-1 hover:bg-white rounded-lg transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4 text-gray-500 hover:text-gray-700" />
              </button>

              {/* Content */}
              <div className="flex items-start gap-3 pr-8">
                {/* Icon */}
                <div className={`flex-shrink-0 ${styles.icon}`}>
                  <Icon className="w-6 h-6" />
                </div>

                {/* Text content */}
                <div className="flex-1 min-w-0">
                  {/* Priority badge and title */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${styles.badge}`}>
                      {notification.priority.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-gray-900 mb-1">
                    {notification.title}
                  </h4>

                  <p className="text-sm text-gray-700 leading-relaxed">
                    {notification.message}
                  </p>

                  {/* Action button */}
                  {notification.action_url && notification.action_label && (
                    <a
                      href={notification.action_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-3 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 transition-colors"
                    >
                      {notification.action_label}
                      <Navigation2 className="w-4 h-4" />
                    </a>
                  )}

                  {/* Mark as read button */}
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-gray-600 hover:text-gray-800"
                    >
                      <Check className="w-3 h-3" />
                      Mark as read
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
