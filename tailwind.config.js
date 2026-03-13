/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './portfolio/index.html',
    './film/index.html',
    './kontakt/index.html',
    './portraits/index.html',
    './portraits/wedding/index.html',
    './portraits/event/index.html',
    './portraits/stationary/index.html',
    './App.tsx',
    './index.tsx',
    './components/**/*.{ts,tsx}',
    './pages/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          paper: '#F3F2ED',
          black: '#1A1A1A',
          gray: '#8C8C8C',
          lightGray: '#E5E5E5',
        },
      },
      fontFamily: {
        serif: ['"podium-sharp-variable"', 'Playfair Display', '"podium-sharp"', '"Podium Sharp"', 'serif'],
        playfair: ['Playfair Display', 'serif'],
        sans: ['DM Sans', 'sans-serif'],
      },
      backgroundImage: {
        noise: "url('https://grainy-gradients.vercel.app/noise.svg')",
      },
      animation: {
        marquee: 'marquee 60s linear infinite',
        'fade-in': 'fadeIn 1s ease-out forwards',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
