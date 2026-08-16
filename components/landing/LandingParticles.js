'use client';

import { useEffect, useRef } from 'react';

const prefersReducedMotion = () => {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * LandingParticles — ONE fixed, full-page particle field behind all landing
 * content. Two depth layers drift at different speeds and shift with scroll
 * (parallax), with twinkle + soft link lines. Pointer-events none, aria-hidden.
 *
 * Speed: lazy-loaded (dynamic ssr:false in page.js) so it's never on the
 * critical LCP path; pauses when the tab is hidden; fewer particles on small
 * screens; respects prefers-reduced-motion.
 */
export default function LandingParticles() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion()) return undefined;

    const ctx = canvas.getContext('2d');
    let raf = 0;
    let width = 0;
    let height = 0;
    let particles = [];
    let running = true;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);
    const COLORS = ['167,139,250', '34,211,238', '251,191,36'];

    const build = () => {
      const isSmall = width < 640;
      // two depth layers: far (slow, faint) + near (faster, brighter)
      const far = Math.floor((isSmall ? 26 : 48));
      const near = Math.floor((isSmall ? 14 : 26));
      particles = [];
      for (let i = 0; i < far; i++) {
        particles.push({
          layer: 0,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.06,
          vy: (Math.random() - 0.5) * 0.05,
          r: 0.6 + Math.random() * 1.1,
          c: COLORS[i % COLORS.length],
          a: 0.08 + Math.random() * 0.12,
          tw: Math.random() * Math.PI * 2,
          twS: 0.008 + Math.random() * 0.01,
        });
      }
      for (let i = 0; i < near; i++) {
        particles.push({
          layer: 1,
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.18,
          r: 1.2 + Math.random() * 2.0,
          c: COLORS[(i + 1) % COLORS.length],
          a: 0.2 + Math.random() * 0.28,
          tw: Math.random() * Math.PI * 2,
          twS: 0.012 + Math.random() * 0.016,
        });
      }
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.floor(width * DPR);
      canvas.height = Math.floor(height * DPR);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      build();
    };

    // scroll parallax: near layer shifts more than far layer
    const scrollRatio = () => {
      const max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      return Math.min(window.scrollY / max, 1);
    };

    const draw = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      const par = scrollRatio();

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.tw += p.twS;

        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;
        if (p.y < -20) p.y = height + 20;
        if (p.y > height + 20) p.y = -20;

        // parallax offset: far layer barely moves, near layer drifts up
        const py = p.y - par * (p.layer === 0 ? 18 : 90);
        const twinkle = 0.7 + Math.sin(p.tw) * 0.3;
        const alpha = p.a * twinkle;

        const glow = ctx.createRadialGradient(p.x, py, 0, p.x, py, p.r * 6);
        glow.addColorStop(0, `rgba(${p.c},${alpha})`);
        glow.addColorStop(1, `rgba(${p.c},0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, py, p.r * 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = `rgba(${p.c},${Math.min(alpha + 0.12, 0.85)})`;
        ctx.beginPath();
        ctx.arc(p.x, py, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // link lines only on near layer (keeps it subtle + cheap)
      const nearPts = particles.filter((p) => p.layer === 1);
      for (let i = 0; i < nearPts.length; i++) {
        const a = nearPts[i];
        const ay = a.y - par * 90;
        for (let j = i + 1; j < nearPts.length; j++) {
          const b = nearPts[j];
          const by = b.y - par * 90;
          const dx = a.x - b.x;
          const dy = ay - by;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.strokeStyle = `rgba(139,124,246,${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, ay);
            ctx.lineTo(b.x, by);
            ctx.stroke();
          }
        }
      }

      raf = window.requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        window.cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = window.requestAnimationFrame(draw);
      }
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 opacity-70"
    />
  );
}
