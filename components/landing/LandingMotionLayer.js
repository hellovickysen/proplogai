'use client';

import { useEffect } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * LandingMotionLayer — ONE rAF loop that reads the pointer and scroll position
 * and writes them to CSS custom properties on :root (--mx, --my, --sy, plus
 * smoothed versions). Visual layers consume these via CSS `transform` only
 * (GPU-composited), so parallax/tilt never triggers re-render or layout.
 *
 * Reliable by design: no scroll-jacking, no sticky-pin math, no React state
 * per frame. Lazy-loaded (dynamic ssr:false in page.js) so it never blocks LCP.
 * Pauses on hidden tab; disabled entirely under prefers-reduced-motion.
 */
export default function LandingMotionLayer() {
  useEffect(() => {
    if (prefersReducedMotion()) return undefined;

    const root = document.documentElement;
    let raf = 0;
    let running = true;

    // targets
    let tx = 0.5; // pointer x, 0..1
    let ty = 0.5; // pointer y, 0..1
    let tScroll = window.scrollY;
    // smoothed (lerped) values
    let mx = 0.5;
    let my = 0.5;
    let sy = tScroll;

    const onMove = (e) => {
      tx = e.clientX / window.innerWidth;
      ty = e.clientY / window.innerHeight;
    };
    const onScroll = () => {
      tScroll = window.scrollY;
    };

    const tick = () => {
      if (!running) return;
      // lerp toward targets for buttery motion
      mx += (tx - mx) * 0.08;
      my += (ty - my) * 0.08;
      sy += (tScroll - sy) * 0.12;

      // pointer centered around 0 (-0.5..0.5)
      root.style.setProperty('--mx', (mx - 0.5).toFixed(4));
      root.style.setProperty('--my', (my - 0.5).toFixed(4));
      root.style.setProperty('--sy', sy.toFixed(1));

      raf = window.requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        window.cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        tScroll = window.scrollY;
        raf = window.requestAnimationFrame(tick);
      }
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    raf = window.requestAnimationFrame(tick);

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return null;
}
