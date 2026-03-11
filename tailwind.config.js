/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0a0a0f',
          secondary: '#12121a',
          tertiary: '#1a1a24',
        },
        accent: {
          DEFAULT: '#00d4ff',
          secondary: '#0099cc',
        },
        text: {
          DEFAULT: '#e8e8f0',
          secondary: '#8a8a9a',
        },
        border: '#2a2a38',
        success: '#00ff88',
        warning: '#ffaa00',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
