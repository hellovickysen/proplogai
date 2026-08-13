"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveDisciplineRule } from '@/app/dashboard/rulebook/discipline-actions';

const NON_NEGOTIABLES = [
  { key: 'daily_loss_limit', title: 'Daily Loss Limit', type: 'daily_loss_limit', value: '250', unit: '$', before: 'I will never lose more than', after: 'in one day.', detail: 'When I reach it, I stop trading.' },
  { key: 'risk_per_trade', title: 'Risk Per Trade', type: 'risk_per_trade', value: '100', unit: '$', before: 'I will never risk more than', after: 'on one trade.', detail: 'This is my maximum planned loss for a trade.', units: ['$', '%'] },
  { key: 'maximum_lot_contract_size', title: 'Maximum Lot / Contract Size', type: 'max_position_size', value: '1', unit: 'lot / contract', before: 'I will never trade more than', after: 'lot / contract on one trade.', detail: '' },
  { key: 'maximum_trades_per_day', title: 'Maximum Trades Per Day', type: 'max_trades_per_day', value: '2', unit: 'trades', before: 'I will never take more than', after: 'trades in one trading day.', detail: '' },
  { key: 'consecutive_loss_limit', title: 'Consecutive Loss Limit', type: 'consecutive_losses', value: '2', unit: 'consecutive losses', before: 'I will stop after', after: 'consecutive losses.', detail: 'After reaching this limit, I stop trading for the day.' },
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

function Status({ saved }) {
  return <span className={'text-[11px] ' + (saved ? 'text-emerald-300' : 'text-white/35')}>{saved ? '✓ Saved' : ''}</span>;
}

function StatusLight({ active, className = '' }) {
  return <span title={active ? 'Active' : 'Inactive'} className={'h-2.5 w-2.5 shrink-0 rounded-full ' + (active ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-white/25') + ' ' + className} />;
}

function RuleToggle({ enabled, onToggle, saving = false }) {
  return <button type="button" onClick={onToggle} disabled={saving} aria-pressed={enabled} className={'flex h-6 items-center gap-1 rounded-full border px-1 transition-colors ' + (enabled ? 'border-cyan-400/40 bg-cyan-500/15 text-cyan-300' : 'border-white/15 bg-white/[0.03] text-white/40')}><span className="font-mono text-[9px] font-semibold">{enabled ? 'ON' : 'OFF'}</span><span className={'h-4 w-4 rounded-full bg-[#08080f] transition-transform ' + (enabled ? 'translate-x-0' : '')} /></button>;
}

function NumberRule({ rule, stored, accountId }) {
  const [value, setValue] = useState(stored?.value || rule.value);
  const [unit, setUnit] = useState(stored?.unit || rule.unit);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function save() {
    setError('');
    if (!value || Number(value) <= 0) { setError('Enter a value greater than 0.'); return; }
    if (['maximum_trades_per_day', 'consecutive_loss_limit'].includes(rule.key) && (!Number.isInteger(Number(value)) || Number(value) < 1)) { setError('Enter a whole number of at least 1.'); return; }
    setSaving(true);
    const result = await saveDisciplineRule({ account_id: accountId, category: 'non_negotiable', rule_key: rule.key, rule_type: rule.type, title: rule.title, description: rule.detail, value, unit, sort_order: NON_NEGOTIABLES.findIndex((item) => item.key === rule.key) + 1 });
    if (result.error) setError(result.error);
    else { setSaved(true); setTimeout(() => setSaved(false), 1800); router.refresh(); }
    setSaving(false);
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3"><span className="rounded-full border border-red-400/25 bg-red-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-300">Non-negotiable</span><Status saved={saved} /></div>
      <h3 className="mt-3 font-display text-base font-semibold">{rule.title}</h3>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed text-white/70">
        <span>{rule.before}</span>
        <div className="flex rounded-lg border border-white/10 bg-black/30 focus-within:border-cyan-400/60">
          <input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" className="w-20 bg-transparent px-2.5 py-1.5 text-sm font-semibold outline-none" aria-label={rule.title} />
          {rule.units ? <select value={unit} onChange={(event) => setUnit(event.target.value)} className="border-l border-white/10 bg-transparent px-2 text-[11px] text-white/55 outline-none">{rule.units.map((option) => <option key={option} value={option}>{option}</option>)}</select> : <span className="flex items-center border-l border-white/10 px-2 text-[11px] text-white/45">{unit}</span>}
        </div>
        <span>{rule.after}</span>
      </div>
      {rule.detail && <p className="mt-1 text-xs text-white/45">{rule.detail}</p>}
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
      <button type="button" onClick={save} disabled={saving} className="mt-3 rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50">{saving ? 'Saving...' : saved ? '✓ Saved' : 'Save'}</button>
    </div>
  );
}

function ToggleRule({ rule, stored, accountId, custom = false }) {
  const [enabled, setEnabled] = useState(stored ? stored.enabled : false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  async function toggle() {
    const next = !enabled; setEnabled(next); setSaving(true);
    const result = await saveDisciplineRule({ account_id: accountId, category: custom ? 'custom' : 'behavior', rule_key: rule.key, rule_type: custom ? 'custom_behavior' : rule.key, title: rule.title, description: rule.description, value: '', unit: null, enabled: next, sort_order: 1 });
    if (!result.error) { setSaved(true); setTimeout(() => setSaved(false), 1200); router.refresh(); } else setEnabled(!next);
    setSaving(false);
  }
  return <div className="relative flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 pl-9"><StatusLight active={enabled} className="absolute left-3 top-3" /><div className="min-w-0 flex-1"><h3 className="font-display text-sm font-semibold">{rule.title}</h3><p className="mt-1 text-xs leading-relaxed text-white/45">{rule.description}</p><Status saved={saved} /></div><RuleToggle enabled={enabled} onToggle={toggle} saving={saving} /></div>;
}

function SegmentedRule({ rule, stored, accountId }) {
  const [value, setValue] = useState(stored?.value || rule.defaultValue);
  const [enabled, setEnabled] = useState(stored ? stored.enabled : false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  async function save(nextValue = value, nextEnabled = enabled) {
    setValue(nextValue); setEnabled(nextEnabled);
    const result = await saveDisciplineRule({ account_id: accountId, category: 'condition', rule_key: rule.key, rule_type: rule.key, title: rule.title, description: rule.description, value: nextValue, unit: null, enabled: nextEnabled, sort_order: 1 });
    if (!result.error) { setSaved(true); setTimeout(() => setSaved(false), 1200); router.refresh(); }
  }
  return <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4 pl-9"><StatusLight active={enabled} className="absolute left-3 top-3" /><div className="flex items-start justify-between gap-3 pr-12"><div><h3 className="font-display text-base font-semibold">{rule.title}</h3><p className="mt-1 text-xs leading-relaxed text-white/45">{rule.description}</p></div><RuleToggle enabled={enabled} onToggle={() => save(value, !enabled)} /></div><div className="mt-3 flex flex-wrap gap-1.5">{rule.options.map(([key, label]) => <button key={key} type="button" onClick={() => save(key, enabled)} className={'rounded-lg border px-3 py-2 text-xs font-semibold ' + (value === key ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/20 text-white/50')}>{label}</button>)}</div><Status saved={saved} /></div>;
}

function TradingHours({ stored, accountId }) {
  const initial = stored?.metadata || {};
  const [enabled, setEnabled] = useState(stored ? stored.enabled : false);
  const [sessions, setSessions] = useState(initial.sessions || []);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  async function save(nextSessions = sessions, nextEnabled = enabled) {
    setSessions(nextSessions); setEnabled(nextEnabled);
    const result = await saveDisciplineRule({ account_id: accountId, category: 'condition', rule_key: 'trading_hours', rule_type: 'trading_sessions', title: 'Trading Hours', description: 'I only trade during my chosen sessions.', value: nextSessions.join(', '), unit: 'sessions', enabled: nextEnabled, metadata: { sessions: nextSessions }, sort_order: 1 });
    if (!result.error) { setSaved(true); setTimeout(() => setSaved(false), 1200); router.refresh(); }
  }
  function toggleSession(session) { const next = sessions.includes(session) ? sessions.filter((item) => item !== session) : [...sessions, session]; save(next, enabled); }
  return <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-4 pl-9"><StatusLight active={enabled} className="absolute left-3 top-3" /><div className="flex items-start justify-between gap-3 pr-12"><div><h3 className="font-display text-base font-semibold">Trading Hours</h3><p className="mt-1 text-xs text-white/45">I only trade during my chosen sessions.</p></div><RuleToggle enabled={enabled} onToggle={() => save(sessions, !enabled)} /></div><div className="mt-3 flex flex-wrap gap-1.5">{['Asian', 'London', 'New York'].map((session) => <button key={session} type="button" onClick={() => toggleSession(session)} className={'rounded-lg border px-3 py-2 text-xs font-semibold ' + (sessions.includes(session) ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-300' : 'border-white/10 bg-black/20 text-white/50')}>{session}</button>)}</div><Status saved={saved} /></div>;
}

function CustomRuleModal({ onClose, accountId, onSaved }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  async function save() { if (!title.trim()) { setError('Enter a rule name.'); return; } setSaving(true); const result = await saveDisciplineRule({ account_id: accountId, category: 'custom', rule_key: 'custom_' + Date.now(), rule_type: 'custom_behavior', title, description, value: '', unit: null, enabled: false, sort_order: 99 }); if (result.error) setError(result.error); else onSaved(); setSaving(false); }
  return <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}><div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12121a] p-5" onClick={(event) => event.stopPropagation()}><h2 className="font-display text-lg font-semibold">Add Custom Rule</h2><div className="mt-4 space-y-3"><input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Rule name" className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" /><textarea value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the rule I want to follow..." rows={3} className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-cyan-400/60" />{error && <p className="text-xs text-red-300">{error}</p>}</div><div className="mt-4 flex gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/60">Cancel</button><button type="button" onClick={save} disabled={saving} className="rounded-lg px-4 py-2 text-sm font-semibold text-[#08080f]" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>{saving ? 'Saving...' : 'Save Rule'}</button></div></div></div>;
}

export default function RulebookDisciplinePage({ rules = [], scopeAccount = null }) {
  const [showCustom, setShowCustom] = useState(false);
  const router = useRouter();
  const stored = useMemo(() => Object.fromEntries([...rules].sort((a, b) => Number(!!a.account_id) - Number(!!b.account_id)).map((rule) => [rule.rule_key, rule])), [rules]);
  const scopeLabel = scopeAccount ? scopeAccount.name + ' overrides' : 'Global defaults';
  const enabledBehaviors = BEHAVIORS.filter((rule) => stored[rule.key]?.enabled).length;
  const response = stored.rule_break_response?.value || 'review_first';
  const responseEnabled = stored.rule_break_response ? stored.rule_break_response.enabled : false;

  async function saveResponse(value = response, enabled = responseEnabled) { await saveDisciplineRule({ account_id: scopeAccount?.id || null, category: 'response', rule_key: 'rule_break_response', rule_type: 'rule_break_response', title: 'When I Break a Rule', description: 'Decide what happens after I violate one of my own rules.', value, unit: null, enabled, sort_order: 1 }); router.refresh(); }

  return <div className="px-4 py-8 sm:px-6"><div className="mb-7 flex flex-wrap items-start justify-between gap-3"><div className="max-w-2xl"><span className="font-mono text-xs uppercase tracking-wider text-cyan-300">Your discipline foundation</span><h1 className="mt-2 font-display text-3xl font-bold">Rulebook</h1><p className="mt-2 text-sm leading-relaxed text-white/55">These are the rules I choose to follow before and during trading. They are personal boundaries, not trading recommendations.</p></div><div className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">● Rulebook Active</div></div><div className="mb-6 flex items-center gap-2 font-mono text-xs text-white/45"><span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">{scopeLabel}</span><span>{NON_NEGOTIABLES.length + enabledBehaviors} active rules</span></div>
    <section><h2 className="font-display text-xl font-semibold">1. Non-negotiables</h2><p className="mt-1 text-sm text-white/45">Set the limits I will follow before I trade.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{NON_NEGOTIABLES.map((rule) => <NumberRule key={rule.key} rule={rule} stored={stored[rule.key]} accountId={scopeAccount?.id || null} />)}</div></section>
    <section className="mt-9"><h2 className="font-display text-xl font-semibold">2. Trading Behavior</h2><p className="mt-1 text-sm text-white/45">Rules that protect me from emotional and impulsive decisions.</p><div className="mt-4 grid gap-3 sm:grid-cols-2">{BEHAVIORS.map((rule) => <ToggleRule key={rule.key} rule={rule} stored={stored[rule.key]} accountId={scopeAccount?.id || null} />)}{rules.filter((rule) => rule.category === 'custom').map((rule) => <ToggleRule key={rule.id} rule={{ key: rule.rule_key, title: rule.title, description: rule.guidance }} stored={rule} accountId={scopeAccount?.id || null} custom />)}</div><button type="button" onClick={() => setShowCustom(true)} className="mt-4 rounded-lg border border-dashed border-white/20 px-3 py-2 text-xs text-white/50 hover:border-cyan-400/40 hover:text-cyan-300">+ Add Custom Rule</button></section>
    <section className="mt-9"><h2 className="font-display text-xl font-semibold">3. Trading Conditions</h2><p className="mt-1 text-sm text-white/45">Define when and how I allow myself to trade.</p><div className="mt-4 grid gap-4 sm:grid-cols-3"><TradingHours stored={stored.trading_hours} accountId={scopeAccount?.id || null} />{CONDITIONS.slice(1).map((rule) => <SegmentedRule key={rule.key} rule={rule} stored={stored[rule.key]} accountId={scopeAccount?.id || null} />)}</div></section>
    <section className="mt-9"><div className="relative"><StatusLight active={responseEnabled} className="absolute left-0 top-2" /><div className="flex items-start justify-between gap-3 pl-5 pr-14"><div><h2 className="font-display text-xl font-semibold">4. When I Break a Rule</h2><p className="mt-1 text-sm text-white/45">Decide what happens when I violate one of my own rules.</p></div><RuleToggle enabled={responseEnabled} onToggle={() => saveResponse(response, !responseEnabled)} /></div></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{[['stop_trading', 'Stop Trading', 'Stop trading for the day.'], ['take_a_break', 'Take a Break', 'Pause for 30 minutes before deciding whether to continue.'], ['review_first', 'Review First', 'Review the trade before taking another position.']].map(([key, title, description]) => <button key={key} type="button" onClick={() => saveResponse(key, responseEnabled)} className={'rounded-xl border p-4 text-left transition-colors ' + (responseEnabled && response === key ? 'border-cyan-400/50 bg-cyan-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]')}><div className="font-display text-sm font-semibold">{title}</div><p className="mt-1 text-xs leading-relaxed text-white/45">{description}</p></button>)}</div></section>
    <section className="mt-9 rounded-2xl border border-cyan-400/20 bg-cyan-500/[0.04] p-5"><h2 className="font-display text-lg font-semibold">My Rulebook</h2><div className="mt-3 grid gap-2 text-sm text-white/60 sm:grid-cols-3"><span>{NON_NEGOTIABLES.length} Non-negotiables</span><span>{enabledBehaviors} Behavioral Rules</span><span>{CONDITIONS.length} Trading Conditions</span></div><div className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-300">● ACTIVE</div><p className="mt-1 text-sm text-white/50">Your rules are ready to be checked against your trades as future rule-violation detection is added.</p></section>
    {showCustom && <CustomRuleModal accountId={scopeAccount?.id || null} onClose={() => setShowCustom(false)} onSaved={() => { setShowCustom(false); router.refresh(); }} />}
  </div>;
}
