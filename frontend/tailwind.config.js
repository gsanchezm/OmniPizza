/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pizza: {
          red: '#D32F2F',
          orange: '#FF6F00',
          yellow: '#FBC02D',
          green: '#388E3C'
        }
      }
    },
  },
  plugins: [],
}
