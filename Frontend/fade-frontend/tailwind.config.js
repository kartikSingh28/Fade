export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        fade: {
          bg: "#0A0A0B",
          surface: "#111113",
          border: "#1C1C1F",
          text: "#EDEDED",
          muted: "#A1A1AA",
          hint: "#6B7280",
          accent: "#7C7F87",
          accentGlow: "#9FA3AA",
          danger: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        fade: "0 0 0 1px rgba(255,255,255,0.04)",
        soft: "0 8px 30px rgba(0,0,0,0.6)",
      },
      animation: {
        fadein: "fadeIn 200ms ease-out",
        fadeout: "fadeOut 200ms ease-in",
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeOut: { from: { opacity: 1 }, to: { opacity: 0 } },
      },
    },
  },
  plugins: [],
};
