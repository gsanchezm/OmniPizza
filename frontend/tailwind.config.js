export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#FF5722", // Vibrant Orange
          hover: "#E64A19",
          secondary: "#FF8A65",
          accent: "#FFCCBC",
        },
        surface: {
          DEFAULT: "#0F0F0F", // Deep Dark
          2: "#1F1F1F", // Input/Card BG
          card: "rgba(30, 30, 30, 0.6)", // Glassy
        },
        border: "#2A2A2A",
        text: {
          DEFAULT: "#FFFFFF",
          muted: "#9CA3AF",
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "sans-serif"],
      },
    },
  },
  plugins: [],
};
