import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-primary)",
        surface: "var(--bg-surface)",
        foreground: "var(--text-primary)",
        muted: "var(--text-secondary)",
        border: "var(--border-soft)",
        
        // Mode accents
        academic: {
          DEFAULT: "#B69CFF",
          soft: "#EDE5FF",
          deep: "#7C5CFA",
        },
        finance: {
          DEFAULT: "#7FE3C0",
          soft: "#E0FBF2",
          deep: "#37B98F",
        },
        
        // Dynamic active mode tokens (changes with mode)
        accent: {
          DEFAULT: "var(--accent-current)",
          soft: "var(--accent-current-soft)",
          deep: "var(--accent-current-deep)",
        },

        // Status
        status: {
          urgent: "#FF7A85",
          warning: "#FFC978",
          success: "#7FE3C0",
          info: "#8EC8FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "16px",
        xl: "20px",
        "2xl": "24px",
      },
      boxShadow: {
        soft: "0 2px 12px rgba(0, 0, 0, 0.04)",
        card: "0 4px 20px rgba(0, 0, 0, 0.06)",
        float: "0 8px 30px rgba(0, 0, 0, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
