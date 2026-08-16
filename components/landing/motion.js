'use client';

import { useEffect, useRef } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Reveal — IntersectionObserver-driven entrance. Wraps children; adds
 * translate/opacity transition. dir = up | left | right. Reliable (no scroll math).
 */
export function Reveal({ children, dir = 'up', delay = 0, className = '' }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (prefersReducedMotion()) {
      el.style.opacity = '1';
      el.style.transform = 'none';
      return undefined;
    }
    const from =
      dir === 'left' ? 'translate(28px, 18px)' :
      dir === 'right' ? 'translate(-28px, 18px)' :
      'translate(0, 24px)';
    el.style.opacity = '0';
    el.style.transform = from;
    el.style.transition = `opacity 700ms ease ${delay}ms, transform 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          el.style.opacity = '1';
          el.style.transform = 'none';
          io.disconnect();
        }
      }),
      { threshold: 0.18, rootMargin: '0px 0px -6% 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [dir, delay]);
  return (
    <div ref={ref} className={className} style={{ willChange: 'opacity, transform' }}>
      {children}
    </div>
  );
}

/**
 * SectionLabel — monospace micro-label (e.g. "TRADER BEHAVIOR / 04").
 */
export function SectionLabel({ children, className = '' }) {
  return (
    <div className={`font-mono text-[10px] uppercase tracking-[0.3em] text-lime-300/60 ${className}`}>
      {children}
    </div>
  );
}

/**
 * AnimatedNumber — counts up when scrolled into view. Suffix/prefix supported.
 */
export function AnimatedNumber({ value, prefix = '', suffix = '', className = '', duration = 1200 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const target = Number(value);
    if (prefersReducedMotion() || isNaN(target)) {
      el.textContent = `${prefix}${value}${suffix}`;
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        const start = performance.now();
        const tick = (now) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = `${prefix}${Math.round(target * eased)}${suffix}`;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = `${prefix}${target}${suffix}`;
        };
        requestAnimationFrame(tick);
        io.disconnect();
      }),
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, prefix, suffix, duration]);
  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  );
}
