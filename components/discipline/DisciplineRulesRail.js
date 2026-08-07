"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  addDisciplineRule,
  completeDisciplineProgramSetup,
  startDisciplineProgram,
} from '@/app/dashboard/discipline/actions';
import { useToast } from '@/components/ui/Toast';

const RULES = {
  risk: { key: 'risk', name: 'Risk per trade', metric: 'risk_per_trade', ruleType: 'required_guardrail', unit: '$', icon: '◈' },
  daily: { key: 'daily', name: 'Daily loss limit', metric: 'daily_loss_limit', ruleType: 'required_guardrail', unit: '$', icon: '◈' },
  size: { key: 'size', name: 'Maximum position size', metric: 'maximum_position_size', ruleType: 'focus', unit: 'Lots', icon: '◉' },
  setup: { key: 'setup', name: 'Planned A-grade setups only', metric: 'behavior', ruleType: 'focus', unit: '', icon: '◌' },
  confirmation: { key: 'confirmation', name: 'Wait for candle-close confirmation', metric: 'behavior', ruleType: 'focus', unit: '', icon: '▥' },
  profit: { key: 'profit', name: 'Stop on profit', metric: 'stop_on_profit', ruleType: 'library', unit: '$', icon: '↑' },
};

const REQUIRED = [RULES.risk, RULES.daily];
const FOCUS = [RULES.size, RULES.setup, RULES.confirmation];
const LIBRARY = [RULES.profit];

function formatThreshold(rule) {
  if (rule.threshold == null) return 'Qualitative';
  return `${rule.unit || ''}${rule.threshold}${rule.unit && rule.unit !== '$' ? ` ${rule.unit}` : ''}`;
}

function RuleEditor({ rule, busy, onClose, onSave }) {
  const [name, setName] = useState(rule.name);
  const [threshold, setThreshold] = useState('');
  const [instrument, setInstrument] = useState('');
  const quantitative = rule.metric !== 'behavior';

  return (
    <section className="mb-5 rounded-2xl border border-fuchsia-300/30 bg-[#10131d] p-4 shadow-[0_22px_70px_rgba(0,0,0,0.42)] sm:p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fuchsia-300">Add rule</div>
          <h2 className="mt-1 font-display text-xl font-semibold text-white">{rule.name}</h2>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/65">Close</button>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Rule name</span>
          <input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300" />
        </label>
        {quantitative && <label>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Limit</span>
          <div className="mt-2 flex overflow-hidden rounded-xl border border-white/10 bg-black/30">
            <input autoFocus value={threshold} onChange={(event) => setThreshold(event.target.value)} type="number" min="0" step="any" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-white outline-none" placeholder="Enter value" />
            <span className="border-l border-white/10 px-3 py-3 text-xs text-white/50">{rule.unit}</span>
          </div>
        </label>}
        <label>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">Instrument scope</span>
          <input value={instrument} onChange={(event) => setInstrument(event.target.value)} maxLength={30} className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none focus:border-cyan-300" placeholder="All instruments" />
        </label>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/45">This creates the current baseline. Version editing follows in a later slice.</p>
        <button type="button" disabled={busy || !name.trim() || (quantitative && !threshold)} onClick={() => onSave({ ...rule, name }, threshold, instrument)} className="rounded-lg bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">
          {busy ? 'Saving…' : 'Save rule'}
        </button>
      </div>
    </section>
  );
}

