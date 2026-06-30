"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const TOUR_STEPS = [
  {
    page: '/dashboard',
    target: null, // No target — center modal welcome
    title: 'Welcome to PropLogAI!',
    description: 'Let\'s take a quick tour of the essentials. You\'ll learn how to log trades, journal your psychology, track expenses, and share your results. Takes about 60 seconds.',
    icon: '👋',
  },
  {
    page: '/dashboard',
    target: '[data-tour="new-trade"]',
    title: 'Log your first trade',
    description: 'Click here to log a trade. Enter the pair, direction, P&L, and which setups you followed. It takes 30 seconds.',
    icon: '📝',
    position: 'bottom',
  },
  {
    page: '/dashboard',
    target: '[data-tour="nav-expenses"]',
    title: 'Track prop firm costs',
    description: 'Track challenge fees, renewals, and payouts here. Know your real ROI across all prop firms — most traders have no idea how much they\'ve actually spent.',
    icon: '💳',
    position: 'right',
  },
  {
    page: '/dashboard',
    target: '[data-tour="share-btn"]',
    title: 'Share your P&L card',
    description: 'Share your daily or total P&L as a beautiful card on Twitter, Instagram, or TikTok. Choose Story, Square, or Landscape format.',
    icon: '📤',
    position: 'bottom',
  },
  {
    page: '/dashboard',
    target: '[data-tour="recent-trades"]',
    title: 'Journal & share individual trades',
    description: 'Click any trade to view its details. From there you can add a journal entry (emotions, notes, screenshots) and share a 24-hour link to the full trade journal.',
    icon: '📊',
    position: 'top',
  },
  {
    page: '/dashboard',
    target: '[data-tour="nav-coach"]',
    title: 'Get AI coaching',
    description: 'After logging 5+ trades, the AI Coach analyzes your patterns — finds recurring mistakes, ranks them by cost, and gives you concrete fixes. Your personal trading psychologist.',
    icon: '✦',
    position: 'right',
  },
  {
    page: '/dashboard',
    target: null,
    title: 'You\'re all set!',
    description: 'Start by logging your first trade — that\'s where everything begins. The more you journal, the more patterns the AI can find. You can replay this tour anytime from Settings.',
    icon: '🚀',
    isFinal: true,
  },
];

const STORAGE_KEY = 'pl_tour_complete';

function getTooltipPosition(rect, position, isMobile) {
  const pad = 12;
  const tooltipW = isMobile ? Math.min(320, window.innerWidth - 32) : 340;

  if (position === 'bottom') {
    return {
      top: rect.bottom + pad,
      left: Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16)),
    };
  }
  if (position === 'top') {
    return {
      top: rect.top - pad - 200,
      left: Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipW / 2, window.innerWidth - tooltipW - 16)),
    };
  }
  if (position === 'right') {
    return {
      top: rect.top + rect.height / 2 - 80,
      left: isMobile ? 16 : Math.min(rect.right + pad, window.innerWidth - tooltipW - 16),
    };
  }
  return { top: rect.bottom + pad, left: 16 };
}

export default function GuidedTour({ hasTrades }) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const rafRef = useRef(null);

  // Check if tour should auto-start
  useEffect(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
      if (!hasTrades) {
        // Small delay to let the page render
        const timer = setTimeout(() => setActive(true), 1500);
        return () => clearTimeout(timer);
      }
    } catch (e) {}
  }, [hasTrades]);

  useEffect(() => {
    setIsMobile(window.innerWidth < 640);
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Listen for custom event to restart tour
  useEffect(() => {
    function onReplay() {
      setStep(0);
      setActive(true);
      if (pathname !== '/dashboard') {
        router.push('/dashboard');
      }
    }
    window.addEventListener('replay-tour', onReplay);
    return () => window.removeEventListener('replay-tour', onReplay);
  }, [pathname, router]);

  // Find and highlight target element
  const updateTarget = useCallback(() => {
    const current = TOUR_STEPS[step];
    if (!current || !current.target || !active) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(current.target);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
      // Scroll into view if needed
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetRect(null);
    }
  }, [step, active]);

  useEffect(() => {
    if (!active) return;
    updateTarget();
    // Poll for element (it may appear after render)
    const interval = setInterval(updateTarget, 500);
    window.addEventListener('scroll', updateTarget);
    window.addEventListener('resize', updateTarget);
    return () => {
      clearInterval(interval);
      window.removeEventListener('scroll', updateTarget);
      window.removeEventListener('resize', updateTarget);
    };
  }, [active, step, updateTarget]);

  // Handle escape key
  useEffect(() => {
    if (!active) return;
    function onKey(e) { if (e.key === 'Escape') finish(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  function next() {
    if (step < TOUR_STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function finish() {
    setActive(false);
    setStep(0);
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
  }

  if (!active) return null;

  const current = TOUR_STEPS[step];
  const hasTarget = current.target && targetRect;
  const tooltipW = isMobile ? Math.min(320, (typeof window !== 'undefined' ? window.innerWidth : 400) - 32) : 340;

  const tooltipPos = hasTarget
    ? getTooltipPosition(targetRect, current.position, isMobile)
    : null;

  return (
    <div className="fixed inset-0 z-[100]" style={{ pointerEvents: 'auto' }}>
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.7)' }} onClick={finish} />

      {/* Spotlight cutout */}
      {hasTarget && (
        <div
          className="absolute rounded-xl"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.7)',
            border: '2px solid rgba(167,139,250,0.5)',
            zIndex: 101,
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="absolute rounded-2xl border border-white/15 bg-[#0b0b14] p-5 shadow-2xl"
        style={{
          width: tooltipW,
          zIndex: 102,
          ...(hasTarget
            ? { top: tooltipPos.top, left: tooltipPos.left }
            : { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
          ),
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step counter */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {TOUR_STEPS.map((_, i) => (
              <div
                key={i}
                className={'h-1.5 rounded-full transition-all ' + (i === step ? 'w-5' : 'w-1.5') }
                style={{ background: i === step ? 'linear-gradient(120deg, #a78bfa, #22d3ee)' : i < step ? '#a78bfa' : 'rgba(255,255,255,0.15)' }}
              />
            ))}
          </div>
          <span className="font-mono text-[10px] text-white/40">{step + 1}/{TOUR_STEPS.length}</span>
        </div>

        {/* Icon + Title */}
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xl">{current.icon}</span>
          <h3 className="font-display text-base font-bold">{current.title}</h3>
        </div>

        {/* Description */}
        <p className="mb-4 text-sm leading-relaxed text-white/65">{current.description}</p>

        {/* Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={finish}
            className="text-xs text-white/35 hover:text-white/55 transition-colors"
          >
            {current.isFinal ? '' : 'Skip tour'}
          </button>
          <div className="flex items-center gap-2">
            {step > 0 && !current.isFinal && (
              <button
                onClick={back}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/60 hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={current.isFinal ? finish : next}
              className="rounded-lg px-4 py-1.5 text-xs font-semibold text-[#08080f] transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}
            >
              {current.isFinal ? 'Start trading!' : step === 0 ? 'Let\'s go!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Call this from Settings to replay the tour */
export function replayTour() {
  try { localStorage.removeItem('pl_tour_complete'); } catch (e) {}
  window.dispatchEvent(new Event('replay-tour'));
}
