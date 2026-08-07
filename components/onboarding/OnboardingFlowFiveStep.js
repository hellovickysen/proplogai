"use client";

import { useMemo, useState } from 'react';
import { completeDisciplineOnboarding } from '@/app/onboarding/actions';

const FOCUS_RULES = [
  { id: 'planned_setups_only', title: 'Planned A-grade setups only', copy: 'Take only the setups you defined before the session.' },
  { id: 'candle_close_confirmation', title: 'Wait for candle-close confirmation', copy: 'Let confirmation finish before entering.' },
  { id: 'one_trade_at_a_time', title: 'One trade at a time', copy: 'Close or manage the current idea before opening another.' },
  { id: 'no_averaging_down', title: 'No averaging down', copy: 'Do not add size to a losing position.' },
  { id: 'journal_before_next_trade', title: 'Journal before the next trade', copy: 'Record the decision before moving on.' },
  { id: 'pause_after_rule_break', title: 'Pause after a rule break', copy: 'Step away and reset before the next decision.' },
];

const STEPS = ['Readiness', 'Guardrails', 'Focus rules', 'Monk path', 'Programme ready'];

function Field({ label, value, onChange, unit, placeholder }) {
  return <label className="block">
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{label}</span>
    <div className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-black/30 focus-within:border-cyan-300">
      <input type="number" min="0" step="any" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none" />
      <span className="border-l border-white/10 px-3 py-3 text-xs text-white/50">{unit}</span>
    </div>
  </label>;
}

function Frame({ step, children, onBack, onNext, nextLabel = 'Continue', nextDisabled = false }) {
  return <main className="min-h-screen bg-[#080b11] px-4 py-7 text-white sm:px-6 sm:py-10">
    <div className="mx-auto max-w-5xl">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div className="font-display text-lg font-semibold tracking-tight">PropLogAI <span className="text-white/35">/ Discipline</span></div>
        <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/75">Step {step + 1} of 5</div>
      </header>
      <div className="mb-8 grid grid-cols-5 gap-1.5" aria-label={`Onboarding step ${step + 1} of 5`}>
        {STEPS.map((name, index) => <div key={name} className={`h-1 rounded-full ${index <= step ? 'bg-gradient-to-r from-fuchsia-300 to-cyan-300' : 'bg-white/15'}`} />)}
      </div>
      <section className="overflow-hidden rounded-2xl border border-white/15 bg-[radial-gradient(circle_at_85%_0%,rgba(38,196,255,0.12),transparent_30%),linear-gradient(135deg,#0c111c,#080b12)] shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
        {children}
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-6 py-5 sm:px-9">
          <button type="button" onClick={onBack} disabled={!onBack} className="rounded-lg px-4 py-2.5 text-sm text-white/60 transition hover:text-white disabled:invisible">Back</button>
          <button type="button" onClick={onNext} disabled={nextDisabled} className="rounded-lg bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 px-5 py-3 text-sm font-medium text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45">{nextLabel}</button>
        </footer>
      </section>
    </div>
  </main>;
}

