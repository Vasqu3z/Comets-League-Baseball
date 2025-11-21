import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface: {
          DEFAULT: "var(--surface-dark)",
          light: "var(--surface-light)",
        },
        comets: {
          yellow: "var(--comets-yellow)",
          red: "var(--comets-red)",
          blue: "var(--comets-blue)",
          cyan: "var(--comets-cyan)",
          purple: "var(--comets-purple)",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "cursive"],
        body: ["var(--font-body)", "sans-serif"],
        ui: ["var(--font-ui)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      animation: {
        "spin-slow": "spin 12s linear infinite",
        "pulse-slow": "pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
export default config;