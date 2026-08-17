'use client';

import { useEffect, useRef } from 'react';

const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * LandingMotion — a single deferred client layer that wires up every
 * scroll-driven effect for the marketing page via data-attributes:
 *
 *   [data-reveal]            fade + rise into view (CSS transition)
 *   [data-count-to]          integer count-up when scrolled into view
 *   [data-count-decimal]     decimal count-up (e.g. profit factor "1.36")
 *   [data-bar]               scaleX 0->1 bar fill (element should have an inner
 *                            span styled as the fill, width set inline)
 *   [data-draw]              SVG path/circle stroke draw (stroke-dashoffset -> 0)
 *   [data-parallax]          subtle translateY depth on scroll (uses --py speed)
 *
 * Everything is transform/opacity only, IntersectionObserver-driven, and fully
 * disabled under prefers-reduced-motion. No animation library is added, which
 * keeps the bundle light and the CSP (script-src 'self') satisfied.
 */
export function LandingMotion() {
  useEffect(() => {
    const reduced = prefersReducedMotion();

    /* ── Reduced-motion: snap everything to its final state and bail ── */
    if (reduced) {
      document.querySelectorAll('[data-reveal]').forEach((el) => el.classList.add('is-visible'));
      document.querySelectorAll('[data-count-to]').forEach((el) => {
        el.textContent = `${el.dataset.countTo}${el.dataset.countSuffix || ''}`;
      });
      document.querySelectorAll('[data-draw]').forEach((el) => {
        el.style.strokeDashoffset = '0';
      });
      document.querySelectorAll('[data-bar] > span').forEach((el) => {
        el.style.transform = 'scaleX(1)';
      });
      return undefined;
    }

    /* ── 1. Reveal on scroll ── */
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

    /* ── 2. Integer counters ── */
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.dataset.countTo || 0);
          const suffix = el.dataset.countSuffix || '';
          const duration = 1200;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = `${Math.round(target * eased)}${suffix}`;
            if (progress < 1) window.requestAnimationFrame(tick);
            else el.textContent = `${target}${suffix}`;
          };
          window.requestAnimationFrame(tick);
          counterObserver.unobserve(el);
        });
      },
      { threshold: 0.55 }
    );
    document.querySelectorAll('[data-count-to]').forEach((el) => counterObserver.observe(el));

    /* ── 3. Decimal counters (profit factor, R multiples, etc.) ── */
    const decimalObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const target = Number(el.dataset.countDecimal || 0);
          const decimals = Number(el.dataset.countPlaces || 2);
          const suffix = el.dataset.countSuffix || '';
          const duration = 1200;
          const start = performance.now();
          const tick = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = `${(target * eased).toFixed(decimals)}${suffix}`;
            if (progress < 1) window.requestAnimationFrame(tick);
            else el.textContent = `${target.toFixed(decimals)}${suffix}`;
          };
          window.requestAnimationFrame(tick);
          decimalObserver.unobserve(el);
        });
      },
      { threshold: 0.55 }
    );
    document.querySelectorAll('[data-count-decimal]').forEach((el) => decimalObserver.observe(el));

    /* ── 4. SVG stroke draw ── */
    const drawObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          el.style.transition = 'stroke-dashoffset 1.6s cubic-bezier(0.4, 0, 0.2, 1)';
          el.style.strokeDashoffset = '0';
          drawObserver.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    document.querySelectorAll('[data-draw]').forEach((el) => {
      try {
        const length = el.getTotalLength ? el.getTotalLength() : 1000;
        el.style.strokeDasharray = `${length}`;
        el.style.strokeDashoffset = `${length}`;
        drawObserver.observe(el);
      } catch (e) {
        /* non-geometry element — skip */
      }
    });

    /* ── 5. Bar fills ── */
    const barObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const fill = entry.target.querySelector('span');
          if (fill) fill.style.transform = 'scaleX(1)';
          barObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.5 }
    );
    document.querySelectorAll('[data-bar]').forEach((el) => {
      const fill = el.querySelector('span');
      if (fill) {
        fill.style.transform = 'scaleX(0)';
        fill.style.transformOrigin = 'left center';
        fill.style.transition = 'transform 1.2s cubic-bezier(0.16, 1, 0.3, 1)';
      }
      barObserver.observe(el);
    });

    /* ── 6. Subtle parallax depth (transform only) ── */
    const parallaxEls = Array.from(document.querySelectorAll('[data-parallax]'));
    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        const viewportMid = window.innerHeight / 2;
        parallaxEls.forEach((el) => {
          const speed = Number(el.dataset.parallax || 0.08);
          const rect = el.getBoundingClientRect();
          const offset = (rect.top + rect.height / 2 - viewportMid) * speed;
          el.style.transform = `translateY(${offset.toFixed(1)}px)`;
        });
        rafId = null;
      });
    };
    if (parallaxEls.length) {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    return () => {
      revealObserver.disconnect();
      counterObserver.disconnect();
      decimalObserver.disconnect();
      drawObserver.disconnect();
      barObserver.disconnect();
      if (parallaxEls.length) window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
