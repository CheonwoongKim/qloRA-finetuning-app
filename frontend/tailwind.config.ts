import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#E5EAFF",
          100: "#BCC8FF",
          200: "#99AAFF",
          300: "#668CFF",
          400: "#3366FF",
          500: "#0033FF",
          600: "#002EE6",
          700: "#0024B3",
          800: "#001C8A",
          900: "#001569",
          DEFAULT: "#0033FF",
          foreground: "#FFFFFF",
        },
        neutral: {
          50: "#F5F5F5",
          100: "#E5E5E5",
          200: "#D0D5D2",
          300: "#CCCCCC",
          400: "#999999",
          500: "#666666",
          600: "#333333",
          700: "#212121",
          800: "#1A1A1A",
          900: "#0D0D0D",
        },
        success: "#008000",
        info: "#1863DC",
        background: "#FFFFFF",
        foreground: "#000000",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#000000",
        },
        border: "#E5EAFF",
        input: "#E5EAFF",
        ring: "#0033FF",
      },
      fontFamily: {
        sans: [
          "Pretendard",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "Monaco",
          "Inconsolata",
          "Fira Code",
          "monospace",
        ],
      },
      fontSize: {
        xs: "12px",       // 작은 텍스트
        sm: "13px",       // 버튼, 메뉴
        base: "14px",     // 기본 텍스트
        lg: "16px",
        xl: "18px",
        "2xl": "20px",
        "3xl": "24px",
        "4xl": "30px",
        "5xl": "36px",
        "6xl": "48px",
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "6px",
        md: "8px",
        lg: "12px",
        xl: "20px",
        "2xl": "24px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "2xl": "0 32px 68px 0 rgba(0, 0, 0, 0.3)",
        border: "0 0 0 1px rgba(229, 234, 255, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