function MonkRail({ reviewedDayCount = 0 }) {
  const boundedDayCount = Math.min(Math.max(Number(reviewedDayCount) || 0, 0), 30);
  const percent = Math.min(Math.round((boundedDayCount / 30) * 100), 100);
  return (
    <aside className="hidden h-fit rounded-2xl border border-white/15 bg-[radial-gradient(circle_at_50%_25%,rgba(86,70,210,0.24),transparent_36%),linear-gradient(180deg,#0b111c,#080b11)] p-5 xl:sticky xl:top-6 xl:block">
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.19em] text-fuchsia-300">Monk reminder <span className="rounded-full border border-white/25 px-2 py-0.5 text-[9px] text-white/60">Lite</span></div>
      <div className="relative mx-auto mt-5 overflow-hidden rounded-2xl border border-violet-300/20 bg-[radial-gradient(circle_at_50%_35%,rgba(53,197,255,0.16),transparent_42%),linear-gradient(180deg,rgba(21,16,43,0.72),rgba(4,11,20,0.9))]">
        <img src="/discipline/monk-master.png.png" alt="Faceless Monk path progress illustration" className="h-56 w-full object-contain object-bottom" />
        <span className="absolute inset-x-0 bottom-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/70">Path begins with review</span>
      </div>
      <div className="mt-5 text-center"><div className="text-sm text-white/60">Reviewed</div><div className="mt-1 font-display text-xl text-white">Day {boundedDayCount} of 30</div><div className="mt-1 font-display text-4xl text-cyan-300">{percent}%</div></div>
      <div className="mt-4 grid grid-cols-10 gap-1" aria-label={`${percent}% of 30 reviewed trading days completed`} role="progressbar" aria-valuemin="0" aria-valuemax="30" aria-valuenow={boundedDayCount}>
        {Array.from({ length: 10 }).map((_, index) => <span key={index} className={`h-1.5 rounded-full ${index < Math.ceil(percent / 10) ? 'bg-gradient-to-r from-fuchsia-300 to-cyan-300' : 'bg-white/15'}`} />)}
      </div>
      <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 text-center"><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/45">Reminder</div><p className="mt-2 text-sm leading-relaxed text-white/75">One completed eligible review advances a new trading date once.</p></div>
      <button type="button" disabled className="mt-4 w-full rounded-xl border border-fuchsia-300/70 px-4 py-3 text-sm text-white/65">Immersive progress arrives next</button>
    </aside>
  );
}

function EmptyProgramme({ onStart, starting, accountLabel }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <section className="rounded-2xl border border-white/15 bg-[radial-gradient(circle_at_80%_0%,rgba(38,196,255,0.12),transparent_28%),linear-gradient(135deg,#0c111c,#080b12)] p-6 sm:p-9">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-fuchsia-300">Discipline programme</div>
        <h1 className="mt-3 font-display text-3xl text-white sm:text-4xl">Set the rules your reviews will protect.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">Create the programme for {accountLabel}, set two required guardrails, then choose three to five Focus rules. Trade logging remains your evidence source.</p>
        <button type="button" onClick={onStart} disabled={starting} className="mt-7 rounded-lg bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 px-5 py-3 text-sm font-medium text-white disabled:opacity-50">{starting ? 'Starting…' : 'Start programme'}</button>
      </section>
    </div>
  );
}

