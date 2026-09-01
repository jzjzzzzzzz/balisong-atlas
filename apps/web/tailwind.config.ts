import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#151513", paper: "#f3f0e9", parchment: "#e7e1d6", ochre: "#9e2d26",
        redline: "#9e2d26", moss: "#455e52", fog: "#cac8c0", quiet: "#62615b", night: "#10100f"
      },
      fontFamily: { display: ["var(--font-display)", "Georgia", "serif"], sans: ["var(--font-sans)", "Arial", "sans-serif"] },
      boxShadow: { museum: "0 16px 34px rgba(21,21,19,.10)" }
    }
  },
  plugins: [],
};
export default config;
