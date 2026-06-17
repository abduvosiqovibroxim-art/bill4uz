import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Bill4you color palette
        bg: "#0a0f14",
        surface: "#1a1f24",
        soft: "#2d3338",
        gold: "#d5b36a",
        emerald: "#22c55e",
        muted: "#9ca3af",
        billuz: {
          dark: "#0a0f14",
          card: "#1a1f24",
          green: "#00ff88",
          "green-alt": "#22c55e",
          border: "#2d3338",
          muted: "#9ca3af",
        }
      },
      borderRadius: {
        billuz: "12px",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(0, 255, 136, 0.2), 0 20px 50px rgba(0,0,0,.4)",
        panel: "0 16px 40px rgba(0, 0, 0, 0.4)",
        soft: "0 8px 22px rgba(0, 0, 0, 0.3)"
      }
    }
  },
  plugins: []
};

export default config;
