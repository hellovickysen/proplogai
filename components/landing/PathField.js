'use client';

import { useEffect, useRef, useState } from 'react';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * PathField — the persistent "PropLogAI Path": a fixed, full-page SVG behind
 * all content. A single glowing path runs down the page; it starts CHAOTIC
 * (jagged, noisy) and, as you scroll, its amplitude calms and its trend rises
 * until it resolves into a clean upward trajectory. Nodes pulse along it.
 *
 * Implementation: the path `d` is recomputed each frame from scroll progress
 * (0..1) by lerping a chaotic field toward a smooth rising curve. Pure SVG
 * transform/path — no layout, no scroll-jacking. Pauses when tab hidden;
 * static under prefers-reduced-motion.
 */
export default function PathField() {
  const pathRef = useRef(null);
  const glowRef = useRef(null);
  const nodesRef = useRef([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted || prefersReducedMotion()) return undefined;
    let raf = 0;
    let running = true;
    const W = 100; // viewBox units
    const H = 100;
    const POINTS = 40;

    const smooth = (t) => t * t * (3 - 2 * t);

    const build = (progress, time) => {
      // progress 0 = chaos, 1 = clean rising line
      const chaosAmp = (1 - progress) * 26; // how jagged
      const rise = progress * 55; // how much it climbs
      const d = [];
      const nodePos = [];
      for (let i = 0; i <= POINTS; i++) {
        const x = (i / POINTS) * W;
        // base: gentle downward drift -> rising
        const baseY = 78 - (i / POINTS) * rise - progress * 6;
        // chaos: layered sine noise, calmed by progress; subtle time wobble
        const wobble = Math.sin(time * 0.0006 + i) * (1 - progress) * 2;
        const noise =
          Math.sin(i * 1.7) * Math.cos(i * 0.9) * chaosAmp * 0.5 +
          Math.sin(i * 0.6 + 2) * chaosAmp * 0.5 + wobble;
        const y = baseY + noise;
        d.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
        if (i % 8 === 0) nodePos.push([x, y]);
      }
      return { d: d.join(' '), nodePos };
    };

    const tick = (time) => {
      if (!running) return;
      const doc = document.documentElement;
      const max = Math.max(doc.scrollHeight - window.innerHeight, 1);
      const raw = Math.min(window.scrollY / max, 1);
      const progress = smooth(raw);
      const { d, nodePos } = build(progress, time);
      if (pathRef.current) pathRef.current.setAttribute('d', d);
      if (glowRef.current) glowRef.current.setAttribute('d', d);
      nodesRef.current.forEach((node, i) => {
        if (node && nodePos[i]) {
          node.setAttribute('cx', nodePos[i][0]);
          node.setAttribute('cy', nodePos[i][1]);
        }
      });
      raf = window.requestAnimationFrame(tick);
    };

    const onVis = () => {
      if (document.hidden) {
        running = false;
        window.cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = window.requestAnimationFrame(tick);
      }
    };

    raf = window.requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      running = false;
      window.cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-0 opacity-70" aria-hidden="true">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
        <defs>
          <linearGradient id="pathGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.7" />
            <stop offset="45%" stopColor="#a3e635" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0.9" />
          </linearGradient>
          <filter id="pathGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.6" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* soft under-glow */}
        <path ref={glowRef} d="M0,78" fill="none" stroke="url(#pathGrad)" strokeWidth="1.4" opacity="0.25" filter="url(#pathGlow)" />
        {/* main path */}
        <path ref={pathRef} d="M0,78" fill="none" stroke="url(#pathGrad)" strokeWidth="0.55" strokeLinecap="round" />
        {/* pulsing nodes */}
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <circle
            key={i}
            ref={(el) => (nodesRef.current[i] = el)}
            r="0.7"
            fill="#a3e635"
            opacity="0.8"
          />
        ))}
      </svg>
    </div>
  );
}
