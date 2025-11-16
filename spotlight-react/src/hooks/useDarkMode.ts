/**
 * useDarkMode - Dark Mode Hook with System Preference Detection
 * Phase 6.7: Detects system preference and provides toggle functionality
 */

import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface UseDarkModeReturn {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

/**
 * Hook to manage dark mode with system preference detection
 */
export const useDarkMode = (): UseDarkModeReturn => {
  // Get initial theme from localStorage or default to 'system'
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem('rdtrip-theme') as Theme;
    return stored || 'system';
  });

  // Compute actual dark mode status based on theme setting
  const [isDark, setIsDark] = useState(false);

  // Update dark mode based on theme and system preference
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const updateDarkMode = () => {
      let shouldBeDark = false;

      if (theme === 'dark') {
        shouldBeDark = true;
      } else if (theme === 'light') {
        shouldBeDark = false;
      } else {
        // theme === 'system'
        shouldBeDark = mediaQuery.matches;
      }

      setIsDark(shouldBeDark);

      if (shouldBeDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    // Initial update
    updateDarkMode();

    // Listen for system preference changes
    const handler = () => updateDarkMode();
    mediaQuery.addEventListener('change', handler);

    return () => {
      mediaQuery.removeEventListener('change', handler);
    };
  }, [theme]);

  // Set theme and persist to localStorage
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('rdtrip-theme', newTheme);
  };

  // Toggle between light and dark
  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return {
    theme,
    isDark,
    setTheme,
    toggleTheme,
  };
};
