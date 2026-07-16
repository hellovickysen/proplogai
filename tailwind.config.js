/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}', './lib/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: { ink: '#07070b', ink2: '#0b0b14', mint: '#34d399', loss: '#f87171' },
      fontFamily: {
        display: ['var(--font-poppins)', 'sans-serif'],
        sans: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        body: ['var(--font-poppins)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
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
