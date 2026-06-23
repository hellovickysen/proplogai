"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTrade } from '@/app/dashboard/trades/actions';
import { useToast } from '@/components/Toast';

const PAIRS = ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'GBP/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'];
const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function QuickLog() {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pair, setPair] = useState('');
  const [direction, setDirection] = useState('long');
  const [pnl, setPnl] = useState('');

  // Load last pair from localStorage
  function handleOpen() {
    try {
      const saved = localStorage.getItem('pj_trade_defaults');
      if (saved) {
        const d = JSON.parse(saved);
        if (d.pair) setPair(d.pair);
      }
    } catch (e) {}
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    setPnl('');
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!pnl || !pair) return;
    setSaving(true);
    const res = await createTrade({
      pair: pair.toUpperCase(),
      direction,
      pnl,
      trade_date: todayStr(),
      timeframe: '',
      session: '',
    });
    setSaving(false);
    if (res && res.error) {
      if (toast) toast.error(res.error);
    } else {
      if (toast) toast.success('Trade logged!');
      // Save pair as default
      try {
        const saved = localStorage.getItem('pj_trade_defaults');
        const d = saved ? JSON.parse(saved) : {};
        d.pair = pair;
        localStorage.setItem('pj_trade_defaults', JSON.stringify(d));
      } catch (e) {}
      handleClose();
      router.refresh();
    }
  }

  return (
    <>
      {/* FAB button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-30 grid h-14 w-14 place-items-center rounded-2xl shadow-xl text-xl text-[#08080f] font-bold transition-transform hover:scale-110 active:scale-95"
        style={{ background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)', boxShadow: '0 4px 20px rgba(139,92,246,0.4)' }}
        title="Quick Log"
      >
        +
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onClick={handleClose}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="relative mx-4 mb-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#0e0e18] p-5 shadow-2xl sm:mb-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-base font-bold">Quick Log</h3>
              <button onClick={handleClose} className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/60 hover:text-white">&#10005;</button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <input
                  className={field}
                  value={pair}
                  onChange={(e) => setPair(e.target.value)}
                  placeholder="Pair (e.g. XAU/USD)"
                  list="ql-pairs"
                  required
                />
                <datalist id="ql-pairs">{PAIRS.map((p) => <option key={p} value={p} />)}</datalist>
              </div>

              <div className="flex gap-2">
                <button type="button" onClick={() => setDirection('long')}
                  className={'flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ' + (direction === 'long' ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-black/30 text-white/50')}>
                  &#9650; Long
                </button>
                <button type="button" onClick={() => setDirection('short')}
                  className={'flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ' + (direction === 'short' ? 'border-red-400/50 bg-red-500/15 text-red-300' : 'border-white/10 bg-black/30 text-white/50')}>
                  &#9660; Short
                </button>
              </div>

              <input
                className={field}
                value={pnl}
                onChange={(e) => setPnl(e.target.value)}
                placeholder="P&L ($) e.g. 145 or -90"
                inputMode="decimal"
                required
              />

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-xl py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)' }}
              >
                {saving ? 'Saving...' : 'Log Trade'}
              </button>
            </form>

            <p className="mt-3 text-center font-mono text-[10px] text-white/30">
              Need more fields? <a href="/dashboard/trades/new" className="text-cyan-400/60">Full form &rarr;</a>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
