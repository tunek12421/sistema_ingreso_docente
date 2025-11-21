/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e7f3ff',
          100: '#cfe7ff',
          500: '#007bff',
          600: '#0056b3',
          700: '#004085',
        },
        success: {
          500: '#28a745',
          600: '#218838',
        },
        danger: {
          500: '#dc3545',
          600: '#c82333',
        },
      },
    },
  },
  plugins: [],
}
