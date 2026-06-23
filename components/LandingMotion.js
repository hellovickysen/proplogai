'use client';

import { useEffect, useRef } from 'react';

const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

export function HeroParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return undefined;

    const ctx = canvas.getContext('2d');
    let animationFrame;
    let width = 0;
    let height = 0;
    let nodes = [];
    let time = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = width / 2;
      const cy = height * 0.5;
      const radius = Math.min(width, height) * 0.28;

      nodes = Array.from({ length: 42 }, (_, index) => {
        const ring = index % 3;
        const angle = (Math.PI * 2 * index) / 42 + ring * 0.38;
        const spread = radius * (0.42 + ring * 0.26 + Math.random() * 0.18);
        return {
          baseX: cx + Math.cos(angle) * spread * (1.05 + Math.random() * 0.16),
          baseY: cy + Math.sin(angle) * spread * 0.72,
          angle,
          drift: 0.18 + Math.random() * 0.26,
          phase: Math.random() * Math.PI * 2,
          radius: 1.3 + Math.random() * 2.3,
          color: index % 4 === 0 ? '34, 211, 238' : '167, 139, 250',
        };
      });
    };

    const draw = () => {
      time += 0.006;
      ctx.clearRect(0, 0, width, height);

      const points = nodes.map((node) => ({
        ...node,
        x: node.baseX + Math.cos(time * node.drift + node.phase) * 12,
        y: node.baseY + Math.sin(time * node.drift + node.phase) * 10,
      }));

      points.forEach((point, index) => {
        for (let j = index + 1; j < points.length; j += 1) {
          const other = points[j];
          const dx = point.x - other.x;
          const dy = point.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 150) {
            const alpha = 0.18 * (1 - distance / 150);
            ctx.beginPath();
            ctx.strokeStyle = `rgba(34, 211, 238, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      });

      points.forEach((point) => {
        const pulse = 0.44 + Math.sin(time * 2 + point.phase) * 0.18;
        const glow = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, point.radius * 12);
        glow.addColorStop(0, `rgba(${point.color}, ${pulse})`);
        glow.addColorStop(1, `rgba(${point.color}, 0)`);

        ctx.beginPath();
        ctx.fillStyle = glow;
        ctx.arc(point.x, point.y, point.radius * 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${0.55 + pulse * 0.2})`;
        ctx.arc(point.x, point.y, point.radius * 0.72, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrame = window.requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="hero-particle-canvas" />;
}

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
