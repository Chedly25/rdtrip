/**
 * Smart Alerts Monitor
 * Sprint 2.3: Real-Time Adaptations
 *
 * Intelligent alert system that monitors:
 * - Weather conditions affecting planned activities
 * - Upcoming reservations that need confirmation
 * - Driving time warnings for tight schedules
 * - Check-out reminders
 * - Contextual suggestions
 *
 * Design: Proactive travel companion with elegant notifications
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudRain,
  Bell,
  Calendar,
  Car,
  Coffee,
  BedDouble,
  X,
  ChevronRight,
} from 'lucide-react';
import type { CurrentWeather, WeatherCondition } from '../../services/weather';
import { isWeatherDisruptive } from '../../services/weather';

// Wanderlust Editorial Colors
const colors = {
  cream: '#FFFBF5',
  warmWhite: '#FAF7F2',
  terracotta: '#C45830',
  terracottaLight: '#D96A42',
  golden: '#D4A853',
  goldenLight: '#E4BE73',
  sage: '#6B8E7B',
  sageLight: '#8BA99A',
  darkBrown: '#2C2417',
  mediumBrown: '#4A3F35',
  lightBrown: '#8B7355',
  border: '#E8E2D9',
  rainBlue: '#5B7B8C',
  stormDark: '#3D4F5F',
};

// Alert types
export type SmartAlertType =
  | 'weather_warning'
  | 'reservation_reminder'
  | 'driving_warning'
  | 'checkout_reminder'
  | 'activity_suggestion'
  | 'weather_clear';

export interface SmartAlert {
  id: string;
  type: SmartAlertType;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  icon: 'weather' | 'reservation' | 'driving' | 'checkout' | 'suggestion';
  actionLabel?: string;
  onAction?: () => void;
  timestamp: Date;
  expiresAt?: Date;
  dismissed?: boolean;
}

// Activity for monitoring
export interface MonitoredActivity {
  id: string;
  name: string;
  type: 'outdoor' | 'indoor' | 'restaurant' | 'hotel' | 'transport';
  startTime: Date;
  endTime?: Date;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  hasReservation?: boolean;
  reservationPhone?: string;
}

// Monitor configuration
interface SmartAlertsMonitorProps {
  /** Current weather data */
  weather: CurrentWeather | null;
  /** Activities to monitor */
  activities: MonitoredActivity[];
  /** Current user location */
  userLocation?: { lat: number; lng: number };
  /** Callback when alert is generated */
  onAlert: (alert: SmartAlert) => void;
  /** Callback when weather disruption is detected */
  onWeatherDisruption?: (activity: MonitoredActivity, weather: CurrentWeather) => void;
  /** Enable/disable sound notifications */
  soundEnabled?: boolean;
  /** Monitoring interval in ms (default: 1 minute) */
  checkInterval?: number;
}

/**
 * Calculate distance between two coordinates (Haversine)
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate driving time based on distance
 */
function estimateDrivingTime(distanceKm: number): number {
  // Rough estimate: 40 km/h average including traffic
  return Math.round(distanceKm / 40 * 60);
}

/**
 * Smart Alerts Monitor - Runs in background to detect alert conditions
 */
