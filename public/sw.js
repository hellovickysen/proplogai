self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// Intentionally no response caching: PropLogAI remains online-first and does not promise offline trade data.
self.addEventListener('fetch', () => {});
