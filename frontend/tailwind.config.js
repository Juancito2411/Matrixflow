/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F8FAFC',
        sidebar: '#0F172A',
        primary: {
          DEFAULT: '#2563EB',
          hover: '#1D4ED8',
        },
        accent: '#06B6D4',
        textMain: '#0F172A',
        textMuted: '#64748B',
      },
    },
  },
  plugins: [],
}