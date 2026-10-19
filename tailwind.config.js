/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#0A0A0A',
        chalk:    '#F4F4F2',
        heritage: {
          red:  '#D32B2F',
          blue: '#1E4371',
          gold: '#D4AF37',
        },
        surface:  '#141414',
      },
      fontFamily: {
        'brush':          ['"MK Balao Lettering Estudo"', '"Oswald"', 'sans-serif'],
        'sans-condensed': ['"Oswald"', 'sans-serif'],
        'sans-body':      ['"Inter"', 'sans-serif'],
      },
      borderWidth: {
        'classic': '2px',
      },
    },
  },
  plugins: [],
}
