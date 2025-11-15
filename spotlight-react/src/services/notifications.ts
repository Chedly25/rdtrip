/**
 * Firebase Cloud Messaging (FCM) Service
 * Phase 5: Notifications & Push
 *
 * Handles browser push notifications via Firebase
 */

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';
import { v4 as uuidv4 } from 'uuid';

// Firebase configuration (from environment variables)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// VAPID key for Web Push (from Firebase Console)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let messaging: Messaging | null = null;
let isFirebaseInitialized = false;

/**
 * Initialize Firebase App and Messaging
 */
function initializeFirebase(): Messaging | null {
  if (isFirebaseInitialized) {
    return messaging;
  }

  // Check if all required config values are present
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('⚠️  Firebase config not found. Push notifications will be disabled.');
    console.warn('   Set VITE_FIREBASE_* environment variables to enable.');
    return null;
  }

  try {
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    isFirebaseInitialized = true;
    console.log('✅ Firebase initialized successfully');
    return messaging;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error);
    return null;
  }
}

/**
 * Get or generate unique device ID
 * Stored in localStorage for consistency across sessions
 */
export function getDeviceId(): string {
  const DEVICE_ID_KEY = 'rdtrip_device_id';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = uuidv4();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    console.log('🔑 Generated new device ID:', deviceId);
  }

  return deviceId;
}

/**
 * Request notification permission and register FCM token
 * Returns FCM token if successful, null otherwise
 */
export async function requestNotificationPermission(): Promise<string | null> {
  // Initialize Firebase
  const msg = initializeFirebase();
  if (!msg) {
    console.log('Firebase not initialized, skipping notification registration');
    return null;
  }

  // Check if browser supports notifications
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return null;
  }

  try {
    // Request permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    console.log('✅ Notification permission granted');

    // Get FCM token
    const token = await getToken(msg, { vapidKey: VAPID_KEY });

    if (token) {
      console.log('✅ FCM token obtained:', token.substring(0, 20) + '...');

      // Register token with backend
      await registerDeviceToken(token);

      return token;
    } else {
      console.warn('No FCM token available. User may need to grant permission.');
      return null;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return null;
  }
}

/**
 * Register device token with backend
 */
async function registerDeviceToken(fcmToken: string): Promise<void> {
  const deviceId = getDeviceId();
  const platform = 'web';

  try {
    const response = await fetch('/api/notifications/devices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        deviceId,
        fcmToken,
        platform,
      }),
    });

    if (response.ok) {
      console.log('✅ Device token registered with backend');
    } else {
      console.error('❌ Failed to register device token:', await response.text());
    }
  } catch (error) {
    console.error('Error registering device token:', error);
  }
}

/**
 * Listen for real-time push notifications (foreground messages)
 * @param callback - Function to call when notification is received
 */
export function onNotificationReceived(
  callback: (payload: { title: string; body: string; data?: any }) => void
): (() => void) | null {
  const msg = initializeFirebase();
  if (!msg) {
    return null;
  }

  // Listen for messages when app is in foreground
  const unsubscribe = onMessage(msg, (payload) => {
    console.log('📬 Received foreground message:', payload);

    const title = payload.notification?.title || 'New Notification';
    const body = payload.notification?.body || '';
    const data = payload.data;

    // Call the callback
    callback({ title, body, data });

    // Show browser notification (if permission granted)
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
      });
    }
  });

  return unsubscribe;
}

/**
 * Fetch notifications from backend
 */
export async function fetchNotifications(unreadOnly = false): Promise<{
  notifications: any[];
  unreadCount: number;
}> {
  try {
    const response = await fetch(`/api/notifications?unreadOnly=${unreadOnly}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (response.ok) {
      return await response.json();
    } else {
      console.error('Failed to fetch notifications:', await response.text());
      return { notifications: [], unreadCount: 0 };
    }
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return { notifications: [], unreadCount: 0 };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Fetch notification preferences
 */
export async function fetchNotificationPreferences(): Promise<any | null> {
  try {
    const response = await fetch('/api/notifications/preferences', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      return data.preferences;
    } else {
      console.error('Failed to fetch preferences:', await response.text());
      return null;
    }
  } catch (error) {
    console.error('Error fetching preferences:', error);
    return null;
  }
}

/**
 * Update notification preferences
 */
export async function updateNotificationPreferences(preferences: any): Promise<boolean> {
  try {
    const response = await fetch('/api/notifications/preferences', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(preferences),
    });

    return response.ok;
  } catch (error) {
    console.error('Error updating preferences:', error);
    return false;
  }
}
