/**
 * Alert Banner - Travel Companion Notifications
 *
 * Contextual alert banners that appear at the top of the screen
 * during Trip Mode to provide timely, actionable information.
 *
 * Design: "Telegram from the Road" - urgent but elegant notifications
 *
 * Alert Types:
 * - Weather warnings
 * - Reservation reminders
 * - Driving time warnings
 * - Check-out reminders
 * - Activity suggestions
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  CloudRain,
  Clock,
  Calendar,
  Car,
  Info,
  CheckCircle,
  ChevronRight,
  Bell,
  Umbrella,
  Sun,
  Coffee,
} from 'lucide-react';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  goldenDark: '#B8923D',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  darkBrown: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E8E2D9',
};

// Alert priority configurations
const alertConfigs = {
  urgent: {
    background: `linear-gradient(135deg, ${colors.terracotta} 0%, ${colors.terracottaLight} 100%)`,
    icon: AlertTriangle,
    iconColor: 'white',
    textColor: 'white',
    borderColor: colors.terracotta,
  },
  warning: {
    background: `linear-gradient(135deg, ${colors.golden} 0%, ${colors.goldenDark} 100%)`,
    icon: AlertTriangle,
    iconColor: 'white',
    textColor: 'white',
    borderColor: colors.golden,
  },
  info: {
    background: colors.cream,
    icon: Info,
    iconColor: colors.sage,
    textColor: colors.darkBrown,
    borderColor: colors.sage,
  },
  success: {
    background: `linear-gradient(135deg, ${colors.sage} 0%, ${colors.sageLight} 100%)`,
    icon: CheckCircle,
    iconColor: 'white',
    textColor: 'white',
    borderColor: colors.sage,
  },
};

// Alert type icons
const alertTypeIcons: Record<string, React.ElementType> = {
  weather: CloudRain,
  rain: Umbrella,
  sun: Sun,
  reservation: Calendar,
  driving: Car,
  checkout: Clock,
  reminder: Bell,
  suggestion: Coffee,
};

export interface TripAlert {
  id: string;
  type: 'weather' | 'reservation' | 'driving' | 'checkout' | 'reminder' | 'suggestion';
  priority: 'urgent' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp?: Date;
  autoDismiss?: number; // milliseconds
}

// Single Alert Banner Component
const AlertBannerItem = ({
  alert,
  onDismiss,
  index,
}: {
  alert: TripAlert;
  onDismiss: (id: string) => void;
  index: number;
}) => {
  const config = alertConfigs[alert.priority];
  const TypeIcon = alertTypeIcons[alert.type] || config.icon;

  // Auto-dismiss effect
  useEffect(() => {
    if (alert.autoDismiss) {
      const timer = setTimeout(() => {
        onDismiss(alert.id);
      }, alert.autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [alert.id, alert.autoDismiss, onDismiss]);

  const isLight = alert.priority === 'info';

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ delay: index * 0.1, type: 'spring', damping: 25, stiffness: 300 }}
      className="relative overflow-hidden rounded-2xl shadow-lg"
      style={{
        background: config.background,
        border: isLight ? `1px solid ${config.borderColor}30` : 'none',
        boxShadow: `0 10px 30px ${config.borderColor}30`,
      }}
    >
      {/* Decorative stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: isLight ? config.borderColor : 'rgba(255,255,255,0.3)' }}
      />

      <div className="p-4 pl-5 flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: isLight ? `${config.borderColor}15` : 'rgba(255,255,255,0.2)',
          }}
        >
          <TypeIcon
            className="w-5 h-5"
            style={{ color: isLight ? config.borderColor : 'white' }}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className="text-sm font-semibold mb-0.5"
            style={{ color: config.textColor }}
          >
            {alert.title}
          </h4>
          <p
            className="text-sm opacity-90"
            style={{ color: config.textColor }}
          >
            {alert.message}
          </p>

          {/* Action button */}
          {alert.action && (
            <motion.button
              onClick={alert.action.onClick}
              className="mt-2 flex items-center gap-1 text-sm font-medium"
              style={{
                color: isLight ? config.borderColor : 'white',
              }}
              whileHover={{ x: 3 }}
            >
              {alert.action.label}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Dismiss button */}
        <motion.button
          onClick={() => onDismiss(alert.id)}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: isLight ? colors.warmWhite : 'rgba(255,255,255,0.2)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X
            className="w-4 h-4"
            style={{ color: isLight ? colors.lightBrown : 'white' }}
          />
        </motion.button>
      </div>

      {/* Auto-dismiss progress bar */}
      {alert.autoDismiss && (
        <motion.div
          className="absolute bottom-0 left-0 h-0.5"
          style={{ background: isLight ? config.borderColor : 'rgba(255,255,255,0.4)' }}
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: alert.autoDismiss / 1000, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
};

// Alert Stack Container
interface AlertBannerStackProps {
  alerts: TripAlert[];
  onDismiss: (id: string) => void;
  maxVisible?: number;
  className?: string;
}

export const AlertBannerStack: React.FC<AlertBannerStackProps> = ({
  alerts,
  onDismiss,
  maxVisible = 3,
  className = '',
}) => {
  const visibleAlerts = alerts.slice(0, maxVisible);
  const hiddenCount = alerts.length - maxVisible;

  return (
    <div className={`space-y-2 ${className}`}>
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert, index) => (
          <AlertBannerItem
            key={alert.id}
            alert={alert}
            onDismiss={onDismiss}
            index={index}
          />
        ))}
      </AnimatePresence>

      {/* Hidden alerts indicator */}
      {hiddenCount > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-2"
        >
          <span className="text-sm" style={{ color: colors.lightBrown }}>
            +{hiddenCount} more alert{hiddenCount > 1 ? 's' : ''}
          </span>
        </motion.div>
      )}
    </div>
  );
};

