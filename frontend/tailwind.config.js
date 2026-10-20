/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cesfam: {
          green: '#10b981',
          dark: '#0f172a',
          blue: '#0284c7',
        }
      }
    },
  },
  plugins: [],
}