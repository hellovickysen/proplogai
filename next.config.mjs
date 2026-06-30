/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', '@supabase/ssr'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'irdlflbcugzmxazeuyod.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://us.i.posthog.com https://*.posthog.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in https://openrouter.ai https://us.i.posthog.com https://*.posthog.com",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
export default nextConfig;
