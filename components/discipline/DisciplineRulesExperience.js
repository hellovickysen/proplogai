"use client";

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addDisciplineRule,
  completeDisciplineProgramSetup,
  startDisciplineProgram,
} from '@/app/dashboard/discipline/actions';
import { useToast } from '@/components/ui/Toast';

const TEMPLATES = [
  {
    key: 'risk',
    name: 'Risk per trade',
    metric: 'risk_per_trade',
    ruleType: 'required_guardrail',
    unit: '$',
    eyebrow: 'Required guardrail',
    copy: 'Keep one trade from damaging your day.',
  },
  {
    key: 'daily',
    name: 'Daily loss limit',
    metric: 'daily_loss_limit',
    ruleType: 'required_guardrail',
    unit: '$',
    eyebrow: 'Required guardrail',
    copy: 'Know when the session is over.',
  },
  {
    key: 'size',
    name: 'Maximum position size',
    metric: 'maximum_position_size',
    ruleType: 'focus',
    unit: 'Lots',
    eyebrow: 'Focus rule',
    copy: 'Make size visible before it becomes a mistake.',
  },
  {
    key: 'setup',
    name: 'Confirm the setup',
    metric: 'behavior',
    ruleType: 'focus',
    unit: '',
    eyebrow: 'Focus rule',
    copy: 'Enter only when your setup is actually present.',
  },
  {
    key: 'confirmation',
    name: 'Wait for candle-close confirmation',
    metric: 'behavior',
    ruleType: 'focus',
    unit: '',
    eyebrow: 'Focus rule',
    copy: 'Avoid entering before your confirmation is complete.',
  },
  {
    key: 'profit',
    name: 'Stop on profit',
    metric: 'stop_on_profit',
    ruleType: 'library',
    unit: '$',
    eyebrow: 'Optional control',
    copy: 'Optional protection after a strong session.',
  },
];

function Stat({ label, value, detail, tone = 'text-white' }) {
  return (
    <div className="min-w-0 rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className={`mt-2 font-display text-2xl font-bold ${tone}`}>{value}</div>
      <div className="mt-1 text-xs text-white/50">{detail}</div>
    </div>
  );
}

function RuleTile({ template, configured, focusFull, busy, onChoose }) {
  const disabled = configured || busy || (template.ruleType === 'focus' && focusFull);
  const status = configured
    ? 'Configured'
    : template.ruleType === 'focus' && focusFull
      ? 'Focus limit reached'
      : `Add ${template.eyebrow.toLowerCase()} →`;

  return (
    <button
      type="button"
      onClick={() => onChoose(template)}
      disabled={disabled}
      className={`group relative w-full rounded-2xl border p-5 text-left transition-all ${
        configured
          ? 'border-emerald-400/25 bg-emerald-400/[0.05]'
          : 'border-white/10 bg-white/[0.025] hover:-translate-y-0.5 hover:border-cyan-400/35 hover:bg-cyan-400/[0.05]'
      } disabled:cursor-default disabled:hover:translate-y-0`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`grid h-10 w-10 place-items-center rounded-xl border text-lg ${configured ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-white/10 bg-black/20 text-cyan-300'}`}>
          {configured ? '✓' : '◈'}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">{template.eyebrow}</span>
      </div>
      <div className="mt-5 font-display text-base font-semibold text-white">{template.name}</div>
      <p className="mt-1.5 text-sm leading-relaxed text-white/55">{template.copy}</p>
      <div className={`mt-5 text-xs font-semibold ${configured ? 'text-emerald-300' : 'text-cyan-300'}`}>{status}</div>
    </button>
  );
}

function RulePanel({ template, onClose, onSave, busy }) {
  const [name, setName] = useState(template.name);
  const [threshold, setThreshold] = useState('');
  const [instrument, setInstrument] = useState('');
  const needsThreshold = template.metric !== 'behavior';

  return (
    <section className="rounded-2xl border border-cyan-400/30 bg-[#12121a] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">Add rule</div>
          <h2 className="mt-1 font-display text-xl font-bold">{template.name}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/55">Close</button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Rule name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" />
        </label>
        {needsThreshold && (
          <label className="block">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Your limit</span>
            <div className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-black/25">
              <input autoFocus value={threshold} onChange={(event) => setThreshold(event.target.value)} type="number" min="0" step="any" placeholder="Enter a number" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" />
              <span className="flex items-center border-l border-white/10 px-3 text-xs text-white/50">{template.unit}</span>
            </div>
          </label>
        )}
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Instrument scope</span>
          <input value={instrument} onChange={(event) => setInstrument(event.target.value)} maxLength={30} placeholder="All instruments" className="mt-2 w-full rounded-xl border border-white/10 bg-black/25 px-3 py-3 text-sm outline-none" />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-xs text-white/45">This adds the rule to the current programme baseline. Rule editing and version history arrive in a later slice.</p>
        <button
          type="button"
          disabled={busy || !name.trim() || (needsThreshold && !threshold)}
          onClick={() => onSave({ ...template, name }, threshold, instrument)}
          className="rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:opacity-50"
          style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}
        >
          {busy ? 'Saving…' : 'Save rule'}
        </button>
      </div>
    </section>
  );
}

