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
        theme: {
          bg: 'var(--bg-dark)',
          navy: 'var(--bg-navy)',
          surface: 'var(--bg-surface)',
          'surface-active': 'var(--bg-surface-active)',
          purple: 'var(--accent-purple)',
          'purple-hover': 'var(--accent-purple-hover)',
          lavender: 'var(--light-lavender)',
          gray: 'var(--muted-gray)',
          secondary: 'var(--text-secondary)',
        }
      }
    },
  },
  plugins: [],
}