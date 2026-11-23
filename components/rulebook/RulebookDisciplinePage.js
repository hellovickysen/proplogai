"use client";

import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveDisciplineRule } from '@/app/dashboard/rulebook/discipline-actions';
import { RULEBOOK_DEFAULT_LIMITS } from '@/lib/rulebook-default-limits.mjs';
import { rulebookDate, ruleForDate, ruleHistoryEntries, recentRuleHistory } from '@/lib/rulebook-history.mjs';

function todayLocal() { return rulebookDate(); }

function loggedAt(value) {
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? String(value || 'Time unavailable') : new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(timestamp) + ' IST';
}

function ruleValueLabel(entry) {
  if (!entry.enabled) return 'Disabled';
  const names = { a_plus_only: 'A+ only', a_or_a_plus: 'A or A+', any_valid_setup: 'Any valid setup', avoid_news: 'Avoid news', trade_news: 'Trade news', no_rule: 'No news rule' };
  if (!entry.value) return 'Enabled';
  return names[entry.value] || `${entry.value}${entry.unit ? ` ${entry.unit}` : ''}`;
}

function RuleHistoryTimeline({ entries, compact = false }) {
  return <div className="relative ml-2 mt-5 border-l border-cyan-400/25 pl-5">
    {entries.map((entry, index) => <div key={`${entry.ruleId}-${entry.effective_from}-${entry.recorded_at}-${index}`} className="relative pb-5 last:pb-0">
      <span aria-hidden="true" className="absolute -left-[26px] top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0b101d] bg-cyan-300" />
      <div className="rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1"><div className="min-w-0"><p className="font-semibold text-white">{entry.title} <span className="ml-1 text-xs font-normal text-white/45">{entry.accountId ? 'Account rule' : 'Global rule'}</span></p><p className="mt-1 text-xs text-white/50">{entry.legacy ? 'First known snapshot' : 'Recorded'} {loggedAt(entry.recorded_at)}</p></div><span className={entry.enabled ? 'font-medium text-cyan-300' : 'text-white/45'}>{ruleValueLabel(entry)}</span></div>
        <p className="mt-2 text-xs text-white/60">{entry.scheduled ? "Scheduled · applies to trades from " : "Applies to trades from "}{entry.effective_from}{entry.legacy ? ' · earlier values unavailable' : ''}</p>
      </div>
    </div>)}
    {!entries.length && <p className="rounded-xl border border-white/10 p-5 text-sm text-white/55">{compact ? 'No rule changes logged in the last three months.' : 'No saved Rulebook changes yet. Save a rule to start its timeline.'}</p>}
  </div>;
}

const NON_NEGOTIABLES = [
  { key: 'daily_loss_limit', title: 'Daily Loss Limit', type: 'daily_loss_limit', value: RULEBOOK_DEFAULT_LIMITS.daily_loss_limit, unit: '$', before: 'I will never lose more than', after: 'in one day.', detail: 'When I reach it, I stop trading.' },
  { key: 'risk_per_trade', title: 'Risk Per Trade', type: 'risk_per_trade', value: '100', unit: '$', before: 'I will never risk more than', after: 'on one trade.', detail: 'This is my maximum planned loss for a trade.', units: ['$', '%'] },
  { key: 'maximum_lot_contract_size', title: 'Maximum Lot / Contract Size', type: 'max_position_size', value: RULEBOOK_DEFAULT_LIMITS.maximum_lot_contract_size, unit: 'lot / contract', before: 'I will never trade more than', after: 'on one trade.', detail: '' },
  { key: 'maximum_trades_per_day', title: 'Maximum Trades Per Day', type: 'max_trades_per_day', value: '2', unit: 'trades', before: 'I will never take more than', after: 'in one trading day.', detail: '' },
  { key: 'consecutive_loss_limit', title: 'Consecutive Loss Limit', type: 'consecutive_losses', value: '2', unit: 'losses', before: 'I will stop after', after: 'in a row.', detail: 'After reaching this limit, I stop trading for the day.' },
];

const BEHAVIORS = [
  { key: 'no_revenge_trading', title: 'No Revenge Trading', description: 'I will not increase my risk to recover a loss.' },
  { key: 'no_fomo_entries', title: 'No FOMO Entries', description: 'If I miss my setup, I will not chase the trade.' },
  { key: 'never_move_stop_loss', title: 'Never Move Stop Loss', description: 'I will not move my stop farther away after entering a trade.' },
  { key: 'trade_my_setup', title: 'Trade My Setup', description: 'I will only enter when my defined setup is present.' },
  { key: 'no_overtrading', title: 'No Overtrading', description: 'Once I reach my planned trading limit, I am done for the day.' },
];

