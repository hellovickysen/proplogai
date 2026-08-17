"use client";

import { useEffect, useState } from 'react';

function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export default function PwaInstallPrompt({ userId }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [interacted, setInteracted] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [installed, setInstalled] = useState(false);
  const [installing, setInstalling] = useState(false);
  const dismissKey = `proplog_pwa_install_dismissed_${userId}`;

  useEffect(() => {
    if (!userId) return;
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone) { setInstalled(true); return; }
    setDismissed(localStorage.getItem(dismissKey) === 'true');

    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

    function handleBeforeInstall(event) {
      event.preventDefault();
      setDeferredPrompt(event);
    }
    function handleInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    function handleInteraction() {
      setInteracted(true);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    window.addEventListener('pointerdown', handleInteraction, { once: true });
    window.addEventListener('keydown', handleInteraction, { once: true });
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
      window.removeEventListener('pointerdown', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
    };
  }, [dismissKey, userId]);

  function dismiss() {
    localStorage.setItem(dismissKey, 'true');
    setDismissed(true);
  }

  async function install() {
    if (!deferredPrompt) return;
    setInstalling(true);
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setInstalling(false);
    setDeferredPrompt(null);
  }

  if (!interacted || dismissed || installed || (!deferredPrompt && !isIOS())) return null;

  const ios = isIOS();
  return (
    <div className="fixed inset-x-4 bottom-24 z-[997] rounded-2xl border border-cyan-400/25 bg-[#12121a]/95 p-4 shadow-2xl backdrop-blur-md sm:hidden">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: 'linear-gradient(135deg,#a78bfa,#22d3ee)' }}>
          <svg width="24" height="24" viewBox="0 0 100 100" aria-hidden="true"><polygon points="22,42 50,49 50,75 22,69" fill="#08080f" /><polygon points="78,42 50,49 50,75 78,69" fill="#08080f" /><polyline points="50,49 63,39 74,27" fill="none" stroke="#08080f" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round" /><circle cx="74" cy="27" r="4.5" fill="#08080f" /></svg>
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-semibold text-white">Keep PropLogAI on your home screen</h2>
          <p className="mt-1 text-xs leading-relaxed text-white/55">{ios ? 'Tap Share, then Add to Home Screen for an app-like experience.' : 'Install the app for quick full-screen access.'}</p>
          <div className="mt-3 flex items-center gap-2">
            {ios ? <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300">Share → Add to Home Screen</span> : <button type="button" onClick={install} disabled={installing} className="rounded-lg px-3 py-2 text-xs font-semibold text-[#08080f] disabled:opacity-50" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>{installing ? 'Opening...' : 'Install App'}</button>}
            <button type="button" onClick={dismiss} className="px-2 py-2 text-xs text-white/45 hover:text-white/70">Not now</button>
          </div>
        </div>
      </div>
    </div>
  );
}