export default function OnboardingFlowFiveStep({ accountLabel = 'your active account' }) {
  const [step, setStep] = useState(0);
  const [limits, setLimits] = useState({ dailyLossLimit: '', maximumPositionSize: '', stopOnProfit: '' });
  const [focusRuleIds, setFocusRuleIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const selectedFocus = useMemo(() => FOCUS_RULES.filter((rule) => focusRuleIds.includes(rule.id)), [focusRuleIds]);
  const validLimits = Object.values(limits).every((value) => Number(value) > 0);

  const toggleFocus = (id) => setFocusRuleIds((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 5 ? [...current, id] : current);
  const next = () => { setError(''); setStep((current) => Math.min(current + 1, 4)); };
  const back = () => { setError(''); setStep((current) => Math.max(current - 1, 0)); };
  const finish = async () => {
    setSubmitting(true); setError('');
    const result = await completeDisciplineOnboarding({ ...limits, focusRuleIds });
    if (result?.error) { setError(result.error); setSubmitting(false); return; }
    window.location.href = '/dashboard/discipline';
  };

  if (step === 0) return <Frame step={step} onNext={next}>
    <div className="grid gap-8 px-6 py-8 sm:px-9 sm:py-12 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
      <div><div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fuchsia-300">Discipline programme</div><h1 className="mt-4 max-w-xl font-display text-4xl leading-tight sm:text-5xl">Build the structure your decisions can return to.</h1><p className="mt-5 max-w-xl text-sm leading-relaxed text-white/60">This programme is for {accountLabel}. Set clear limits, choose the behaviours to protect, then start from Day 0.</p><div className="mt-7 flex items-center gap-3 text-sm text-cyan-200"><span className="grid h-8 w-8 place-items-center rounded-full border border-cyan-300/30 bg-cyan-300/10">1</span> Five deliberate steps. No performance promises.</div></div>
      <div className="rounded-2xl border border-violet-300/20 bg-[radial-gradient(circle_at_50%_30%,rgba(53,197,255,0.16),transparent_42%),linear-gradient(180deg,rgba(21,16,43,0.72),rgba(4,11,20,0.9))] p-4"><img src="/discipline/monk-day-0.png" alt="Day 0 monk illustration" className="h-64 w-full object-contain object-bottom" /><div className="pb-2 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/70">Day 0 — begin with a clear rulebook</div></div>
    </div>
  </Frame>;

  if (step === 1) return <Frame step={step} onBack={back} onNext={next} nextDisabled={!validLimits}>
    <div className="px-6 py-8 sm:px-9 sm:py-12"><div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fuchsia-300">Required guardrails</div><h1 className="mt-3 font-display text-3xl sm:text-4xl">Decide the limits before the session asks you to.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">These three controls are required for your programme. Use positive values that match your account and trading plan.</p><div className="mt-8 grid gap-5 md:grid-cols-3"><Field label="Daily loss limit" unit="$" value={limits.dailyLossLimit} onChange={(value) => setLimits({ ...limits, dailyLossLimit: value })} placeholder="e.g. 200" /><Field label="Maximum position size" unit="Lots" value={limits.maximumPositionSize} onChange={(value) => setLimits({ ...limits, maximumPositionSize: value })} placeholder="e.g. 2" /><Field label="Stop-on-profit" unit="$" value={limits.stopOnProfit} onChange={(value) => setLimits({ ...limits, stopOnProfit: value })} placeholder="e.g. 300" /></div></div>
  </Frame>;

  if (step === 2) return <Frame step={step} onBack={back} onNext={next} nextDisabled={focusRuleIds.length < 3 || focusRuleIds.length > 5}>
    <div className="px-6 py-8 sm:px-9 sm:py-12"><div className="flex flex-wrap items-end justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fuchsia-300">Focus rules</div><h1 className="mt-3 font-display text-3xl sm:text-4xl">Choose 3–5 behaviours to protect.</h1></div><div className={`rounded-full border px-3 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${focusRuleIds.length >= 3 && focusRuleIds.length <= 5 ? 'border-emerald-300/30 text-emerald-200' : 'border-white/15 text-white/45'}`}>{focusRuleIds.length} of 3–5 selected</div></div><p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">These are observable commitments for review, not predictions about outcomes.</p><div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{FOCUS_RULES.map((rule) => { const selected = focusRuleIds.includes(rule.id); const locked = !selected && focusRuleIds.length >= 5; return <button key={rule.id} type="button" disabled={locked} onClick={() => toggleFocus(rule.id)} className={`rounded-2xl border p-5 text-left transition ${selected ? 'border-cyan-300/50 bg-cyan-300/[0.08]' : 'border-white/10 bg-black/20 hover:border-white/25'} disabled:opacity-45`}><div className="flex items-start justify-between gap-3"><span className="font-display text-base font-semibold">{rule.title}</span><span className={`grid h-5 w-5 place-items-center rounded-full border text-xs ${selected ? 'border-cyan-200 bg-cyan-300 text-[#08111b]' : 'border-white/20 text-transparent'}`}>✓</span></div><p className="mt-2 text-sm leading-relaxed text-white/55">{rule.copy}</p></button>; })}</div></div>
  </Frame>;

  if (step === 3) return <Frame step={step} onBack={back} onNext={next}>
    <div className="grid gap-7 px-6 py-8 sm:px-9 sm:py-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div className="overflow-hidden rounded-2xl border border-violet-300/20 bg-[radial-gradient(circle_at_50%_35%,rgba(53,197,255,0.16),transparent_42%),linear-gradient(180deg,rgba(21,16,43,0.72),rgba(4,11,20,0.9))]"><img src="/discipline/monk-master.png.png" alt="Monk progression energy preview" className="h-72 w-full object-contain object-bottom" /><div className="pb-5 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/70">Energy preview — earned through reviewed days</div></div><div><div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fuchsia-300">Monk progression</div><h1 className="mt-3 font-display text-3xl sm:text-4xl">Progress is a practice, not a promise.</h1><p className="mt-4 text-sm leading-relaxed text-white/60">Your path starts at Day 0. Eligible reviewed trading dates advance the progression once, keeping attention on the process you can repeat.</p><div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4"><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">What advances the path</div><p className="mt-2 text-sm text-white/75">One completed eligible review for a new trading date.</p></div></div></div>
  </Frame>;

  return <Frame step={step} onBack={back} onNext={finish} nextLabel={submitting ? 'Starting…' : 'Start my programme'} nextDisabled={submitting}>
    <div className="px-6 py-8 sm:px-9 sm:py-12"><div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fuchsia-300">Programme ready</div><h1 className="mt-3 font-display text-3xl sm:text-4xl">Your discipline programme is ready to begin.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">We will save these guardrails and focus rules for {accountLabel}, then take you to your discipline dashboard.</p><div className="mt-8 grid gap-4 md:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Required guardrails</div><ul className="mt-3 space-y-2 text-sm text-white/80"><li>Daily loss limit: ${limits.dailyLossLimit}</li><li>Maximum position size: {limits.maximumPositionSize} Lots</li><li>Stop-on-profit: ${limits.stopOnProfit}</li></ul></div><div className="rounded-2xl border border-white/10 bg-black/20 p-5"><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Focus rules</div><ul className="mt-3 space-y-2 text-sm text-white/80">{selectedFocus.map((rule) => <li key={rule.id}>{rule.title}</li>)}</ul></div></div>{error && <p role="alert" className="mt-5 rounded-xl border border-rose-300/30 bg-rose-300/10 px-4 py-3 text-sm text-rose-100">{error}</p>}</div>
  </Frame>;
}