export function useSmartAlertsMonitor({
  weather,
  activities,
  userLocation,
  onAlert,
  onWeatherDisruption,
  checkInterval = 60000,
}: Omit<SmartAlertsMonitorProps, 'soundEnabled'>) {
  const [generatedAlertIds, setGeneratedAlertIds] = useState<Set<string>>(new Set());

  // Generate unique alert ID based on type and activity
  const getAlertKey = useCallback((type: SmartAlertType, activityId?: string) => {
    const dateKey = new Date().toDateString();
    return `${type}-${activityId || 'general'}-${dateKey}`;
  }, []);

  // Check if alert was already generated
  const wasAlertGenerated = useCallback((key: string) => {
    return generatedAlertIds.has(key);
  }, [generatedAlertIds]);

  // Mark alert as generated
  const markAlertGenerated = useCallback((key: string) => {
    setGeneratedAlertIds(prev => new Set(prev).add(key));
  }, []);

  // Generate weather warning alert
  const checkWeatherAlerts = useCallback(() => {
    if (!weather) return;

    const now = new Date();
    const upcomingOutdoor = activities.filter(a => {
      const timeUntil = a.startTime.getTime() - now.getTime();
      return a.type === 'outdoor' && timeUntil > 0 && timeUntil < 3 * 60 * 60 * 1000; // Next 3 hours
    });

    if (isWeatherDisruptive(weather.condition) && upcomingOutdoor.length > 0) {
      upcomingOutdoor.forEach(activity => {
        const alertKey = getAlertKey('weather_warning', activity.id);
        if (!wasAlertGenerated(alertKey)) {
          const alert: SmartAlert = {
            id: `weather-${activity.id}-${Date.now()}`,
            type: 'weather_warning',
            priority: 'high',
            title: getWeatherTitle(weather.condition),
            message: `${activity.name} may be affected. Consider indoor alternatives.`,
            icon: 'weather',
            actionLabel: 'View alternatives',
            timestamp: now,
            onAction: () => onWeatherDisruption?.(activity, weather),
          };
          onAlert(alert);
          markAlertGenerated(alertKey);
        }
      });
    }
  }, [weather, activities, onAlert, onWeatherDisruption, getAlertKey, wasAlertGenerated, markAlertGenerated]);

  // Check reservation reminders
  const checkReservationAlerts = useCallback(() => {
    const now = new Date();

    activities
      .filter(a => a.hasReservation && a.type === 'restaurant')
      .forEach(activity => {
        const timeUntil = activity.startTime.getTime() - now.getTime();
        const minutesUntil = timeUntil / (60 * 1000);

        // Alert 2 hours before restaurant reservation
        if (minutesUntil > 90 && minutesUntil <= 120) {
          const alertKey = getAlertKey('reservation_reminder', activity.id);
          if (!wasAlertGenerated(alertKey)) {
            const alert: SmartAlert = {
              id: `reservation-${activity.id}-${Date.now()}`,
              type: 'reservation_reminder',
              priority: 'medium',
              title: 'Reservation Reminder',
              message: `${activity.name} in 2 hours. Consider confirming your booking.`,
              icon: 'reservation',
              actionLabel: 'Call restaurant',
              timestamp: now,
            };
            onAlert(alert);
            markAlertGenerated(alertKey);
          }
        }
      });
  }, [activities, onAlert, getAlertKey, wasAlertGenerated, markAlertGenerated]);

  // Check driving time warnings
  const checkDrivingAlerts = useCallback(() => {
    if (!userLocation) return;

    const now = new Date();

    activities.forEach(activity => {
      const timeUntil = activity.startTime.getTime() - now.getTime();
      const minutesUntil = timeUntil / (60 * 1000);

      if (minutesUntil > 0 && minutesUntil <= 60) {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          activity.location.lat,
          activity.location.lng
        );
        const drivingTime = estimateDrivingTime(distance);

        // Alert if driving time is close to time until activity
        if (drivingTime >= minutesUntil - 15 && drivingTime <= minutesUntil + 5) {
          const alertKey = getAlertKey('driving_warning', activity.id);
          if (!wasAlertGenerated(alertKey)) {
            const alert: SmartAlert = {
              id: `driving-${activity.id}-${Date.now()}`,
              type: 'driving_warning',
              priority: minutesUntil < drivingTime ? 'high' : 'medium',
              title: 'Time to Leave',
              message: `${Math.round(drivingTime)} min drive to ${activity.name}. Leave now to arrive on time.`,
              icon: 'driving',
              actionLabel: 'Navigate',
              timestamp: now,
            };
            onAlert(alert);
            markAlertGenerated(alertKey);
          }
        }
      }
    });
  }, [userLocation, activities, onAlert, getAlertKey, wasAlertGenerated, markAlertGenerated]);

  // Check hotel checkout reminders
  const checkCheckoutAlerts = useCallback(() => {
    const now = new Date();

    activities
      .filter(a => a.type === 'hotel')
      .forEach(activity => {
        if (activity.endTime) {
          const timeUntil = activity.endTime.getTime() - now.getTime();
          const minutesUntil = timeUntil / (60 * 1000);

          // Alert 1 hour before checkout
          if (minutesUntil > 45 && minutesUntil <= 60) {
            const alertKey = getAlertKey('checkout_reminder', activity.id);
            if (!wasAlertGenerated(alertKey)) {
              const alert: SmartAlert = {
                id: `checkout-${activity.id}-${Date.now()}`,
                type: 'checkout_reminder',
                priority: 'medium',
                title: 'Check-out Reminder',
                message: `Check-out at ${activity.name} in 1 hour.`,
                icon: 'checkout',
                timestamp: now,
              };
              onAlert(alert);
              markAlertGenerated(alertKey);
            }
          }
        }
      });
  }, [activities, onAlert, getAlertKey, wasAlertGenerated, markAlertGenerated]);

  // Run all checks periodically
  useEffect(() => {
    const runChecks = () => {
      checkWeatherAlerts();
      checkReservationAlerts();
      checkDrivingAlerts();
      checkCheckoutAlerts();
    };

    // Initial check
    runChecks();

    // Periodic checks
    const intervalId = setInterval(runChecks, checkInterval);
    return () => clearInterval(intervalId);
  }, [checkWeatherAlerts, checkReservationAlerts, checkDrivingAlerts, checkCheckoutAlerts, checkInterval]);
}

