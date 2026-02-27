/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Dark con acentos rojos - inspirada en Daphne Dark UI Kit
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#e63946',
          600: '#dc2626',
          700: '#c1121f',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        dark: {
          bg: '#0f0f13',
          card: '#1a1a24',
          surface: '#252532',
          border: '#2d2d3d',
          hover: '#32324a',
          input: '#1e1e2e',
        },
        light: {
          text: '#f1f1f1',
          secondary: '#a0a0b0',
          muted: '#6b6b7b',
        },
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'count-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(230, 57, 70, 0.4)' },
          '50%': { boxShadow: '0 0 20px 4px rgba(230, 57, 70, 0.2)' },
        },
        'podium-rise': {
          '0%': { opacity: '0', transform: 'translateY(40px) scale(0.9)' },
          '60%': { opacity: '1', transform: 'translateY(-8px) scale(1.02)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.85)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 15px 0 rgba(251, 191, 36, 0.3)' },
          '50%': { boxShadow: '0 0 30px 8px rgba(251, 191, 36, 0.15)' },
        },
        'slide-left': {
          '0%': { opacity: '0', transform: 'translateX(-30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'slide-right': {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out forwards',
        'fade-up-delay-1': 'fade-up 0.5s ease-out 0.1s forwards',
        'fade-up-delay-2': 'fade-up 0.5s ease-out 0.2s forwards',
        'fade-up-delay-3': 'fade-up 0.5s ease-out 0.3s forwards',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'gradient-shift': 'gradient-shift 6s ease infinite',
        'count-up': 'count-up 0.6s ease-out forwards',
        'slide-in': 'slide-in 0.3s ease-out',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'podium-rise': 'podium-rise 0.7s ease-out forwards',
        'podium-rise-delay-1': 'podium-rise 0.7s ease-out 0.15s forwards',
        'podium-rise-delay-2': 'podium-rise 0.7s ease-out 0.3s forwards',
        'float': 'float 3s ease-in-out infinite',
        'float-delay-1': 'float 3s ease-in-out 0.5s infinite',
        'float-delay-2': 'float 3s ease-in-out 1s infinite',
        'scale-in': 'scale-in 0.5s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
        'glow-pulse': 'glow-pulse 2.5s ease-in-out infinite',
        'slide-left': 'slide-left 0.6s ease-out forwards',
        'slide-right': 'slide-right 0.6s ease-out forwards',
      },
    },
  },
  plugins: [],
}
