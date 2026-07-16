'use client';

import dynamic from 'next/dynamic';

const LandingMotion = dynamic(
  () => import('./LandingMotion').then((mod) => ({ default: mod.LandingMotion })),
  { ssr: false }
);

/**
 * Wrapper that lazy-loads LandingMotion (IntersectionObserver setup + counter
 * animations) AFTER the page has hydrated. This removes it from the critical
 * rendering path so the hero headline can paint without waiting for the
 * LandingMotion JS chunk.
 */
export default function DeferredMotion() {
  return <LandingMotion />;
}
