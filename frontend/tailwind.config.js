/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // פלטה כהה, נקייה, בסגנון Perplexity/v0
        canvas: "#0E0F11",       // רקע ראשי
        surface: "#17181B",      // כרטיסים / סרגל צד
        "surface-2": "#1F2023",  // hover / כרטיסים משניים
        border: "#2A2B2F",
        accent: "#3FE0C5",       // טורקיז עדין - CTA וסטטוסים
        "accent-dim": "#2A9D8F",
        text: {
          primary: "#F2F3F5",
          secondary: "#9B9DA3",
          muted: "#5F6167",
        },
      },
      fontFamily: {
        sans: ["Inter", "Assistant", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        panel: "0 4px 24px rgba(0,0,0,0.35)",
      },
    },
  },
  plugins: [],
};
