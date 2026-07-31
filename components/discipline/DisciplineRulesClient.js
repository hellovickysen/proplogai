"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { startDisciplineProgram, addDisciplineRule } from '@/app/dashboard/discipline/actions';
import { useToast } from '@/components/ui/Toast';

const METRICS = [
  { value: 'risk_per_trade', label: 'Risk per trade', unit: '$' },
  { value: 'daily_loss_limit', label: 'Daily loss limit', unit: '$' },
  { value: 'maximum_position_size', label: 'Maximum position size', unit: 'Lots' },
  { value: 'stop_on_profit', label: 'Stop on profit', unit: '$' },
  { value: 'behavior', label: 'Behaviour rule', unit: '' },
];

function RuleCard({ rule, isFocus }) {
  const typeLabel = rule.rule_type === 'required_guardrail' ? 'Required guardrail' : rule.rule_type === 'focus' ? 'Focus rule' : 'Rule library';
  const value = rule.threshold == null ? 'Qualitative' : `${rule.threshold} ${rule.unit || ''}`.trim();
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-base font-semibold text-white">{rule.name}</div>
          <div className="mt-1 font-mono text-xs uppercase tracking-wider text-white/45">{typeLabel}</div>
        </div>
        {isFocus && <span className="rounded-full border border-cyan-400/25 bg-cyan-400/10 px-2 py-1 font-mono text-[10px] uppercase text-cyan-300">Focus</span>}
      </div>
      <div className="mt-4 border-t border-white/[0.06] pt-3 text-sm text-white/65">
        <span className="text-white/40">Threshold</span><span className="mx-2 text-white/25">•</span>{value}
        {rule.instrument && <><span className="mx-2 text-white/25">•</span>{rule.instrument}</>}
      </div>
    </div>
  );
}

function AddRuleForm({ programId, onComplete }) {
  const router = useRouter();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [ruleType, setRuleType] = useState('required_guardrail');
  const [metric, setMetric] = useState('risk_per_trade');
  const [name, setName] = useState('Risk per trade');
  const [threshold, setThreshold] = useState('');
  const [unit, setUnit] = useState('$');
  const [instrument, setInstrument] = useState('');

  function onMetricChange(next) {
    const option = METRICS.find((item) => item.value === next);
    setMetric(next);
    setName(option.label);
    setUnit(option.unit);
    if (next === 'behavior') setThreshold('');
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const result = await addDisciplineRule({ programId, ruleType, metric, name, threshold, unit, instrument });
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Rule added to your discipline programme.');
    onComplete();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-cyan-400/25 bg-[#12121a] p-5">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold">Add a programme rule</h2>
        <p className="mt-1 text-sm text-white/55">Required guardrails protect the account. Focus rules reveal repeatable execution mistakes.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wider text-white/55">Rule role</span>
          <select value={ruleType} onChange={(event) => setRuleType(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm">
            <option value="required_guardrail">Required guardrail</option>
            <option value="focus">Focus rule</option>
            <option value="library">Rule library</option>
          </select>
        </label>
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wider text-white/55">What it measures</span>
          <select value={metric} onChange={(event) => onMetricChange(event.target.value)} className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm">
            {METRICS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="font-mono text-xs uppercase tracking-wider text-white/55">Rule name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm" />
        </label>
        {metric !== 'behavior' && (
          <label className="block">
            <span className="font-mono text-xs uppercase tracking-wider text-white/55">Threshold</span>
            <input value={threshold} onChange={(event) => setThreshold(event.target.value)} type="number" min="0" step="any" placeholder="e.g. 50" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm" />
          </label>
        )}
        <label className="block">
          <span className="font-mono text-xs uppercase tracking-wider text-white/55">Unit</span>
          <input value={unit} onChange={(event) => setUnit(event.target.value)} maxLength={20} placeholder="$, Lots, Contracts" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm" />
        </label>
        <label className="block sm:col-span-2">
          <span className="font-mono text-xs uppercase tracking-wider text-white/55">Instrument scope (optional)</span>
          <input value={instrument} onChange={(event) => setInstrument(event.target.value)} maxLength={30} placeholder="e.g. XAUUSD" className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm" />
        </label>
      </div>
      <button disabled={saving} className="mt-5 rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
        {saving ? 'Adding…' : 'Add rule'}
      </button>
    </form>
  );
}

export default function DisciplineRulesClient({ program, rules, focusRuleIds }) {
  const router = useRouter();
  const toast = useToast();
  const [starting, setStarting] = useState(false);
  const [adding, setAdding] = useState(false);

  async function start() {
    setStarting(true);
    const result = await startDisciplineProgram();
    setStarting(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success('Your 30-day discipline programme has started.');
    router.refresh();
  }

  if (!program) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.13),transparent_35%),radial-gradient(circle_at_top_left,rgba(167,139,250,0.16),transparent_40%),#0b0b14] p-7 sm:p-10">
          <div className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">30-day discipline system</div>
          <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Train your process—not your P&amp;L.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/65">Start with the rules that protect your account. Then PropLogAI will turn your trade evidence into focused reviews, repeat-pattern evidence, and one clear next focus.</p>
          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            {['Set guardrails', 'Choose up to five Focus rules', 'Review exceptions, not every trade'].map((item, index) => <div key={item} className="rounded-2xl border border-white/10 bg-black/20 p-4"><div className="font-mono text-xs text-cyan-300">0{index + 1}</div><div className="mt-2 text-sm font-medium text-white/85">{item}</div></div>)}
          </div>
          <button onClick={start} disabled={starting} className="mt-7 rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>{starting ? 'Starting…' : 'Start my discipline programme'}</button>
        </div>
      </div>
    );
  }

  const required = rules.filter((rule) => rule.rule_type === 'required_guardrail');
  const focus = rules.filter((rule) => rule.rule_type === 'focus');
  const library = rules.filter((rule) => rule.rule_type === 'library');
  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
        <div><div className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">Discipline · Rules</div><h1 className="mt-2 font-display text-3xl font-bold">Protect the rules that matter.</h1><p className="mt-2 text-sm text-white/55">Required guardrails measure account protection. Focus rules reveal the execution pattern to improve next.</p></div>
        <button onClick={() => setAdding((value) => !value)} className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/80">{adding ? 'Close' : '+ Add rule'}</button>
      </div>
      {adding && <div className="mb-7"><AddRuleForm programId={program.id} onComplete={() => setAdding(false)} /></div>}
      <section className="mb-8"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Required guardrails</h2><span className="font-mono text-xs text-white/40">Account protection</span></div><div className="grid gap-4 lg:grid-cols-2">{required.length ? required.map((rule) => <RuleCard key={rule.id} rule={rule} isFocus={false} />) : <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-white/45">Add Risk per trade and Daily loss limit first.</div>}</div></section>
      <section className="mb-8"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Focus rules</h2><span className="font-mono text-xs text-white/40">{focus.length}/5 selected</span></div><div className="grid gap-4 lg:grid-cols-2">{focus.length ? focus.map((rule) => <RuleCard key={rule.id} rule={rule} isFocus={focusRuleIds.includes(rule.id)} />) : <div className="rounded-2xl border border-dashed border-white/15 p-5 text-sm text-white/45">Choose the 3–5 execution rules you want to protect this programme.</div>}</div></section>
      {library.length > 0 && <section><h2 className="mb-3 font-display text-lg font-semibold">Rule library</h2><div className="grid gap-4 lg:grid-cols-2">{library.map((rule) => <RuleCard key={rule.id} rule={rule} isFocus={false} />)}</div></section>}
    </div>
  );
}
