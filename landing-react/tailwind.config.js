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
        // Premium Brand Colors
        brand: {
          primary: '#0066FF',
          'primary-dark': '#0052CC',
          'primary-light': '#3384FF',
        },
        // Refined Agent Colors (Muted & Sophisticated)
        adventure: {
          base: '#059669',
          light: '#10B981',
          dark: '#047857',
        },
        culture: {
          base: '#7C3AED',
          light: '#8B5CF6',
          dark: '#6D28D9',
        },
        food: {
          base: '#EA580C',
          light: '#F97316',
          dark: '#DC2626',
        },
        'hidden-gems': {
          base: '#0891B2',
          light: '#06B6D4',
          dark: '#0E7490',
        },
        // Semantic Colors
        success: '#00D924',
        warning: '#FFB800',
        error: '#FF3B3B',
        info: '#0066FF',
      },
      fontFamily: {
        display: ['Inter Display', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'base': ['1rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'md': ['1.125rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'lg': ['1.333rem', { lineHeight: '1.3', letterSpacing: '0' }],
        'xl': ['1.777rem', { lineHeight: '1.3', letterSpacing: '-0.025em' }],
        '2xl': ['2.369rem', { lineHeight: '1.2', letterSpacing: '-0.025em' }],
        '3xl': ['3.157rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
        '4xl': ['4.209rem', { lineHeight: '1.1', letterSpacing: '-0.03em' }],
      },
      letterSpacing: {
        tighter: '-0.03em',
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
        wider: '0.05em',
        widest: '0.1em',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'sm': '0 2px 4px 0 rgba(0, 0, 0, 0.04)',
        'md': '0 4px 8px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 8px 16px -2px rgba(0, 0, 0, 0.08)',
        'xl': '0 16px 32px -4px rgba(0, 0, 0, 0.10)',
        '2xl': '0 24px 48px -8px rgba(0, 0, 0, 0.12)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'primary': '0 4px 16px -2px rgba(0, 102, 255, 0.2)',
        'success': '0 4px 16px -2px rgba(0, 217, 36, 0.2)',
        'error': '0 4px 16px -2px rgba(255, 59, 59, 0.2)',
      },
      borderRadius: {
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
        'full': '9999px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradientShift 15s ease infinite',
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
            transform: 'scale(0.9)',
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
        gradientShift: {
          '0%, 100%': {
            backgroundPosition: '0% 50%',
          },
          '50%': {
            backgroundPosition: '100% 50%',
          },
        },
      },
      transitionTimingFunction: {
        'bounce-in': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-soft': 'cubic-bezier(0.43, 0.09, 0.38, 1.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