// Helper: Get weather title
function getWeatherTitle(condition: WeatherCondition): string {
  const titles: Record<WeatherCondition, string> = {
    rain: 'Rain Expected',
    drizzle: 'Light Rain',
    thunderstorm: 'Storm Warning',
    snow: 'Snow Expected',
    clear: 'Clear Skies',
    clouds: 'Overcast',
    mist: 'Misty Conditions',
    fog: 'Foggy Weather',
    haze: 'Hazy Conditions',
  };
  return titles[condition] || 'Weather Update';
}

/**
 * Smart Alert Toast Component
 * Displays individual alerts with animations
 */
interface SmartAlertToastProps {
  alert: SmartAlert;
  onDismiss: (id: string) => void;
  onAction?: () => void;
}

const alertIconMap: Record<SmartAlert['icon'], React.ElementType> = {
  weather: CloudRain,
  reservation: Calendar,
  driving: Car,
  checkout: BedDouble,
  suggestion: Coffee,
};

const priorityColors: Record<SmartAlert['priority'], { bg: string; accent: string }> = {
  high: { bg: colors.terracotta, accent: colors.terracottaLight },
  medium: { bg: colors.golden, accent: colors.goldenLight },
  low: { bg: colors.sage, accent: colors.sageLight },
};

export const SmartAlertToast: React.FC<SmartAlertToastProps> = ({
  alert,
  onDismiss,
  onAction,
}) => {
  const Icon = alertIconMap[alert.icon] || Bell;
  const color = priorityColors[alert.priority];

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="relative overflow-hidden rounded-2xl shadow-lg"
      style={{
        background: `linear-gradient(135deg, ${color.bg} 0%, ${color.accent} 100%)`,
        boxShadow: `0 10px 40px ${color.bg}40`,
      }}
    >
      {/* Decorative stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1"
        style={{ background: 'rgba(255,255,255,0.3)' }}
      />

      <div className="p-4 pl-5 flex items-start gap-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          <Icon className="w-5 h-5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white mb-0.5">
            {alert.title}
          </h4>
          <p className="text-sm text-white/90">
            {alert.message}
          </p>

          {/* Action button */}
          {alert.actionLabel && (
            <motion.button
              onClick={() => {
                onAction?.();
                alert.onAction?.();
              }}
              className="mt-2 flex items-center gap-1 text-sm font-medium text-white"
              whileHover={{ x: 3 }}
            >
              {alert.actionLabel}
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Dismiss button */}
        <motion.button
          onClick={() => onDismiss(alert.id)}
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.2)' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X className="w-4 h-4 text-white" />
        </motion.button>
      </div>

      {/* Auto-dismiss progress bar */}
      <motion.div
        className="absolute bottom-0 left-0 h-0.5 bg-white/30"
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: 10, ease: 'linear' }}
      />
    </motion.div>
  );
};

/**
 * Smart Alerts Container
 * Manages and displays multiple alerts
 */
interface SmartAlertsContainerProps {
  alerts: SmartAlert[];
  onDismiss: (id: string) => void;
  maxVisible?: number;
  className?: string;
}

export const SmartAlertsContainer: React.FC<SmartAlertsContainerProps> = ({
  alerts,
  onDismiss,
  maxVisible = 3,
  className = '',
}) => {
  const visibleAlerts = alerts
    .filter(a => !a.dismissed)
    .slice(0, maxVisible);

  return (
    <div className={`space-y-2 ${className}`}>
      <AnimatePresence mode="popLayout">
        {visibleAlerts.map((alert) => (
          <SmartAlertToast
            key={alert.id}
            alert={alert}
            onDismiss={onDismiss}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default SmartAlertsContainer;
