import type { Config } from "tailwindcss";

// Design tokens — "luxury editorial" direction per the premium design brief:
// cream background, near-black ink text, and a gold accent used for primary
// actions/highlights. Existing class names (paper/ink/denim/teal/line) are
// kept so no component files needed touching — only the token values moved.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        paper: "#FAF8F4",
        "paper-dark": "#161310",
        surface: "#FFFFFF",
        ink: "#111827",
        "ink-muted": "#6B7280",
        denim: {
          DEFAULT: "#C9A86A", // gold accent
          light: "#DDC28C",
          dark: "#A8814A",
        },
        teal: {
          DEFAULT: "#16A34A", // success
          light: "#22C55E",
        },
        line: "#EAE4D8",
        "line-dark": "#3A342A",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "70ch",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;
