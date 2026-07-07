"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { createTrade, updateTrade } from '@/app/dashboard/trades/actions';
import { DEFAULT_EMOTIONS, resolveEmotions } from '@/lib/emotions';
import { resolveTags } from '@/lib/tags';
import { processImageFile } from '@/lib/imageUtils';
import { useToast } from '@/components/ui/Toast';

const PAIRS = ['XAU/USD', 'EUR/USD', 'GBP/USD', 'USD/JPY', 'GBP/JPY', 'AUD/USD', 'USD/CAD', 'NZD/USD'];
const TIMEFRAMES = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'];
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

/* ─── Custom themed dropdown for Timeframe ─────────────────── */
function TimeframeDropdown({ value, onChange, labelCls, fieldCls }) {
  const [open, setOpen] = useState(false);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (!e.target.closest('[data-tf-dropdown]')) setOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [open]);

  return (
    <div className="relative" data-tf-dropdown>
      <label className={labelCls}>Timeframe</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={fieldCls + ' flex w-full cursor-pointer items-center justify-between text-left'}
      >
        <span>{value}</span>
        <span className={'text-white/30 text-xs transition-transform ' + (open ? 'rotate-180' : '')}>&#9660;</span>
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-white/10 bg-[#12121a] py-1 shadow-xl">
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { onChange(t); setOpen(false); }}
              className={'flex w-full items-center px-3.5 py-2.5 text-sm transition-colors ' +
                (t === value
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold'
                  : 'text-white/70 hover:bg-white/[0.06] hover:text-white')}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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

  // Build initial per-setup follow map: if editing, assign the saved overall status to each setup
  const initialFollowMap = {};
  if (initial && initial.setup_followed) {
    initialSetupIds.forEach((id) => { initialFollowMap[id] = initial.setup_followed; });
  }

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
    setup_follow_map: initialFollowMap,
    no_setup_reason: (initial && initial.no_setup_reason) || '',
    timeframe: (initial && initial.timeframe) || 'M5',
    session: (initial && initial.session) || '',
    trade_date: (initial && initial.trade_date) || todayStr(),
  });

  // Journal fields (create mode only)
  const EMOTIONS = resolveEmotions(prefs);
  const TAGS = resolveTags(prefs);
  const [journalOpen, setJournalOpen] = useState(false);
  const [emotions, setEmotions] = useState([]);
  const [confidence, setConfidence] = useState((prefs && prefs.default_confidence) || 0);
  const [note, setNote] = useState('');
  const [lesson, setLesson] = useState('');
  const [tradeTags, setTradeTags] = useState([]);
  const [screenshotUrls, setScreenshotUrls] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Risk:Reward state
  const [rrRisk, setRrRisk] = useState('1');
  const [rrReward, setRrReward] = useState('');
  const [rrManual, setRrManual] = useState(false);

  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  // Quick-add modals
  const [showAddSetup, setShowAddSetup] = useState(false);
  const [showAddEmotion, setShowAddEmotion] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [newSetupName, setNewSetupName] = useState('');
  const [newSetupDir, setNewSetupDir] = useState('');
  const [newEmotionName, setNewEmotionName] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);
  const [localSetups, setLocalSetups] = useState(null); // override for setups after quick-add
  const [localEmotions, setLocalEmotions] = useState(EMOTIONS);
  const [localTags, setLocalTags] = useState(TAGS);

  async function handleAddSetup() {
    const name = newSetupName.trim();
    if (!name) return;
    setQuickSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      const { data, error: err } = await supabase
        .from('setups')
        .insert({ user_id: user.id, name, direction: newSetupDir.trim() || null, is_default: false, is_active: true, sort_order: 999 })
        .select('id, name, direction, is_default, is_active')
        .single();
      if (err) throw err;
      setLocalSetups(prev => [...(prev || setups || []), data]);
      setNewSetupName('');
      setNewSetupDir('');
      setShowAddSetup(false);
      toast.success('Setup "' + name + '" added');
    } catch (e) {
      toast.error(e.message || 'Failed to add setup');
    }
    setQuickSaving(false);
  }

  async function handleAddEmotion() {
    const name = newEmotionName.trim();
    if (!name) return;
    setQuickSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      const existing = prefs?.custom_emotions || [];
      if (existing.includes(name)) { toast.error('Already exists'); setQuickSaving(false); return; }
      const updated = [...existing, name];
      const { error: err } = await supabase.from('user_preferences').update({ custom_emotions: updated }).eq('user_id', user.id);
      if (err) throw err;
      setLocalEmotions(prev => [...prev, name]);
      setNewEmotionName('');
      setShowAddEmotion(false);
      toast.success('Emotion "' + name + '" added');
    } catch (e) {
      toast.error(e.message || 'Failed to add emotion');
    }
    setQuickSaving(false);
  }

  async function handleAddTag() {
    const name = newTagName.trim().toLowerCase();
    if (!name) return;
    setQuickSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not logged in');
      const existing = prefs?.custom_tags || [];
      if (existing.includes(name)) { toast.error('Already exists'); setQuickSaving(false); return; }
      const updated = [...existing, name];
      const { error: err } = await supabase.from('user_preferences').update({ custom_tags: updated }).eq('user_id', user.id);
      if (err) throw err;
      setLocalTags(prev => [...prev, name]);
      setNewTagName('');
      setShowAddTag(false);
      toast.success('Tag "' + name + '" added');
    } catch (e) {
      toast.error(e.message || 'Failed to add tag');
    }
    setQuickSaving(false);
  }

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

  // Auto-calculate Risk:Reward from entry/exit/stop_loss
  useEffect(() => {
    if (rrManual) return; // user overrode manually
    const entry = Number(form.entry_price);
    const exit = Number(form.exit_price);
    const sl = Number(form.stop_loss);
    if (!Number.isFinite(entry) || !Number.isFinite(exit) || !Number.isFinite(sl)) {
      setRrReward('');
      return;
    }
    let risk, reward;
    if (form.direction === 'long') {
      risk = Math.abs(entry - sl);
      reward = Math.abs(exit - entry);
    } else {
      risk = Math.abs(sl - entry);
      reward = Math.abs(entry - exit);
    }
    if (risk <= 0) { setRrReward(''); return; }
    setRrRisk('1');
    setRrReward((reward / risk).toFixed(1));
  }, [form.entry_price, form.exit_price, form.stop_loss, form.direction, rrManual]);

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
    } catch (e) {
      console.warn('[TradeForm]', e?.message);
    }
  }, []);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  // Resolve active setups from DB — Good SL + Bad SL always included, sorted: regular A-Z → Good SL → Bad SL → No Setup
  const PINNED_SETUPS = ['Good SL', 'Bad SL'];
  const setupSource = localSetups || setups;
  const activeSetups = setupSource && setupSource.length > 0
    ? setupSource
        .filter((s) => s.is_active || PINNED_SETUPS.includes(s.name))
        .sort((a, b) => {
          // No Setup always last
          if (a.name === 'No Setup') return 1;
          if (b.name === 'No Setup') return -1;
          // Bad SL right before No Setup
          if (a.name === 'Bad SL') return 1;
          if (b.name === 'Bad SL') return -1;
          // Good SL right before Bad SL
          if (a.name === 'Good SL') return 1;
          if (b.name === 'Good SL') return -1;
          // Rest alphabetical
          return a.name.localeCompare(b.name);
        })
    : null;

  // Find selected setup objects (multi-select)
  const selectedSetups = activeSetups
    ? activeSetups.filter((s) => form.setup_ids.includes(s.id))
    : [];

  const hasNoSetup = selectedSetups.some((s) => s.is_default);

  // Compute overall setup_followed from per-setup map
  function computeOverallFollowed(followMap, ids) {
    const values = ids.map((id) => followMap[id]).filter(Boolean);
    if (values.length === 0) return '';
    if (values.every((v) => v === 'yes')) return 'yes';
    if (values.every((v) => v === 'no')) return 'no';
    return 'partial';
  }

  function toggleSetup(setupId) {
    if (!activeSetups) return;
    const chosen = activeSetups.find((s) => s.id === setupId);
    if (!chosen) return;

    setForm((f) => {
      let newIds = [...f.setup_ids];
      let newMap = { ...f.setup_follow_map };

      if (newIds.includes(setupId)) {
        // Deselect — remove from map
        newIds = newIds.filter((id) => id !== setupId);
        delete newMap[setupId];
      } else {
        // Select
        if (chosen.is_default) {
          // No Setup is exclusive — clear all others
          newIds = [setupId];
          newMap = {};
        } else {
          // Regular setup: remove No Setup if present, enforce max
          const noSetupEntry = activeSetups.find((s) => s.is_default);
          if (noSetupEntry) {
            newIds = newIds.filter((id) => id !== noSetupEntry.id);
            delete newMap[noSetupEntry.id];
          }
          if (newIds.length >= MAX_SETUPS) return f;
          newIds.push(setupId);
          // New setup starts with no follow status (blank)
        }
      }

      // Resolve names for backward compat
      const names = newIds
        .map((id) => (activeSetups.find((s) => s.id === id) || {}).name)
        .filter(Boolean);

      const isNoSetup = newIds.length > 0 && activeSetups.some((s) => s.is_default && newIds.includes(s.id));

      return {
        ...f,
        setup_ids: newIds,
        setup_id: newIds[0] || '',
        setup: names.join(', '),
        setup_follow_map: isNoSetup ? {} : newMap,
        setup_followed: isNoSetup ? '' : computeOverallFollowed(newMap, newIds),
        no_setup_reason: isNoSetup ? f.no_setup_reason : '',
      };
    });
  }

  function setSetupFollowed(setupId, value) {
    setForm((f) => {
      const newMap = { ...f.setup_follow_map };
      if (newMap[setupId] === value) {
        delete newMap[setupId]; // Toggle off
      } else {
        newMap[setupId] = value;
      }
      return {
        ...f,
        setup_follow_map: newMap,
        setup_followed: computeOverallFollowed(newMap, f.setup_ids),
      };
    });
  }

  function toggleTag(tag) {
    setTradeTags((cur) => cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]);
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      setError('Session expired. Please refresh the page and try again.');
      setUploading(false);
      return;
    }
    const newUrls = [];

    for (const file of files) {
      // Convert to WebP
      const processed = await processImageFile(file);
      if (processed.error) {
        setError(processed.error);
        setUploading(false);
        return;
      }

      const safe = processed.file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = user.id + '/new/' + Date.now() + '_' + safe;
      const up = await supabase.storage.from('screenshots').upload(path, processed.file, { upsert: true });
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

    // Validate: each selected regular setup must have a follow status
    const regularSetups = selectedSetups.filter((s) => !s.is_default);
    if (regularSetups.length > 0) {
      const missing = regularSetups.filter((s) => !form.setup_follow_map[s.id]);
      if (missing.length > 0) {
        const names = missing.map((s) => s.name).join(', ');
        setError('Please mark whether you followed each setup: ' + names);
        setSaving(false);
        return;
      }
    }

    const payload = { ...form };

    // Attach journal if in create mode and any journal field is filled
    if (mode === 'create' && (note || lesson || emotions.length || tradeTags.length || confidence || screenshotUrls.length)) {
      payload.journal = {
        note,
        lesson,
        emotions,
        tags: tradeTags,
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
      } catch (e) {
        console.warn('[TradeForm]', e?.message);
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
  const labelCls = 'mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55';

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-6">
        <form onSubmit={onSubmit} id="trade-form" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          {/* Section 1: Trade Details */}
          <div className="mb-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
              <span className="grid h-5 w-5 place-items-center rounded-md text-[10px]" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(34,211,238,0.2))' }}>1</span>
              Trade details
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="field-pair" className={labelCls}>Pair</label>
                <input id="field-pair" className={field} list="pairs" value={form.pair} onChange={(e) => set('pair', e.target.value)} />
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
                    className={'flex-1 rounded-lg border px-3 py-3 text-sm font-semibold ' + (form.direction === 'long' ? 'border-emerald-400/50 bg-emerald-500/15 text-emerald-300' : 'border-white/10 bg-black/30 text-white/50')}
                  >
                    &#9650; Long
                  </button>
                  <button
                    type="button"
                    onClick={() => set('direction', 'short')}
                    className={'flex-1 rounded-lg border px-3 py-3 text-sm font-semibold ' + (form.direction === 'short' ? 'border-red-400/50 bg-red-500/15 text-red-300' : 'border-white/10 bg-black/30 text-white/50')}
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
                      className={'rounded-lg border px-2 py-3 text-xs font-semibold sm:text-sm ' + (form.session === s ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/30 text-white/50')}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div><label htmlFor="field-trade_date" className={labelCls}>Trade date</label><input id="field-trade_date" type="date" className={field + ' cursor-pointer'} style={{ colorScheme: 'dark' }} value={form.trade_date} onChange={(e) => set('trade_date', e.target.value)} /></div>
              <TimeframeDropdown value={form.timeframe} onChange={(v) => set('timeframe', v)} labelCls={labelCls} fieldCls={field} />

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
                      <button type="button" onClick={() => setShowAddSetup(true)} className="rounded-full border border-dashed border-white/20 px-3 py-1.5 text-xs text-white/40 hover:text-white/70 hover:border-white/40 transition-colors" title="Add custom setup">+</button>
                    </div>
                    {/* Quick-add setup modal */}
                    {showAddSetup && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={() => { setShowAddSetup(false); setNewSetupName(''); setNewSetupDir(''); }}>
                        <div className="w-full max-w-md rounded-2xl border border-cyan-400/30 bg-[#12121a] p-6" onClick={e => e.stopPropagation()}>
                          <h3 className="mb-4 font-display text-base font-semibold">New setup</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/55">Setup name *</label>
                              <input type="text" value={newSetupName} onChange={e => setNewSetupName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddSetup())} placeholder="e.g. Breakout, Scalp, ChoCh..." className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60" maxLength={60} autoFocus />
                            </div>
                            <div>
                              <label className="mb-1 block font-mono text-xs uppercase tracking-wider text-white/55">Rule direction</label>
                              <textarea value={newSetupDir} onChange={e => setNewSetupDir(e.target.value)} placeholder="When should you take this setup? What conditions must be met?" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400/60 min-h-[80px]" rows={3} maxLength={500} />
                              <p className="mt-1 text-xs text-white/30">{(newSetupDir || '').length}/500 — Shows during trade logging to remind you.</p>
                            </div>
                          </div>
                          <div className="mt-5 flex gap-3">
                            <button type="button" onClick={() => { setShowAddSetup(false); setNewSetupName(''); setNewSetupDir(''); }} className="rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white/70">Cancel</button>
                            <button type="button" onClick={handleAddSetup} disabled={quickSaving || !newSetupName.trim()} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>{quickSaving ? 'Saving...' : 'Create setup'}</button>
                          </div>
                        </div>
                      </div>
                    )}
                    {form.setup_ids.length > 0 && (
                      <p className="mt-1.5 font-mono text-[11px] text-white/40">
                        {form.setup_ids.length}/{MAX_SETUPS} selected
                      </p>
                    )}
                  </div>
                ) : (
                  <select id="field-setup" className={field} value={form.setup} onChange={(e) => set('setup', e.target.value)}>
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

            {/* Setup cards with directions + inline follow tracking */}
            {selectedSetups.length > 0 && (
              <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
                {/* Each setup: direction + follow buttons in one card */}
                {!hasNoSetup && (
                  <div className="space-y-3">
                    {selectedSetups.filter((s) => !s.is_default).map((s) => {
                      const val = form.setup_follow_map[s.id] || '';
                      return (
                        <div key={s.id} className="rounded-lg bg-white/[0.02] px-3 py-2.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[10px] uppercase text-cyan-400/60">{s.name}</span>
                            <div className="flex gap-1">
                              {[
                                { v: 'yes', l: 'Yes', color: 'emerald' },
                                { v: 'partial', l: 'Partial', color: 'amber' },
                                { v: 'no', l: 'No', color: 'red' },
                              ].map((opt) => {
                                const active = val === opt.v;
                                const cls = active
                                  ? 'border-' + opt.color + '-400/50 bg-' + opt.color + '-500/15 text-' + opt.color + '-300'
                                  : 'border-white/10 bg-black/20 text-white/40';
                                return (
                                  <button
                                    key={opt.v}
                                    type="button"
                                    onClick={() => setSetupFollowed(s.id, opt.v)}
                                    className={'rounded-md border px-2 py-1 text-[10px] font-semibold ' + cls}
                                  >
                                    {opt.l}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          {s.direction && <p className="mt-1 text-sm leading-relaxed text-white/60">{s.direction}</p>}
                        </div>
                      );
                    })}
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
                            className={'rounded-full border px-3 py-2 text-xs ' + (active ? 'border-red-400/50 bg-red-500/15 text-red-200' : 'border-white/10 bg-black/30 text-white/50 hover:text-white')}
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
              <div><label htmlFor="field-entry_price" className={labelCls}>Entry price</label><input id="field-entry_price" className={field} value={form.entry_price} onChange={(e) => set('entry_price', e.target.value)} inputMode="decimal" /></div>
              <div><label htmlFor="field-exit_price" className={labelCls}>Exit price</label><input id="field-exit_price" className={field} value={form.exit_price} onChange={(e) => set('exit_price', e.target.value)} inputMode="decimal" /></div>
              <div><label htmlFor="field-stop_loss" className={labelCls}>Stop loss <span className="text-white/30">(optional)</span></label><input id="field-stop_loss" className={field} value={form.stop_loss} onChange={(e) => set('stop_loss', e.target.value)} inputMode="decimal" /></div>
              <div><label htmlFor="field-lot_size" className={labelCls}>Lot / Contract size</label><input id="field-lot_size" className={field} value={form.lot_size} onChange={(e) => set('lot_size', e.target.value)} inputMode="decimal" /></div>
            </div>
          </div>

          {/* Section 3: Result */}
          <div className="border-t border-white/[0.06] pt-5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/50">
              <span className="grid h-5 w-5 place-items-center rounded-md text-[10px]" style={{ background: 'linear-gradient(135deg,rgba(139,92,246,0.3),rgba(34,211,238,0.2))' }}>3</span>
              Result
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label htmlFor="field-pnl" className={labelCls}>P&L ($) *</label><input id="field-pnl" className={field} value={form.pnl} onChange={(e) => set('pnl', e.target.value)} inputMode="decimal" placeholder="e.g. 145 or -90" /></div>
              <div>
                <label className={labelCls}>Risk : Reward <span className="text-white/30">(auto)</span></label>
                <div className="flex items-center gap-2">
                  <input
                    className="w-14 rounded-lg border border-white/10 bg-black/30 px-2 py-2.5 text-center text-sm font-semibold outline-none focus:border-cyan-400/60"
                    value={rrRisk}
                    onChange={(e) => { setRrRisk(e.target.value); setRrManual(true); }}
                    inputMode="decimal"
                    placeholder="1"
                    maxLength={4}
                  />
                  <span className="font-mono text-sm font-bold text-white/40">:</span>
                  <input
                    className="w-14 rounded-lg border border-white/10 bg-black/30 px-2 py-2.5 text-center text-sm font-semibold outline-none focus:border-cyan-400/60"
                    value={rrReward}
                    onChange={(e) => { setRrReward(e.target.value); setRrManual(true); }}
                    inputMode="decimal"
                    placeholder="—"
                    maxLength={4}
                  />
                </div>
              </div>
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
                      {localEmotions.map((em) => {
                        const on = emotions.includes(em);
                        return (
                          <button
                            key={em}
                            type="button"
                            onClick={() => toggleEmotion(em)}
                            className={'rounded-full border px-3 py-2 text-xs ' + (on ? 'border-violet-400/50 bg-violet-500/15 text-violet-200' : 'border-white/10 bg-black/30 text-white/50 hover:text-white')}
                          >
                            {em}
                          </button>
                        );
                      })}
                      <button type="button" onClick={() => setShowAddEmotion(true)} className="rounded-full border border-dashed border-white/20 px-3 py-2 text-xs text-white/40 hover:text-white/70 hover:border-white/40 transition-colors" title="Add custom emotion">+</button>
                    </div>
                    {showAddEmotion && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-400/[0.04] p-2">
                        <input type="text" value={newEmotionName} onChange={e => setNewEmotionName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddEmotion())} placeholder="Emotion name" className="w-32 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-400/40" autoFocus />
                        <button type="button" onClick={handleAddEmotion} disabled={quickSaving || !newEmotionName.trim()} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#08080f] disabled:opacity-50" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>{quickSaving ? '...' : 'Add'}</button>
                        <button type="button" onClick={() => { setShowAddEmotion(false); setNewEmotionName(''); }} className="text-xs text-white/40 hover:text-white/70">✕</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="field-confidence" className={labelCls}>Confidence at entry</label>
                    <div id="field-confidence" className="flex gap-1 text-2xl">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <button key={i} type="button" onClick={() => setConfidence(i)} className={'p-1 ' + (i <= confidence ? 'text-amber-400' : 'text-white/40')}>
                          &#9733;
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Tags</label>
                    <div className="flex flex-wrap gap-2">
                      {localTags.map((tag) => {
                        const on = tradeTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={'rounded-full border px-3 py-2 text-xs ' + (on ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200' : 'border-white/10 bg-black/30 text-white/50 hover:text-white')}
                          >
                            {tag}
                          </button>
                        );
                      })}
                      <button type="button" onClick={() => setShowAddTag(true)} className="rounded-full border border-dashed border-white/20 px-3 py-2 text-xs text-white/40 hover:text-white/70 hover:border-white/40 transition-colors" title="Add custom tag">+</button>
                    </div>
                    {showAddTag && (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-xl border border-violet-400/20 bg-violet-400/[0.04] p-2">
                        <input type="text" value={newTagName} onChange={e => setNewTagName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} placeholder="Tag name" className="w-32 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-xs text-white outline-none focus:border-violet-400/40" autoFocus />
                        <button type="button" onClick={handleAddTag} disabled={quickSaving || !newTagName.trim()} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#08080f] disabled:opacity-50" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>{quickSaving ? '...' : 'Add'}</button>
                        <button type="button" onClick={() => { setShowAddTag(false); setNewTagName(''); }} className="text-xs text-white/40 hover:text-white/70">✕</button>
                      </div>
                    )}
                  </div>
                  <div>
                    <label htmlFor="field-notes" className={labelCls}>Notes — what happened & why?</label>
                    <textarea
                      id="field-notes"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={4}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-cyan-400/60"
                      placeholder="Your reasoning, what went well, what you'd change..."
                    />
                  </div>
                  <div>
                    <label htmlFor="field-lesson" className={labelCls}>Lesson learned</label>
                    <textarea
                      id="field-lesson"
                      value={lesson}
                      onChange={(e) => setLesson(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm leading-relaxed outline-none focus:border-cyan-400/60"
                      placeholder="What will you do differently next time?"
                    />
                  </div>
                  <div>
                    <label htmlFor="field-screenshots" className={labelCls}>Chart screenshots</label>
                    {screenshotUrls.length > 0 && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {screenshotUrls.map((url, i) => (
                          <div key={`${url}-${i}`} className="group relative">
                            <img src={url} alt="" className="h-20 w-20 rounded-lg border border-white/10 object-cover" />
                            <button
                              type="button"
                              onClick={() => removeScreenshot(i)}
                              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white"
                            >
                              &#10005;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <input
                      id="field-screenshots"
                      type="file"
                      accept="image/*,application/pdf"
                      multiple
                      onChange={onFiles}
                      className="block w-full text-sm text-white/60 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2.5 file:text-sm file:text-white"
                    />
                    {uploading && <p className="mt-1 text-xs text-cyan-400">Processing & uploading...</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

          <div className="mt-6 flex gap-3">
            <Link href={mode === 'edit' ? '/dashboard/trades/' + tradeId : '/dashboard/trades'} className="rounded-xl border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white/70">Cancel</Link>
            <button type="submit" disabled={saving || uploading} className="rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
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
        {selectedSetups.length > 0 && (
          <div className="mt-2 space-y-1">
            {selectedSetups.map((s) => {
              const val = form.setup_follow_map[s.id] || '';
              const followBadge = val === 'yes' ? 'bg-emerald-500/15 text-emerald-300'
                : val === 'partial' ? 'bg-amber-500/15 text-amber-300'
                : val === 'no' ? 'bg-red-500/15 text-red-300' : '';
              const followLabel = val === 'yes' ? 'Followed' : val === 'partial' ? 'Partial' : val === 'no' ? 'Not followed' : '';
              return (
                <div key={s.id} className="flex items-center gap-1.5">
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300">{s.name}</span>
                  {followLabel && <span className={'rounded-full px-2 py-0.5 text-xs ' + followBadge}>{followLabel}</span>}
                </div>
              );
            })}
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
