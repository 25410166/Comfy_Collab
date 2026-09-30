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
        brand: {
          50: '#F0F6FF',
          100: '#E0EDFF',
          200: '#BFD7FE',
          300: '#93B8FE',
          400: '#4D8BFF',
          500: '#0D5CFF', // Trend 2027 Electric Cobalt Azure
          600: '#0048E0',
          700: '#0035B3',
          800: '#002585',
          900: '#071642',
          950: '#030B24',
        },
        electric: '#0D5CFF',
        cyber: '#00F0FF',
        dark: {
          950: '#050811', // Deep space obsidian base
          900: '#0B1120', // Translucent subsurface navy
          850: '#0F172A', // Glass panel
          800: '#131D31', // Active item
          700: '#1E293B', // Subtle border
          600: '#334155'
        }
      },
      boxShadow: {
        'glow-electric': '0 0 24px -2px rgba(13, 92, 255, 0.45)',
        'glow-cyan': '0 0 18px -2px rgba(0, 240, 255, 0.35)',
        'glow-pill': '0 0 10px rgba(13, 92, 255, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      }
    },
  },
  plugins: [],
}
