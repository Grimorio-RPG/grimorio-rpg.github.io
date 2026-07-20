/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        parchment: {
          50: '#faf6ec',
          100: '#f3ead2',
          200: '#e7d5a8',
        },
        ink: {
          900: '#1a1712',
          800: '#26221a',
          700: '#3a3428',
        },
        dragon: {
          50: '#fbeceb',
          100: '#f6d3d0',
          400: '#c8514b',
          500: '#a3312b',
          600: '#7f2621',
          700: '#5e1c18',
        },
        arcane: {
          400: '#8b7cc4',
          500: '#6a5aa8',
          600: '#4f4285',
        },
      },
      fontFamily: {
        display: ['"Cinzel"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
