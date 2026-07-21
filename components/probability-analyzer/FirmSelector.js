'use client';

import { useState } from 'react';
import { getFirmList, getFirmRules } from '@/lib/probability-analyzer/firms';

export default function FirmSelector({ value, onChange, customRules, onCustomChange }) {
  const firms = getFirmList();
  const isCustom = value === 'Custom';

  return (
    <div className="space-y-3">
      <label className="font-mono text-xs uppercase tracking-wider text-white/55">
        Prop Firm
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5
          text-sm text-white outline-none transition-colors
          focus:border-white/25 focus:bg-white/[0.05]"
      >
        {firms.map((f) => (
          <option key={f.key} value={f.key} className="bg-[#0b0b14] text-white">
            {f.name} {f.phase ? `(${f.phase})` : ''}
          </option>
        ))}
      </select>

      {isCustom && customRules && (
        <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <CustomInput
            label="Profit Target %"
            value={customRules.profitTarget}
            onChange={(v) => onCustomChange({ ...customRules, profitTarget: v })}
          />
          <CustomInput
            label="Daily DD %"
            value={customRules.dailyDrawdown}
            onChange={(v) => onCustomChange({ ...customRules, dailyDrawdown: v })}
          />
          <CustomInput
            label="Overall DD %"
            value={customRules.overallDrawdown}
            onChange={(v) => onCustomChange({ ...customRules, overallDrawdown: v })}
          />
          <CustomInput
            label="Min Trading Days"
            value={customRules.minimumTradingDays}
            onChange={(v) => onCustomChange({ ...customRules, minimumTradingDays: v })}
          />
          <CustomInput
            label="Challenge Days"
            value={customRules.challengeDays}
            onChange={(v) => onCustomChange({ ...customRules, challengeDays: v })}
          />
        </div>
      )}
    </div>
  );
}

function CustomInput({ label, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-white/40">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5
          text-sm text-white outline-none focus:border-white/20"
      />
    </div>
  );
}
