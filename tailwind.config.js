/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      boxShadow: {
        glow: "0 18px 42px rgba(2, 132, 199, 0.24)",
      },
    },
  },
  plugins: [],
};
