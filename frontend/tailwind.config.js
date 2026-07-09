/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./*.jsx",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        yt: {
          primary: 'var(--yt-primary)',
          secondary: 'var(--yt-secondary)',
          surface: 'var(--yt-surface)',
          card: 'var(--yt-card)',
          border: 'var(--yt-border)',
        },
        tw: {
          primary: 'var(--tw-primary)',
          secondary: 'var(--tw-secondary)',
          surface: 'var(--tw-surface)',
          card: 'var(--tw-card)',
          border: 'var(--tw-border)',
          green: 'var(--tw-green)',
          pink: 'var(--tw-pink)',
        },
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
}