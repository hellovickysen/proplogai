"use client";

import { useEffect, useState } from 'react';

/**
 * CSS-only confetti burst. Renders 40 particles that fly outward and fade.
 * Pure CSS animations — zero dependencies, auto-removes after 3s.
 *
 * Usage: <Confetti active={showConfetti} onDone={() => setShowConfetti(false)} />
 */

const COLORS = ['#ffc42d', '#ff9f1c', '#34d399', '#fbbf24', '#f87171', '#818cf8', '#fb923c'];

function randomBetween(a, b) {
  return Math.random() * (b - a) + a;
}

export default function Confetti({ active, onDone }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!active) return;

    const ps = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: randomBetween(-200, 200),
      y: randomBetween(-300, -80),
      r: randomBetween(0, 360),
      s: randomBetween(4, 10),
      color: COLORS[i % COLORS.length],
      delay: randomBetween(0, 0.3),
      duration: randomBetween(1.5, 2.5),
      shape: Math.random() > 0.5 ? 'circle' : 'rect',
    }));
    setParticles(ps);

    const timer = setTimeout(() => {
      setParticles([]);
      if (onDone) onDone();
    }, 3000);

    return () => clearTimeout(timer);
  }, [active]);

  if (particles.length === 0) return null;

  return (
    <div style={{ position: 'fixed', top: '40%', left: '50%', zIndex: 100, pointerEvents: 'none' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes confettiFall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(var(--cx), var(--cy)) rotate(var(--cr)); opacity: 0; }
        }
      `}} />
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            width: p.shape === 'circle' ? p.s : p.s * 0.6,
            height: p.s,
            backgroundColor: p.color,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            '--cx': p.x + 'px',
            '--cy': p.y + 'px',
            '--cr': p.r + 'deg',
            animation: `confettiFall ${p.duration}s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

/**
 * Animated checkmark for small successes.
 * Shows a drawing checkmark inside a circle, then fades out.
 *
 * Usage: <SuccessCheck active={show} onDone={() => setShow(false)} />
 */
export function SuccessCheck({ active, onDone }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) return;
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      if (onDone) onDone();
    }, 2000);
    return () => clearTimeout(timer);
  }, [active]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', top: '35%', left: '50%', transform: 'translate(-50%, -50%)',
      zIndex: 100, pointerEvents: 'none',
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes checkPop { 0% { transform: scale(0); opacity: 0; } 50% { transform: scale(1.2); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        @keyframes checkDraw { 0% { stroke-dashoffset: 24; } 100% { stroke-dashoffset: 0; } }
        @keyframes checkFade { 0%,70% { opacity: 1; } 100% { opacity: 0; } }
      `}} />
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'linear-gradient(135deg, rgba(52,211,153,0.2), rgba(47,216,255,0.10))',
        border: '2px solid rgba(52,211,153,0.5)',
        display: 'grid', placeItems: 'center',
        animation: 'checkPop 0.4s ease-out, checkFade 2s ease-out forwards',
        boxShadow: '0 0 30px rgba(52,211,153,0.3)',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
          <path
            d="M5 13l4 4L19 7"
            stroke="#34d399"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              strokeDasharray: 24,
              strokeDashoffset: 24,
              animation: 'checkDraw 0.5s ease-out 0.3s forwards',
            }}
          />
        </svg>
      </div>
    </div>
  );
}
