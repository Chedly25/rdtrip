/**
 * useTimeOfDay - Time-Aware Theme Hook
 *
 * Provides dynamic theming that shifts with the time of day,
 * creating an immersive experience that reflects the traveler's moment.
 *
 * Design: "Wanderlust Field Notes" - Editorial travel magazine meets living journal
 */

import { useState, useEffect, useMemo, createContext, useContext } from 'react';
import type { ReactNode } from 'react';

export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';

export interface TimeTheme {
  name: TimeOfDay;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  backgroundGradient: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  cardBg: string;
  cardBorder: string;
  shadow: string;
  glow: string;
  iconColor: string;
  isNight: boolean;
}

// Beautiful, time-aware color palettes
export const timeThemes: Record<TimeOfDay, TimeTheme> = {
  dawn: {
    name: 'dawn',
    primary: '#E07B9A',       // Rose pink
    secondary: '#FFB4A2',     // Soft coral
    accent: '#B5838D',        // Dusty rose
    background: '#FFF5F3',    // Warm white
    backgroundGradient: 'linear-gradient(180deg, #FFCDB2 0%, #FFE5D9 50%, #FFF5F3 100%)',
    textPrimary: '#3D2C29',   // Deep brown
    textSecondary: '#6B5750', // Warm gray
    textMuted: '#9D8A84',     // Muted brown
    cardBg: 'rgba(255, 255, 255, 0.85)',
    cardBorder: 'rgba(224, 123, 154, 0.2)',
    shadow: '0 8px 32px rgba(224, 123, 154, 0.15)',
    glow: 'rgba(224, 123, 154, 0.4)',
    iconColor: '#E07B9A',
    isNight: false,
  },
  morning: {
    name: 'morning',
    primary: '#5B9BD5',       // Fresh blue
    secondary: '#87CEEB',     // Sky blue
    accent: '#4A90A4',        // Ocean blue
    background: '#F8FBFD',    // Cool white
    backgroundGradient: 'linear-gradient(180deg, #B4E4FF 0%, #E8F4F8 50%, #FFFBF5 100%)',
    textPrimary: '#1E3A4C',   // Deep navy
    textSecondary: '#4A6572', // Slate
    textMuted: '#7A9AA8',     // Muted blue
    cardBg: 'rgba(255, 255, 255, 0.9)',
    cardBorder: 'rgba(91, 155, 213, 0.2)',
    shadow: '0 8px 32px rgba(91, 155, 213, 0.12)',
    glow: 'rgba(91, 155, 213, 0.4)',
    iconColor: '#5B9BD5',
    isNight: false,
  },
  afternoon: {
    name: 'afternoon',
    primary: '#D4A853',       // Golden amber
    secondary: '#E4BE73',     // Soft gold
    accent: '#C49B4A',        // Deep gold
    background: '#FFFBF5',    // Cream
    backgroundGradient: 'linear-gradient(180deg, #FFF8E7 0%, #FFFBF5 50%, #FAF7F2 100%)',
    textPrimary: '#2C2417',   // Rich brown
    textSecondary: '#4A3F35', // Medium brown
    textMuted: '#8B7355',     // Light brown
    cardBg: 'rgba(255, 255, 255, 0.92)',
    cardBorder: 'rgba(212, 168, 83, 0.25)',
    shadow: '0 8px 32px rgba(212, 168, 83, 0.15)',
    glow: 'rgba(212, 168, 83, 0.5)',
    iconColor: '#D4A853',
    isNight: false,
  },
  evening: {
    name: 'evening',
    primary: '#E07B39',       // Burnt orange
    secondary: '#F4A261',     // Warm amber
    accent: '#D4622B',        // Deep terracotta
    background: '#FFF8F3',    // Warm cream
    backgroundGradient: 'linear-gradient(180deg, #FFE8D6 0%, #FFF0E5 50%, #FFFBF5 100%)',
    textPrimary: '#2C1810',   // Deep umber
    textSecondary: '#5C3D2E', // Warm brown
    textMuted: '#8B6B5A',     // Muted terracotta
    cardBg: 'rgba(255, 255, 255, 0.88)',
    cardBorder: 'rgba(224, 123, 57, 0.2)',
    shadow: '0 8px 32px rgba(224, 123, 57, 0.18)',
    glow: 'rgba(224, 123, 57, 0.5)',
    iconColor: '#E07B39',
    isNight: false,
  },
  night: {
    name: 'night',
    primary: '#8B7EC8',       // Soft lavender
    secondary: '#9D8189',     // Dusty mauve
    accent: '#6D6875',        // Deep purple-gray
    background: '#1A1621',    // Deep night
    backgroundGradient: 'linear-gradient(180deg, #2C2438 0%, #1A1621 50%, #12101A 100%)',
    textPrimary: '#F5F3F7',   // Soft white
    textSecondary: '#C9C4D4', // Light lavender
    textMuted: '#8A8494',     // Muted purple
    cardBg: 'rgba(42, 36, 56, 0.9)',
    cardBorder: 'rgba(139, 126, 200, 0.2)',
    shadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    glow: 'rgba(139, 126, 200, 0.3)',
    iconColor: '#8B7EC8',
    isNight: true,
  },
};

// Get time of day from hour
export const getTimeOfDay = (hour: number): TimeOfDay => {
  if (hour >= 5 && hour < 7) return 'dawn';
  if (hour >= 7 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
};

// Get the icon name for time of day
export const getTimeIcon = (timeOfDay: TimeOfDay): string => {
  const icons = {
    dawn: 'Sunrise',
    morning: 'Sun',
    afternoon: 'CloudSun',
    evening: 'Sunset',
    night: 'Moon',
  };
  return icons[timeOfDay];
};

// Get a poetic description of the time
export const getTimeDescription = (timeOfDay: TimeOfDay): string => {
  const descriptions = {
    dawn: 'The world awakens',
    morning: 'Fresh possibilities',
    afternoon: 'Golden moments',
    evening: 'Amber reflections',
    night: 'Starlit dreams',
  };
  return descriptions[timeOfDay];
};

// Hook to get current time theme
export function useTimeOfDay() {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const timeOfDay = useMemo(() => {
    return getTimeOfDay(currentTime.getHours());
  }, [currentTime]);

  const theme = useMemo(() => {
    return timeThemes[timeOfDay];
  }, [timeOfDay]);

  const formattedTime = useMemo(() => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, [currentTime]);

  const formattedDate = useMemo(() => {
    return currentTime.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  }, [currentTime]);

  return {
    currentTime,
    timeOfDay,
    theme,
    formattedTime,
    formattedDate,
    timeIcon: getTimeIcon(timeOfDay),
    timeDescription: getTimeDescription(timeOfDay),
    isNight: timeOfDay === 'night',
    isDawn: timeOfDay === 'dawn',
  };
}

// Context for sharing time theme
interface TimeThemeContextValue {
  currentTime: Date;
  timeOfDay: TimeOfDay;
  theme: TimeTheme;
  formattedTime: string;
  formattedDate: string;
  timeIcon: string;
  timeDescription: string;
  isNight: boolean;
  isDawn: boolean;
}

const TimeThemeContext = createContext<TimeThemeContextValue | null>(null);

export function TimeThemeProvider({ children }: { children: ReactNode }) {
  const timeData = useTimeOfDay();

  return (
    <TimeThemeContext.Provider value={timeData}>
      {children}
    </TimeThemeContext.Provider>
  );
}

export function useTimeTheme() {
  const context = useContext(TimeThemeContext);
  if (!context) {
    // Fallback if not in provider
    return useTimeOfDay();
  }
  return context;
}

export default useTimeOfDay;
