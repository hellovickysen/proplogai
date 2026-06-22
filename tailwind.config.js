/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07070b',
        ink2: '#0b0b14',
        violet: { brand: '#8b5cf6' },
        cyan: { brand: '#22d3ee' },
        mint: '#34d399',
        loss: '#f87171',
        amber: { brand: '#fbbf24' },
      },
      fontFamily: {
        display: ['var(--font-space)', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