const CONDITIONS = [
  { key: 'trading_hours', title: 'Trading Hours', description: 'I only trade during my chosen trading window.' },
  { key: 'news_trading', title: 'News Trading', description: 'Choose whether news events are part of my trading rules.', options: [['avoid_news', 'Avoid News'], ['trade_news', 'Trade News'], ['no_rule', 'No Rule']], defaultValue: 'no_rule' },
  { key: 'minimum_setup_quality', title: 'Minimum Setup Quality', description: 'Define the minimum setup quality I am willing to trade. This is a personal rule, not a recommendation.', options: [['a_plus_only', 'A+ Only'], ['a_or_a_plus', 'A or A+'], ['any_valid_setup', 'Any Valid Setup']], defaultValue: 'a_or_a_plus' },
];

function StatusLight({ active, className = '' }) {
  return <span title={active ? 'Active' : 'Inactive'} className={'h-2.5 w-2.5 shrink-0 rounded-full ' + (active ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-white/25') + ' ' + className} />;
}

function RuleToggle({ enabled, onToggle, saving = false }) {
  return <button type="button" onClick={onToggle} disabled={saving} aria-pressed={enabled} className={'flex h-6 items-center gap-1 rounded-full border px-1 transition-colors ' + (enabled ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300' : 'border-white/15 bg-white/[0.03] text-white/40')}><span className="font-mono text-[9px] font-semibold">{enabled ? 'ON' : 'OFF'}</span><span className={'h-4 w-4 rounded-full bg-[#08080f] transition-transform ' + (enabled ? 'translate-x-0' : '')} /></button>;
}

function NumberRule({ rule, stored, accountId }) {
  const [value, setValue] = useState(stored?.value || rule.value);
  const [unit, setUnit] = useState(stored?.unit || rule.unit);
  const [effectiveFrom, setEffectiveFrom] = useState(todayLocal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const router = useRouter();
  useEffect(() => { setValue(stored?.value || rule.value); setUnit(stored?.unit || rule.unit); }, [stored?.value, stored?.unit, rule.value, rule.unit]);

  async function save() {
    setError(''); setNotice('');
    if (!value || Number(value) <= 0) { setError('Enter a value greater than 0.'); return; }
    if (['maximum_trades_per_day', 'consecutive_loss_limit'].includes(rule.key) && (!Number.isInteger(Number(value)) || Number(value) < 1)) { setError('Enter a whole number of at least 1.'); return; }
    setSaving(true);
    const result = await saveDisciplineRule({ account_id: accountId, category: 'non_negotiable', rule_key: rule.key, rule_type: rule.type, title: rule.title, description: rule.detail, value, unit, effective_from: effectiveFrom, sort_order: NON_NEGOTIABLES.findIndex((item) => item.key === rule.key) + 1 });
    if (result.error) setError(result.error);
    else { setValue(result.currentValue || rule.value); setUnit(result.currentUnit || rule.unit); setNotice(result.scheduled ? `Saved for ${result.effectiveFrom}. It will not apply before that date.` : `Saved from ${result.effectiveFrom}. Earlier effective versions are preserved.`); setEffectiveFrom(todayLocal()); router.refresh(); }
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3"><span className="rounded-full border border-red-400/25 bg-red-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-300">Non-negotiable</span></div>
      <h3 className="mt-3 font-display text-base font-semibold">{rule.title}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed text-white/70">
        <span>{rule.before}</span>
        <div className="flex rounded-lg border border-white/10 bg-black/30 focus-within:border-cyan-400/60">
          <input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" className="w-20 bg-transparent px-2.5 py-1.5 text-sm font-semibold outline-none" aria-label={rule.title} />
          {rule.units ? <select value={unit} onChange={(event) => setUnit(event.target.value)} className="border-l border-white/10 bg-transparent px-2 text-[11px] text-white/55 outline-none">{rule.units.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <span className="flex items-center border-l border-white/10 px-2 text-[11px] text-white/60">{unit}</span>}
        </div>
        <span>{rule.after}</span>
      </div>
      {rule.detail && <p className="mt-1 text-xs text-white/60">{rule.detail}</p>}
      {!stored && <p className="mt-2 text-xs text-amber-300/80">Displayed default · compared retrospectively in analytics. Save your own value and effective date for a dated rule.</p>}
      <label className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/55">Effective from trading date <input type="date" value={effectiveFrom} onChange={(event) => setEffectiveFrom(event.target.value)} className="rounded-lg border border-white/15 bg-[#08080f] px-2 py-1.5 text-white/80" /></label>
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      {notice && <p role="status" className="mt-2 text-xs text-cyan-200">{notice}</p>}
      <button type="button" onClick={save} disabled={saving} className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
    </div>
  );
}

function ToggleRule({ rule, stored, accountId, custom = false }) {
  const [enabled, setEnabled] = useState(stored ? stored.enabled : false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  async function toggle() {
    const next = !enabled; setEnabled(next); setSaving(true);
    const result = await saveDisciplineRule({ account_id: accountId, category: custom ? 'custom' : 'behavior', rule_key: rule.key, rule_type: custom ? 'custom_behavior' : rule.key, title: rule.title, description: rule.description, value: '', unit: null, enabled: next, effective_from: todayLocal(), sort_order: 1 });
    if (!result.error) router.refresh(); else setEnabled(!next);
    setSaving(false);
  }
  return <div className="relative flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 pl-9"><StatusLight active={enabled} className="absolute left-3 top-3" /><div className="min-w-0 flex-1"><h3 className="font-display text-sm font-semibold">{rule.title}</h3><p className="mt-1 text-xs leading-relaxed text-white/60">{rule.description}</p></div><RuleToggle enabled={enabled} onToggle={toggle} saving={saving} /></div>;
}

function SegmentedRule({ rule, stored, accountId }) {
  const [value, setValue] = useState(stored?.value || rule.defaultValue);
  const [enabled, setEnabled] = useState(stored ? stored.enabled : false);
  const router = useRouter();
  async function save(nextValue = value, nextEnabled = enabled) {
    setValue(nextValue); setEnabled(nextEnabled);
    const result = await saveDisciplineRule({ account_id: accountId, category: 'condition', rule_key: rule.key, rule_type: rule.key, title: rule.title, description: rule.description, value: nextValue, unit: null, enabled: nextEnabled, effective_from: todayLocal(), sort_order: 1 });
    if (!result.error) router.refresh();
  }
  return <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4 pl-9"><StatusLight active={enabled} className="absolute left-3 top-3" /><div className="flex items-start justify-between gap-3 pr-12"><div><h3 className="font-display text-base font-semibold">{rule.title}</h3><p className="mt-1 text-xs leading-relaxed text-white/60">{rule.description}</p></div><RuleToggle enabled={enabled} onToggle={() => save(value, !enabled)} /></div><div className="mt-3 flex flex-wrap gap-1.5">{rule.options.map(([key, label]) => <button key={key} type="button" onClick={() => save(key, enabled)} className={'rounded-lg border px-3 py-2 text-xs font-semibold ' + (value === key ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/20 bg-white/[0.04] text-white/65 hover:border-white/30 hover:bg-white/[0.07]')}>{label}</button>)}</div></div>;
}

function TradingHours({ stored, accountId }) {
  const initial = stored?.metadata || {};
  const [enabled, setEnabled] = useState(stored ? stored.enabled : false);
  const [sessions, setSessions] = useState(initial.sessions || []);
  const router = useRouter();
  async function save(nextSessions = sessions, nextEnabled = enabled) {
    setSessions(nextSessions); setEnabled(nextEnabled);
    const result = await saveDisciplineRule({ account_id: accountId, category: 'condition', rule_key: 'trading_hours', rule_type: 'trading_sessions', title: 'Trading Hours', description: 'I only trade during my chosen sessions.', value: nextSessions.join(', '), unit: 'sessions', enabled: nextEnabled, effective_from: todayLocal(), metadata: { sessions: nextSessions }, sort_order: 1 });
    if (!result.error) router.refresh();
  }
  function toggleSession(session) { const next = sessions.includes(session) ? sessions.filter((item) => item !== session) : [...sessions, session]; save(next, enabled); }
  return <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4 pl-9"><StatusLight active={enabled} className="absolute left-3 top-3" /><div className="flex items-start justify-between gap-3 pr-12"><div><h3 className="font-display text-base font-semibold">Trading Hours</h3><p className="mt-1 text-xs text-white/60">I only trade during my chosen sessions.</p></div><RuleToggle enabled={enabled} onToggle={() => save(sessions, !enabled)} /></div><div className="mt-3 flex flex-wrap gap-1.5">{['Asian', 'London', 'New York'].map((session) => <button key={session} type="button" onClick={() => toggleSession(session)} className={'rounded-lg border px-3 py-2 text-xs font-semibold ' + (sessions.includes(session) ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/20 bg-white/[0.04] text-white/65 hover:border-white/30 hover:bg-white/[0.07]')}>{session}</button>)}</div></div>;
}

function CustomRuleModal({ onClose, accountId, onSaved }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  async function save() { if (!title.trim()) { setError('Enter a rule name.'); return; } setSaving(true); const result = await saveDisciplineRule({ account_id: accountId, category: 'custom', rule_key: 'custom_' + Date.now(), rule_type: 'custom_behavior', title, description, value: '', unit: null, enabled: false, effective_from: todayLocal(), sort_order: 99 }); if (result.error) setError(result.error); else onSaved(); setSaving(false); }
  return <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-5" onClick={(event) => event.stopPropagation()}><h2 className="font-display text-lg font-semibold">Add Custom Rule</h2><div className="mt-4 space-y-3"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Rule name" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" /><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the rule I want to follow..." rows={3} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" />{error && <p className="text-xs text-red-300">{error}</p>}</div><div className="mt-4 flex gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">Cancel</button><button type="button" onClick={save} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>{saving ? 'Saving...' : 'Save Rule'}</button></div></div></div>;
}

export default function RulebookDisciplinePage({ rules = [], scopeAccount = null }) {
  const [showCustom, setShowCustom] = useState(false);
  const [tab, setTab] = useState('rules');
  const router = useRouter();
  const stored = useMemo(() => Object.fromEntries(rules.map((rule) => ruleForDate(rule, todayLocal())).filter(Boolean).sort((a, b) => Number(!!a.account_id) - Number(!!b.account_id)).map((rule) => [rule.rule_key, rule])), [rules]);
  const scopeLabel = scopeAccount ? scopeAccount.name + ' overrides' : 'Global defaults';
  const enabledBehaviors = BEHAVIORS.filter((rule) => stored[rule.key]?.enabled).length;
  const savedActiveRules = Object.values(stored).filter((rule) => rule.enabled).length;
  const savedNonNegotiables = NON_NEGOTIABLES.filter((rule) => stored[rule.key]?.enabled).length;
  const response = stored.rule_break_response?.value || 'review_first';
  const responseEnabled = stored.rule_break_response ? stored.rule_break_response.enabled : false;
  const history = useMemo(() => ruleHistoryEntries(rules), [rules]);
  const recentHistory = useMemo(() => recentRuleHistory(history), [history]);

  async function saveResponse(value = response, enabled = responseEnabled) { await saveDisciplineRule({ account_id: scopeAccount?.id || null, category: 'response', rule_key: 'rule_break_response', rule_type: 'rule_break_response', title: 'When I Break a Rule', description: 'Decide what happens after I violate one of my own rules.', value, unit: null, enabled, effective_from: todayLocal(), sort_order: 1 }); router.refresh(); }

  return <div className="px-4 py-8 sm:px-6"><div className="mb-7 flex flex-wrap items-start justify-between gap-3"><div className="max-w-2xl"><span className="font-mono text-xs uppercase tracking-wider text-cyan-300">Your discipline foundation</span><h1 className="mt-2 font-display text-3xl font-bold">Rulebook</h1><p className="mt-2 text-sm leading-relaxed text-white/55">These are the rules I choose to follow before and during trading. They are personal boundaries, not trading recommendations.</p></div><div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">● Rulebook Active</div></div><div className="mb-6 flex items-center gap-2 font-mono text-xs text-white/60"><span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">{scopeLabel}</span><span>{savedActiveRules} saved active rules</span></div>
    <div className="mb-6 flex gap-2 border-b border-white/10" role="tablist" aria-label="Rulebook sections"><button type="button" role="tab" aria-selected={tab === 'rules'} onClick={() => setTab('rules')} className={'px-4 py-2.5 text-sm font-semibold ' + (tab === 'rules' ? 'border-b-2 border-cyan-400 text-white' : 'text-white/55')}>My rules</button><button type="button" role="tab" aria-selected={tab === 'log'} onClick={() => setTab('log')} className={'px-4 py-2.5 text-sm font-semibold ' + (tab === 'log' ? 'border-b-2 border-cyan-400 text-white' : 'text-white/55')}>Rule history</button></div>
    {tab === 'log' ? <section role="tabpanel"><h2 className="font-display text-xl font-semibold">Full rule history</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-white/60">Recorded means when you saved a change. Applies from is the first trading date that uses it. Times are in IST. First known snapshots show only the last saved state; earlier overwritten values are unavailable. Older Analytics comparisons are labeled retrospective.</p><RuleHistoryTimeline entries={history} /></section> : <>
    <section className="mb-8 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.035] p-4 sm:p-5"><div className="flex flex-wrap items-center justify-between gap-2"><div><h2 className="font-display text-lg font-semibold">Recent rule changes</h2><p className="mt-1 text-xs text-white/55">Recorded in the last three calendar months · newest first · IST</p></div><button type="button" onClick={() => setTab('log')} className="rounded-lg border border-cyan-400/25 px-3 py-2 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/10">View full history →</button></div><RuleHistoryTimeline entries={recentHistory.slice(0, 5)} compact />{recentHistory.length > 5 && <p className="mt-3 text-xs text-white/50">Showing 5 of {recentHistory.length} recent records. Open full history to see all changes.</p>}</section>
    <section><h2 className="font-display text-xl font-semibold">1. Non-negotiables</h2><p className="mt-1 text-sm text-white/60">Set the limits I will follow before I trade.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{NON_NEGOTIABLES.map((rule) => <NumberRule key={rule.key} rule={rule} stored={stored[rule.key]} accountId={scopeAccount?.id || null} />)}</div></section>
    <section className="mt-9"><h2 className="font-display text-xl font-semibold">2. Trading Behavior</h2><p className="mt-1 text-sm text-white/60">Rules that protect me from emotional and impulsive decisions.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{BEHAVIORS.map((rule) => <ToggleRule key={rule.key} rule={rule} stored={stored[rule.key]} accountId={scopeAccount?.id || null} />)}{rules.filter((rule) => rule.category === 'custom').map((rule) => <ToggleRule key={rule.id} rule={{ key: rule.rule_key, title: rule.title, description: rule.guidance }} stored={rule} accountId={scopeAccount?.id || null} custom />)}</div><button type="button" onClick={() => setShowCustom(true)} className="mt-4 rounded-lg border border-dashed border-white/20 px-3 py-2 text-xs text-white/50 hover:border-cyan-400/40 hover:text-cyan-300">+ Add Custom Rule</button></section>
    <section className="mt-9"><h2 className="font-display text-xl font-semibold">3. Trading Conditions</h2><p className="mt-1 text-sm text-white/60">Define when and how I allow myself to trade.</p><div className="mt-4 grid gap-4 sm:grid-cols-3"><TradingHours stored={stored.trading_hours} accountId={scopeAccount?.id || null} />{CONDITIONS.slice(1).map((rule) => <SegmentedRule key={rule.key} rule={rule} stored={stored[rule.key]} accountId={scopeAccount?.id || null} />)}</div></section>
    <section className="mt-9"><div className="flex flex-wrap items-start gap-3"><div><h2 className="font-display text-xl font-semibold">4. When I Break a Rule</h2><p className="mt-1 text-sm text-white/60">Decide what happens when I violate one of my own rules.</p></div><div className="mt-1 flex items-center gap-2"><StatusLight active={responseEnabled} /><RuleToggle enabled={responseEnabled} onToggle={() => saveResponse(response, !responseEnabled)} /></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{[['stop_trading', 'Stop Trading', 'Stop trading for the day.'], ['take_a_break', 'Take a Break', 'Pause for 30 minutes before deciding whether to continue.'], ['review_first', 'Review First', 'Review the trade before taking another position.']].map(([key, title, description]) => <button key={key} type="button" onClick={() => saveResponse(key, responseEnabled)} className={'rounded-xl border p-4 text-left transition-colors ' + (responseEnabled && response === key ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/20 bg-white/[0.04] hover:border-white/30 hover:bg-white/[0.07]')}><div className="font-display text-sm font-semibold">{title}</div><p className="mt-1 text-xs leading-relaxed text-white/60">{description}</p></button>)}</div></section>
    <section className="mt-9 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-5"><h2 className="font-display text-lg font-semibold">My Rulebook</h2><div className="mt-3 grid gap-2 text-sm text-white/60 sm:grid-cols-3"><span>{savedNonNegotiables} saved non-negotiables</span><span>{enabledBehaviors} behavioral rules</span><span>{CONDITIONS.filter((rule) => stored[rule.key]?.enabled).length} trading conditions</span></div><div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-300">● ACTIVE</div><p className="mt-1 text-sm text-white/50">Saved rules apply from their effective trading dates. For example, 3 trades/day from 1 Oct and 1 trade/day from 15 Oct keeps the 3-trade limit through 14 Oct. Future changes stay scheduled. Earlier trades and displayed defaults are compared retrospectively and clearly labeled; unknown behaviour still needs review.</p></section>
    {showCustom && <CustomRuleModal accountId={scopeAccount?.id || null} onClose={() => setShowCustom(false)} onSaved={() => { setShowCustom(false); router.refresh(); }} />}</>}
  </div>;
}
