/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: { ink: '#07070b', ink2: '#0b0b14', mint: '#34d399', loss: '#f87171' },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        sans: ['Poppins', 'system-ui', 'sans-serif'],
        body: ['Poppins', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      fontSize: {
        xs: ['0.8125rem', { lineHeight: '1.25rem' }],   // 13px (was 12px)
        sm: ['0.9375rem', { lineHeight: '1.375rem' }],   // 15px (was 14px)
        base: ['1rem', { lineHeight: '1.5rem' }],         // 16px
      },
    },
  },
  plugins: [],
};
