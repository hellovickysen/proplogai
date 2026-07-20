"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createTrade } from '@/app/dashboard/trades/actions';

const PAIRS = ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'GBP/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function QuickLogModal({ onClose }) {
  const router = useRouter();
  const [pair, setPair] = useState('XAU/USD');
  const [direction, setDirection] = useState('long');
  const [tradeDate, setTradeDate] = useState(todayStr());
  const [pnl, setPnl] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!pnl && pnl !== 0) {
      setError('P&L is required');
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      pair,
      direction,
      trade_date: tradeDate,
      pnl,
      // Defaults for fields the full form normally requires
      entry_price: '',
      exit_price: '',
      lot_size: '',
      stop_loss: '',
      take_profit: '',
      timeframe: 'M5',
      session: '',
      setup: '',
      setup_ids: [],
      setup_followed: '',
      setup_follow_map: {},
      no_setup_reason: '',
      account_id: '',
    };

    const res = await createTrade(payload);
    if (res && res.error) {
      setError(res.error);
      setSaving(false);
    } else {
      onClose();
      router.refresh();
    }
  }

  const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
  const labelCls = 'mb-1.5 block font-mono text-[10px] uppercase tracking-wider text-white/55';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        style={{ WebkitBackdropFilter: 'blur(12px)', backdropFilter: 'blur(12px)' }}
      />

      {/* Modal */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-5 shadow-2xl"
        style={{ boxShadow: '0 0 40px rgba(167,139,250,0.1), 0 20px 60px rgba(0,0,0,0.5)' }}
      >
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <h2 className="font-display text-base font-bold text-white">Quick Log</h2>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/trades/new"
              onClick={onClose}
              className="text-[11px] text-white/40 hover:text-white/60 transition-colors"
            >
              Full form &rarr;
            </Link>
            <button
              onClick={onClose}
              className="grid h-7 w-7 place-items-center rounded-lg border border-white/10 bg-white/5 text-xs text-white/40 hover:text-white"
            >
              &#10005;
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Pair */}
          <div>
            <label className={labelCls}>Pair</label>
            <div className="flex flex-wrap gap-1.5">
              {PAIRS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPair(p)}
                  className={
                    'rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ' +
                    (pair === p
                      ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300'
                      : 'border-white/10 bg-black/30 text-white/50 hover:text-white')
                  }
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Direction + Date row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Direction</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['long', 'short'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDirection(d)}
                    className={
                      'rounded-lg border py-2.5 text-xs font-semibold capitalize transition-colors ' +
                      (direction === d
                        ? d === 'long'
                          ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300'
                          : 'border-red-400/50 bg-red-500/15 text-red-300'
                        : 'border-white/10 bg-black/30 text-white/50')
                    }
                  >
                    {d === 'long' ? '▲ Long' : '▼ Short'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input
                type="date"
                className={field + ' cursor-pointer'}
                style={{ colorScheme: 'dark' }}
                value={tradeDate}
                onChange={(e) => setTradeDate(e.target.value)}
              />
            </div>
          </div>

          {/* P&L */}
          <div>
            <label className={labelCls}>P&L ($) *</label>
            <input
              className={field + ' text-base font-semibold'}
              value={pnl}
              onChange={(e) => setPnl(e.target.value)}
              inputMode="decimal"
              placeholder="e.g. 145 or -90"
              autoFocus
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-lg bg-red-500/10 border border-red-400/20 px-3 py-2 text-xs text-red-400">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl py-3 text-sm font-semibold text-[#08080f] transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
          >
            {saving ? 'Saving...' : 'Log trade'}
          </button>
        </form>
      </div>
    </div>
  );
}
