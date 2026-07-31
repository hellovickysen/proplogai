"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { addDisciplineRule, startDisciplineProgram } from '@/app/dashboard/discipline/actions';
import { useToast } from '@/components/ui/Toast';

const TEMPLATES = [
  { key: 'risk', name: 'Risk per trade', metric: 'risk_per_trade', ruleType: 'required_guardrail', unit: '$', icon: '◈', copy: 'Keep one trade from damaging your day.' },
  { key: 'daily', name: 'Daily loss limit', metric: 'daily_loss_limit', ruleType: 'required_guardrail', unit: '$', icon: '◒', copy: 'Know when the session is over.' },
  { key: 'size', name: 'Maximum position size', metric: 'maximum_position_size', ruleType: 'focus', unit: 'Lots', icon: '⊙', copy: 'Make size visible before it becomes a mistake.' },
  { key: 'setup', name: 'Confirm the setup', metric: 'behavior', ruleType: 'focus', unit: '', icon: '✓', copy: 'Enter only when your setup is actually present.' },
  { key: 'profit', name: 'Stop on profit', metric: 'stop_on_profit', ruleType: 'library', unit: '$', icon: '↑', copy: 'Optional protection after a strong session.' },
];

function MiniStat({ eyebrow, value, detail, tone = 'normal' }) {
  const toneClass = tone === 'accent' ? 'text-cyan-300' : tone === 'good' ? 'text-emerald-300' : 'text-white';
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{eyebrow}</div>
      <div className={'mt-2 font-display text-2xl font-bold ' + toneClass}>{value}</div>
      <div className="mt-1 text-xs text-white/50">{detail}</div>
    </div>
  );
}

