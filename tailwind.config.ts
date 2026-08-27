import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        orange: {
          DEFAULT: "#EE4D2D",
          dark: "#D6421B",
          light: "#FFF0ED",
          lighter: "#FFF8F6",
        },
        ink: "#222222",
        "ink-soft": "#757575",
        line: "#EAEAEA",
      },
      borderRadius: {
        md: "10px",
      },
    },
  },
  plugins: [],
};
export default config;
