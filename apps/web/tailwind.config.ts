import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./features/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172225", paper: "#f4f0e7", parchment: "#e9e0cf", ochre: "#a96532",
        moss: "#405a55", fog: "#c8cfca", quiet: "#687574", night: "#10191b"
      },
      fontFamily: { display: ["var(--font-display)", "Georgia", "serif"], sans: ["var(--font-sans)", "Arial", "sans-serif"] },
      boxShadow: { museum: "0 18px 50px rgba(19,31,33,.12)" }
    }
  },
  plugins: [],
};
export default config;