// Hook for managing alerts
export const useAlerts = () => {
  const [alerts, setAlerts] = useState<TripAlert[]>([]);

  const addAlert = (alert: Omit<TripAlert, 'id'>) => {
    const id = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setAlerts((prev) => [...prev, { ...alert, id }]);
    return id;
  };

  const dismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  return {
    alerts,
    addAlert,
    dismissAlert,
    clearAllAlerts,
  };
};

// Pre-configured alert creators
export const createWeatherAlert = (
  condition: string,
  suggestion: string,
  onAction?: () => void
): Omit<TripAlert, 'id'> => ({
  type: 'weather',
  priority: 'warning',
  title: `Weather Update: ${condition}`,
  message: suggestion,
  action: onAction
    ? { label: 'Find indoor alternatives', onClick: onAction }
    : undefined,
  autoDismiss: 10000,
});

export const createReservationReminder = (
  restaurantName: string,
  time: string,
  onNavigate?: () => void
): Omit<TripAlert, 'id'> => ({
  type: 'reservation',
  priority: 'info',
  title: 'Reservation Reminder',
  message: `${restaurantName} at ${time} - leave in 30 minutes`,
  action: onNavigate
    ? { label: 'Navigate there', onClick: onNavigate }
    : undefined,
  autoDismiss: 15000,
});

export const createDrivingWarning = (
  destination: string,
  minutesNeeded: number,
  onNavigate?: () => void
): Omit<TripAlert, 'id'> => ({
  type: 'driving',
  priority: minutesNeeded < 15 ? 'urgent' : 'warning',
  title: 'Time to Leave',
  message: `Leave now to arrive at ${destination} on time (${minutesNeeded} min drive)`,
  action: onNavigate
    ? { label: 'Start navigation', onClick: onNavigate }
    : undefined,
});

export const createCheckoutReminder = (
  hotelName: string,
  checkoutTime: string
): Omit<TripAlert, 'id'> => ({
  type: 'checkout',
  priority: 'info',
  title: 'Check-out Reminder',
  message: `${hotelName} check-out at ${checkoutTime}`,
  autoDismiss: 30000,
});

export default AlertBannerStack;
