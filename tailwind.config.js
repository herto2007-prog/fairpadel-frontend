/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // FairPadel Brand Colors - Paleta Mokoto
        primary: {
          DEFAULT: '#df2531',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#df2531',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        // Dark theme colors
        dark: {
          950: '#0B0E14', // Main background
          900: '#151921', // Card background
          850: '#1C2130', // Elevated cards
          800: '#232838', // Borders
          700: '#2A3142', // Hover states
          600: '#3D4659', // Disabled
          500: '#6B7280', // Muted text
          400: '#9CA3AF', // Secondary text
          300: '#D1D5DB', // Primary text
          200: '#E5E7EB',
          100: '#F3F4F6',
          50: '#F9FAFB',
        },
        // Surface colors
        surface: {
          DEFAULT: '#151921',
          elevated: '#1C2130',
          overlay: 'rgba(11, 14, 20, 0.8)',
        },
      },
      fontFamily: {
        sans: ['Open Sans', 'system-ui', 'sans-serif'],
        display: ['Mokoto', 'Open Sans', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-dark': 'linear-gradient(180deg, #0B0E14 0%, #151921 100%)',
      },
    },
  },
  plugins: [],
};
