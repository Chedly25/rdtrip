/**
 * NotificationCenter Component
 * Phase 5: Notifications & Push
 *
 * Bell icon with dropdown showing in-app notifications
 * Includes unread count badge, real-time updates, and mark-as-read functionality
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Check, CheckCheck, X, Loader2 } from 'lucide-react'
import type { Notification } from '../../types'
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  onNotificationReceived,
  requestNotificationPermission,
} from '../../services/notifications'

// Notification icons by type
const NOTIFICATION_ICONS: Record<string, string> = {
  mention: '💬',
  task_assigned: '📝',
  task_due_soon: '⏰',
  poll_created: '📊',
  poll_closed: '✅',
  comment_on_activity: '💭',
  activity_changed: '🔄',
  chat_message: '✉️',
  collaborator_added: '👥',
  route_shared: '🗺️',
}

interface NotificationCenterProps {
  userId?: string
}

export default function NotificationCenter({ userId }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [permissionRequested, setPermissionRequested] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Fetch notifications on mount and when dropdown opens
  useEffect(() => {
    if (userId) {
      loadNotifications()
    }
  }, [userId])

  // Request notification permission on mount (only once)
  useEffect(() => {
    if (userId && !permissionRequested) {
      requestNotificationPermission()
      setPermissionRequested(true)
    }
  }, [userId, permissionRequested])

  // Listen for real-time notifications via Firebase
  useEffect(() => {
    if (!userId) return

    const unsubscribe = onNotificationReceived((payload) => {
      console.log('📬 Real-time notification received:', payload)
      // Reload notifications to show new one
      loadNotifications()
    })

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [userId])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  async function loadNotifications() {
    setIsLoading(true)
    try {
      const data = await fetchNotifications(false) // Include all (read & unread)
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleMarkAsRead(notificationId: string) {
    const success = await markNotificationAsRead(notificationId)
    if (success) {
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      )
      setUnreadCount((prev) => Math.max(0, prev - 1))
    }
  }

  async function handleMarkAllAsRead() {
    const success = await markAllNotificationsAsRead()
    if (success) {
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    }
  }

  function getRelativeTime(timestamp: string): string {
    const now = new Date()
    const then = new Date(timestamp)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return then.toLocaleDateString()
  }

  function handleNotificationClick(notification: Notification) {
    // Mark as read
    if (!notification.read) {
      handleMarkAsRead(notification.id)
    }

    // Navigate to relevant page (if routeId or itineraryId is present)
    if (notification.routeId) {
      // TODO: Navigate to route page
      console.log('Navigate to route:', notification.routeId)
    } else if (notification.itineraryId) {
      // TODO: Navigate to itinerary
      console.log('Navigate to itinerary:', notification.itineraryId)
    }
  }

  // Separate unread and read notifications
  const unreadNotifications = notifications.filter((n) => !n.read)
  const readNotifications = notifications.filter((n) => n.read)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3 h-3" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>

            {/* Notification List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  <span className="ml-2 text-sm text-gray-500">Loading notifications...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    We'll notify you when something happens
                  </p>
                </div>
              ) : (
                <>
                  {/* Unread Notifications */}
                  {unreadNotifications.length > 0 && (
                    <div>
                      {unreadNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onClick={() => handleNotificationClick(notification)}
                          onMarkAsRead={() => handleMarkAsRead(notification.id)}
                          getRelativeTime={getRelativeTime}
                        />
                      ))}
                    </div>
                  )}

                  {/* Read Notifications */}
                  {readNotifications.length > 0 && (
                    <div className={unreadNotifications.length > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''}>
                      {readNotifications.slice(0, 10).map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onClick={() => handleNotificationClick(notification)}
                          onMarkAsRead={() => handleMarkAsRead(notification.id)}
                          getRelativeTime={getRelativeTime}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer (optional: link to all notifications) */}
            {notifications.length > 10 && (
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-center">
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  View all notifications
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Notification Item Component
interface NotificationItemProps {
  notification: Notification
  onClick: () => void
  onMarkAsRead: () => void
  getRelativeTime: (timestamp: string) => string
}

function NotificationItem({ notification, onClick, onMarkAsRead, getRelativeTime }: NotificationItemProps) {
  const isUnread = !notification.read
  const icon = NOTIFICATION_ICONS[notification.type] || '📬'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer border-b border-gray-100 dark:border-gray-800 transition-colors ${
        isUnread ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 text-2xl mt-0.5">{icon}</div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${isUnread ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {notification.title}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                {notification.message}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {getRelativeTime(notification.createdAt)}
              </p>
            </div>

            {/* Mark as read button (only for unread) */}
            {isUnread && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onMarkAsRead()
                }}
                className="flex-shrink-0 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Mark as read"
              >
                <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </button>
            )}
          </div>
        </div>

        {/* Unread dot indicator */}
        {isUnread && (
          <div className="flex-shrink-0 mt-2">
            <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
