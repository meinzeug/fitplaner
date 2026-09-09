/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
        },
        netto: {
          yellow: '#FFDD00',
          red: '#D50000',
          dark: '#1C1917',
        },
        np: {
          red: '#E10915',
          dark: '#1E293B',
          blue: '#0F172A',
        }
      }
    },
  },
  plugins: [],
}