function CustomFocusTile({ busy, focusFull, onChoose }) {
  return (
    <button
      type="button"
      disabled={busy || focusFull}
      onClick={onChoose}
      className="w-full rounded-2xl border border-dashed border-white/20 bg-black/15 p-5 text-left transition-colors hover:border-cyan-400/40 disabled:cursor-default disabled:opacity-60"
    >
      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Focus rule</div>
      <div className="mt-4 font-display text-base font-semibold text-white">Add a behaviour to protect</div>
      <p className="mt-1.5 text-sm leading-relaxed text-white/55">Use your own words for the execution behaviour you want reviewed.</p>
      <div className="mt-5 text-xs font-semibold text-cyan-300">{focusFull ? 'Focus limit reached' : 'Add custom Focus rule →'}</div>
    </button>
  );
}

export default function DisciplineRulesExperience({ program, rules, focusRuleIds, activeAccountId }) {
  const router = useRouter();
  const toast = useToast();
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [selected, setSelected] = useState(null);

  const configuredTemplate = (template) => rules.some((rule) => (
    rule.rule_type === template.ruleType
    && rule.metric === template.metric
    && rule.name === template.name
  ));
  const requiredMetrics = useMemo(() => new Set(rules.filter((rule) => rule.rule_type === 'required_guardrail').map((rule) => rule.metric)), [rules]);
  const focusCount = focusRuleIds.length;
  const hasRequiredGuardrails = requiredMetrics.has('risk_per_trade') && requiredMetrics.has('daily_loss_limit');
  const setupReady = hasRequiredGuardrails && focusCount >= 3 && focusCount <= 5;
  const accountLabel = activeAccountId ? 'Selected account' : 'All Accounts';

  async function start() {
    setStarting(true);
    const result = await startDisciplineProgram();
    setStarting(false);
    if (result.error) return toast.error(result.error);
    toast.success('Your programme setup is ready. Add your guardrails first.');
    router.refresh();
  }

  async function saveRule(template, threshold, instrument) {
    if (!program) return;
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
    toast.success(`${template.name} is now part of your Rulebook.`);
    router.refresh();
  }

  async function completeSetup() {
    if (!program) return;
    setCompleting(true);
    const result = await completeDisciplineProgramSetup(program.id);
    setCompleting(false);
    if (result.error) return toast.error(result.error);
    toast.success('Rules setup complete. Reviews will use this evidence baseline.');
    router.refresh();
  }

  if (!program) {
    return (
      <div className="px-4 py-7 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_88%_5%,rgba(34,211,238,0.14),transparent_27%),radial-gradient(circle_at_10%_0%,rgba(167,139,250,0.2),transparent_32%),#0b0b14]">
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="p-7 sm:p-10">
              <div className="font-mono text-xs uppercase tracking-[0.24em] text-cyan-300">30-day discipline system</div>
              <h1 className="mt-4 max-w-3xl font-display text-4xl font-bold leading-[1.04] sm:text-5xl">Build your review baseline from your own rules.</h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65">Trade entries remain evidence. Start by defining the guardrails and behaviours that make exception reviews fair and specific.</p>
              <button onClick={start} disabled={starting} className="mt-8 rounded-xl px-6 py-3.5 text-sm font-semibold text-[#08080f] disabled:opacity-60" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
                {starting ? 'Starting…' : `Start for ${accountLabel}`}
              </button>
              <p className="mt-3 text-xs text-white/40">No production data or programme progress is changed by starting setup.</p>
            </div>
            <div className="border-t border-white/10 bg-black/20 p-7 lg:border-l lg:border-t-0">
              <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Your training loop</div>
              <div className="mt-6 space-y-5">
                {[
                  ['01', 'Set two account guardrails', 'Risk per trade and daily loss limit.'],
                  ['02', 'Choose three to five Focus rules', 'The behaviours you want to protect.'],
                  ['03', 'Review only exceptions', 'Good losses stay fast; mistakes become evidence.'],
                ].map(([number, title, copy]) => (
                  <div key={number} className="flex gap-4">
                    <div className="font-mono text-sm text-cyan-300">{number}</div>
                    <div><div className="font-display text-base font-semibold">{title}</div><div className="mt-1 text-sm text-white/50">{copy}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-7 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-[0.22em] text-cyan-300">Discipline programme · Rules</div>
            <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Your rules are the evidence baseline.</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/55">{accountLabel}. Required guardrails protect the account; Focus rules keep reviews specific.</p>
          </div>
          <div className="rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-4 py-3">
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-300">Next action</div>
            <div className="mt-1 text-sm font-semibold">{!hasRequiredGuardrails ? 'Set both guardrails' : focusCount < 3 ? 'Choose more Focus rules' : program.configured_at ? 'Rules setup complete' : 'Complete rules setup'}</div>
          </div>
        </div>

        <div className="mb-6 flex overflow-x-auto rounded-xl border border-white/10 bg-white/[0.025] p-1">
          {['Today', 'Rules', 'Review', 'Progress'].map((tab) => <span key={tab} className={`rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-[0.14em] ${tab === 'Rules' ? 'bg-white/[0.09] text-white' : 'text-white/35'}`}>{tab}</span>)}
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Stat label="Programme scope" value={accountLabel} detail="Rules are checked server-side" tone="text-cyan-300" />
          <Stat label="Guardrails" value={`${requiredMetrics.size} / 2`} detail="Risk and daily loss limit" tone={hasRequiredGuardrails ? 'text-emerald-300' : 'text-white'} />
          <Stat label="Focus rules" value={`${focusCount} / 5`} detail="Three required to complete setup" tone={focusCount >= 3 ? 'text-emerald-300' : 'text-white'} />
        </div>

        {selected && <div className="mb-6"><RulePanel template={selected} onClose={() => setSelected(null)} onSave={saveRule} busy={saving} /></div>}

        <section>
          <div className="mb-3 flex items-end justify-between gap-4">
            <div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Step 1</div><h2 className="mt-1 font-display text-xl font-semibold">Protect the account first</h2></div>
            <p className="max-w-md text-right text-xs text-white/45">Both guardrails are required before programme setup can be completed.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            {TEMPLATES.filter((template) => template.ruleType === 'required_guardrail').map((template) => (
              <RuleTile key={template.key} template={template} configured={requiredMetrics.has(template.metric)} focusFull={false} onChoose={setSelected} busy={saving} />
            ))}
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Step 2</div><h2 className="mt-1 font-display text-xl font-semibold">Choose the behaviours to protect</h2><p className="mt-1 text-sm text-white/50">Choose three to five rules. More can remain in the Rulebook without becoming Focus rules.</p></div>
          <div className="grid gap-4 lg:grid-cols-3">
            {TEMPLATES.filter((template) => template.ruleType === 'focus').map((template) => (
              <RuleTile key={template.key} template={template} configured={configuredTemplate(template)} focusFull={focusCount >= 5} onChoose={setSelected} busy={saving} />
            ))}
            <CustomFocusTile busy={saving} focusFull={focusCount >= 5} onChoose={() => setSelected({ key: 'custom', name: 'New Focus rule', metric: 'behavior', ruleType: 'focus', unit: '', eyebrow: 'Focus rule', copy: 'Use your own words for the behaviour to protect.' })} />
          </div>
        </section>

        <section className="mt-8">
          <div className="mb-3"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Optional controls</div><h2 className="mt-1 font-display text-xl font-semibold">Keep useful controls in the Rulebook</h2></div>
          <div className="grid gap-4 lg:grid-cols-3">
            {TEMPLATES.filter((template) => template.ruleType === 'library').map((template) => (
              <RuleTile key={template.key} template={template} configured={configuredTemplate(template)} focusFull={false} onChoose={setSelected} busy={saving} />
            ))}
          </div>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-5">
          <div><div className="font-display text-lg font-semibold">Ready to use these rules in reviews?</div><p className="mt-1 text-sm text-white/55">Complete setup after two guardrails and three to five Focus rules are configured. Versioned rule editing is a later Slice 1 follow-up.</p></div>
          <button type="button" disabled={!setupReady || Boolean(program.configured_at) || completing} onClick={completeSetup} className="rounded-xl px-5 py-3 text-sm font-semibold text-[#08080f] disabled:cursor-not-allowed disabled:opacity-50" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
            {program.configured_at ? 'Rules setup complete' : completing ? 'Completing…' : 'Complete rules setup'}
          </button>
        </div>
      </div>
    </div>
  );
}
