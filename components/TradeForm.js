"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createTrade, updateTrade } from '@/app/dashboard/trades/actions';
import { DEFAULT_EMOTIONS, resolveEmotions } from '@/lib/emotions';

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

export default function TradeForm({ mode = 'create', tradeId = null, initial = null, prefs = null }) {
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

  // Journal fields (create mode only)
  const EMOTIONS = resolveEmotions(prefs);
  const [journalOpen, setJournalOpen] = useState(false);
  const [emotions, setEmotions] = useState([]);
  const [confidence, setConfidence] = useState((prefs && prefs.default_confidence) || 0);
  const [note, setNote] = useState('');
  const [screenshotUrls, setScreenshotUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function toggleEmotion(e) {
    setEmotions((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]));
  }

  function removeScreenshot(i) {
    setScreenshotUrls((cur) => cur.filter((_, idx) => idx !== i));
  }

  async function onFiles(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const newUrls = [];

    for (const file of files) {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = user.id + '/new/' + Date.now() + '_' + safe;
      const up = await supabase.storage.from('screenshots').upload(path, file, { upsert: true });
      if (up.error) {
        setError('Upload failed: ' + up.error.message);
        setUploading(false);
        return;
      }
      const pub = supabase.storage.from('screenshots').getPublicUrl(path);
      newUrls.push(pub.data.publicUrl);
    }

    setScreenshotUrls((cur) => [...cur, ...newUrls]);
    setUploading(false);
    // Reset the file input
    e.target.value = '';
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = { ...form };

    // Attach journal if in create mode and any journal field is filled
    if (mode === 'create' && (note || emotions.length || confidence || screenshotUrls.length)) {
      payload.journal = {
        note,
        emotions,
        confidence,
        screenshot_urls: screenshotUrls,
      };
    }

    const res = mode === 'edit' ? await updateTrade(tradeId, payload) : await createTrade(payload);
    if (res && res.error) {
      setError(res.error);
      setSaving(false);
    } else {
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture(mode === 'edit' ? 'trade_updated' : 'trade_created', {
          pair: form.pair,
          direction: form.direction,
          has_journal: !!(payload.journal),
        });
      }
      router.push(mode === 'edit' ? '/dashboard/trades/' + tradeId : '/dashboard/trades');
      router.refresh();
    }
  }

  const pnlNum = Number(form.pnl);
  const hasPnl = form.pnl !== '' && Number.isFinite(pnlNum);
  const rNum = Number(form.r_multiple);
  const hasR = form.r_multiple !== '' && Number.isFinite(rNum);

  const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
  const labelCls = 'mb-1.5 block font-mono text-[11px] uppercase tracking-wider text-white/40';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <form onSubmit={onSubmit} id="trade-form" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelCls}>Pair</label>
              <input className={field} list="pairs" value={form.pair} onChange={(e) => set('pair', e.target.value)} />
              <datalist id="pairs">
                {PAIRS.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
            </div>
            <div>
              <label className={labelCls}>Direction</label>
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
            <div><label className={labelCls}>Entry price</label><input className={field} value={form.entry_price} onChange={(e) => set('entry_price', e.target.value)} inputMode="decimal" /></div>
            <div><label className={labelCls}>Exit price</label><input className={field} value={form.exit_price} onChange={(e) => set('exit_price', e.target.value)} inputMode="decimal" /></div>
            <div><label className={labelCls}>Stop loss</label><input className={field} value={form.stop_loss} onChange={(e) => set('stop_loss', e.target.value)} inputMode="decimal" /></div>
            <div><label className={labelCls}>Take profit</label><input className={field} value={form.take_profit} onChange={(e) => set('take_profit', e.target.value)} inputMode="decimal" /></div>
            <div><label className={labelCls}>Lot size</label><input className={field} value={form.lot_size} onChange={(e) => set('lot_size', e.target.value)} inputMode="decimal" /></div>
            <div><label className={labelCls}>P&amp;L ($) *</label><input className={field} value={form.pnl} onChange={(e) => set('pnl', e.target.value)} inputMode="decimal" placeholder="e.g. 145 or -90" /></div>
            <div><label className={labelCls}>R multiple (optional)</label><input className={field} value={form.r_multiple} onChange={(e) => set('r_multiple', e.target.value)} inputMode="decimal" placeholder="e.g. 1.5 or -1" /></div>
            <div>
              <label className={labelCls}>Timeframe</label>
              <select className={field} value={form.timeframe} onChange={(e) => set('timeframe', e.target.value)}>
                {TIMEFRAMES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div><label className={labelCls}>Setup</label><input className={field} value={form.setup} onChange={(e) => set('setup', e.target.value)} placeholder="e.g. London breakout" /></div>
            <div><label className={labelCls}>Opened</label><input type="datetime-local" className={field} value={form.opened_at} onChange={(e) => set('opened_at', e.target.value)} /></div>
            <div><label className={labelCls}>Closed</label><input type="datetime-local" className={field} value={form.closed_at} onChange={(e) => set('closed_at', e.target.value)} /></div>
          </div>

          {/* Journal section — create mode only */}
          {mode === 'create' && (
            <div className="mt-6 border-t border-white/10 pt-5">
              <button
                type="button"
                onClick={() => setJournalOpen(!journalOpen)}
                className="flex w-full items-center justify-between text-left"
              >
                <span className="font-display text-base font-semibold">
                  Journal <span className="ml-1 text-xs font-normal text-white/40">(optional)</span>
                </span>
                <span className="text-white/40 text-xl leading-none">{journalOpen ? '−' : '+'}</span>
              </button>

              {journalOpen && (
                <div className="mt-4 space-y-5">
                  {/* Emotions */}
                  <div>
                    <label className={labelCls}>How did you feel?</label>
                    <div className="flex flex-wrap gap-2">
                      {EMOTIONS.map((em) => {
                        const on = emotions.includes(em);
                        return (
                          <button
                            key={em}
                            type="button"
                            onClick={() => toggleEmotion(em)}
                            className={'rounded-full border px-3 py-1.5 text-xs ' + (on ? 'border-violet-400/50 bg-violet-500/15 text-violet-200' : 'border-white/10 bg-black/30 text-white/50 hover:text-white')}
                          >
                            {em}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Confidence */}
                  <div>
                    <label className={labelCls}>Confidence at entry</label>
                    <div className="flex gap-1 text-2xl">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} type="button" onClick={() => setConfidence(i)} className={i <= confidence ? 'text-amber-400' : 'text-white/20'}>
                          &#9733;
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className={labelCls}>Notes — what happened &amp; why?</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-cyan-400/60"
                      placeholder="Your reasoning, what went well, what you'd change..."
                    />
                  </div>

                  {/* Multi-screenshot upload */}
                  <div>
                    <label className={labelCls}>Chart screenshots</label>
                    {screenshotUrls.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {screenshotUrls.map((url, i) => (
                          <div key={i} className="group relative">
                            <img src={url} alt="" className="h-20 w-20 rounded-lg border border-white/10 object-cover" />
                            <button
                              type="button"
                              onClick={() => removeScreenshot(i)}
                              className="absolute -right-1.5 -top-1.5 hidden h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white group-hover:flex"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={onFiles}
                      className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-white"
                    />
                    {uploading && <p className="mt-1 text-xs text-cyan-400">Uploading…</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

          <div className="mt-6 flex gap-3">
            <Link href={mode === 'edit' ? '/dashboard/trades/' + tradeId : '/dashboard/trades'} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70">Cancel</Link>
            <button type="submit" disabled={saving || uploading} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
              {saving ? 'Saving…' : mode === 'edit' ? 'Save changes' : 'Save trade'}
            </button>
          </div>
        </form>
      </div>

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
