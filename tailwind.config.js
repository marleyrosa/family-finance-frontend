/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./dashboard/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#091018",
        card: "#121b26",
        accent: "#2dd4bf",
        warm: "#f59e0b",
        ok: "#22c55e",
        danger: "#ef4444",
        text: "#e6eef8",
      },
      borderRadius: {
        fintech: "1.25rem",
      },
      boxShadow: {
        soft: "0 12px 24px rgba(0,0,0,0.22)",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Manrope", "sans-serif"],
      },
      backgroundImage: {
        halo: "radial-gradient(circle at 15% 20%, rgba(45,212,191,0.25), transparent 38%), radial-gradient(circle at 80% 15%, rgba(245,158,11,0.2), transparent 35%), linear-gradient(145deg, #070c12 10%, #0e1722 60%, #121b26 100%)",
      },
    },
  },
  plugins: [],
};
