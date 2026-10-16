/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        festive: {
          950: '#0c071e', // Deep royal night background
          900: '#140c31', // Rich card background
          850: '#1a103e',
          800: '#261655', // Border and elevated surfaces
          700: '#3c247d',
          500: '#8b5cf6', // Bright purple accent
          400: '#a78bfa',
          gold: '#f59e0b', // Festive Indian gold
          'gold-light': '#fbbf24',
          'gold-dark': '#d97706',
        },
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.85)' },
          '50%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1)' },
        },
        glow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      animation: {
        pop: 'pop 0.25s ease-out forwards',
        glow: 'glow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
