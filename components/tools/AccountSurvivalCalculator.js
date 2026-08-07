'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

function clamp(value, minimum, maximum) {
  const number = Number(value);
  return Math.min(Math.max(Number.isFinite(number) ? number : minimum, minimum), maximum);
}

function NumberInput({ label, value, onChange, prefix, suffix, hint, minimum = 1, maximum = 100000000, step = 1 }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-white/55">{label}</span>
      <div className="flex items-center rounded-xl border border-white/10 bg-black/20 px-3 transition-colors focus-within:border-cyan-300/50">
        {prefix && <span className="mr-1 text-sm text-white/45">{prefix}</span>}
        <input
          aria-label={label}
          type="number"
          min={minimum}
          max={maximum}
          step={step}
          value={value}
          onChange={(event) => onChange(clamp(event.target.value, minimum, maximum))}
          className="w-full bg-transparent py-3 text-base font-semibold text-white outline-none"
        />
        {suffix && <span className="ml-2 text-sm text-white/45">{suffix}</span>}
      </div>
      {hint && <span className="mt-1.5 block text-xs text-white/45">{hint}</span>}
    </label>
  );
}

function Stat({ label, value, tone = 'white' }) {
  const tones = { white: 'text-white', cyan: 'text-cyan-200', green: 'text-emerald-400', amber: 'text-amber-300', red: 'text-red-400' };
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.025] p-3">
      <p className="font-mono text-[10px] uppercase tracking-wider text-white/45">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

