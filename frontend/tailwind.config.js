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
          primary: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
          accent: "var(--brand-accent)",
        },
        surface: {
          DEFAULT: "var(--surface)",
          card: "var(--card)",
        },
        text: {
          DEFAULT: "var(--text)",
        },
      }
    },
  },
  plugins: [],
}
