"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { generateShareCode, updateProfileSettings } from '@/app/dashboard/settings/profile-actions';
import { useToast } from '@/components/Toast';

const gradientText = { background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' };
const field = 'w-full rounded-lg border border-white/10 bg-black/30 px-3.5 py-2.5 text-sm outline-none focus:border-cyan-400/60';
const labelCls = 'mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55';
const dateStyle = { colorScheme: 'dark' };

function Toggle({ label, checked, onChange, desc }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5">
      <div>
        <div className="text-sm font-semibold">{label}</div>
        {desc && <p className="mt-0.5 text-xs text-white/40">{desc}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={'relative h-6 w-11 rounded-full transition-colors ' + (checked ? 'bg-cyan-500' : 'bg-white/15')}
      >
        <span className={'absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ' + (checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </div>
  );
}

export default function PublicProfileSettings({ prefs }) {
  const router = useRouter();
  const toast = useToast();
  const [shareCode, setShareCode] = useState(prefs?.share_code || '');
  const [showCalendar, setShowCalendar] = useState(prefs?.show_calendar || false);
  const [showTrades, setShowTrades] = useState(prefs?.show_trades || false);
  const [showPayouts, setShowPayouts] = useState(prefs?.show_payouts || false);
  const [showTrophies, setShowTrophies] = useState(prefs?.show_trophies || false);
  const [calendarMode, setCalendarMode] = useState(prefs?.calendar_mode || 'rolling');
  const [calendarStart, setCalendarStart] = useState(prefs?.calendar_start || '');
  const [calendarEnd, setCalendarEnd] = useState(prefs?.calendar_end || '');
  const [rollingDays, setRollingDays] = useState(prefs?.calendar_rolling_days || 30);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);

  const profileUrl = shareCode ? (typeof window !== 'undefined' ? window.location.origin : '') + '/profile/' + shareCode : '';

  async function handleGenerate() {
    setGenerating(true);
    const res = await generateShareCode();
    if (res.error) { if (toast) toast.error(res.error); }
    else { setShareCode(res.share_code); if (toast) toast.success('Profile link generated!'); }
    setGenerating(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(profileUrl);
    if (toast) toast.success('Link copied!');
  }

  async function handleToggle(key, value) {
    if (key === 'show_calendar') setShowCalendar(value);
    if (key === 'show_trades') setShowTrades(value);
    if (key === 'show_payouts') setShowPayouts(value);
    if (key === 'show_trophies') setShowTrophies(value);
    await updateProfileSettings({ [key]: value });
    router.refresh();
  }

  async function handleSaveCalendarSettings() {
    setSaving(true);
    await updateProfileSettings({
      calendar_mode: calendarMode,
      calendar_start: calendarStart,
      calendar_end: calendarEnd,
      calendar_rolling_days: rollingDays,
    });
    setSaving(false);
    if (toast) toast.success('Calendar settings saved!');
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="mb-5 flex items-center gap-2">
        <span className="text-lg">&#127760;</span>
        <h2 className="font-display text-lg font-bold" style={gradientText}>Public Profile</h2>
      </div>
      <p className="mb-5 text-sm text-white/55">
        Share your trading achievements publicly. Control what others can see.
      </p>

      {/* Share link */}
      <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
        <label className={labelCls}>Your shareable link</label>
        {shareCode ? (
          <div className="flex gap-2">
            <input className={field + ' flex-1 bg-white/[0.02] text-white/70'} value={profileUrl} readOnly />
            <button onClick={handleCopy} className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20">
              Copy
            </button>
          </div>
        ) : (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#ffc42d,#ff9f1c)' }}
          >
            {generating ? 'Generating...' : 'Generate public link'}
          </button>
        )}
      </div>

      {/* Visibility toggles */}
      <div className="mb-5 space-y-2">
        <label className={labelCls}>What to show publicly</label>
        <Toggle
          label="P&L Calendar"
          desc="Show your trade results on a calendar"
          checked={showCalendar}
          onChange={(v) => handleToggle('show_calendar', v)}
        />
        <Toggle
          label="Trade List"
          desc="Show recent trades (pair, direction, P&L, date)"
          checked={showTrades}
          onChange={(v) => handleToggle('show_trades', v)}
        />
        <Toggle
          label="Total Payouts"
          desc="Show payout amounts and firm breakdown"
          checked={showPayouts}
          onChange={(v) => handleToggle('show_payouts', v)}
        />
        <Toggle
          label="Trophy Wall"
          desc="Show your uploaded certificates and proofs"
          checked={showTrophies}
          onChange={(v) => handleToggle('show_trophies', v)}
        />
      </div>

      {/* Calendar date range — only if calendar or trades is enabled */}
      {(showCalendar || showTrades) && (
        <div className="rounded-xl border border-white/10 bg-black/20 p-4">
          <label className={labelCls}>Date range (for calendar &amp; trades)</label>
          <div className="mb-3 flex gap-2">
            {[
              { v: 'rolling', l: 'Rolling window' },
              { v: 'fixed', l: 'Fixed dates' },
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => setCalendarMode(opt.v)}
                className={'flex-1 rounded-lg border px-3 py-2.5 text-xs font-semibold ' + (calendarMode === opt.v ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/30 text-white/50')}
              >
                {opt.l}
              </button>
            ))}
          </div>

          {calendarMode === 'rolling' ? (
            <div>
              <label className={labelCls}>Show last</label>
              <div className="flex gap-2">
                {[30, 60, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setRollingDays(d)}
                    className={'flex-1 rounded-lg border px-3 py-2 text-sm font-semibold ' + (rollingDays === d ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/30 text-white/50')}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Start date</label>
                <input type="date" className={field + ' cursor-pointer'} style={dateStyle} value={calendarStart} onChange={(e) => setCalendarStart(e.target.value)} />
              </div>
              <div>
                <label className={labelCls}>End date</label>
                <input type="date" className={field + ' cursor-pointer'} style={dateStyle} value={calendarEnd} onChange={(e) => setCalendarEnd(e.target.value)} />
              </div>
            </div>
          )}

          <button
            onClick={handleSaveCalendarSettings}
            disabled={saving}
            className="mt-3 rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/70 hover:text-white disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save date settings'}
          </button>
        </div>
      )}
    </div>
  );
}
