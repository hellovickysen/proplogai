"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createTrade, updateTrade } from '@/app/dashboard/trades/actions';
import { DEFAULT_EMOTIONS, resolveEmotions } from '@/lib/emotions';
import { useToast } from '@/components/Toast';

const PAIRS = ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'GBP/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'];
const TIMEFRAMES = ['M5', 'M15', 'H1', 'H4', 'D1'];
const SESSIONS = ['Asian', 'London', 'New York'];
const MAX_SETUPS = 5;
const NO_SETUP_REASONS = [
  { value: 'revenge', label: 'Revenge trade' },
  { value: 'fomo', label: 'FOMO' },
  { value: 'boredom', label: 'Boredom' },
  { value: 'recover_loss', label: 'Trying to recover loss' },
  { value: 'overconfidence', label: 'Overconfidence' },
  { value: 'chasing', label: 'Chasing price' },
  { value: 'other', label: 'Other' },
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function TradeForm({ mode = 'create', tradeId = null, initial = null, prefs = null, setups = null }) {
  const router = useRouter();

  // Resolve initial setup_ids from setup_ids array, or single setup_id, or empty
  const initialSetupIds =
    initial && Array.isArray(initial.setup_ids) && initial.setup_ids.length > 0
      ? initial.setup_ids
      : initial && initial.setup_id
        ? [initial.setup_id]
        : [];

  const [form, setForm] = useState({
    pair: (initial && initial.pair) || 'XAU/USD',
    direction: (initial && initial.direction) || 'long',
    entry_price: initial && initial.entry_price != null ? initial.entry_price : '',
    exit_price: initial && initial.exit_price != null ? initial.exit_price : '',
    stop_loss: initial && initial.stop_loss != null ? initial.stop_loss : '',
    take_profit: initial && initial.take_profit != null ? initial.take_profit : '',
    lot_size: initial && initial.lot_size != null ? initial.lot_size : '',
    pnl: initial && initial.pnl != null ? initial.pnl : '',
    r_multiple: initial && initial.r_multiple != null ? initial.r_multiple : '',
    setup: (initial && initial.setup) || '',
    setup_id: (initial && initial.setup_id) || '',
    setup_ids: initialSetupIds,
    setup_followed: (initial && initial.setup_followed) || '',
    no_setup_reason: (initial && initial.no_setup_reason) || '',
    timeframe: (initial && initial.timeframe) || 'M5',
    session: (initial && initial.session) || '',
    trade_date: (initial && initial.trade_date) || todayStr(),
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
  const toast = useToast();

  // Auto-calculate R multiple from entry/exit/stop_loss
  useEffect(() => {
    const entry = Number(form.entry_price);
    const exit = Number(form.exit_price);
    const sl = Number(form.stop_loss);
    if (!Number.isFinite(entry) || !Number.isFinite(exit) || !Number.isFinite(sl)) return;
    let risk, reward;
    if (form.direction === 'long') {
      risk = entry - sl;
      reward = exit - entry;
    } else {
      risk = sl - entry;
      reward = entry - exit;
    }
    if (risk <= 0) return;
    const r = (reward / risk).toFixed(2);
    if (r !== String(form.r_multiple)) {
      setForm((f) => ({ ...f, r_multiple: r }));
    }
  }, [form.entry_price, form.exit_price, form.stop_loss, form.direction]);

  // Load saved defaults (pair, session, timeframe) for new trades
  useEffect(() => {
    if (mode !== 'create' || initial) return;
    try {
      const saved = localStorage.getItem('pj_trade_defaults');
      if (saved) {
        const d = JSON.parse(saved);
        setForm((f) => ({
          ...f,
          pair: d.pair || f.pair,
          session: d.session || f.session,
          timeframe: d.timeframe || f.timeframe,
        }));
      }
    } catch (e) {}
  }, []);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Resolve active setups from DB
  const activeSetups = setups && setups.length > 0
    ? setups.filter((s) => s.is_active)
    : null;

  // Find selected setup objects (multi-select)
  const selectedSetups = activeSetups
    ? activeSetups.filter((s) => form.setup_ids.includes(s.id))
    : [];

  const hasNoSetup = selectedSetups.some((s) => s.is_default);

  function toggleSetup(setupId) {
    if (!activeSetups) return;
    const chosen = activeSetups.find((s) => s.id === setupId);
    if (!chosen) return;

    setForm((f) => {
      let newIds = [...f.setup_ids];

      if (newIds.includes(setupId)) {
        // Deselect
        newIds = newIds.filter((id) => id !== setupId);
      } else {
        // Select
        if (chosen.is_default) {
          // No Setup is exclusive — clear all others
          newIds = [setupId];
        } else {
          // Regular setup: remove No Setup if present, enforce max
          const noSetupEntry = activeSetups.find((s) => s.is_default);
          if (noSetupEntry) {
            newIds = newIds.filter((id) => id !== noSetupEntry.id);
          }
          if (newIds.length >= MAX_SETUPS) return f;
          newIds.push(setupId);
        }
      }

      // Resolve names for backward compat
      const names = newIds
        .map((id) => (activeSetups.find((s) => s.id === id) || {}).name)
        .filter(Boolean);

      return {
        ...f,
        setup_ids: newIds,
        setup_id: newIds[0] || '',
        setup: names.join(', '),
        setup_followed: '',
        no_setup_reason: '',
      };
    });
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
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    const MAX_FILES = 10;
    if (screenshotUrls.length + files.length > MAX_FILES) {
      setError('Maximum ' + MAX_FILES + ' screenshots per trade.');
      return;
    }
    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        setError('File "' + file.name + '" exceeds 5MB limit.');
        return;
      }
    }
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
      if (toast) toast.error(res.error);
      setSaving(false);
    } else {
      if (toast) toast.success(mode === 'edit' ? 'Trade updated!' : 'Trade saved!');
      if (typeof window !== 'undefined' && window.posthog) {
        window.posthog.capture(mode === 'edit' ? 'trade_updated' : 'trade_created', {
          pair: form.pair,
          direction: form.direction,
          has_journal: !!(payload.journal),
          setup: form.setup,
          setup_count: form.setup_ids.length,
          setup_followed: form.setup_followed,
        });
      }
      // Save defaults for next trade
      try {
        localStorage.setItem('pj_trade_defaults', JSON.stringify({
          pair: form.pair, session: form.session, timeframe: form.timeframe,
        }));
      } catch (e) {}
      router.push(mode === 'edit' ? '/dashboard/trades/' + tradeId : '/dashboard/trades');
      router.refresh();
    }
  }

  const pnlNum = Number(form.pnl);
  const hasPnl = form.pnl !== '' && Number.isFinite(pnlNum);
  const rNum = Number(form.r_multiple);
  const hasR = form.r_multiple !== '' && Number.isFinite(rNum);

  const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
  const labelCls = 'mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <form onSubmit={onSubmit} id="trade-form" className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          {/* Section 1: Trade Details */}
          <div className="mb-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
              <span className="grid h-5 w-5 place-items-center rounded-md text-[10px]" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(34,211,238,0.2))' }}>1</span>
              Trade details
            </h3>
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
              <div>
                <label className={labelCls}>Session</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {SESSIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => set('session', form.session === s ? '' : s)}
                      className={'rounded-lg border px-2 py-2.5 text-xs font-semibold sm:text-sm ' + (form.session === s ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/30 text-white/50')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className={labelCls}>Trade date</label><input type="date" className={field + ' cursor-pointer'} style={{ colorScheme: 'dark' }} value={form.trade_date} onChange={(e) => set('trade_date', e.target.value)} /></div>
              <div>
                <label className={labelCls}>Timeframe</label>
                <select className={field} value={form.timeframe} onChange={(e) => set('timeframe', e.target.value)}>
                  {TIMEFRAMES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              {/* Setup — multi-select toggle buttons or legacy dropdown */}
              <div className="sm:col-span-2">
                <label className={labelCls}>
                  Setup <span className="text-white/30">(up to {MAX_SETUPS})</span>
                </label>
                {activeSetups ? (
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {activeSetups.map((s) => {
                        const selected = form.setup_ids.includes(s.id);
                        const isNoSetupItem = s.is_default;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => toggleSetup(s.id)}
                            className={
                              'rounded-full border px-3 py-1.5 text-xs transition-colors ' +
                              (selected
                                ? isNoSetupItem
                                  ? 'border-red-400/50 bg-red-500/15 text-red-200'
                                  : 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200'
                                : 'border-white/10 bg-black/30 text-white/50 hover:text-white')
                            }
                          >
                            {s.name}
                          </button>
                        );
                      })}
                    </div>
                    {form.setup_ids.length > 0 && (
                      <p className="mt-1.5 font-mono text-[11px] text-white/40">
                        {form.setup_ids.length}/{MAX_SETUPS} selected
                      </p>
                    )}
                  </div>
                ) : (
                  <select className={field} value={form.setup} onChange={(e) => set('setup', e.target.value)}>
                    <option value="">Select setup...</option>
                    {(prefs && prefs.custom_setups && prefs.custom_setups.length > 0
                      ? prefs.custom_setups
                      : ['Fib Level', 'London Low Sweep', 'London High Sweep', 'ChoCh On Line']
                    ).map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Setup directions + discipline fields */}
            {selectedSetups.length > 0 && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                {/* Show rule directions for all selected setups */}
                {selectedSetups.some((s) => s.direction) && (
                  <div className="mb-3 space-y-2">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-white/40">Rule directions</div>
                    {selectedSetups.filter((s) => s.direction).map((s) => (
                      <div key={s.id} className="rounded-lg bg-white/[0.02] px-3 py-2">
                        <span className="font-mono text-[10px] uppercase text-cyan-400/60">{s.name}</span>
                        <p className="mt-0.5 text-sm leading-relaxed text-white/60">{s.direction}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Did you follow these setups? — regular setups only */}
                {!hasNoSetup && (
                  <div>
                    <label className={labelCls}>
                      Did you follow {selectedSetups.length > 1 ? 'these setups' : 'this setup'}?
                    </label>
                    <div className="flex gap-2">
                      {[
                        { v: 'yes', l: 'Yes', color: 'emerald' },
                        { v: 'partial', l: 'Partially', color: 'amber' },
                        { v: 'no', l: 'No', color: 'red' },
                      ].map((opt) => {
                        const active = form.setup_followed === opt.v;
                        const cls = active
                          ? 'border-' + opt.color + '-400/50 bg-' + opt.color + '-500/15 text-' + opt.color + '-300'
                          : 'border-white/10 bg-black/30 text-white/50';
                        return (
                          <button
                            key={opt.v}
                            type="button"
                            onClick={() => set('setup_followed', form.setup_followed === opt.v ? '' : opt.v)}
                            className={'flex-1 rounded-lg border px-3 py-2 text-xs font-semibold ' + cls}
                          >
                            {opt.l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* No Setup reason */}
                {hasNoSetup && (
                  <div>
                    <label className={labelCls}>What caused this trade?</label>
                    <div className="flex flex-wrap gap-2">
                      {NO_SETUP_REASONS.map((r) => {
                        const active = form.no_setup_reason === r.value;
                        return (
                          <button
                            key={r.value}
                            type="button"
                            onClick={() => set('no_setup_reason', active ? '' : r.value)}
                            className={'rounded-full border px-3 py-1.5 text-xs ' + (active ? 'border-red-400/50 bg-red-500/15 text-red-200' : 'border-white/10 bg-black/30 text-white/50 hover:text-white')}
                          >
                            {r.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Price Data */}
          <div className="mb-5 border-t border-white/[0.06] pt-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
              <span className="grid h-5 w-5 place-items-center rounded-md text-[10px]" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(34,211,238,0.2))' }}>2</span>
              Price data
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelCls}>Entry price</label><input className={field} value={form.entry_price} onChange={(e) => set('entry_price', e.target.value)} inputMode="decimal" /></div>
              <div><label className={labelCls}>Exit price</label><input className={field} value={form.exit_price} onChange={(e) => set('exit_price', e.target.value)} inputMode="decimal" /></div>
              <div><label className={labelCls}>Stop loss</label><input className={field} value={form.stop_loss} onChange={(e) => set('stop_loss', e.target.value)} inputMode="decimal" /></div>
              <div><label className={labelCls}>Take profit</label><input className={field} value={form.take_profit} onChange={(e) => set('take_profit', e.target.value)} inputMode="decimal" /></div>
              <div><label className={labelCls}>Lot size</label><input className={field} value={form.lot_size} onChange={(e) => set('lot_size', e.target.value)} inputMode="decimal" /></div>
            </div>
          </div>

          {/* Section 3: Result */}
          <div className="border-t border-white/[0.06] pt-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
              <span className="grid h-5 w-5 place-items-center rounded-md text-[10px]" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(34,211,238,0.2))' }}>3</span>
              Result
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className={labelCls}>P&L ($) *</label><input className={field} value={form.pnl} onChange={(e) => set('pnl', e.target.value)} inputMode="decimal" placeholder="e.g. 145 or -90" /></div>
              <div><label className={labelCls}>R multiple <span className="text-white/30">(auto)</span></label><input className={field} value={form.r_multiple} onChange={(e) => set('r_multiple', e.target.value)} inputMode="decimal" placeholder="auto from prices" /></div>
            </div>
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
                  Journal <span className="ml-1 text-xs font-normal text-white/55">(optional)</span>
                </span>
                <span className="text-white/55 text-xl leading-none">{journalOpen ? '−' : '+'}</span>
              </button>

              {journalOpen && (
                <div className="mt-4 space-y-5">
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
                  <div>
                    <label className={labelCls}>Confidence at entry</label>
                    <div className="flex gap-1 text-2xl">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} type="button" onClick={() => setConfidence(i)} className={i <= confidence ? 'text-amber-400' : 'text-white/40'}>
                          &#9733;
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Notes — what happened & why?</label>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-cyan-400/60"
                      placeholder="Your reasoning, what went well, what you'd change..."
                    />
                  </div>
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
                              &#10005;
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
                    {uploading && <p className="mt-1 text-xs text-cyan-400">Uploading...</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

          <div className="mt-6 flex gap-3">
            <Link href={mode === 'edit' ? '/dashboard/trades/' + tradeId : '/dashboard/trades'} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70">Cancel</Link>
            <button type="submit" disabled={saving || uploading} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
              {saving ? 'Saving...' : mode === 'edit' ? 'Save changes' : 'Save trade'}
            </button>
          </div>
        </form>
      </div>

      {/* Preview panel */}
      <div className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="font-mono text-xs uppercase tracking-wider text-white/55">Preview</div>
        <div className="mt-3 font-display text-lg font-bold">
          {form.pair}{' '}
          <span className={'ml-1 text-xs ' + (form.direction === 'long' ? 'text-emerald-400' : 'text-red-400')}>{form.direction.toUpperCase()}</span>
        </div>
        {form.setup && (
          <div className="mt-2 flex flex-wrap gap-1">
            {form.setup.split(', ').map((s, i) => (
              <span key={i} className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">{s}</span>
            ))}
            {form.setup_followed && (
              <span className={'rounded-full px-2 py-0.5 text-xs ' + (form.setup_followed === 'yes' ? 'bg-emerald-500/15 text-emerald-300' : form.setup_followed === 'partial' ? 'bg-amber-500/15 text-amber-300' : 'bg-red-500/15 text-red-300')}>
                {form.setup_followed === 'yes' ? 'Followed' : form.setup_followed === 'partial' ? 'Partial' : 'Not followed'}
              </span>
            )}
          </div>
        )}
        <div className={'mt-4 font-display text-3xl font-bold ' + (hasPnl ? (pnlNum >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-white/50')}>
          {hasPnl ? (pnlNum >= 0 ? '+' : '-') + '$' + Math.abs(pnlNum).toLocaleString() : '$0.00'}
        </div>
        <div className={'mt-1 font-mono text-sm ' + (hasR ? (rNum >= 0 ? 'text-emerald-400' : 'text-red-400') : 'text-white/50')}>
          {hasR ? (rNum >= 0 ? '+' : '-') + Math.abs(rNum).toFixed(2) + 'R' : '—R'}
        </div>
        <div className="mt-4 font-mono text-xs text-white/55">{hasPnl ? (pnlNum >= 0 ? 'Win' : 'Loss') : 'Enter P&L to preview'}</div>
      </div>
    </div>
  );
}