export default function DisciplineRulesRail({ program, rules, focusRuleIds, activeAccountId, reviewedDayCount = 0 }) {
  const router = useRouter();
  const toast = useToast();
  const [selectedRule, setSelectedRule] = useState(null);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completing, setCompleting] = useState(false);

  const activeFocusIds = new Set(focusRuleIds);
  const ruleFor = (template, focusOnly = false) => rules.find((rule) => (
    rule.rule_type === template.ruleType
    && rule.metric === template.metric
    && rule.name === template.name
    && (!focusOnly || activeFocusIds.has(rule.id))
  ));
  const requiredRules = REQUIRED.map((template) => ({ template, rule: ruleFor(template) }));
  const focusRules = FOCUS.map((template) => ({ template, rule: ruleFor(template, true) }));
  const otherRules = rules.filter((rule) => !requiredRules.some(({ rule: current }) => current?.id === rule.id) && !focusRules.some(({ rule: current }) => current?.id === rule.id));
  const focusCount = rules.filter((rule) => rule.rule_type === 'focus' && activeFocusIds.has(rule.id)).length;
  const configuredGuardrails = requiredRules.filter(({ rule }) => rule).length;
  const setupReady = configuredGuardrails === 2 && focusCount >= 3 && focusCount <= 5;
  const accountLabel = activeAccountId ? 'the selected account' : 'All Accounts';

  async function start() {
    setStarting(true);
    const result = await startDisciplineProgram();
    setStarting(false);
    if (result.error) return toast.error(result.error);
    toast.success('Programme started. Set the two guardrails first.');
    router.refresh();
  }

  async function saveRule(template, threshold, instrument) {
    if (!program) return;
    setSaving(true);
    const result = await addDisciplineRule({ programId: program.id, name: template.name, metric: template.metric, ruleType: template.ruleType, unit: template.unit, threshold, instrument });
    setSaving(false);
    if (result.error) return toast.error(result.error);
    setSelectedRule(null);
    toast.success('Rule added to the programme.');
    router.refresh();
  }

  async function completeSetup() {
    if (!program) return;
    setCompleting(true);
    const result = await completeDisciplineProgramSetup(program.id);
    setCompleting(false);
    if (result.error) return toast.error(result.error);
    toast.success('Rules setup complete.');
    router.refresh();
  }

  if (!program) return <EmptyProgramme onStart={start} starting={starting} accountLabel={accountLabel} />;

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-7 sm:px-6 lg:py-9">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_285px]">
        <main className="min-w-0">
          <header className="flex flex-wrap items-start justify-between gap-4">
            <div><h1 className="font-display text-3xl font-normal tracking-tight text-white">Your rules</h1><p className="mt-2 text-sm text-white/60">The limits and behaviours PropLogAI checks when a trade needs review.</p></div>
            <button type="button" onClick={() => setSelectedRule({ key: 'custom', name: 'New Focus rule', metric: 'behavior', ruleType: 'focus', unit: '', icon: '+' })} className="rounded-lg bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 px-4 py-2.5 text-sm text-white shadow-[0_0_24px_rgba(62,137,255,0.25)]">＋ Add rule</button>
          </header>

          <div className="mt-5 grid grid-cols-4 overflow-hidden rounded-xl border border-white/15 bg-black/20" aria-label="Discipline section status">
            {[["▣", "Today"], ["♢", "Rules"], ["▤", "Review"], ["⌁", "Progress"]].map(([icon, label]) => <span key={label} className={`relative flex items-center justify-center gap-2 px-2 py-3 text-sm ${label === 'Rules' ? 'text-white' : 'text-white/55'}`}>{label === 'Rules' && <span aria-hidden="true" className="absolute inset-x-4 bottom-0 h-0.5 bg-gradient-to-r from-fuchsia-300 to-cyan-300" />}<span aria-hidden="true" className="hidden text-base sm:inline">{icon}</span>{label}</span>)}
          </div>

          {selectedRule && <div className="mt-5"><RuleEditor rule={selectedRule} busy={saving} onClose={() => setSelectedRule(null)} onSave={saveRule} /></div>}

          <section className="mt-5 rounded-2xl border border-white/15 bg-[linear-gradient(120deg,rgba(18,18,29,0.85),rgba(5,13,23,0.82))] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="font-mono text-xs uppercase tracking-[0.18em] text-fuchsia-300">Required guardrails <span className="text-white/45">ⓘ</span></div><span className={`rounded-lg border px-2.5 py-1 text-xs ${configuredGuardrails === 2 ? 'border-emerald-400/60 text-emerald-300' : 'border-amber-300/50 text-amber-200'}`}>{configuredGuardrails === 2 ? 'Configured' : `${configuredGuardrails} of 2 set`}</span></div>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              {requiredRules.map(({ template, rule }) => <div key={template.key} className="grid gap-3 border-t border-white/10 px-4 py-4 first:border-t-0 sm:grid-cols-[42px_minmax(160px,1fr)_110px_95px_auto] sm:items-center"><span className="grid h-9 w-9 place-items-center rounded-full border border-fuchsia-300/45 text-fuchsia-200">{template.icon}</span><span className="text-sm text-white">{template.name}</span><span className="font-mono text-sm text-white/85">{rule ? formatThreshold(rule) : 'Not set'}</span><span className={`w-fit rounded-md border px-2 py-1 text-xs ${rule ? 'border-emerald-400/55 text-emerald-300' : 'border-white/15 text-white/40'}`}>{rule ? 'Required' : 'Pending'}</span>{rule ? <span className="text-sm text-white/45">History next</span> : <button type="button" onClick={() => setSelectedRule(template)} className="w-fit text-sm text-white/75 hover:text-cyan-200">＋ Add</button>}</div>)}
            </div>
          </section>

          <section className="mt-5 rounded-2xl border border-white/15 bg-[linear-gradient(120deg,rgba(18,18,29,0.85),rgba(5,13,23,0.82))] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="font-mono text-xs uppercase tracking-[0.18em] text-fuchsia-300">Focus rules · {focusCount} of 5</div><span className={`rounded-lg border px-2.5 py-1 text-xs ${focusCount >= 3 ? 'border-emerald-400/60 text-emerald-300' : 'border-amber-300/50 text-amber-200'}`}>{focusCount >= 3 ? 'Configured' : 'Choose 3–5'}</span></div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {focusRules.map(({ template, rule }) => <button key={template.key} type="button" onClick={() => !rule && setSelectedRule(template)} disabled={Boolean(rule) || saving || focusCount >= 5} className={`min-h-28 rounded-xl border p-4 text-left ${rule ? 'border-emerald-400/25 bg-emerald-400/[0.04]' : 'border-white/10 bg-black/20 hover:border-fuchsia-300/55'} disabled:cursor-default`}><span className="grid h-9 w-9 place-items-center rounded-full border border-fuchsia-300/45 text-fuchsia-200">{template.icon}</span><div className="mt-3 text-sm leading-relaxed text-white">{template.name}</div><div className={`mt-3 text-xs ${rule ? 'text-emerald-300' : 'text-cyan-200'}`}>{rule ? '✓ Configured' : focusCount >= 5 ? 'Focus limit reached' : 'Add Focus rule'}</div></button>)}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm"><p className="text-white/60">Only Focus rules appear in quick reviews.</p><button type="button" onClick={() => setSelectedRule({ key: 'custom', name: 'New Focus rule', metric: 'behavior', ruleType: 'focus', unit: '', icon: '+' })} disabled={focusCount >= 5 || saving} className="rounded-lg border border-fuchsia-300/70 px-3 py-2 text-fuchsia-200 disabled:opacity-40">Choose Focus rules</button></div>
          </section>

          <details className="mt-5 rounded-2xl border border-white/15 bg-[linear-gradient(120deg,rgba(18,18,29,0.85),rgba(5,13,23,0.82))] p-4 sm:p-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-mono text-xs uppercase tracking-[0.18em] text-fuchsia-300">All other rules · {otherRules.length}<span className="text-white/70">⌄</span></summary>
            <p className="mt-4 text-sm text-white/60">Optional defaults and custom rules stay available without appearing in quick reviews.</p>
            <div className="mt-4 space-y-2">{[...otherRules, ...LIBRARY.filter((template) => !ruleFor(template))].map((item) => { const rule = item.id ? item : null; const template = rule ? null : item; return <div key={rule?.id || template.key} className="flex items-center justify-between rounded-lg border border-white/10 bg-black/20 px-3 py-3 text-sm"><span>{rule?.name || template.name}</span><button type="button" onClick={() => !rule && setSelectedRule(template)} className="text-cyan-200">{rule ? 'In Rulebook' : 'Add'}</button></div>; })}</div>
          </details>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 px-1"><span className="text-sm text-white/45">Rule history and editing become available after the versioning slice.</span><button type="button" onClick={completeSetup} disabled={!setupReady || Boolean(program.configured_at) || completing} className="rounded-lg bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-400 px-4 py-2.5 text-sm text-white disabled:opacity-40">{program.configured_at ? 'Rules setup complete' : completing ? 'Completing…' : 'Complete rules setup'}</button></div>

          <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4 xl:hidden"><div className="font-mono text-[10px] uppercase tracking-[0.16em] text-fuchsia-300">Monk reminder · Lite</div><p className="mt-2 text-sm text-white/65">The Monk Path begins after the first eligible reviewed trading day. Progress is currently {reviewedDayCount} of 30.</p></div>
        </main>
        <MonkRail reviewedDayCount={reviewedDayCount} />
      </div>
    </div>
  );
}
