'use client';

import { useEffect, useRef } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * ParallaxDepth — fixed, full-page layered background that drifts at different
 * scroll rates (via var(--sy)) and reacts to the pointer (via --mx/--my),
 * creating real depth. Pure CSS transform on layered divs — GPU-composited,
 * zero layout. Renders nothing itself but the layers.
 *
 * Layer order (far -> near): base gradient, far grid, mid glow orbs, near specks.
 */
export default function ParallaxDepth() {
  const farRef = useRef(null);
  const midRef = useRef(null);
  const nearRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    let running = true;

    const tick = () => {
      if (!running) return;
      const sy = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--sy')) || 0;
      const mx = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--mx')) || 0;
      const my = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--my')) || 0;

      // far grid: slowest
      if (farRef.current) {
        farRef.current.style.transform = `translate3d(${mx * -12}px, ${sy * -0.04 + my * -12}px, 0)`;
      }
      // mid glows: medium
      if (midRef.current) {
        midRef.current.style.transform = `translate3d(${mx * -26}px, ${sy * -0.09 + my * -20}px, 0)`;
      }
      // near specks: fastest
      if (nearRef.current) {
        nearRef.current.style.transform = `translate3d(${mx * -44}px, ${sy * -0.16 + my * -30}px, 0)`;
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
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* far grid */}
      <div
        ref={farRef}
        className="absolute -inset-[15%] opacity-[0.13] will-change-transform"
        style={{
          backgroundImage:
            'linear-gradient(rgba(139,124,246,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(139,124,246,0.14) 1px, transparent 1px)',
          backgroundSize: '90px 90px',
        }}
      />
      {/* mid glow orbs */}
      <div ref={midRef} className="absolute inset-0 will-change-transform">
        <div className="absolute -top-40 left-1/4 h-[32rem] w-[52rem] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(139,124,246,0.13),transparent_65%)] blur-3xl" />
        <div className="absolute right-[-12rem] top-1/3 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(34,211,238,0.1),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.06),transparent_65%)] blur-3xl" />
      </div>
      {/* near specks (tiny crosshair dots) */}
      <div ref={nearRef} className="absolute inset-0 will-change-transform">
        {[
          { l: '12%', t: '22%' }, { l: '78%', t: '14%' }, { l: '88%', t: '48%' },
          { l: '8%', t: '58%' }, { l: '60%', t: '70%' }, { l: '30%', t: '82%' },
          { l: '46%', t: '30%' }, { l: '70%', t: '86%' },
        ].map((p, i) => (
          <span
            key={i}
            className="absolute h-1 w-1 rounded-full bg-cyan-300/40"
            style={{ left: p.l, top: p.t, boxShadow: '0 0 8px rgba(34,211,238,0.5)' }}
          />
        ))}
      </div>
    </div>
  );
}
