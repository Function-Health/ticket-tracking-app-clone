import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#0b0b0d",
        panel: "#141417",
        border: "#26262b",
        muted: "#7d7d85",
        text: "#e6e6ea",
        accent: "#5e6ad2",
      },
    },
  },
  plugins: [],
};
export default config;
