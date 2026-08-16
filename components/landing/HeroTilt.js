'use client';

import { useEffect, useRef } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * HeroTilt — wraps the hero dashboard mockup. Reads --mx/--my (written by
 * LandingMotionLayer) and applies a subtle 3D perspective tilt + float, so the
 * product feels physical and alive. Transform-only; GPU-composited.
 */
export default function HeroTilt({ children }) {
  const ref = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let running = true;
    let t = 0;

    const tick = () => {
      if (!running) return;
      t += 0.005;
      const mx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mx')) || 0;
      const my = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--my')) || 0;
      const floatY = Math.sin(t) * 6; // gentle bob
      if (ref.current) {
        ref.current.style.transform =
          `perspective(1200px) rotateX(${(-my * 6).toFixed(2)}deg) rotateY(${(mx * 8).toFixed(2)}deg) translateY(${floatY.toFixed(1)}px)`;
      }
      rafRef.current = window.requestAnimationFrame(tick);
    };

    rafRef.current = window.requestAnimationFrame(tick);
    return () => {
      running = false;
      window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={ref} className="will-change-transform" style={{ transformStyle: 'preserve-3d' }}>
      {children}
    </div>
  );
}
