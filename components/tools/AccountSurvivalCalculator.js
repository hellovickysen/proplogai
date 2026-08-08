'use client';
import { useMemo, useState } from 'react';

const usd = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

function toNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function Field({ label, value, setValue, prefix, suffix, step = 1, min = 0, max = 100000000, note }) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-xs uppercase tracking-wider text-white/55">
        {label}
      </span>
      <div className="flex items-center rounded-xl border border-white/10 bg-white/5 px-3 transition-colors focus-within:border-violet-500/50 focus-within:ring-1 focus-within:ring-violet-500/30">
        {prefix && <span className="mr-1 font-mono text-white/40">{prefix}</span>}
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0"
          className="w-full bg-transparent py-3 text-base font-semibold text-white placeholder-white/30 outline-none"
        />
        {suffix && <span className="ml-2 font-mono text-white/40">{suffix}</span>}
      </div>
      {note && <span className="mt-1.5 block text-xs text-white/40">{note}</span>}
    </label>
  );
}

function Stat({ label, value, highlight }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <p className="font-mono text-xs uppercase tracking-wider text-white/55">{label}</p>
      <p className={`mt-1 text-xl font-bold ${highlight ? 'text-cyan-300' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}

export default function AccountSurvivalCalculator() {
  const [size, setSize] = useState('50000');
  const [ddMode, setDdMode] = useState('dollar');
  const [ddDollar, setDdDollar] = useState('2000');
  const [ddPercent, setDdPercent] = useState('4');
  const [riskPerTrade, setRiskPerTrade] = useState('100');
  const [tradesPerDay, setTradesPerDay] = useState('2');

  const calc = useMemo(() => {
    const account = Math.max(toNum(size), 0.01);
    const drawdown =
      ddMode === 'percent'
        ? Math.min(account * toNum(ddPercent) / 100, account)
        : Math.min(toNum(ddDollar), account);
    const risk = Math.max(toNum(riskPerTrade), 0);
    const trades = Math.max(Math.floor(toNum(tradesPerDay, 1)), 1);
    const dailyRisk = risk * trades;

    const losingTrades = risk > 0 ? Math.floor(drawdown / risk) : 0;
    const losingSessions = dailyRisk > 0 ? Math.floor(drawdown / dailyRisk) : 0;

    const riskPctOfAccount = account > 0 ? (risk / account) * 100 : 0;
    const riskPctOfDrawdown = drawdown > 0 ? (risk / drawdown) * 100 : 0;
    const dailyPctOfDrawdown = drawdown > 0 ? (dailyRisk / drawdown) * 100 : 0;

    return {
      account,
      drawdown,
      risk,
      trades,
      dailyRisk,
      losingTrades,
      losingSessions,
      riskPctOfAccount,
      riskPctOfDrawdown,
      dailyPctOfDrawdown,
    };
  }, [size, ddMode, ddDollar, ddPercent, riskPerTrade, tradesPerDay]);

  const drawdownPct = calc.account > 0 ? (calc.drawdown / calc.account) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white md:text-3xl">
          Account Survival Calculator
        </h1>
        <p className="mt-2 text-sm text-white/55 md:text-base">
          Calculate how many consecutive losing trades or sessions your account
          can survive based on your risk settings.
        </p>
      </div>

      {/* Inputs */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <Field
            label="Account size"
            value={size}
            setValue={setSize}
            prefix="$"
            note="Your trading capital or prop firm account size"
          />

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-xs uppercase tracking-wider text-white/55">
                Maximum drawdown
              </span>
              <div className="flex rounded-lg border border-white/10 p-0.5">
                <button
                  type="button"
                  onClick={() => setDdMode('dollar')}
                  className={`rounded px-3 py-1 text-xs transition-all ${
                    ddMode === 'dollar'
                      ? 'bg-white/10 font-semibold text-white'
                      : 'text-white/45 hover:text-white/70'
                  }`}
                >
                  $
                </button>
                <button
                  type="button"
                  onClick={() => setDdMode('percent')}
                  className={`rounded px-3 py-1 text-xs transition-all ${
                    ddMode === 'percent'
                      ? 'bg-white/10 font-semibold text-white'
                      : 'text-white/45 hover:text-white/70'
                  }`}
                >
                  %
                </button>
              </div>
            </div>
            {ddMode === 'dollar' ? (
              <Field
                label=""
                value={ddDollar}
                setValue={setDdDollar}
                prefix="$"
              />
            ) : (
              <Field
                label=""
                value={ddPercent}
                setValue={setDdPercent}
                suffix="%"
                step={0.1}
                max={100}
              />
            )}
            <p className="mt-1.5 text-xs text-white/40">
              {usd.format(calc.drawdown)} ({drawdownPct.toFixed(1)}% of account)
            </p>
          </div>

          <Field
            label="Risk per trade"
            value={riskPerTrade}
            setValue={setRiskPerTrade}
            prefix="$"
            note={`${calc.riskPctOfAccount.toFixed(2)}% of account · ${calc.riskPctOfDrawdown.toFixed(1)}% of drawdown`}
          />

          <Field
            label="Trades per session"
            value={tradesPerDay}
            setValue={setTradesPerDay}
            min={1}
            max={100}
            note={`Daily risk: ${usd.format(calc.dailyRisk)} (${calc.dailyPctOfDrawdown.toFixed(1)}% of drawdown)`}
          />
        </div>
      </div>

      {/* Results */}
      {calc.risk > 0 && calc.drawdown > 0 && (
        <div className="animate-[fadeIn_0.3s_ease-out] rounded-2xl border border-white/10 bg-white/[0.03] p-5 md:p-6">
          <p className="font-mono text-xs uppercase tracking-wider text-white/55">
            Account survival
          </p>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-cyan-300/20 bg-cyan-300/[0.04] p-5 text-center">
              <p className="font-mono text-5xl font-bold text-cyan-300">
                {calc.losingTrades}
              </p>
              <p className="mt-2 text-sm font-medium text-white/70">
                Consecutive losing trades
              </p>
              <p className="mt-1 text-xs text-white/40">
                {usd.format(calc.drawdown)} ÷ {usd.format(calc.risk)}
              </p>
            </div>

            <div className="rounded-xl border border-violet-400/20 bg-violet-400/[0.04] p-5 text-center">
              <p className="font-mono text-5xl font-bold text-violet-400">
                {calc.losingSessions}
              </p>
              <p className="mt-2 text-sm font-medium text-white/70">
                Consecutive losing sessions
              </p>
              <p className="mt-1 text-xs text-white/40">
                {usd.format(calc.drawdown)} ÷ {usd.format(calc.dailyRisk)}/day
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Max drawdown" value={usd.format(calc.drawdown)} />
            <Stat label="Risk per trade" value={usd.format(calc.risk)} />
            <Stat label="Daily risk" value={usd.format(calc.dailyRisk)} />
          </div>

          {calc.losingSessions <= 5 && (
            <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/[0.04] p-4">
              <p className="text-sm text-amber-200/80">
                ⚠ Your account can only survive {calc.losingSessions} consecutive
                losing {calc.losingSessions === 1 ? 'session' : 'sessions'}.
                Consider reducing your risk per trade to increase your survival
                buffer.
              </p>
            </div>
          )}
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        input[type='number']::-webkit-outer-spin-button,
        input[type='number']::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
}
