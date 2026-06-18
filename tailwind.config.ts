import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0F1117",
        surface: "#1A1D27",
        border: "#2A2D3A",
        primary: "#6366F1",
        meta: "#1877F2",
        google: "#EA4335",
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
        "text-primary": "#F9FAFB",
        "text-secondary": "#9CA3AF",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;