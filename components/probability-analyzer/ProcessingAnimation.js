'use client';

import { useState, useEffect } from 'react';

const STEPS = [
  { label: 'Parsing statement', icon: '📄' },
  { label: 'Detecting broker format', icon: '🔍' },
  { label: 'Normalizing trades', icon: '🔄' },
  { label: 'Calculating metrics', icon: '📊' },
  { label: 'Running Monte Carlo simulation', icon: '🎲' },
  { label: 'Generating probability score', icon: '🎯' },
];

export default function ProcessingAnimation({ step = 0 }) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  const currentStep = Math.min(step, STEPS.length - 1);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-16">
      {/* Spinner */}
      <div className="relative mb-8">
        <div className="h-16 w-16 animate-spin rounded-full border-2 border-white/10 border-t-cyan-400" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          {STEPS[currentStep].icon}
        </div>
      </div>

      {/* Steps */}
      <div className="w-full space-y-2">
        {STEPS.map((s, i) => (
          <div
            key={s.label}
            className={`flex items-center gap-3 rounded-xl px-4 py-2 text-sm transition-all duration-300 ${
              i < currentStep
                ? 'text-emerald-400'
                : i === currentStep
                  ? 'text-white'
                  : 'text-white/20'
            }`}
          >
            <span className="w-5 text-center text-xs">
              {i < currentStep ? '✓' : i === currentStep ? '→' : '·'}
            </span>
            <span>
              {s.label}
              {i === currentStep ? dots : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
