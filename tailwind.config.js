/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
     './views/**/*.ejs',
    './public/**/*.html'
  ],
  theme: {
    extend: {},
  },
  safelist: ['table', 'table-zebra', 'table-pin-rows', 'table-pin-cols'],
  plugins: [require('daisyui')],
}

