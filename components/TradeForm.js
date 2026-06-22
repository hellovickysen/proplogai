"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createTrade, updateTrade } from '@/app/dashboard/trades/actions';

const PAIRS = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'XAU/USD', 'GBP/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'];
const TIMEFRAMES = ['M5', 'M15', 'H1', 'H4', 'D1'];

function toLocalInput(v) {
  if (!v) return '';
  try {
    const d = new Date(v);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  } catch (e) {
    return '';
  }
}

export default function TradeForm({ mode = 'create', tradeId = null, initial = null }) {
  const router = useRouter();
  const [form, setForm] = useState({
    pair: (initial && initial.pair) || 'EUR/USD',
    direction: (initial && initial.direction) || 'long',
    entry_price: initial && initial.entry_price != null ? initial.entry_price : '',
    exit_price: initial && initial.exit_price != null ? initial.exit_price : '',
    stop_loss: initial && initial.stop_loss != null ? initial.stop_loss : '',
    take_profit: initial && initial.take_profit != null ? initial.take_profit : '',
    lot_size: initial && initial.lot_size != null ? initial.lot_size : '',
    pnl: initial && initial.pnl != null ? initial.pnl : '',
    r_multiple: initial && initial.r_multiple != null ? initial.r_multiple : '',
    setup: (initial && initial.setup) || '',
    timeframe: (initial && initial.timeframe) || 'H1',
    opened_at: toLocalInput(initial && initial.opened_at),
    closed_at: toLocalInput(initial && initial.closed_at),
  });
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = mode === 'edit' ? await updateTrade(tradeId, form) : await createTrade(form);
    if (res && res.error) {
      setError(res.error);
      setSaving(false);
    } else {
      router.push(mode === 'edit' ? '/dashboard/trades/' + tradeId : '/dashboard/trades');
      router.refresh();
    }
  }

  const pnlNum = Number(form.pnl);
  const hasPnl = form.pnl !== '' && Number.isFinite(pnlNum);
  const rNum = Number(form.r_multiple);
  const hasR = form.r_multiple !== '' && Number.isFinite(rNum);

  const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
  const label = 'mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/40';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <form onSubmit={onSubmit} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={label}>Pair</label>
            <input className={field} list="pairs" value={form.pair} onChange={(e) => set('pair', e.target.value)} />
            <datalist id="pairs">
              {PAIRS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div>
            <label className={label}>Direction</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => set('direction', 'long')}
                className={'flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ' + (form.direction === 'long' ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-black/30 text-white/50')}
              >
                &#9650; Long
              </button>
              <button
                type="button"
                onClick={() => set('direction', 'short')}
                className={'flex-1 rounded-lg border px-3 py-2.5 text-sm font-semibold ' + (form.direction === 'short' ? 'border-red-400/50 bg-red-500/15 text-red-300' : 'border-white/10 bg-black/30 text-white/50')}
              >
                &#9660; Short
              </button>
            </div>
          </div>
          <div><label className={label}>Entry price</label><input className={field} value={form.entry_price} onChange={(e) => set('entry_price', e.target.value)} inputMode="decimal" /></div>
          <div><label className={label}>Exit price</label><input className={field} value={form.exit_price} onChange={(e) => set('exit_price', e.target.value)} inputMode="decimal" /></div>
          <div><label className={label}>Stop loss</label><input className={field} value={form.stop_loss} onChange={(e) => set('stop_loss', e.target.value)} inputMode="decimal" /></div>
          <div><label className={label}>Take profit</label><input className={field} value={form.take_profit} onChange={(e) => set('take_profit', e.target.value)} inputMode="decimal" /></div>
          <div><label className={label}>Lot size</label><input className={field} value={form.lot_size} onChange={(e) => set('lot_size', e.target.value)} inputMode="decimal" /></div>
          <div><label className={label}>P&amp;L ($) *</label><input className={field} value={form.pnl} onChange={(e) => set('pnl', e.target.value)} inputMode="decimal" placeholder="e.g. 145 or -90" /></div>
          <div><label className={label}>R multiple (optional)</label><input className={field} value={form.r_multiple} onChange={(e) => set('r_multiple', e.target.value)} inputMode="decimal" placeholder="e.g. 1.5 or -1" /></div>
          <div>
            <label className={label}>Timeframe</label>
            <select className={field} value={form.timeframe} onChange={(e) => set('timeframe', e.target.value)}>
              {TIMEFRAMES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div><label className={label}>Setup</label><input className={field} value={form.setup} onChange={(e) => set('setup', e.target.value)} placeholder="e.g. London breakout" /></div>
          <div><label className={label}>Opened</label><input type="datetime-local" className={field} value={form.opened_at} onChange={(e) => set('opened_at', e.target.value)} /></div>
          <div><label className={label}>Closed</label><input type="datetime-local" className={field} value={form.closed_at} onChange={(e) => set('closed_at', e.target.value)} /></div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

        <div className="mt-6 flex gap-3">
          <Link href={mode === 'edit' ? '/dashboard/trades/' + tradeId : '/dashboard/trades'} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70">Cancel</Link>
          <button type="submit" disabled={saving} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
            {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save trade'}
          </button>
        </div>
      </form>

      <div className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="font-mono text-[11px] uppercase tracking-wider text-white/40">Preview</div>
        <div className="mt-3 font-display text-lg font-bold">
          {form.pair}{' '}
          <span className={'ml-1 text-xs ' + (form.direction === 'long' ? 'text-emerald-400' : 'text-red-400')}>{form.direction.toUpperCase()}</span>
        </div>
        <div className={'mt-4 font-display text-3xl font-bold ' + (hasPnl ? (pnlNum >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-white/30')}>
          {hasPnl ? (pnlNum >= 0 ? '+' : '-') + '$' + Math.abs(pnlNum).toLocaleString() : '$0.00'}
        </div>
        <div className={'mt-1 font-mono text-sm ' + (hasR ? (rNum >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-white/30')}>
          {hasR ? (rNum >= 0 ? '+' : '-') + Math.abs(rNum).toFixed(2) + 'R' : '—R'}
        </div>
        <div className="mt-4 font-mono text-xs text-white/40">{hasPnl ? (pnlNum >= 0 ? 'Win' : 'Loss') : 'Enter P&L to preview'}</div>
      </div>
    </div>
  );
}