function RuleTile({ template, configured, focusCount, onChoose, busy }) {
  const isFocus = template.ruleType === 'focus';
  const disabled = configured || (isFocus && focusCount >= 5);
  return (
    <button
      type="button"
      onClick={() => onChoose(template)}
      disabled={disabled || busy}
      className={'group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all ' +
        (configured
          ? 'border-emerald-400/25 bg-emerald-400/[0.05]'
          : 'border-white/10 bg-white/[0.025] hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-cyan-400/[0.05]') +
        ' disabled:cursor-default disabled:hover:translate-y-0'}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={'grid h-10 w-10 place-items-center rounded-xl border text-lg ' + (configured ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-black/20 text-cyan-300')}>{configured ? '✓' : template.icon}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{template.ruleType === 'required_guardrail' ? 'Guardrail' : template.ruleType === 'focus' ? 'Focus rule' : 'Optional'}</span>
      </div>
      <div className="mt-5 font-display text-base font-semibold text-white">{template.name}</div>
      <p className="mt-1.5 pr-5 text-sm leading-relaxed text-white/55">{template.copy}</p>
      <div className={'mt-5 text-xs font-semibold ' + (configured ? 'text-emerald-300' : 'text-cyan-300')}>
        {configured ? 'Configured' : isFocus && focusCount >= 5 ? 'Focus limit reached' : 'Add this rule →'}
      </div>
    </button>
  );
}

function ThresholdPanel({ template, onClose, onSave, busy }) {
  const [threshold, setThreshold] = useState('');
  const [instrument, setInstrument] = useState('');
  const needsThreshold = template.metric !== 'behavior';
  return (
    <div className="rounded-2xl border border-cyan-400/30 bg-[#12121a] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">Add rule</div>
          <h2 className="mt-1 font-display text-xl font-bold">{template.name}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55">Close</button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {needsThreshold && <label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Your limit</span><div className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-black/25"><input autoFocus value={threshold} onChange={(event) => setThreshold(event.target.value)} type="number" min="0" step="any" placeholder="Enter a number" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" /><span className="flex items-center border-l border-white/10 px-3 text-xs text-white/50">{template.unit}</span></div></label>}
        <label className="block"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Instrument scope</span><input value={instrument} onChange={(event) => setInstrument(event.target.value)} placeholder="All instruments" className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" /></label>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-white/45">You can change this later. The original rule version stays with past trade evidence.</p><button type="button" disabled={busy || (needsThreshold && !threshold)} onClick={() => onSave(template, threshold, instrument)} className="rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-50" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>{busy ? 'Saving…' : 'Save rule'}</button></div>
    </div>
  );
}

export default function DisciplineRulesExperience({ program, rules, focusRuleIds }) {
  const router = useRouter();
  const toast = useToast();
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);

  const configuredMetrics = useMemo(() => new Set(rules.map((rule) => rule.metric)), [rules]);
  const focusCount = focusRuleIds.length;
  const guardrailCount = rules.filter((rule) => rule.rule_type === 'required_guardrail').length;
  const programmeDay = 0;

  async function start() {
    setStarting(true);
    const result = await startDisciplineProgram();
    setStarting(false);
    if (result.error) return toast.error(result.error);
    toast.success('Your 30-day discipline programme has started.');
    router.refresh();
  }

  async function saveRule(template, threshold, instrument) {
    setSaving(true);
    const result = await addDisciplineRule({
      programId: program.id,
      name: template.name,
      metric: template.metric,
      ruleType: template.ruleType,
      unit: template.unit,
      threshold,
      instrument,
    });
    setSaving(false);
    if (result.error) return toast.error(result.error);
    setSelected(null);
    toast.success(`${template.name} is now part of your programme.`);
    router.refresh();
  }

  if (!program) {
    return (
      <div className="px-4 py-7 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_88%_5%,rgba(34,211,238,0.14),transparent_27%),radial-gradient(circle_at_10%_0%,rgba(167,139,250,0.2),transparent_32%),#0b0b14]">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-7 sm:p-10"><div className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-300">30-day discipline system</div><h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.04] sm:text-5xl">Make your next trading day more disciplined than the last.</h1><p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65">PropLogAI turns your own rules and trade evidence into a small, practical training loop. No extra journal homework. No profit promises.</p><button onClick={start} disabled={starting} className="mt-8 rounded-xl px-6 py-3.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>{starting ? 'Starting…' : 'Start my 30-day programme'}</button><p className="mt-3 text-xs text-white/40">Starts with your guardrails. You can change rules later without rewriting past evidence.</p></div>
            <div className="border-t border-white/10 bg-black/20 p-7 lg:border-l lg:border-t-0"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Your training loop</div><div className="mt-6 space-y-5">{[['01','Set two account guardrails','Risk per trade and daily loss limit.'],['02','Choose a few Focus rules','The behaviours you want to protect.'],['03','Review only exceptions','Good losses stay fast; mistakes become evidence.']].map(([number, title, copy]) => <div key={number} className="flex gap-4"><div className="font-mono text-sm text-cyan-300">{number}</div><div><div className="font-display text-base font-semibold">{title}</div><div className="mt-1 text-sm text-white/50">{copy}</div></div></div>)}</div></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-7 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><div className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">Discipline programme · Build baseline</div><h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Your rules are the training plan.</h1><p className="mt-2 max-w-2xl text-sm text-white/55">Set the boundaries first. PropLogAI will use them to make reviews focused, fair, and useful.</p></div><div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">Next action</div><div className="mt-1 text-sm font-semibold">{guardrailCount < 2 ? 'Set your guardrails' : 'Choose a Focus rule'}</div></div></div>
        <div className="mb-5 flex overflow-x-auto rounded-xl border border-white/10 bg-white/[0.025] p-1"><span className="rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-white/35">Today</span><span className="rounded-lg bg-white/[0.09] px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-white">Rules</span><span className="rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-white/35">Review</span><span className="rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] text-white/35">Progress</span></div>
        <div className="mb-6 grid gap-3 sm:grid-cols-3"><MiniStat eyebrow="Programme day" value={`${programmeDay} / 30`} detail="Trading days, not calendar days" tone="accent" /><MiniStat eyebrow="Guardrails" value={`${guardrailCount} / 2`} detail="Risk and daily loss limit" tone={guardrailCount >= 2 ? 'good' : 'normal'} /><MiniStat eyebrow="Focus rules" value={`${focusCount} / 5`} detail="Choose the behaviours to protect" tone={focusCount > 0 ? 'good' : 'normal'} /></div>
        {selected && <div className="mb-6"><ThresholdPanel template={selected} onClose={() => setSelected(null)} onSave={saveRule} busy={saving} /></div>}
        <section><div className="mb-3 flex items-end justify-between gap-4"><div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Step 1</div><h2 className="mt-1 font-display text-xl font-semibold">Protect the account first</h2></div><p className="max-w-md text-right text-xs text-white/45">Start with these two. They are account guardrails, not performance targets.</p></div><div className="grid gap-4 lg:grid-cols-2">{TEMPLATES.filter((template) => template.ruleType === 'required_guardrail').map((template) => <RuleTile key={template.key} template={template} configured={configuredMetrics.has(template.metric)} focusCount={focusCount} onChoose={setSelected} busy={saving} />)}</div></section>
        <section className="mt-8"><div className="mb-3"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Step 2</div><h2 className="mt-1 font-display text-xl font-semibold">Choose what you want to improve</h2><p className="mt-1 text-sm text-white/50">Pick up to five rules that identify rushed, oversized, or unplanned execution.</p></div><div className="grid gap-4 lg:grid-cols-3">{TEMPLATES.filter((template) => template.ruleType !== 'required_guardrail').map((template) => <RuleTile key={template.key} template={template} configured={configuredMetrics.has(template.metric)} focusCount={focusCount} onChoose={setSelected} busy={saving} />)}</div></section>
      </div>
    </div>
  );
}
