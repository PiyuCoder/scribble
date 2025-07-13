/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#38BDF8",
        accent: "#FACC15",
        background: "#F8FAFC",
        textMain: "#1F2937",
        textAccent: "#8B5CF6",
        error: "#F87171",
      },
    },
  },
  plugins: [],
};
