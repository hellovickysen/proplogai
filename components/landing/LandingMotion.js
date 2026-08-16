'use client';

import { useEffect } from 'react';

const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * LandingMotion — scroll-reveal + counter animations, deferred until after
 * hydration so the hero paints without waiting on this chunk.
 *
 * Note: the hero particle canvas used to live here as HeroParticles, but it
 * was consolidated into the single full-page LandingParticles canvas
 * (components/landing/LandingParticles.js). This file now only handles
 * [data-reveal] and [data-count-to].
 */
export function LandingMotion() {
  useEffect(() => {
    if (prefersReducedMotion()) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
      document.querySelectorAll('[data-count-to]').forEach((el) => {
        el.textContent = `${el.dataset.countTo}${el.dataset.countSuffix || ''}`;
      });
      return undefined;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: '0px 0px -8% 0px' }
    );

    document.querySelectorAll('[data-reveal]').forEach((el) => revealObserver.observe(el));

    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const el = entry.target;
          const target = Number(el.dataset.countTo || 0);
          const suffix = el.dataset.countSuffix || '';
          const duration = 1100;
          const start = performance.now();

          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = `${Math.round(target * eased)}${suffix}`;

            if (progress < 1) {
              window.requestAnimationFrame(tick);
            } else {
              el.textContent = `${target}${suffix}`;
            }
          };

          window.requestAnimationFrame(tick);
          counterObserver.unobserve(el);
        });
      },
      { threshold: 0.55 }
    );

    document.querySelectorAll('[data-count-to]').forEach((el) => counterObserver.observe(el));

    return () => {
      revealObserver.disconnect();
      counterObserver.disconnect();
    };
  }, []);

  return null;
}
