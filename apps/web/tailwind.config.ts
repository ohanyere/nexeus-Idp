import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        heading: ["var(--font-space-grotesk)", "Space Grotesk", "system-ui", "sans-serif"]
      },
      colors: {
        ink: "#111827",
        muted: "#64748b",
        canvas: "#f6f8fa",
        line: "#d0d7de",
        brand: "#0969da",
        success: "#15803d",
        warning: "#b45309",
        danger: "#b91c1c",
        sidebar: "#0d1117",
        "sidebar-soft": "#161b22"
      },
      boxShadow: {
        panel: "0 1px 2px rgba(27, 31, 36, 0.06)",
        card: "0 8px 18px rgba(27, 31, 36, 0.08)"
      }
    }
  },
  plugins: []
};

export default config;
