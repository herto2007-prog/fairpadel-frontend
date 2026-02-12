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
    },
  },
  plugins: [],
}