export default function AccountSurvivalCalculator() {
  const [accountSize, setAccountSize] = useState(50000);
  const [maximumLoss, setMaximumLoss] = useState(2000);
  const [lossMode, setLossMode] = useState('dollar');
  const [dailyDollar, setDailyDollar] = useState(200);
  const [dailyPercent, setDailyPercent] = useState(1);
  const [calculated, setCalculated] = useState({ accountSize: 50000, maximumLoss: 2000, lossMode: 'dollar', dailyDollar: 200, dailyPercent: 1 });

  const proposedDailyLoss = lossMode === 'percentage' ? accountSize * (dailyPercent / 100) : dailyDollar;
  const result = useMemo(() => {
    const dailyLoss = calculated.lossMode === 'percentage'
      ? calculated.accountSize * (calculated.dailyPercent / 100)
      : calculated.dailyDollar;
    const sessions = Math.floor(calculated.maximumLoss / dailyLoss);
    const remainder = calculated.maximumLoss - sessions * dailyLoss;
    const status = sessions >= 30
      ? { title: 'Excellent discipline buffer', icon: '🙂', tone: 'green', copy: 'Your configured plan has a wide buffer for consecutive losing trading sessions.' }
      : sessions >= 15
        ? { title: 'Moderate buffer', icon: '⚠', tone: 'amber', copy: 'Your configured plan has a meaningful, but limited, buffer for consecutive losing trading sessions.' }
        : { title: 'High-risk buffer', icon: '🚨', tone: 'red', copy: 'Your configured plan has a small buffer for consecutive losing trading sessions.' };
    return { dailyLoss, sessions, remainder, status };
  }, [calculated]);

  const dayMarkers = result.sessions > 0
    ? Array.from(new Set([1, Math.max(1, Math.ceil(result.sessions * 0.25)), Math.max(1, Math.ceil(result.sessions * 0.5)), Math.max(1, Math.ceil(result.sessions * 0.75)), result.sessions])).slice(0, 5)
    : [];
  const progressSegments = Math.min(20, Math.max(1, result.sessions));

  function calculate() {
    setCalculated({ accountSize, maximumLoss, lossMode, dailyDollar, dailyPercent });
  }

  return (
    <div className="mx-auto max-w-4xl pb-12">
      <section className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/5 text-3xl" aria-hidden="true">🛡</div>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300">Free risk calculator</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-white md:text-4xl">Account Survival Calculator</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/55 md:text-base">Know how many consecutive losing trading sessions your account can absorb from your planned maximum daily loss.</p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <div className="mb-6"><p className="font-mono text-xs uppercase tracking-wider text-cyan-300">Your risk boundary</p><h2 className="mt-1 text-xl font-semibold text-white">Account and daily loss plan</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <NumberInput label="Account size" value={accountSize} onChange={setAccountSize} prefix="$" />
          <NumberInput label="Maximum allowed loss or drawdown" value={maximumLoss} onChange={setMaximumLoss} prefix="$" hint="For a personal account this may equal your capital. For a prop account, use the firm’s allowed drawdown." maximum={accountSize * 100} />
        </div>

        <div className="mt-5 rounded-xl border border-white/10 bg-black/20 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-wider text-white/55">Planned maximum daily loss</p><p className="mt-1 text-sm text-white/45">Choose the format that matches how you set your daily boundary.</p></div><div className="flex rounded-lg border border-white/10 p-1" role="radiogroup" aria-label="Planned daily loss format"><button type="button" role="radio" aria-checked={lossMode === 'dollar'} onClick={() => setLossMode('dollar')} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${lossMode === 'dollar' ? 'bg-cyan-300/10 text-cyan-200' : 'text-white/45 hover:text-white'}`}>Dollar</button><button type="button" role="radio" aria-checked={lossMode === 'percentage'} onClick={() => setLossMode('percentage')} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${lossMode === 'percentage' ? 'bg-cyan-300/10 text-cyan-200' : 'text-white/45 hover:text-white'}`}>Percentage</button></div></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {lossMode === 'dollar' ? <NumberInput label="Planned daily loss" value={dailyDollar} onChange={setDailyDollar} prefix="$" maximum={maximumLoss} /> : <NumberInput label="Planned daily loss" value={dailyPercent} onChange={setDailyPercent} suffix="%" maximum={100} step={0.1} hint={`Auto-converts to ${money.format(proposedDailyLoss)} per session.`} />}
            <div className="rounded-xl border border-cyan-300/15 bg-cyan-300/[0.05] p-4"><p className="font-mono text-[10px] uppercase tracking-wider text-cyan-200">Current daily loss</p><p className="mt-2 text-2xl font-bold text-white">{money.format(proposedDailyLoss)}</p><p className="mt-1 text-xs text-white/45">{lossMode === 'percentage' ? `${dailyPercent}% of account size` : 'Dollar amount selected'}</p></div>
          </div>
        </div>
        <button type="button" onClick={calculate} className="mt-6 w-full rounded-xl px-5 py-3.5 text-sm font-semibold text-[#08080f] transition-transform hover:scale-[1.01] active:scale-[0.99]" style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}>Calculate survival →</button>
      </section>

      <section className="mt-5 rounded-2xl border border-cyan-300/20 bg-gradient-to-br from-violet-500/[0.11] to-cyan-500/[0.05] p-5 text-center md:p-7">
        <p className="font-mono text-xs uppercase tracking-wider text-cyan-200">Your plan survives</p>
        <p className="mt-3 text-7xl font-bold tracking-tight text-white md:text-8xl">{result.sessions}</p>
        <h2 className="mt-2 text-xl font-semibold text-white md:text-2xl">Consecutive losing trading sessions</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/55">If a trading session reaches your planned maximum daily loss for {result.sessions} sessions in a row, the configured maximum allowed loss would be exhausted.</p>

        <div className="mx-auto mt-7 max-w-xl"><div className="flex gap-1.5" aria-label={`${result.sessions} configured survival sessions`} role="img">{Array.from({ length: progressSegments }, (_, index) => <span key={index} className="h-3 flex-1 rounded-sm bg-cyan-300" />)}</div><p className="mt-2 font-mono text-xs text-white/55">{result.sessions} / {result.sessions} configured sessions</p></div>

        <div className="mt-7 grid gap-3 sm:grid-cols-3"><Stat label="Planned daily loss" value={money.format(result.dailyLoss)} tone="cyan" /><Stat label="Maximum allowed loss" value={money.format(calculated.maximumLoss)} tone="cyan" /><Stat label="Survival" value={`${result.sessions} sessions`} tone="cyan" /></div>
      </section>

      <section className="mt-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-mono text-xs uppercase tracking-wider text-cyan-300">Simple timeline</p><h2 className="mt-1 text-lg font-semibold text-white">Configured loss boundary</h2></div><span className="font-mono text-xs text-white/45">No forecast. Just your inputs.</span></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-5">{dayMarkers.map((day, index) => { const final = index === dayMarkers.length - 1; return <div key={`${day}-${index}`} className={`rounded-xl border p-3 ${final ? 'border-red-400/30 bg-red-400/[0.06]' : 'border-emerald-400/20 bg-emerald-400/[0.04]'}`}><p className="font-mono text-[10px] uppercase tracking-wider text-white/45">Session {day}</p><p className={`mt-2 text-sm font-semibold ${final ? 'text-red-400' : 'text-emerald-400'}`}>{final ? 'Boundary reached' : 'Within buffer'} {final ? '✕' : '✓'}</p></div>; })}</div>
        <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-relaxed text-white/55"><span className="font-semibold text-white">Formula: </span>{money.format(calculated.maximumLoss)} maximum allowed loss ÷ {money.format(result.dailyLoss)} planned daily loss = <span className="font-semibold text-cyan-200">{result.sessions} full sessions</span>{result.remainder > 0 ? `, with ${money.format(result.remainder)} remaining after those full sessions.` : '.'}</div>
      </section>

      <section className={`mt-5 rounded-2xl border p-5 ${result.status.tone === 'green' ? 'border-emerald-400/20 bg-emerald-400/[0.05]' : result.status.tone === 'amber' ? 'border-amber-300/20 bg-amber-300/[0.05]' : 'border-red-400/20 bg-red-400/[0.05]'}`}><div className="flex gap-3"><span className="text-2xl" aria-hidden="true">{result.status.icon}</span><div><h2 className="font-semibold text-white">{result.status.title}</h2><p className="mt-1 text-sm leading-relaxed text-white/60">Your account can survive {result.sessions} consecutive losing trading sessions. {result.status.copy}</p></div></div></section>

      <section className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.05] p-5 text-center"><h2 className="font-semibold text-white">Want live tracking?</h2><p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/55">Log trades in PropLogAI to keep your own risk and review evidence in one place.</p><Link href="/login" className="mt-5 inline-block rounded-xl px-6 py-3 text-sm font-semibold text-[#08080f] transition-transform hover:scale-[1.01] active:scale-[0.99]" style={{ background: 'linear-gradient(120deg, #a78bfa, #22d3ee)' }}>Start Free →</Link></section>
      <p className="mx-auto mt-7 max-w-2xl text-center text-xs leading-relaxed text-white/45">Educational calculator only. It does not connect to a trading account or provide trading, investment, or risk advice. Confirm drawdown rules with your prop firm or account provider.</p>
    </div>
  );
}
