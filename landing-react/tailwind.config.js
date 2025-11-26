/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Revolut Design System Colors
        rui: {
          black: '#191C1F',
          foreground: '#191C1F',
          'grey-50': '#717173',
          'grey-20': '#C9C9CD',
          'grey-10': '#E2E2E7',
          'grey-8': '#EBEBF0',
          'grey-5': '#F1F2F4',
          'grey-2': '#F7F7F7',
          white: '#FFFFFF',
          accent: '#4F55F1',
          'accent-light': '#EDEEFD',
        },
        // Semantic Colors
        success: '#00B88B',
        warning: '#EC7E00',
        danger: '#E23B4A',
        info: '#0666EB',
        // Agent Colors (kept for app functionality)
        adventure: {
          base: '#09BE67',
          light: '#E5F7F3',
          dark: '#067F44',
        },
        culture: {
          base: '#805CF5',
          light: '#F4EBFD',
          dark: '#6262D3',
        },
        food: {
          base: '#EE7A40',
          light: '#FDF2E5',
          dark: '#CA4F12',
        },
        'hidden-gems': {
          base: '#00BE90',
          light: '#E5F7F3',
          dark: '#00A87E',
        },
      },
      fontFamily: {
        // Revolut uses Aeonik Pro for marketing, Inter for UI
        marketing: ['Aeonik Pro', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        // Revolut Marketing Typography
        'display-1': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: '900' }],
        'display-2': ['2.5rem', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: '900' }],
        'display-3': ['2rem', { lineHeight: '1', letterSpacing: '-0.01em', fontWeight: '900' }],
        // Revolut UI Typography
        'heading-1': ['2rem', { lineHeight: '1.1875', letterSpacing: '-0.011em', fontWeight: '700' }],
        'heading-2': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.013em', fontWeight: '700' }],
        'heading-3': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.014em', fontWeight: '700' }],
        'emphasis-1': ['1rem', { lineHeight: '1.375', letterSpacing: '-0.011em', fontWeight: '500' }],
        'emphasis-2': ['0.875rem', { lineHeight: '1.43', letterSpacing: '-0.007em', fontWeight: '500' }],
        'emphasis-3': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '500' }],
        'body-1': ['1rem', { lineHeight: '1.375', letterSpacing: '-0.011em', fontWeight: '400' }],
        'body-2': ['0.875rem', { lineHeight: '1.43', letterSpacing: '-0.007em', fontWeight: '400' }],
        'body-3': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0', fontWeight: '400' }],
        // Legacy sizes for compatibility
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'sm': ['0.875rem', { lineHeight: '1.43', letterSpacing: '-0.007em' }],
        'base': ['1rem', { lineHeight: '1.375', letterSpacing: '-0.011em' }],
        'lg': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.014em' }],
        'xl': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.013em' }],
        '2xl': ['2rem', { lineHeight: '1.1875', letterSpacing: '-0.011em' }],
        '3xl': ['2.5rem', { lineHeight: '1', letterSpacing: '-0.01em' }],
        '4xl': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.01em' }],
        '5xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.01em' }],
      },
      spacing: {
        // Revolut Spacing Scale
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
        'rui-72': '4.5rem',
      },
      boxShadow: {
        // Revolut Shadow System
        'rui-1': '0 0.125rem 0.1875rem rgba(25, 28, 31, 0.05)',
        'rui-2': '0 0.1875rem 0.5rem rgba(25, 28, 31, 0.1)',
        'rui-3': '0 0.1875rem 1.875rem rgba(25, 28, 31, 0.08)',
        'rui-4': '0 1rem 4rem rgba(25, 28, 31, 0.12)',
        'rui-side': '0 0.125rem 0.25rem rgba(25, 28, 31, 0.05), 0 0.1875rem 1rem rgba(25, 28, 31, 0.1)',
        // Legacy shadows
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'sm': '0 2px 4px 0 rgba(0, 0, 0, 0.04)',
        'md': '0 4px 8px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 8px 16px -2px rgba(0, 0, 0, 0.08)',
        'xl': '0 16px 32px -4px rgba(0, 0, 0, 0.10)',
        '2xl': '0 24px 48px -8px rgba(0, 0, 0, 0.12)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'accent': '0 4px 16px -2px rgba(79, 85, 241, 0.25)',
      },
      borderRadius: {
        // Revolut Radius System
        'rui-2': '0.125rem',
        'rui-4': '0.25rem',
        'rui-6': '0.375rem',
        'rui-8': '0.5rem',
        'rui-12': '0.75rem',
        'rui-16': '1rem',
        'rui-24': '1.5rem',
        'rui-32': '2rem',
        // Legacy radii
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      transitionDuration: {
        // Revolut Duration System
        'rui-xs': '100ms',
        'rui-sm': '200ms',
        'rui-md': '300ms',
        'rui-lg': '450ms',
        'rui-xl': '900ms',
      },
      transitionTimingFunction: {
        // Revolut Easing System - THE KEY TO SMOOTH ANIMATIONS
        'rui-default': 'cubic-bezier(0.15, 0.5, 0.5, 1)',
        'rui-shadow': 'cubic-bezier(0.4, 0.3, 0.8, 0.6)',
        'rui-toast': 'cubic-bezier(0.175, 0.885, 0.21, 1.65)',
        'rui-parallax': 'cubic-bezier(0.35, 0, 0, 1)',
        // Legacy easings
        'smooth': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s var(--ease-rui-default)',
        'slide-up': 'slideUp 0.3s var(--ease-rui-default)',
        'scale-in': 'scaleIn 0.3s var(--ease-rui-default)',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'state-layer': 'stateLayer 0.2s var(--ease-rui-default)',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        scaleIn: {
          'from': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
        shimmer: {
          'from': {
            backgroundPosition: '-200% center',
          },
          'to': {
            backgroundPosition: '200% center',
          },
        },
        float: {
          '0%, 100%': {
            transform: 'translateY(0)',
          },
          '50%': {
            transform: 'translateY(-10px)',
          },
        },
        stateLayer: {
          'from': {
            opacity: '0',
            transform: 'scale(0.8)',
          },
          'to': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
