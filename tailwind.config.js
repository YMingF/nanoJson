/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-', //Use to avoid conflicts with styles from other UI libraries, so in html you need to use tw-flex-grow.
  important: true,
  mode: 'jit', // jit mode generates your CSS on-demand instead of generating everything in advance.
  content: ['./src/**/*.html'],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false, // disable the default tailwind css
  },
};
