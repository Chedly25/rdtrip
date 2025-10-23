/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        adventure: {
          primary: '#1a5f3a',
          secondary: '#2d7a4f',
        },
        culture: {
          primary: '#1e3a8a',
          secondary: '#2563eb',
        },
        food: {
          primary: '#dc2626',
          secondary: '#f97316',
        },
        'hidden-gems': {
          primary: '#9333ea',
          secondary: '#ec4899',
        },
      },
      animation: {
        'gradient': 'gradient 8s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center',
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center',
          },
        },
      },
    },
  },
  plugins: [],
}
