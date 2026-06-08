/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0F172A', // dark navy (page background)
        surface: '#1E293B', // lighter dark (cards/surfaces)
        ink: '#E2E8F0', // light slate (primary text)
        accent: '#6366F1', // modern indigo (blue/purple accent)
      },
    },
  },
  plugins: [],
};
