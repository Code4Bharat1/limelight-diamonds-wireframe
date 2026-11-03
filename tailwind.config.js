/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{js,jsx}',
    './components/**/*.{js,jsx}',
    './app/**/*.{js,jsx}',
    './lib/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f4fbea",
          100: "#e4f5cc",
          200: "#c9eb9b",
          300: "#a6dc5f",
          400: "#8be235",
          500: "#6cc414",
          600: "#4f9a06",
          700: "#3f7d07",
          800: "#33580a",
          900: "#2a470c",
          950: "#16280a",
        },
        teal: {
          50:  "#f4fbea",
          100: "#e4f5cc",
          200: "#c9eb9b",
          300: "#a6dc5f",
          400: "#8be235",
          500: "#6cc414",
          600: "#4f9a06",
          700: "#3f7d07",
          800: "#33580a",
          900: "#2a470c",
          950: "#16280a",
        },
        ink: "#373334",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '14px',
        'card-lg': '18px',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.07), 0 4px 16px 0 rgba(63,125,7,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.10), 0 8px 24px 0 rgba(63,125,7,0.10)',
        'sidebar': '4px 0 24px 0 rgba(0,0,0,0.06)',
      },
      minHeight: {
        touch: '48px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { transform: 'translateY(12px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
      },
    },
  },
  plugins: [],
};
