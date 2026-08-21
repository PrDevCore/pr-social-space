import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111318",
        paper: "#F7F7F5",
        navy: "#0B1A2A",
        /** Brand accent — deep indigo; pairs with the violet gradient end. */
        accent: "#4F46E5",
        /** Secondary gradient stop used for brand CTAs and glows. */
        accent2: "#8B5CF6",
      },
    },
  },
  plugins: [],
};

export default config;
