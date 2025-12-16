/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta UPDS - Azul institucional #02193F
        primary: {
          50: '#e6eaf0',
          100: '#c0c9d9',
          200: '#96a5c0',
          300: '#6c81a7',
          400: '#4d6694',
          500: '#2d4b81',
          600: '#284479',
          700: '#223b6e',
          800: '#1c3264',
          900: '#02193F',  // Color UPDS principal
        },
        // Azul celeste UPDS (para acentos)
        accent: {
          50: '#e0f7ff',
          100: '#b3ecff',
          200: '#80e0ff',
          300: '#4dd4ff',
          400: '#26caff',
          500: '#00AEEF',  // Cyan UPDS
          600: '#009fd9',
          700: '#008cc0',
          800: '#0079a7',
          900: '#00587a',
        },
      },
    },
  },
  plugins: [],
}
