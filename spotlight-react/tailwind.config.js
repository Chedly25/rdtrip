/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Itinerary Display Theme Colors
        terracotta: '#C45830',
        gold: '#D4A853',
        sage: '#4A7C59',
        // Waycraft "Wanderlust Editorial" Color System
        rui: {
          black: '#2C2417',
          foreground: '#2C2417',
          'grey-50': '#8B7355',
          'grey-40': '#9D8A70',
          'grey-60': '#6B5A45',
          'grey-70': '#4A3F30',
          'grey-20': '#C4B8A5',
          'grey-10': '#E5DDD0',
          'grey-8': '#EDE6DB',
          'grey-5': '#F5F0E8',
          'grey-2': '#FAF7F2',
          white: '#FFFBF5',
          cream: '#FBF9F6',
          accent: '#C45830',
          'accent-light': '#FEF3EE',
          secondary: '#4A90A4',
          'secondary-light': '#E8F4F7',
          sage: '#4A7C59',
          golden: '#D4A853',
        },
        // Semantic Colors - Earthy tones
        success: '#4A7C59',
        warning: '#D4A853',
        danger: '#B54A4A',
        info: '#4A6FA5',
        // Neutral colors for components
        neutral: {
          50: '#FAF7F2',
          100: '#F5F0E8',
          200: '#EDE6DB',
          300: '#E5DDD0',
          400: '#C4B8A5',
          500: '#8B7355',
          600: '#6B5A45',
          700: '#4A3F30',
          800: '#3A3226',
          900: '#2C2417',
        },
      },
      fontFamily: {
        // Editorial Typography
        display: ['Fraunces', 'Georgia', 'serif'],
        marketing: ['Fraunces', 'Georgia', 'serif'],
        body: ['Satoshi', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        // Editorial Typography Scale
        'display-1': ['4rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-2': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-3': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
        // UI Typography
        'heading-1': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
        'heading-2': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-3': ['1.25rem', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'emphasis-1': ['1rem', { lineHeight: '1.5', letterSpacing: '-0.01em', fontWeight: '500' }],
        'emphasis-2': ['0.875rem', { lineHeight: '1.5', letterSpacing: '-0.005em', fontWeight: '500' }],
        'emphasis-3': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '500' }],
        'body-1': ['1rem', { lineHeight: '1.6', letterSpacing: '-0.01em', fontWeight: '400' }],
        'body-2': ['0.875rem', { lineHeight: '1.6', letterSpacing: '-0.005em', fontWeight: '400' }],
        'body-3': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
      },
      spacing: {
        'rui-2': '0.125rem',
        'rui-4': '0.25rem',
        'rui-6': '0.375rem',
        'rui-8': '0.5rem',
        'rui-12': '0.75rem',
        'rui-16': '1rem',
        'rui-20': '1.25rem',
        'rui-24': '1.5rem',
        'rui-32': '2rem',
        'rui-40': '2.5rem',
        'rui-48': '3rem',
        'rui-56': '3.5rem',
        'rui-64': '4rem',
      },
      boxShadow: {
        // Warm-tinted Shadow System
        'rui-1': '0 0.125rem 0.25rem rgba(44, 36, 23, 0.06)',
        'rui-2': '0 0.25rem 0.75rem rgba(44, 36, 23, 0.08)',
        'rui-3': '0 0.5rem 2rem rgba(44, 36, 23, 0.1)',
        'rui-4': '0 1.5rem 4rem rgba(44, 36, 23, 0.14)',
        'rui-side': '0 0.125rem 0.25rem rgba(44, 36, 23, 0.05), 0 0.25rem 1rem rgba(44, 36, 23, 0.08)',
        'accent': '0 0.5rem 2rem rgba(196, 88, 48, 0.25)',
      },
      borderRadius: {
        'rui-2': '0.125rem',
        'rui-4': '0.25rem',
        'rui-6': '0.375rem',
        'rui-8': '0.5rem',
        'rui-12': '0.75rem',
        'rui-16': '1rem',
        'rui-24': '1.5rem',
        'rui-32': '2rem',
      },
      transitionDuration: {
        'rui-xs': '100ms',
        'rui-sm': '200ms',
        'rui-md': '300ms',
        'rui-lg': '450ms',
        'rui-xl': '900ms',
      },
      transitionTimingFunction: {
        'rui-default': 'cubic-bezier(0.15, 0.5, 0.5, 1)',
        'rui-shadow': 'cubic-bezier(0.4, 0.3, 0.8, 0.6)',
        'rui-toast': 'cubic-bezier(0.175, 0.885, 0.21, 1.65)',
        'smooth': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s cubic-bezier(0.15, 0.5, 0.5, 1)',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.15, 0.5, 0.5, 1)',
        'scale-in': 'scaleIn 0.3s cubic-bezier(0.15, 0.5, 0.5, 1)',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'ken-burns': 'kenBurns 20s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': { opacity: '0', transform: 'translateY(24px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          'from': { opacity: '0', transform: 'scale(0.96)' },
          'to': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          'from': { backgroundPosition: '-200% center' },
          'to': { backgroundPosition: '200% center' },
        },
        kenBurns: {
          '0%': { transform: 'scale(1) translate(0, 0)' },
          '100%': { transform: 'scale(1.1) translate(-2%, -2%)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    // WI-11.7: Mobile responsive utilities
    plugin(function({ addUtilities, addComponents, theme }) {
      // Safe Area Utilities
      // Use env() for safe areas on notched devices (iPhone X+, Android with notches)
      addUtilities({
        // Padding safe area
        '.p-safe': {
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
        },
        '.pt-safe': { paddingTop: 'env(safe-area-inset-top, 0px)' },
        '.pr-safe': { paddingRight: 'env(safe-area-inset-right, 0px)' },
        '.pb-safe': { paddingBottom: 'env(safe-area-inset-bottom, 0px)' },
        '.pl-safe': { paddingLeft: 'env(safe-area-inset-left, 0px)' },
        '.px-safe': {
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
        },
        '.py-safe': {
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        },
        // Margin safe area
        '.m-safe': {
          marginTop: 'env(safe-area-inset-top, 0px)',
          marginRight: 'env(safe-area-inset-right, 0px)',
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
          marginLeft: 'env(safe-area-inset-left, 0px)',
        },
        '.mt-safe': { marginTop: 'env(safe-area-inset-top, 0px)' },
        '.mr-safe': { marginRight: 'env(safe-area-inset-right, 0px)' },
        '.mb-safe': { marginBottom: 'env(safe-area-inset-bottom, 0px)' },
        '.ml-safe': { marginLeft: 'env(safe-area-inset-left, 0px)' },
        '.mx-safe': {
          marginLeft: 'env(safe-area-inset-left, 0px)',
          marginRight: 'env(safe-area-inset-right, 0px)',
        },
        '.my-safe': {
          marginTop: 'env(safe-area-inset-top, 0px)',
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        },
        // Bottom safe area with minimum (for buttons at bottom of screen)
        '.pb-safe-bottom': {
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)',
        },
        // Top safe area with minimum (for headers)
        '.pt-safe-top': {
          paddingTop: 'max(env(safe-area-inset-top, 0px), 0.75rem)',
        },
        // Min-height for full screen with safe areas
        '.min-h-screen-safe': {
          minHeight: 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
        },
        '.h-screen-safe': {
          height: 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
        },
      });

      // Touch Target Utilities
      // Minimum touch target sizes per Apple HIG (44pt) and Material Design (48dp)
      addUtilities({
        // Minimum touch target (44px - Apple HIG)
        '.touch-target': {
          minWidth: '44px',
          minHeight: '44px',
        },
        '.touch-target-sm': {
          minWidth: '36px',
          minHeight: '36px',
        },
        // Recommended touch target (48px - Material Design)
        '.touch-target-lg': {
          minWidth: '48px',
          minHeight: '48px',
        },
        // Square touch targets
        '.touch-44': {
          width: '44px',
          height: '44px',
          minWidth: '44px',
          minHeight: '44px',
        },
        '.touch-48': {
          width: '48px',
          height: '48px',
          minWidth: '48px',
          minHeight: '48px',
        },
      });

      // Mobile-first Component Utilities
      addComponents({
        // Bottom fixed bar (common pattern for mobile CTAs)
        '.fixed-bottom-bar': {
          position: 'fixed',
          bottom: '0',
          left: '0',
          right: '0',
          backgroundColor: theme('colors.rui.white'),
          borderTopWidth: '1px',
          borderColor: theme('colors.rui.grey-10'),
          paddingLeft: theme('spacing.rui-20'),
          paddingRight: theme('spacing.rui-20'),
          paddingTop: theme('spacing.rui-16'),
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)',
          boxShadow: '0 -4px 16px rgba(44, 36, 23, 0.08)',
        },
        // Full-bleed container (goes edge-to-edge on mobile)
        '.full-bleed': {
          width: '100vw',
          marginLeft: 'calc(-50vw + 50%)',
        },
        // Horizontal scroll container for cards
        '.scroll-x-container': {
          display: 'flex',
          overflowX: 'auto',
          overflowY: 'hidden',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',
          '-webkit-overflow-scrolling': 'touch',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          '& > *': {
            scrollSnapAlign: 'start',
            flexShrink: '0',
          },
        },
        // Prevent pull-to-refresh interference
        '.no-overscroll': {
          overscrollBehavior: 'none',
        },
        // Prevent text selection on touch
        '.no-select': {
          userSelect: 'none',
          '-webkit-user-select': 'none',
          '-webkit-touch-callout': 'none',
        },
      });
    }),
  ],
}
