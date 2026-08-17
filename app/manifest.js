export default function manifest() {
  return {
    name: 'PropLogAI',
    short_name: 'PropLogAI',
    description: 'Personal trading discipline system for prop firm traders.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#07070b',
    theme_color: '#07070b',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };
}
