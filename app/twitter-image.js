// Re-export the OG image for Twitter cards
export { default, alt, size, contentType } from './opengraph-image';

// Next.js must statically read route-segment config from this file.
export const runtime = 'edge';
