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
        // RDTrip "Wanderlust Editorial" Color System
        rui: {
          black: '#2C2417',
          foreground: '#2C2417',
          'grey-50': '#8B7355',
          'grey-20': '#C4B8A5',
          'grey-10': '#E5DDD0',
          'grey-8': '#EDE6DB',
          'grey-5': '#F5F0E8',
          'grey-2': '#FAF7F2',
          white: '#FFFBF5',
          accent: '#C45830',
          'accent-light': '#FEF3EE',
          secondary: '#4A90A4',
          'secondary-light': '#E8F4F7',
        },
        // Semantic Colors - Earthy tones
        success: '#4A7C59',
        warning: '#D4A853',
        danger: '#B54A4A',
        info: '#4A6FA5',
        // Agent Colors - Warmer variants
        adventure: {
          base: '#4A7C59',
          light: '#EEF5F0',
          dark: '#3A6247',
        },
        culture: {
          base: '#8B6914',
          light: '#FBF6E8',
          dark: '#6B5210',
        },
        food: {
          base: '#B54A4A',
          light: '#FCEAEA',
          dark: '#8B3A3A',
        },
        'hidden-gems': {
          base: '#4A90A4',
          light: '#E8F4F7',
          dark: '#3A7284',
        },
      },
      fontFamily: {
        // Editorial Typography - Distinctive character
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
        // Legacy sizes
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0' }],
        'sm': ['0.875rem', { lineHeight: '1.5', letterSpacing: '-0.005em' }],
        'base': ['1rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        'lg': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],
        'xl': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.015em' }],
        '2xl': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.015em' }],
        '3xl': ['2.5rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        '4xl': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        '5xl': ['4rem', { lineHeight: '1.05', letterSpacing: '-0.02em' }],
      },
      spacing: {
        // Spacing Scale
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
        // Warm-tinted Shadow System
        'rui-1': '0 0.125rem 0.25rem rgba(44, 36, 23, 0.06)',
        'rui-2': '0 0.25rem 0.75rem rgba(44, 36, 23, 0.08)',
        'rui-3': '0 0.5rem 2rem rgba(44, 36, 23, 0.1)',
        'rui-4': '0 1.5rem 4rem rgba(44, 36, 23, 0.14)',
        'rui-side': '0 0.125rem 0.25rem rgba(44, 36, 23, 0.05), 0 0.25rem 1rem rgba(44, 36, 23, 0.08)',
        // Accent shadow
        'accent': '0 0.5rem 2rem rgba(196, 88, 48, 0.25)',
        'accent-sm': '0 0.25rem 1rem rgba(196, 88, 48, 0.2)',
        // Legacy shadows
        'xs': '0 1px 2px 0 rgba(44, 36, 23, 0.04)',
        'sm': '0 2px 4px 0 rgba(44, 36, 23, 0.05)',
        'md': '0 4px 8px -1px rgba(44, 36, 23, 0.06)',
        'lg': '0 8px 16px -2px rgba(44, 36, 23, 0.08)',
        'xl': '0 16px 32px -4px rgba(44, 36, 23, 0.10)',
        '2xl': '0 24px 48px -8px rgba(44, 36, 23, 0.12)',
        'inner': 'inset 0 2px 4px 0 rgba(44, 36, 23, 0.06)',
      },
      borderRadius: {
        // Radius System
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
        'rui-parallax': 'cubic-bezier(0.35, 0, 0, 1)',
        'smooth': 'cubic-bezier(0.23, 1, 0.32, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s var(--ease-rui-default)',
        'slide-up': 'slideUp 0.4s var(--ease-rui-default)',
        'scale-in': 'scaleIn 0.3s var(--ease-rui-default)',
        'shimmer': 'shimmer 2s ease-in-out infinite',
        'pulse-soft': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'ken-burns': 'kenBurns 20s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideUp: {
          'from': {
            opacity: '0',
            transform: 'translateY(24px)',
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        scaleIn: {
          'from': {
            opacity: '0',
            transform: 'scale(0.96)',
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
            transform: 'translateY(-12px)',
          },
        },
        kenBurns: {
          '0%': {
            transform: 'scale(1) translate(0, 0)',
          },
          '100%': {
            transform: 'scale(1.1) translate(-2%, -2%)',
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
