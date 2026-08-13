"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveRulebookRule } from '@/app/dashboard/rulebook/rulebook-actions';
import { useToast } from '@/components/ui/Toast';

const DEFAULT_RULES = [
  { rule_key: 'daily_loss_limit', title: 'Daily Loss Limit', value: '250', unit: '$', guidance: 'Stop trading for the day once this loss limit is reached.' },
  { rule_key: 'maximum_lot_contract_size', title: 'Maximum Lot / Contract Size', value: '1', unit: 'lot / contract', guidance: 'Do not exceed this size on any single trade.' },
];

function RuleCard({ rule, initialValue }) {
  const [value, setValue] = useState(initialValue || rule.value);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const router = useRouter();

  async function save() {
    setSaving(true);
    const result = await saveRulebookRule(rule.rule_key, value);
    if (result.error) toast?.error?.(result.error);
    else {
      toast?.success?.(rule.title + ' saved');
      router.refresh();
    }
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <span className="rounded-full border border-red-400/25 bg-red-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-red-300">Non-negotiable</span>
          <h2 className="mt-3 font-display text-lg font-semibold">{rule.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-white/55">{rule.guidance}</p>
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block font-mono text-xs uppercase tracking-wider text-white/55">Your limit</label>
          <div className="flex rounded-lg border border-white/10 bg-black/30 focus-within:border-cyan-400/60">
            <input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" className="min-w-0 flex-1 bg-transparent px-3.5 py-2.5 text-sm outline-none" aria-label={rule.title + ' limit'} />
            <span className="flex items-center border-l border-white/10 px-3 text-xs text-white/45">{rule.unit}</span>
          </div>
        </div>
        <button type="button" onClick={save} disabled={saving || !value.trim()} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-[#08080f] disabled:opacity-50" style={{ background: 'linear-gradient(120deg,#a78bfa,#22d3ee)' }}>
          {saving ? 'Saving...' : 'Save limit'}
        </button>
      </div>
    </div>
  );
}

export default function RulebookGuardrailsPage({ rules = [] }) {
  const values = Object.fromEntries((rules || []).map((rule) => [rule.rule_key, rule.value]));
  const defaults = DEFAULT_RULES;

  return (
    <div className="px-4 py-8 sm:px-6">
      <div className="mb-8 max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-wider text-cyan-300">Your discipline foundation</span>
        <h1 className="mt-2 font-display text-3xl font-bold">Rulebook</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">Set the limits you will not negotiate with. These are your personal boundaries, not trading recommendations.</p>
      </div>
      <section className="max-w-3xl">
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold">1. Non-negotiables</h2>
          <p className="mt-1 text-sm text-white/45">Enter limits that match your account, trading plan, and risk tolerance.</p>
        </div>
        <div className="space-y-4">
          {defaults.map((rule) => <RuleCard key={rule.rule_key} rule={rule} initialValue={values[rule.rule_key]} />)}
        </div>
      </section>
    </div>
  );
}
