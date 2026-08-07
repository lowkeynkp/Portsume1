/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FFF8EF",
        ivory: "#FAF4EB",
        blush: "#F8CCD6",
        peach: "#FFD6C2",
        powder: "#B9E4F4",
        sky: "#8ED8F8",
        butter: "#FFE37A",
        sage: "#BFD8B8",
        forest: "#157A43",
        lavender: "#D7C7F4",
        coral: "#F68D7A",
        navy: "#24305E",
        paper: "#FFFFFF",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
        hand: ["Caveat", "cursive"],
      },
      borderRadius: {
        blob: "42% 58% 63% 37% / 45% 45% 55% 55%",
        pill: "999px",
      },
      boxShadow: {
        soft: "0 12px 40px -12px rgba(36, 48, 94, 0.18)",
        lift: "0 24px 60px -20px rgba(36, 48, 94, 0.28)",
        sticker: "0 6px 16px -6px rgba(36, 48, 94, 0.25)",
      },
      keyframes: {
        floaty: {
          "0%, 100%": { transform: "translateY(0) rotate(var(--tilt, 0deg))" },
          "50%": { transform: "translateY(-12px) rotate(var(--tilt, 0deg))" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        floaty: "floaty 6s ease-in-out infinite",
        wiggle: "wiggle 4s ease-in-out infinite",
        marquee: "marquee 30s linear infinite",
      },
    },
  },
  plugins: [],
};
