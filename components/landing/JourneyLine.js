'use client';

import { useEffect, useRef } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * JourneyLine — the vertical connecting line that DRAWS itself (scaleY 0 -> 1)
 * when the journey section scrolls into view. IntersectionObserver-driven,
 * CSS-transition-based — no scroll math, reliable. Renders the line element.
 */
export default function JourneyLine() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) {
      el.style.transform = 'scaleY(1)';
      return undefined;
    }
    el.style.transformOrigin = 'top';
    el.style.transform = 'scaleY(0)';
    el.style.transition = 'transform 1.6s cubic-bezier(0.16, 1, 0.3, 1)';

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.style.transform = 'scaleY(1)';
            io.disconnect();
          }
        });
      },
      { threshold: 0.15 }
    );
    io.observe(el.parentElement);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="absolute left-5 top-0 h-full w-px bg-gradient-to-b from-[#8b7cf6]/60 via-cyan-300/50 to-emerald-300/50 sm:left-1/2 sm:-translate-x-1/2"
      aria-hidden="true"
    />
  );
}
