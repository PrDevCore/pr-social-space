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
        accent: "#3F5BFF",
      },
    },
  },
  plugins: [],
};

export default config;
