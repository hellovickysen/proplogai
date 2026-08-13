"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveRulebookRule } from '@/app/dashboard/rulebook/rulebook-actions';
import { useToast } from '@/components/ui/Toast';

const DEFAULT_RULES = [
  { rule_key: 'daily_loss_limit', title: 'Daily Loss Limit', value: '250', unit: '$', commitment: 'I will never lose more than', ending: 'in one day. When I reach it, I stop trading.' },
  { rule_key: 'maximum_lot_contract_size', title: 'Maximum Lot / Contract Size', value: '1', unit: 'lot / contract', commitment: 'I will never trade more than', ending: 'on one trade.' },
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
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-red-400/25 bg-red-500/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-red-300">Non-negotiable</span>
            <span className="font-mono text-[11px] text-white/40">{rule.title}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm leading-relaxed text-white/70">
            <span>{rule.commitment}</span>
            <div className="flex rounded-lg border border-white/10 bg-black/30 focus-within:border-cyan-400/60">
              <input value={value} onChange={(event) => setValue(event.target.value)} inputMode="decimal" className="w-20 bg-transparent px-2.5 py-1.5 text-sm font-semibold text-white outline-none" aria-label={rule.title + ' limit'} />
              <span className="flex items-center border-l border-white/10 px-2 text-[11px] text-white/45">{rule.unit}</span>
            </div>
            <span>{rule.ending}</span>
          </div>
        </div>
        <button type="button" onClick={save} disabled={saving || !value.trim()} className="w-fit rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-500/20 disabled:opacity-50">
          {saving ? 'Saving...' : 'Save'}
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
      <div className="mb-6 max-w-2xl">
        <span className="font-mono text-xs uppercase tracking-wider text-cyan-300">Your discipline foundation</span>
        <h1 className="mt-2 font-display text-3xl font-bold">Rulebook</h1>
        <p className="mt-2 text-sm leading-relaxed text-white/55">These are the limits I choose to keep. They are personal boundaries, not trading recommendations.</p>
      </div>
      <section className="max-w-3xl">
        <div className="mb-4">
          <h2 className="font-display text-xl font-semibold">1. Non-negotiables</h2>
          <p className="mt-1 text-sm text-white/45">Set the boundaries I will follow before I trade.</p>
        </div>
        <div className="space-y-4">
          {defaults.map((rule) => <RuleCard key={rule.rule_key} rule={rule} initialValue={values[rule.rule_key]} />)}
        </div>
      </section>
    </div>
  );
}
