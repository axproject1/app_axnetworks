/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        darkBg: {
          DEFAULT: '#0a0b0e',
          card: '#12151c',
          cardElevated: '#181d27',
          border: '#232936',
          muted: '#8b949e',
        },
        darkCard: '#12151c',
        axBlue: '#0284c7',
        axBlueHover: '#0369a1',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"Space Grotesk"', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'elevated': '0 10px 30px -4px rgba(0, 0, 0, 0.08)',
        'card': '0 2px 12px -2px rgba(0, 0, 0, 0.06)',
        'glow-cyan': '0 0 25px -5px rgba(14, 165, 233, 0.35)',
      }
    },
  },
  plugins: [],
}
