export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "var(--brand-primary)",
          hover: "var(--brand-hover)",
          secondary: "var(--brand-secondary)",
          accent: "var(--brand-accent)",
        },
        danger: "var(--danger)",
        surface: {
          DEFAULT: "var(--surface)",
          2: "var(--surface-2)",
          card: "var(--card)",
        },
        border: "var(--border)",
        text: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
    },
  },
  plugins: [],
};
