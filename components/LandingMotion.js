'use client';

import { useEffect, useRef, useState } from 'react';

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
    let particles = [];

    const colors = ['rgba(167,139,250,', 'rgba(34,211,238,', 'rgba(251,191,36,'];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from({ length: 50 }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.24,
        vy: (Math.random() - 0.5) * 0.24,
        radius: 1.1 + Math.random() * 2.4,
        pulse: Math.random() * Math.PI * 2,
        color: colors[index % colors.length],
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.pulse += 0.012;

        if (particle.x < -20) particle.x = width + 20;
        if (particle.x > width + 20) particle.x = -20;
        if (particle.y < -20) particle.y = height + 20;
        if (particle.y > height + 20) particle.y = -20;

        const alpha = 0.28 + Math.sin(particle.pulse) * 0.14;
        const glow = ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, particle.radius * 7);
        glow.addColorStop(0, `${particle.color}${alpha})`);
        glow.addColorStop(1, `${particle.color}0)`);

        ctx.beginPath();
        ctx.fillStyle = glow;
        ctx.arc(particle.x, particle.y, particle.radius * 7, 0, Math.PI * 2);
        ctx.fill();

        for (let j = index + 1; j < particles.length; j += 1) {
          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 115) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(167,139,250,${0.055 * (1 - distance / 115)})`;
            ctx.lineWidth = 1;
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
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
